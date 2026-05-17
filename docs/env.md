# Variáveis de ambiente — Privello

> Documento canônico produzido pela `fase-7-dx-infra`. Espelha o `.env.example` e cobre
> adicionalmente as variáveis lidas pelo código que NÃO constam em `.env.example`.
> Atualizar este documento sempre que uma nova `process.env.X` for adicionada ao código.

## Tabela canônica

| Variável | Descrição | Exemplo | Ambiente |
|---|---|---|---|
| `AUTH_SECRET` | Segredo de assinatura JWT/CSRF do NextAuth v5. Gerar com `openssl rand -base64 32`. | `K7QkXyAo+1F2pJ6wQGZxRZ3tD8mNcVbHsLxF9eTpKuM=` | dev+prod |
| `AUTH_URL` | URL pública do app. Obrigatório em prod (boot falha sem). Em dev pode ficar vazio (NextAuth aceita `Host` arbitrário com `trustHost`). | `https://privello.com.br` | prod |
| `NEXT_PUBLIC_BASE_URL` | URL base usada nos links de email (confirmação, recuperação, etc.). | `http://localhost:3000` | dev+prod |
| `NEXT_DEV_ALLOWED_ORIGINS` | Origens adicionais aceitas em dev (ngrok, IP da rede local), separadas por vírgula. Vazio em produção. | `192.168.1.93,abc.ngrok-free.app` | dev |
| `DEV_ENDPOINT_TOKEN` | Token estático para `/api/dev/*` em dev/staging. Comparado em tempo constante via `crypto.timingSafeEqual` em `src/lib/security/dev-auth.ts`. Gerar com `openssl rand -hex 32`. | `<hex 64 chars>` | dev |
| `CRON_SECRET` | Segredo dos cron endpoints (`/api/cron/*`). Forma preferida: header `Authorization: Bearer $CRON_SECRET` ou `X-Cron-Secret: $CRON_SECRET`. Query string `?secret=` aceita até 2026-06-15T00:00:00Z (janela de transição). | `<hex 64 chars>` | dev+prod |
| `PRODUCTION_HOSTNAME` | Hostname público do app em produção, sem protocolo nem barra final. Lido por `next.config.ts > images.remotePatterns` para liberar imagens servidas pelo próprio domínio. | `privello.com.br` | prod |
| `DATABASE_URL` | Connection string do Postgres. Em dev local aponta para o `docker-compose.yml` deste repo. | `postgresql://postgres:masterkey@localhost:5432/privello?schema=public` | dev+prod |
| `EMAIL_HOST` | SMTP host. | `smtp.gmail.com` | dev+prod |
| `EMAIL_PORT` | SMTP port. | `587` | dev+prod |
| `EMAIL_SECURE` | TLS direto. `true` para porta 465; `false` para STARTTLS na 587. | `false` | dev+prod |
| `EMAIL_USER` | Usuário SMTP. | `contato.privello@gmail.com` | dev+prod |
| `EMAIL_PASS` | Senha SMTP (App Password no Gmail). | `xxxx xxxx xxxx xxxx` | dev+prod |
| `EMAIL_FROM` | Endereço de remetente. Aceita formato `Nome <email>`. | `Privello <contato.privello@gmail.com>` | dev+prod |
| `MERCADOPAGO_ACCESS_TOKEN` | Credencial privada (servidor) do Mercado Pago. NÃO usar token de produção em dev. | `APP_USR-...` | dev+prod |
| `NEXT_PUBLIC_MP_PUBLIC_KEY` | Credencial pública (cliente) do Mercado Pago. Ativa o checkout no front. | `APP_USR-...` | dev+prod |
| `NODE_ENV` | Ambiente de execução. Setado pelo Next/Vitest/runtime — não definir manualmente em `.env`. | `development` / `production` / `test` | dev+prod |
| `PRISMA_DEBUG_QUERIES` | Ativa instrumentação opt-in de queries do Prisma (lê `query`/`error`/`warn` events). Overhead zero quando desligado. | `1` | dev |
| `NEXTAUTH_URL` | **Legado** — alias lido como fallback em 4 routes/actions (`password-reset`, `admin-moderation`, `mp/checkout`, `cadastro/iniciar`). Preferir `AUTH_URL` ou `NEXT_PUBLIC_BASE_URL` em ambientes novos. | `https://privello.com.br` | dev+prod |
| `MP_WEBHOOK_SECRET` | Segredo HMAC do webhook do Mercado Pago. Em dev permite ausência (loga warn e aceita). Em prod, recomendado (rejeita request sem assinatura válida). | `<hex 64 chars>` | prod |
| `R2_ACCOUNT_ID` | Account ID do Cloudflare (visível no dashboard da conta R2). Compõe o endpoint canônico `https://<R2_ACCOUNT_ID>.r2.cloudflarestorage.com` lido pelo `Storage_Module` (`src/lib/storage.ts`). | `a1b2c3d4e5f67890abcdef1234567890` | prod |
| `R2_ACCESS_KEY_ID` | Access Key ID emitido em "R2 → Manage R2 API Tokens" (par S3 v4). Obrigatório em produção; ausente em dev junto com SECRET/BUCKET ativa `Storage_Local_Fallback`. | `<hex 32 chars>` | prod |
| `R2_SECRET_ACCESS_KEY` | Secret Access Key emitido junto com o Access Key ID. Nunca commitar. Obrigatório em produção; ausente em dev junto com KEY_ID/BUCKET ativa `Storage_Local_Fallback`. | `<hex 64 chars>` | prod |
| `R2_BUCKET_NAME` | Nome do bucket R2 que recebe os uploads (prefixos `uploads/`, `audio/`, `verification/`). Obrigatório em produção; ausente em dev junto com KEY_ID/SECRET ativa `Storage_Local_Fallback`. | `privello-prod` | prod |
| `R2_PUBLIC_URL` | URL pública base do bucket usada por `joinPublicUrl` e por `next.config.ts > images.remotePatterns`. Sem barra final (o módulo faz trim). Em fase inicial pode ser a URL gratuita `pub-<id>.r2.dev`; depois CDN próprio. | `https://pub-abc123.r2.dev` | prod |
| `CI` | Setado automaticamente pelo GitHub Actions. Ativa modo CI no Vitest (`allowOnly: false`, `passWithNoTests: false`, cf. `testing-conventions.md > §8.1`). | `true` | (CI only) |

