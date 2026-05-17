# Deploy no Railway — passo-a-passo

> Guia operacional para colocar o Privello em produção no **Railway** com
> storage no **Cloudflare R2**, DNS no **Cloudflare** e domínio do
> **Registro.br**.
>
> Stack: Next.js 16 (`output: "standalone"`) · Prisma 5 · NextAuth v5 ·
> PostgreSQL 16 (Railway add-on) · Cloudflare R2 (S3-compatible).
>
> Documento canônico de deploy desta fase. Substitui
> `docs/legacy/deploy-vercel.md` (preservado apenas como histórico).

---

## Pré-requisitos

- Conta no [Cloudflare](https://dash.cloudflare.com) com **R2 ativado** (cartão de crédito cadastrado, mesmo no plano gratuito de R2).
- Conta no [Railway](https://railway.app) com plano que comporte 1 service `web` + Postgres add-on + 2 cron services.
- Domínio `.com.br` registrado em [Registro.br](https://registro.br).
- Conta no [Mercado Pago Developers](https://www.mercadopago.com.br/developers) com app de **PRODUÇÃO** criada (não sandbox).
- Conta SMTP funcional (Gmail App Password, Resend, SES etc.) — credenciais já em uso em dev.
- `git push origin master` feito; o repo é o GitHub deste projeto.
- Docker Engine local para os smoke checks de pré-deploy.

## Visão geral do fluxo

```
GitHub master                             Cloudflare R2
     │                                          ▲
     │ push                                     │ PUT (S3 v4)
     ▼                                          │
Railway (build via Dockerfile) ── runtime ──────┘
     │
     ├─ web service (Next.js standalone)
     ├─ Postgres add-on (mesma região, backup diário)
     ├─ cron-expire-plans   (0 6 * * * UTC)
     └─ cron-reset-hot      (0 7 * * * UTC)
            │
            └── HTTPS público ◄── Cloudflare DNS/CDN ◄── Registro.br (NS)
```

---

## Passo 1 — Provisionamento do Cloudflare R2

1. Dashboard Cloudflare → **R2** → **Create bucket**.
2. Nome: `privello-prod` (ou outro; será o `R2_BUCKET_NAME`).
3. Location hint: **EU** ou **US** (alinhar com a região do Railway escolhida no Passo 3 — anote a decisão aqui).
4. Após criar, abrir o bucket → **Settings** → **Public R2.dev Bucket URL** → enable. Copiar a URL `https://pub-<id>.r2.dev` — esse é o `R2_PUBLIC_URL` inicial (depois substituível por `https://cdn.privello.com.br` quando o CDN próprio entrar; ver "NFR-RB-3" — a troca é em runtime, sem rebuild).
5. **R2 → Overview** → copiar o **Account ID** mostrado no painel → esse é o `R2_ACCOUNT_ID` (compõe o endpoint S3 `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`).
6. **R2 → Manage R2 API Tokens** → **Create API token**:
   - Permissions: **Object Read & Write**.
   - Specify bucket: o bucket criado em (2).
   - TTL: **Forever** (ou rotacione conforme política interna).
   - Após criar, anotar `Access Key ID` e `Secret Access Key` (serão `R2_ACCESS_KEY_ID` e `R2_SECRET_ACCESS_KEY`). **A secret só é exibida uma vez.**
7. **R2 → Settings → CORS Policy** do bucket: liberar `GET` e `HEAD` para o `Production_Hostname` definido no Passo 4 (preencher após o domínio estar pronto).

> **Nota de segurança (NFR-SEC-1, NFR-SEC-2):** o bucket fica público para
> leitura. Os scopes `uploads/*` e `audio/*` são públicos por desenho. O
> scope `verification/*` também é gravado neste mesmo bucket público nesta
> fase — isso é um **blocker pré-go-live** documentado abaixo (ver
> "Pendências pré-go-live"). Em produção real, `verification/*` precisa
> migrar para bucket privado dedicado + `Presigned_URL`.

### Variáveis coletadas

| Variável | Origem | Exemplo |
|---|---|---|
| `R2_ACCOUNT_ID` | Cloudflare → R2 → Overview | `7a1...c9f` |
| `R2_ACCESS_KEY_ID` | Cloudflare → R2 → Manage R2 API Tokens | `<hex 32>` |
| `R2_SECRET_ACCESS_KEY` | mesmo passo (mostrado 1× só) | `<hex 64>` |
| `R2_BUCKET_NAME` | nome do bucket criado | `privello-prod` |
| `R2_PUBLIC_URL` | bucket → Settings → Public R2.dev URL | `https://pub-abc.r2.dev` |

---

## Passo 2 — Provisionamento do Railway

1. [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo** → selecionar `edulanzarin/privello`.
2. Branch: `master`.
3. Build method: **Dockerfile** (Railway detecta automaticamente o `Dockerfile` na raiz; confirmar em **Settings → Build → Builder = Dockerfile**).
4. Region: escolher US ou EU (mesma região do `Location hint` do R2 do Passo 1.3).
5. **Add → Database → Postgres** dentro do mesmo projeto.
   - Nome: `privello-postgres`.
   - Region: idêntica ao service `web`.
   - Habilitar **Backups → Daily** (NFR-DUR-3).
   - O Railway injeta `DATABASE_URL` automaticamente como Reference Variable no service `web` — verificar em **web → Variables**.
6. Em **web → Variables**, adicionar **todas** as envvars listadas no quadro abaixo. Marcar como `Sealed` (Encrypted) onde indicado.

### Variáveis obrigatórias no Railway (`web` service)

| Variável | Sealed? | Origem do valor |
|---|---|---|
| `DATABASE_URL` | sim | Reference do add-on Postgres (auto). |
| `AUTH_SECRET` | sim | `openssl rand -base64 32` |
| `AUTH_URL` | não | URL pública final (ex.: `https://privello.com.br`, sem barra final). |
| `NEXT_PUBLIC_BASE_URL` | não | mesmo valor de `AUTH_URL`. |
| `PRODUCTION_HOSTNAME` | não | hostname sem protocolo (ex.: `privello.com.br`). |
| `CRON_SECRET` | sim | `openssl rand -hex 32` (compartilhado com os 2 cron services). |
| `R2_ACCOUNT_ID` | sim | Passo 1.5. |
| `R2_ACCESS_KEY_ID` | sim | Passo 1.6. |
| `R2_SECRET_ACCESS_KEY` | sim | Passo 1.6. |
| `R2_BUCKET_NAME` | não | Passo 1.2. |
| `R2_PUBLIC_URL` | não | Passo 1.4. |
| `EMAIL_HOST` `EMAIL_PORT` `EMAIL_SECURE` `EMAIL_USER` `EMAIL_PASS` `EMAIL_FROM` | parcial | mesmos do `.env` de dev (rotacionar `EMAIL_PASS` se ainda não foi). |
| `MERCADOPAGO_ACCESS_TOKEN` | sim | painel MP → produção (não sandbox). |
| `NEXT_PUBLIC_MP_PUBLIC_KEY` | não | painel MP → produção. |
| `MP_WEBHOOK_SECRET` | sim | `openssl rand -hex 32` (mesmo valor configurado no painel MP — Passo 5). |

### Variáveis a NÃO definir manualmente

- `NODE_ENV` — Railway/Docker setam como `production` automaticamente.
- `PORT`, `HOSTNAME` — definidos pelo `Dockerfile` (3000 / 0.0.0.0).
- `DEV_ENDPOINT_TOKEN` — não aplicável em produção (rota `/api/dev/*` retorna 404 sem token).
- `NEXT_DEV_ALLOWED_ORIGINS` — vazio em prod.
- `PRISMA_DEBUG_QUERIES` — só ative pontualmente para diagnóstico (overhead zero quando vazio).

### Primeiro deploy

Depois de salvar as envvars, em **Deployments** → o Railway faz o build:

1. `docker build .` (multi-stage: deps → builder → runner).
2. `prisma generate` no estágio `builder` (bloqueante mesmo se host estiver verde — Requirement 8.7).
3. `next build` produz `.next/standalone` + `.next/static`.
4. No boot do `runner`, o `CMD` executa `prisma migrate deploy` antes de `node server.js`.

Tempo esperado: 4–7 min para o primeiro build (sem cache de layer Docker), 2–3 min em builds subsequentes.

---

## Passo 3 — Configuração de domínio (Registro.br + Cloudflare)

1. **Cloudflare** → **Add a site** → digitar `privello.com.br` → plano **Free** já basta.
2. Cloudflare entrega 2 nameservers (ex.: `xxx.ns.cloudflare.com` e `yyy.ns.cloudflare.com`).
3. **Registro.br** → painel do domínio → **DNS / Servidores** → trocar para os 2 nameservers da Cloudflare. Propagação: 1–24h (geralmente < 1h).
4. **Railway** → **web service** → **Settings → Networking → Custom Domain** → adicionar `privello.com.br` e/ou `www.privello.com.br`. O Railway emite o `CNAME` alvo (ex.: `<gerado>.up.railway.app`).
5. **Cloudflare → DNS → Records** → adicionar:
   - Tipo `CNAME`, nome `@` (apex), valor = alvo do Railway, **Proxy status = Proxied** (nuvem laranja).
   - Tipo `CNAME`, nome `www`, valor = mesmo alvo, **Proxied**.
6. **Cloudflare → SSL/TLS → Overview** → mode **Full (strict)**. O Railway termina TLS no edge.
7. Aguardar até o Cloudflare emitir o certificado universal (5–15 min).
8. **Voltar ao Railway** e atualizar `AUTH_URL`, `NEXT_PUBLIC_BASE_URL` e `PRODUCTION_HOSTNAME` com o domínio definitivo. Disparar redeploy via **Deployments → Redeploy**.

> **Nota:** `PRODUCTION_HOSTNAME` é lido por `next.config.ts > images.remotePatterns`
> em build-time. Mudar essa variável **exige rebuild** (não é runtime).
> Já `R2_PUBLIC_URL` é runtime — pode trocar sem rebuild (NFR-RB-3).

---

## Passo 4 — Configuração de cron (2 schedulers Railway)

Esta fase elimina `vercel.json` e provisiona 2 services dedicados de cron no
mesmo projeto Railway. Cada um chama um endpoint HTTP da app web via `curl`,
autenticando com header `Authorization: Bearer $CRON_SECRET`.

### Variável compartilhada

Definir nos **2 cron services** (em **Variables**, ou via Reference do `web`):

| Variável | Valor |
|---|---|
| `CRON_SECRET` | mesmo valor configurado no service `web` (Passo 2). |
| `PRODUCTION_BASE_URL` | URL pública final (ex.: `https://privello.com.br`, sem barra final). Igual ao `AUTH_URL`. |

### Tabela canônica dos schedulers

| Service name | Cron schedule (UTC) | Equivalente BRT (UTC-3) | Comando |
|---|---|---|---|
| `cron-expire-plans` | `0 6 * * *` | 03:00 BRT | `curl -fsS -H "Authorization: Bearer $CRON_SECRET" "$PRODUCTION_BASE_URL/api/cron/expire-plans"` |
| `cron-reset-hot`    | `0 7 * * *` | 04:00 BRT | `curl -fsS -H "Authorization: Bearer $CRON_SECRET" "$PRODUCTION_BASE_URL/api/cron/reset-hot"` |

Como provisionar cada um no Railway:

1. **New → Empty Service** dentro do mesmo projeto.
2. **Settings → Service Type** → **Cron Job**.
3. **Schedule** → cron expression da tabela acima.
4. **Source** → não conectar repo (não precisa de build próprio).
5. **Settings → Deploy → Custom Start Command** → o comando `curl ...` da tabela acima.
6. Em **Variables**, garantir `CRON_SECRET` e `PRODUCTION_BASE_URL` (ou usar Reference para o `web`).

### ⚠️ Nota crítica — autenticação por header **somente**

**NÃO** usar `?secret=$CRON_SECRET` em query string nos schedulers do Railway.
A janela de transição da forma `?secret=` encerra em **`2026-06-15T00:00:00Z`**
em `src/lib/security/cron-auth.ts` — após essa data o endpoint rejeita
requests autenticados por query com HTTP 401.

A forma autorizada é **exclusivamente o header**:

```
Authorization: Bearer $CRON_SECRET
```

(`X-Cron-Secret: $CRON_SECRET` também é aceito, mas o `Authorization: Bearer`
é a forma preferida.)

### Teste manual antes do go-live

Validar cada cron via shell antes de habilitar a rotina:

```bash
curl -i -H "Authorization: Bearer $CRON_SECRET" \
  https://privello.com.br/api/cron/expire-plans
# Esperado: HTTP/2 200 com payload JSON do handler.

curl -i -H "Authorization: Bearer $CRON_SECRET" \
  https://privello.com.br/api/cron/reset-hot
# Esperado: HTTP/2 200.
```

Se retornar 401: conferir `CRON_SECRET` no service `web` vs no service de cron
(precisa ser **idêntico**); se retornar 500: investigar logs do service `web`
no painel.

---

## Passo 5 — Atualização do `Webhook_MP_URL`

1. Painel Mercado Pago → **Suas integrações → app de produção → Notificações webhook**.
2. URL: `https://privello.com.br/api/mp/webhook`.
3. Eventos: marcar **payments** e **merchant_orders**.
4. Secret: colar o mesmo valor de `MP_WEBHOOK_SECRET` configurado no Railway (Passo 2).
5. Salvar e usar **"Simular notificação"** no painel MP. O endpoint deve retornar 200; se 401, conferir `MP_WEBHOOK_SECRET` em ambos os lados.

---

## Smoke checks pós-deploy

Validar **antes de declarar o deploy verde**.

### Local — antes do `git push`

```bash
# 1) Gates de qualidade no host (não dependem de Docker).
npm run lint         # 0 problems
npx tsc --noEmit     # 0 errors
npm run test         # 305+ tests verdes

# 2) Build da imagem Docker.
docker build -t privello:smoke .
#   Esperado: build completa sem erros, incluindo `prisma generate`
#   no estágio `builder` (Requirement 8.7).
#   Nota: o estágio `builder` define `ARG AUTH_URL=http://localhost:3000`
#   por padrão (placeholder de build). Em produção (Railway), passe o
#   valor real via build-arg ou env service.

# 3) Boot local com Storage_Local_Fallback (R2_* desativadas).
LOCAL_DB="postgresql://postgres:masterkey@host.docker.internal:5432/privello?schema=public"
time docker run --rm -p 3000:3000 \
  -e DATABASE_URL="$LOCAL_DB" \
  -e AUTH_SECRET="$(openssl rand -base64 32)" \
  -e AUTH_URL="http://localhost:3000" \
  privello:smoke
#   Esperado:
#     - container UP em ≤ 5s (NFR-PERF-2).
#     - logs mostram `prisma migrate deploy` + `Listening on 0.0.0.0:3000`.
#   Nota: `AUTH_URL` é obrigatória em produção (guard em `src/lib/auth.ts`).
#   Em smoke local, qualquer URL válida resolve o guard; em produção use
#   `https://privello.com.br`.

# 4) Em outro shell:
time curl -i http://localhost:3000/
#   Esperado: HTTP/1.1 200 OK em ≤ 10s no primeiro hit.
```

### Produção — após o domínio estar ativo

| # | Check | Esperado |
|---|---|---|
| 1 | `curl -i https://privello.com.br/` | HTTP/2 200 |
| 2 | `curl -s https://privello.com.br/api/cidades \| head` | JSON com lista de cidades (Postgres conecta) |
| 3 | Acesso ao `/cadastro/cliente` em browser | formulário renderiza |
| 4 | `/cadastro/acompanhante` (5 passos) | onboarding completo, foto inicial sobe **com URL `https://${R2_PUBLIC_URL}/uploads/...`** (não `/uploads/...`) |
| 5 | Verificar objeto no R2: dashboard Cloudflare → bucket → Object browser | objeto presente sob `uploads/<profileId>/...` |
| 6 | `/painel` sem sessão | redireciona para `/entrar` |
| 7 | Checkout Mercado Pago | inicia fluxo de pagamento |
| 8 | Painel MP → "Simular notificação" | endpoint responde 200 |
| 9 | `curl -H "Authorization: Bearer $CRON_SECRET" https://privello.com.br/api/cron/expire-plans` | 200 |
| 10 | Painel Railway → cron services após primeiro disparo agendado | status verde |

---

## Rollback Plan

Estratégia escalada por escopo da falha. Sempre preferir o degrau menos
destrutivo primeiro.

### 1. Rollback do deploy (1 clique)

Falha de build, regressão de código, container `crashed`:

1. Railway → projeto → **web service → Deployments**.
2. Localizar último deploy verde (label `org.opencontainers.image.revision = <sha>` é o SHA do commit — visível na imagem Docker).
3. **Promote** ou **Rollback** → o Railway faz o swap em segundos.
4. Investigar a causa offline em `master` antes de tentar redeploy.

### 2. Restore do Postgres

Migration ruim, dados corrompidos por bug em produção:

1. Railway → **privello-postgres → Backups**.
2. Selecionar backup ≤ 24h anterior à corrupção.
3. **Restore** → Railway cria DB novo a partir do snapshot.
4. Atualizar `DATABASE_URL` no service `web` para apontar ao DB restaurado (Reference Variable nova).
5. Redeploy do `web`.
6. Se a corrupção veio de uma migration manualmente revertível:
   `npx prisma migrate resolve --rolled-back <nome>` direto contra o DB.

### 3. R2 — não tocar

Os objetos no R2_Bucket são **imutáveis** durante rollback. Não há `delete`
em massa nesta fase (Requirement 3.4 — retenção permanente). Rollback de
deploy não afeta arquivos já subidos.

### 4. DNS — só em último caso

Se o domínio ficar inacessível por incidente Railway prolongado:

1. Cloudflare → **DNS** → editar o `CNAME` `@` para apontar a um endpoint
   alternativo (servidor temporário, página estática de manutenção).
2. Lembrar que TTL Cloudflare default é **Auto (5min)** — propaga rápido.
3. Quando o Railway voltar, repointar o `CNAME` ao alvo `*.up.railway.app`
   original (anotado no Passo 3.4).

---

## Pendências pré-go-live (blockers)

Estes itens **NÃO** estão resolvidos por esta fase de migração e devem ser
endereçados antes de declarar a plataforma "produção real". Bloqueiam o
go-live com tráfego de usuários reais; não bloqueiam o deploy técnico.

### B1 — `verification/*` em bucket privado com Presigned_URL

**Estado atual:** `verification/<profileId>/...` é gravado no mesmo bucket
público dos uploads e áudios. URLs públicas de documento de identidade
ficam acessíveis a qualquer pessoa que adivinhe a Object_Key (chave inclui
`<timestamp>-<rand>`, mas a presunção de privacidade é insuficiente para
KYC).

**Ação:**

1. Criar bucket separado `privello-prod-verification` com **Public access = disabled**.
2. Implementar `getPresignedPutUrl(key, contentType, expiresIn)` e
   `getPresignedGetUrl(key, expiresIn)` em `src/lib/storage.ts`
   (`@aws-sdk/s3-request-presigner`).
3. Refatorar `src/app/api/upload/verification/route.ts` para retornar
   Presigned PUT URL ao cliente em vez de receber bytes; cliente faz
   upload direto ao R2 privado.
4. Para leitura (moderação), `submitVerificationCase` e a UI de moderação
   passam a chamar `getPresignedGetUrl` antes de servir o `<img src>`.

**Referências:** Requirement 4.4, NFR-SEC-2, design.md > Components and Interfaces > 11 ("Pendências pré-go-live").

### B2 — CSP enforcement (Report-Only → enforced)

**Estado atual:** `next.config.ts > headers` envia
`Content-Security-Policy-Report-Only` (herdado de `fase-1-seguranca`).
Violations são reportadas mas não bloqueiam.

**Ação:**

1. Validar logs de CSP por **≥ 7 dias** em produção sem violations
   espúrias persistentes (`fase-1-seguranca/csp-origins.md`).
2. Trocar a header de `Content-Security-Policy-Report-Only` para
   `Content-Security-Policy` em `next.config.ts`.
3. Smoke nos fluxos críticos (login, upload, checkout, vídeo player).

**Referência:** `.kiro/specs/fase-1-seguranca/csp-origins.md`,
`nextauth-prod.md > §5`.

### B3 — `npm audit` sem CVEs críticos

**Estado atual:** auditoria não é parte do CI atual (`fase-7-dx-infra/CI Pipeline`
faz `lint + tsc + test` mas não `audit`).

**Ação:**

```bash
npm audit --omit=dev --audit-level=high
```

1. Resolver qualquer vulnerabilidade `high`/`critical` em deps de produção
   antes do go-live (upgrade ou substituição).
2. (Opcional) adicionar step `npm audit --omit=dev --audit-level=high` ao
   `.github/workflows/ci.yml` como gate.

---

## Referências

- `Dockerfile` na raiz e `.dockerignore` — produzidos por esta migração.
- `docs/env.md` — tabela canônica das envvars (incluindo as 5 do R2).
- `.env.example` — placeholders + comentários (bloco "Storage").
- `src/lib/storage.ts` — Storage_Module e contrato de fallback.
- `src/lib/security/cron-auth.ts` — `verifyCronSecret` consumido pelos endpoints `/api/cron/*`.
- `next.config.ts` — `output: "standalone"` + `images.remotePatterns` (entrada R2 condicional).
- `.kiro/specs/migracao-infra-producao/{requirements,design,tasks}.md` — proveniência completa.
- `docs/legacy/deploy-vercel.md` — guia anterior (Vercel + Neon), preservado apenas como histórico. Não usar.

---

**Última atualização:** 2026-05-17 (entrega `migracao-infra-producao`).
