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

## Cross-references

- Auth (`AUTH_SECRET`, `AUTH_URL`, `NEXT_PUBLIC_BASE_URL`): `.kiro/specs/fase-1-seguranca/nextauth-prod.md > §2`.
- Prisma instrumentation (`PRISMA_DEBUG_QUERIES`): `.kiro/specs/fase-3-backend/metricas-baseline.md > §2.1`.
- Cron endpoints (`CRON_SECRET`): `.env.example` (seção `Cron endpoints`) e `src/lib/security/cron-auth.ts`.
- Dev endpoints (`DEV_ENDPOINT_TOKEN`): `src/lib/security/dev-auth.ts`.
- Images config (`PRODUCTION_HOSTNAME`): `next.config.ts > images.remotePatterns`.
- Vitest CI (`CI`): `.kiro/specs/fase-2-testes/testing-conventions.md > §8`.
- Decisão de localização (`docs/env.md` separado vs README): ADR 0005.