## Notas

- `.env.example` na raiz cobre as 16 primeiras variáveis (auth, dev, cron, images, db,
  email, MP). Após esta fase, ele também inclui `PRISMA_DEBUG_QUERIES` e
  `MP_WEBHOOK_SECRET` (Tarefa 4.4 da fase-7).
- `NEXTAUTH_URL` é alias **legado** dos tempos pré-NextAuth v5. Evitar introduzir em
  ambientes novos — o código já tem `NEXT_PUBLIC_BASE_URL ?? NEXTAUTH_URL ?? "<fallback>"`,
  então basta definir `NEXT_PUBLIC_BASE_URL`.
- `NODE_ENV` e `CI` são setados pelo runtime (Next, Vitest, GitHub Actions) — não vão em
  `.env.example` e não devem ser definidos manualmente em `.env`.
- `AUTH_SECRET` em produção: nunca commitar, rotacionar após suspeita de vazamento, gerar
  com `openssl rand -base64 32`. Cf. `.kiro/specs/fase-1-seguranca/nextauth-prod.md > §3`.
- `CRON_SECRET` aceita `?secret=` em query string até 2026-06-15T00:00:00Z (janela de
  transição da fase-1). Após, apenas header. Cf. `.env.example` e `src/lib/security/cron-auth.ts`.
- `PRISMA_DEBUG_QUERIES` é opt-in e tem **overhead zero** quando desligado (cf.
  `.kiro/specs/fase-3-backend/metricas-baseline.md > §2.1`).
- `Storage_Local_Fallback` (R2 envvars): o `Storage_Module` (`src/lib/storage.ts`)
  ativa o fallback de filesystem **se e somente se** as 3 envvars `R2_ACCESS_KEY_ID`,
  `R2_SECRET_ACCESS_KEY` e `R2_BUCKET_NAME` estão **simultaneamente ausentes** (vazias
  ou indefinidas) **e** `NODE_ENV !== "production"`. Nesse modo, `putObject` escreve
  em `public/<key>` e devolve URL relativa `/<key>`; `deleteObject` é no-op.
  Em produção (`NODE_ENV === "production"`), qualquer ausência das 3 obrigatórias
  faz o `Storage_Module` lançar `Error` síncrono no primeiro `putObject`/`deleteObject`,
  com mensagem listando exatamente os nomes das envvars ausentes (ex.: `"Storage_Module:
  envvar(s) ausente(s) em produção: R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME"`). Presença
  parcial das 3 em dev **desativa** o fallback e propaga erros do SDK S3. `R2_ACCOUNT_ID`
  e `R2_PUBLIC_URL` não participam do gate de fallback, mas são necessários para o
  endpoint canônico e para compor URLs públicas, respectivamente. Cf.
  `.kiro/specs/migracao-infra-producao/design.md > §"Components and Interfaces > 1"`.

## Cross-references

- Auth (`AUTH_SECRET`, `AUTH_URL`, `NEXT_PUBLIC_BASE_URL`): `.kiro/specs/fase-1-seguranca/nextauth-prod.md > §2`.
- Prisma instrumentation (`PRISMA_DEBUG_QUERIES`): `.kiro/specs/fase-3-backend/metricas-baseline.md > §2.1`.
- Cron endpoints (`CRON_SECRET`): `.env.example` (seção `Cron endpoints`) e `src/lib/security/cron-auth.ts`.
- Dev endpoints (`DEV_ENDPOINT_TOKEN`): `src/lib/security/dev-auth.ts`.
- Images config (`PRODUCTION_HOSTNAME`): `next.config.ts > images.remotePatterns`.
- Vitest CI (`CI`): `.kiro/specs/fase-2-testes/testing-conventions.md > §8`.
- Decisão de localização (`docs/env.md` separado vs README): ADR 0005.
