# Deploy no Vercel — passo-a-passo

> Guia operacional para colocar o Privello em produção no Vercel.
> Stack: Next.js 16 · Prisma 5 · NextAuth v5 · PostgreSQL.

## Pré-requisitos

- Conta no [Vercel](https://vercel.com) (plano Hobby grátis funciona para começar).
- Conta no [Neon](https://neon.tech) ou [Supabase](https://supabase.com) para Postgres gerenciado (Hobby/Free funciona).
- Conta no [Mercado Pago Developers](https://www.mercadopago.com.br/developers) com app criada para PRODUÇÃO (não sandbox).
- Conta SMTP com App Password (Gmail) ou serviço dedicado (Resend, SES, etc).
- Domínio próprio (opcional para testar — o Vercel dá um `*.vercel.app` grátis).
- `git push origin master` feito (este projeto já está em https://github.com/edulanzarin/privello).

## Visão geral do fluxo

```
GitHub master → Vercel detecta push → build no Vercel → deploy automático
                                          ↓
                          Variáveis de ambiente do projeto
                                          ↓
                            Postgres externo (Neon/Supabase)
```

O Vercel **não fornece Postgres**. Você precisa de um banco externo. Recomendado: **Neon**, que tem integração nativa com Vercel em 1 clique.

## Passo 1 — Provisionar Postgres no Neon

1. Acessa [neon.tech](https://neon.tech), cria projeto (região mais próxima do Brasil: `us-east-1` ou `aws-sa-east-1` se disponível).
2. Copia a `Connection string` formato `postgresql://user:pass@host/db?sslmode=require`.
3. Roda `npx prisma db push --schema=prisma/schema.prisma` localmente apontando essa string em `DATABASE_URL`. Isso cria as tabelas no Neon.
4. (Opcional) Roda `npx prisma db seed` se quiser dados de teste em produção (não recomendado para produção real — só staging).

## Passo 2 — Conectar o repo ao Vercel

1. No painel do Vercel: **Add New → Project**.
2. Importar `edulanzarin/privello`.
3. Framework preset: **Next.js** (auto-detectado).
4. Build command: deixa o default (`prisma generate && next build` — está no `package.json`).
5. Output directory: deixa o default.
6. Root directory: deixa o default (raiz).

**Não clicar em Deploy ainda.** Antes, configura as env vars.

## Passo 3 — Variáveis de ambiente no Vercel

Em **Project Settings → Environment Variables**, adicionar (todas em **Production** + **Preview** + **Development** salvo onde indicado):

### Obrigatórias

| Variável | Valor | Notas |
|---|---|---|
| `DATABASE_URL` | `postgresql://...?sslmode=require` (Neon) | Marcar **Encrypted** |
| `AUTH_SECRET` | gerar com `openssl rand -base64 32` | **Encrypted**. Diferente em prod e preview. |
| `AUTH_URL` | `https://seudominio.com.br` (ou `https://privello.vercel.app` se ainda não tem domínio) | Sem barra final. |
| `NEXT_PUBLIC_BASE_URL` | mesmo valor que `AUTH_URL` | Pública (não Encrypted). |
| `PRODUCTION_HOSTNAME` | `seudominio.com.br` (sem `https://`) | Pública. Lido por `next.config.ts > images.remotePatterns`. |
| `DEV_ENDPOINT_TOKEN` | gerar com `openssl rand -hex 32` | **Encrypted**. Não usado em prod (`/api/dev/*` retorna 404 em produção sem token). |
| `CRON_SECRET` | gerar com `openssl rand -hex 32` | **Encrypted**. Usado nos crons do Vercel (passo 5). |
| `EMAIL_HOST` | `smtp.gmail.com` (Gmail) ou seu provedor | |
| `EMAIL_PORT` | `587` (Gmail STARTTLS) ou `465` (SSL direto) | |
| `EMAIL_SECURE` | `false` para 587, `true` para 465 | |
| `EMAIL_USER` | usuário SMTP | |
| `EMAIL_PASS` | App Password ou senha SMTP | **Encrypted**. |
| `EMAIL_FROM` | `Privello <noreply@seudominio.com.br>` | |
| `MERCADOPAGO_ACCESS_TOKEN` | token PRIVADO de produção do MP | **Encrypted**. NÃO usar token de teste em prod. |
| `NEXT_PUBLIC_MP_PUBLIC_KEY` | chave PÚBLICA de produção do MP | Pública. |
| `MP_WEBHOOK_SECRET` | gerar com `openssl rand -hex 32`, configurar mesmo valor no painel do MP | **Encrypted**. |

### Opcionais

| Variável | Quando usar |
|---|---|
| `NEXT_DEV_ALLOWED_ORIGINS` | Apenas em **Development**, separado por vírgula. Vazio em prod. |
| `PRISMA_DEBUG_QUERIES` | `1` para ativar instrumentação opt-in (overhead zero quando vazio). |

### Não definir manualmente

- `NODE_ENV` — Vercel/Next setam automaticamente como `production`.
- `CI` — só GitHub Actions seta isso.
- `VERCEL`, `VERCEL_ENV`, `VERCEL_URL` etc — Vercel injeta automaticamente.

## Passo 4 — Primeiro deploy

Clica **Deploy**. O Vercel:
1. Clona o repo.
2. Roda `npm ci`.
3. Roda `prisma generate` (vem do `postinstall`).
4. Roda `next build`.
5. Publica.

Tempo esperado: 2–4 min para o primeiro build, 1–2 min para builds subsequentes (cache).

Se falhar: ler logs do build no painel. Falhas comuns:
- `DATABASE_URL` ausente ou errada → `prisma generate` quebra → adicionar `?sslmode=require` no fim.
- `AUTH_URL` ausente → boot falha → ver `src/lib/auth.ts:9-16`.
- `MERCADOPAGO_ACCESS_TOKEN` inválido → checkout quebra (não é build error).

## Passo 5 — Configurar Cron Jobs

O projeto tem 2 endpoints de cron:
- `/api/cron/expire-plans` — expira planos vencidos.
- `/api/cron/reset-hot` — reset de contadores de "hot" (visualizações por janela).

Para o Vercel rodar automaticamente, criar `vercel.json` na raiz (não está no repo ainda — precisa criar):

```json
{
  "crons": [
    {
      "path": "/api/cron/expire-plans",
      "schedule": "0 3 * * *"
    },
    {
      "path": "/api/cron/reset-hot",
      "schedule": "0 4 * * *"
    }
  ]
}
```

O Vercel chama esses paths com header `Authorization: Bearer $CRON_SECRET` automaticamente. **Importante:** os cron jobs do Vercel só rodam em **Production** (não em Preview).

## Passo 6 — Configurar webhook do Mercado Pago

1. No painel MP: **Suas integrações → Notificações webhook**.
2. URL: `https://seudominio.com.br/api/mp/webhook`.
3. Eventos: marcar **payments** e **merchant_orders**.
4. Secret: copiar o mesmo valor que está em `MP_WEBHOOK_SECRET` no Vercel.

Antes do go-live, testar no painel do MP usando "Simular notificação" e ver se o webhook responde 200.

## Passo 7 — Domínio personalizado

1. Vercel → **Project Settings → Domains** → Add domain.
2. Configurar DNS no registrar:
   - Apex (`seudominio.com.br`): `A` para `76.76.21.21` (IP do Vercel).
   - Subdomínio (`www`): `CNAME` para `cname.vercel-dns.com`.
3. Esperar propagação (5–60 min).
4. Vercel emite SSL automaticamente.
5. **Voltar e atualizar `AUTH_URL` + `NEXT_PUBLIC_BASE_URL` + `PRODUCTION_HOSTNAME`** com o domínio definitivo. Redeploy obrigatório (Vercel → Deployments → Redeploy).

## ⚠️ Bloqueante para uso real: uploads efêmeros

**Atenção:** o filesystem da Vercel é **efêmero** — todo deploy ou cold start zera arquivos em `/public/uploads/`. Hoje o projeto salva uploads diretamente nessa pasta (cf. `src/app/api/upload/route.ts`).

Em produção real você **precisa** migrar uploads para storage externo:

| Opção | Custo | Esforço |
|---|---|---|
| Vercel Blob | Pago por GB armazenado + bandwidth | ~1 dia (refactor de `/api/upload` + `/api/upload-audio`) |
| Cloudflare R2 | Sem egress, $0.015/GB | ~1-2 dias (S3-compatible API) |
| AWS S3 | $0.023/GB armazenado + egress caro | ~1-2 dias |

Sem essa migração, **fotos e mídias somem a cada deploy**. Aceitável apenas para staging/demo.

## ⚠️ Pendências antes de produção real

1. **Uploads efêmeros** (acima) — **bloqueante**.
2. **`npm audit`** — rodar e ver se há CVEs em dependências críticas.
3. **Smokes browser real** — cabeçalhos preparados em `.kiro/specs/fase-6-mobile-cross-browser/mockups-diff.md`. Validar em iOS Safari, Android Chrome, desktop Safari, desktop Edge.
4. **CSP** — está em `Content-Security-Policy-Report-Only`. Após validar 7+ dias sem reports espúrios em produção, virar enforcement (trocar `Report-Only` para `Content-Security-Policy` em `next.config.ts`). Cf. `.kiro/specs/fase-1-seguranca/csp-origins.md` e `nextauth-prod.md > §5`.
5. **Backup de banco** — Neon Free tem 7 dias de PITR, mas para produção real configure dumps periódicos (`pg_dump` em S3, por exemplo).
6. **Monitoramento** — Vercel Analytics (gratuito básico) e logs nativos resolvem 80%. Para mais: Sentry para erros, Axiom ou Datadog para logs estruturados (fora do escopo da auditoria).

## Verificações pós-deploy

Após o primeiro deploy bem-sucedido, abrir em browser:

- `https://seudominio.com.br/` — landing carrega
- `https://seudominio.com.br/cadastro/cliente` — formulário de cadastro
- `https://seudominio.com.br/cadastro/acompanhante` — onboarding completo (5 passos)
- `https://seudominio.com.br/api/cidades` — JSON com lista de cidades (testa que o DB conecta)
- `https://seudominio.com.br/painel` — redireciona para `/entrar` (sessão ausente)

Se algum desses falhar, **antes de tudo** ler logs no painel do Vercel (Functions → Logs) e ver qual é o erro real.

## Rollback

Vercel → Deployments → escolher um deploy anterior verde → **Promote to Production**. Reverte instantaneamente.

Para reverter migração de banco: `npx prisma migrate resolve --rolled-back <nome>` ou restaurar PITR no Neon.

---

**Última atualização:** 2026-05-17 (sessão pós-auditoria).
