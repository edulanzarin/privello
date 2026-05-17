# syntax=docker/dockerfile:1.7
#
# Privello — multi-stage Dockerfile (Next.js 16 + Prisma 5 + Node 20 Alpine).
#
# Esta imagem suporta o deploy do `Privello_App` no Railway (spec
# migracao-infra-producao, Requirement 8). Estágios:
#   1. deps    — instala dependências de produção (cache layer estável).
#   2. builder — instala dev deps, gera Prisma Client e roda `next build`.
#   3. runner  — imagem mínima Alpine, usuário não-root, com migrações Prisma
#                e o output `standalone` do Next.
#
# AGENTS_Rule (area: next-config / output) — consulta em 2026-05-17:
#   node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/output.md
#   Caveat: `output: "standalone"` produz `.next/standalone/server.js` mínimo
#   e NÃO inclui `public/` nem `.next/static/` no diretório standalone — o
#   estágio `runner` precisa copiar esses dois diretórios manualmente para
#   que assets estáticos e arquivos públicos fiquem servíveis em runtime.
#
# Build args:
#   - NODE_VERSION: tag da imagem `node` base (default: 20-alpine).
#   - GIT_SHA: SHA do commit injetado pela CI/Railway para rollback
#              identificável (ver LABEL no estágio `runner`).
#
# Notas:
#   - Apk packages `libc6-compat` e `openssl` são exigidos pelo Prisma engine
#     `linux-musl-openssl-3.0.x`. Sem eles, `prisma generate` produz binário
#     que não carrega em Alpine (libcrypto não encontrada).
#   - `prisma migrate deploy` no `CMD` é idempotente: aplica migrações
#     pendentes e termina, antes de iniciar o servidor Next.

ARG NODE_VERSION=20-alpine

# ── deps ──────────────────────────────────────────────────────────────────
# Cache layer só para `npm ci --omit=dev`. Reaproveitada quando
# package-lock.json não muda.
FROM node:${NODE_VERSION} AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl
COPY package.json package-lock.json ./
COPY prisma/schema.prisma ./prisma/schema.prisma
RUN npm ci --omit=dev

# ── builder ───────────────────────────────────────────────────────────────
# Instala TODAS as dependências (incluindo dev), gera Prisma Client e roda
# `next build`. O resultado relevante é `.next/standalone/`, `.next/static/`
# e `node_modules/{.prisma,@prisma,prisma}` (copiados para o runner).
FROM node:${NODE_VERSION} AS builder
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1

# `next build` evaluates route handlers (collect page data) com `NODE_ENV=production`.
# `src/lib/auth.ts` faz um guard de boot que exige `AUTH_URL` em produção
# (Requirement: NextAuth precisa do origin validado para callbacks). O build
# falha sem essa env, então recebemos um valor em build-arg e re-exportamos
# em ENV para esta etapa. Em runtime, o operador injeta a `AUTH_URL` real
# (Railway env var ou `docker run -e AUTH_URL=...`).
ARG AUTH_URL=http://localhost:3000
ENV AUTH_URL=${AUTH_URL}

RUN npx prisma generate
RUN npm run build

# ── runner ────────────────────────────────────────────────────────────────
# Imagem final servida em produção. Alpine + usuário não-root + apenas o
# necessário para `prisma migrate deploy && node server.js`.
FROM node:${NODE_VERSION} AS runner
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Usuário não-root (Requirement 8 — boa prática de container hardening).
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# Copia o output `standalone` do Next.
# AGENTS_Rule caveat citado no topo deste arquivo: `.next/standalone` NÃO
# inclui `public/` nem `.next/static/` — cópia manual abaixo.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Prisma Client gerado + binário CLI + diretório de migrations precisam estar
# disponíveis no runner para `prisma migrate deploy` no boot
# (Requirement 8.3). `node_modules/.prisma` contém o engine; `@prisma`
# contém o client tipado; `prisma` contém o pacote CLI invocado pelo CMD.
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

USER nextjs
EXPOSE 3000

# Rastreabilidade do deploy: o SHA do commit é injetado em build via
# `--build-arg GIT_SHA=...` (NFR-RB-2). Default `unknown` para builds locais
# sem ARG. Inspect com `docker inspect <image> --format '{{ index .Config.Labels "org.opencontainers.image.revision" }}'`.
ARG GIT_SHA=unknown
LABEL org.opencontainers.image.revision="${GIT_SHA}"

# Aplica migrações Prisma idempotentemente e em seguida sobe o server Next.
# `prisma migrate deploy` retorna 0 quando não há migrações pendentes; falha
# em erro de schema/conn e impede o `node server.js` de subir, garantindo
# que um deploy quebrado não fique escutando porta com schema fora de sync.
CMD ["sh", "-c", "node node_modules/prisma/build/index.js migrate deploy && node server.js"]
