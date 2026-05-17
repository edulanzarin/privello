# Requirements Document

> **Spec:** Migração de infraestrutura para produção (`migracao-infra-producao`)

## Introduction

Este spec migra o **Privello** (Next.js 16 + Prisma 5 + NextAuth v5 + PostgreSQL) do estado atual de desenvolvimento (uploads em `public/uploads/` em filesystem local, sem hospedagem definida) para uma topologia de produção real composta por:

- **Hospedagem da aplicação**: Railway (decisão travada — Vercel é incompatível com o nicho do produto, conforme AUP da Vercel; Railway aceita conteúdo legal adult-adjacent).
- **Storage de arquivos enviados pelos usuários** (fotos, vídeos, áudios, documentos de verificação): Cloudflare R2 (S3-compatible, sem egress fee).
- **Banco de dados**: Railway Postgres add-on (mesma região do app, backup diário automático).
- **DNS / CDN**: Cloudflare na frente do domínio `*.com.br` registrado via Registro.br.
- **Pagamentos**: Mercado Pago (já integrado, mantido).
- **Email transacional**: SMTP via Gmail (já configurado, mantido).

O bloqueante de produção identificado pela auditoria-geral (todas as 7 fases `Done`, 305/305 testes verdes, 0 erros TS, 0 lint problems) é que os 5 pontos do código que escrevem em `public/uploads/` ou `public/verification/` não funcionam num runtime serverless/container efêmero — o filesystem é destruído a cada deploy ou réplica. Esta migração refatora esses 5 pontos para usar um cliente S3 contra o R2, adiciona Dockerfile e configuração de Railway, atualiza a documentação de deploy (substituindo `docs/deploy-vercel.md`) e documenta as variáveis de ambiente novas.

A migração é **estritamente de infraestrutura** — não introduz features novas, não troca o gateway de pagamento, não toca em `prisma/schema.prisma` salvo necessidade absoluta, e mantém os 305+ testes verdes e 0 lint problems durante toda a execução. Os bytes existentes em `public/uploads/` (seeds locais de dev) **não** são migrados — o banco de produção será zerado e populado por um seed novo após o R2 estar ativo.

Decisões arquiteturais já travadas (não reabrir nesta fase):

- **Hosting**: Railway, **não Vercel**.
- **Storage**: Cloudflare R2.
- **Domínio**: Registro.br (`.com.br`).
- **DNS/CDN**: Cloudflare.
- **Email**: SMTP atual (Resend/SES é melhoria futura, fora deste spec).
- **Pagamentos**: Mercado Pago (sem secundário).
- **Postgres**: Railway add-on.

Cross-refs históricas (referência apenas, não dependência ativa):

- `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\specs\fase-1-seguranca\endpoints-zod.md` — schemas Zod dos uploads (`UploadBodySchema`, `UploadAudioBodySchema`, `UploadVerificationBodySchema`, `UploadClientAvatarSchema`).
- `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\specs\fase-1-seguranca\nextauth-prod.md` — envvars de auth (`AUTH_URL`, `AUTH_SECRET`, `PRODUCTION_HOSTNAME`, `CRON_SECRET`).
- `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\specs\fase-7-dx-infra\` — `docs/env.md`, `docs/docker.md`, `CHANGELOG.md` e `docs/adr/` já estabelecidos como padrão de documentação.
- `c:\Users\edulanzarin\Documents\Dev\privello\docs\deploy-vercel.md` — documento que será **substituído** por `docs/deploy-railway.md`.

---

## Glossary

- **Privello_App**: a aplicação Next.js 16 contida em `c:\Users\edulanzarin\Documents\Dev\privello\` que será hospedada em produção. Engloba server actions, route handlers, middleware e componentes React.
- **Storage_Module**: novo módulo `src/lib/storage.ts` introduzido por esta migração, que encapsula o cliente S3 contra o Cloudflare R2 e expõe a API canônica de upload, deleção e geração de URL pública. É a única superfície de código que conhece R2; todos os 5 pontos de upload consomem este módulo.
- **R2_Bucket**: bucket Cloudflare R2 que recebe os arquivos enviados pelos usuários. Identificado por `R2_BUCKET_NAME` no `.env`. Tem objeto-prefixos derivados do domínio funcional (ex.: `uploads/<profileId>/<file>`, `verification/<profileId>/<file>`).
- **R2_Public_URL**: URL pública base do `R2_Bucket` (ex.: `https://pub-<id>.r2.dev` em fase inicial, ou `https://cdn.privello.com.br` quando atrás do Cloudflare CDN). Lida pelo `Storage_Module` a partir de `R2_PUBLIC_URL` e composta com a chave do objeto para formar a URL final persistida em DB.
- **R2_Credentials**: par `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` emitido pelo painel Cloudflare R2, junto com `R2_ACCOUNT_ID`. Obrigatórios em produção; em dev podem ficar vazios para forçar fallback de `Storage_Module` (ver Glossário > `Storage_Local_Fallback`).
- **Storage_Local_Fallback**: comportamento opcional do `Storage_Module` em dev/teste que escreve em `public/uploads/` quando as `R2_Credentials` não estão definidas, preservando o fluxo de seed local atual e permitindo rodar testes sem tocar a rede.
- **Upload_Endpoints**: o conjunto dos 5 pontos do código que hoje fazem `writeFile` + `mkdir`:
  1. `src/app/api/upload/route.ts` (mídias do provider).
  2. `src/app/api/upload-audio/route.ts` (áudio de apresentação do provider).
  3. `src/app/api/upload/verification/route.ts` (documentos de verificação de identidade).
  4. `src/app/_actions/auth.ts` > `registerProviderAction` (foto inicial do provider no cadastro).
  5. `src/app/_actions/client-profile.ts` > `uploadClientAvatarAction` (avatar do cliente).
- **Persisted_URL**: URL salva em colunas de banco — `Profile.audioUrl`, `Media.url`, `User.image`, `VerificationCase.documentFrontUrl`, `VerificationCase.documentBackUrl`, `VerificationCase.selfieUrl`, `VerificationCase.videoUrl`. Após esta migração, novos uploads gravam aqui a `R2_Public_URL` + chave do objeto. URLs antigas no formato `/uploads/...` permanecem intactas (legacy data sem migração de bytes — banco será zerado em produção).
- **Presigned_URL**: URL temporária assinada com as `R2_Credentials` que autoriza um cliente HTTP arbitrário a ler ou escrever um objeto específico do `R2_Bucket` por um intervalo curto. Usado quando aplicável para arquivos privados (documentos de verificação); arquivos públicos (mídias do diretório, avatares) usam `R2_Public_URL` direta.
- **Object_Key**: a chave (path lógico) do objeto no `R2_Bucket`. Formato canônico desta migração: `<scope>/<owner_id>/<filename>` onde `scope` é um de `uploads`, `verification` ou `audio`, `owner_id` é o `profileId` ou `userId` aplicável, e `filename` segue o padrão atual (`<timestamp>-<rand>.<ext>` ou `audio-<timestamp>.<ext>`).
- **Egress**: tráfego de saída do storage para a internet (downloads de imagens/vídeos pelos usuários finais). Cloudflare R2 cobra zero egress, o que é a justificativa principal de escolha sobre AWS S3 puro neste produto de mídia.
- **Railway_Service**: unidade de deploy no Railway. Esta migração entrega 3 services: `web` (Next.js app via `Dockerfile`), `cron-expire-plans` (chama `GET /api/cron/expire-plans` diário 03:00 BRT) e `cron-reset-hot` (chama `GET /api/cron/reset-hot` diário 04:00 BRT).
- **Railway_Postgres**: add-on Postgres do Railway provisionado na mesma região do `Railway_Service` `web`, com backup diário automático e `DATABASE_URL` injetado como envvar pelo painel Railway.
- **Dockerfile_Definition**: arquivo `Dockerfile` na raiz do repo que descreve a build da imagem Docker do `Privello_App`, em multi-stage (deps → build → runner) usando `output: "standalone"` do Next.js 16 e `prisma generate` + `prisma migrate deploy` no boot.
- **Cron_Secret**: envvar `CRON_SECRET` (já existente) que autentica os jobs cron via header `Authorization: Bearer $CRON_SECRET` ou `X-Cron-Secret`. A migração configura os schedulers do Railway para enviar este header.
- **Webhook_MP_URL**: URL pública atualizada do endpoint `POST /api/mp/webhook` no domínio de produção; precisa ser registrada no painel do Mercado Pago após o DNS estar ativo.
- **Production_Hostname**: hostname público final do `Privello_App` em produção (ex.: `privello.com.br`), usado por `next.config.ts > images.remotePatterns` (já existente — esta migração não muda a regra, apenas adiciona o hostname do `R2_Public_URL`).
- **Rollback_Plan**: estratégia documentada em `docs/deploy-railway.md` que permite voltar atrás caso o deploy do Railway falhe — inclui retomar o último deploy verde, restaurar backup do `Railway_Postgres`, e (caso necessário) repontar DNS para a infraestrutura anterior.

---

## 1. Cabeçalho de proveniência

- **spec_path**: `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\specs\migracao-infra-producao\`
- **spec_name**: `migracao-infra-producao`
- **created_at**: 2026-05-17
- **workflow**: `requirements-first` / `feature`
- **agents_rule_areas**:
  - `next-config / output-standalone` (consulta planejada na fase Design — antes de adicionar `output: "standalone"` ao `next.config.ts`).
  - `route-handler / streaming-uploads` (consulta planejada na fase Design — para decidir se uploads grandes via R2 mantêm `req.formData()` ou migram para streaming).
- **dependências externas (não-código)**:
  - Conta Cloudflare com R2 ativado.
  - Conta Railway com plano que comporte o serviço `web` + Postgres add-on + 2 cron services.
  - Domínio `.com.br` registrado em Registro.br.
  - Credenciais Mercado Pago já existentes (atualizar webhook).

### 1.1 Decisões trazidas pela análise de requirements (2026-05-17)

- **REQ-2.1 (auto-resolved):** mkdir+writeFile completamente proibidos nos 5 pontos de upload após refactor.
- **REQ-4.5 (auto-resolved):** HTTP 500 retornado mesmo se o logging estruturado da falha do putObject falhar.
- **REQ-6.4 (auto-resolved):** putObject envolto em try/catch em uploadClientAvatarAction, suprimindo qualquer exception.
- **REQ-1.4:** Storage_Module valida apenas presença de envvars na inicialização; credenciais inválidas só falham no primeiro putObject/deleteObject.
- **REQ-1.5:** Storage_Local_Fallback ativa SOMENTE quando envvars R2_* completamente ausentes; presentes mas inválidas propagam erro do SDK.
- **REQ-3.4:** Sem cleanup de orfãos no R2 — retenção permanente intencional, espelhando o comportamento atual em disco.
- **REQ-4.4:** URL pública aceita como fallback temporário em verification/*; Presigned_URL é blocker antes do go-live real (registrado em docs/deploy-railway.md).
- **REQ-5.2:** signIn("credentials") é mantido após falha não-fatal do upload em registerProviderAction.
- **REQ-8.6:** Validações no host (lint/tsc/test) precedem docker build; erros de prisma generate dentro do Docker bloqueiam build.
- **REQ-10.2:** Permanece flexível — dev escolhe remover ou mover deploy-vercel.md para legacy/, com rationale registrado em CHANGELOG.

---

## 2. Out-of-Scope Findings

> Achados durante a redação desta requirements que não pertencem a esta fase. Cada achado novo durante execução deve ser anexado aqui em vez de absorvido silenciosamente.

| discoveredIn | description | proposedTarget | evidence |
|---|---|---|---|
| _(vazio até a primeira descoberta durante execução)_ | | | |

---

## 3. Non-Goals (fora de escopo)

Os itens abaixo NÃO fazem parte deste spec e não devem virar tarefa:

1. **Trocar o gateway de pagamento** — Mercado Pago se mantém. Stripe e similares permanecem fora (Stripe historicamente bloqueia o nicho do produto).
2. **Adicionar gateway secundário de pagamento** — fora do escopo.
3. **Migrar email transacional para Resend/SES** — manter SMTP via Gmail. Resend/SES é melhoria futura.
4. **Refatorar Server Actions ou serviços além do necessário para usar `Storage_Module`** — a migração só altera os 5 `Upload_Endpoints` listados no Glossário e cria um único módulo novo. Nenhum outro arquivo de aplicação é tocado.
5. **Trocar versões de Prisma, Next.js ou NextAuth** — permanecem como estão.
6. **Adicionar features novas** (planos novos, canais de notificação, gamificação etc.) — fora.
7. **WCAG / acessibilidade ampla** — não é o foco.
8. **App nativo, PWA, push notifications** — fora.
9. **Migrar bytes existentes em `public/uploads/`** — banco de produção é virgem; novos uploads passam pelo R2; seeds antigos são descartados. Não há job de backfill.
10. **CSP enforcement** (Report-Only → real) — gerenciado por `fase-1-seguranca`, não toca aqui.
11. **Smokes em browsers reais** (iOS/Android físicos) — `fase-6-mobile-cross-browser` documentou cabeçalhos; não é foco desta migração.
12. **Cleanup `queries.ts`** — só após 2026-06-13 (`fase-7-dx-infra`).
13. **Mudanças em `prisma/schema.prisma`** — schema é congelado. Esta migração **não** adiciona/remove colunas; URLs novas reusam os mesmos campos existentes (`Profile.audioUrl`, `Media.url`, `User.image`, `VerificationCase.*`).
14. **Migrar URLs já persistidas no banco** — irrelevante (banco zerado).
15. **CDN com transforms de imagem agressivos** — Cloudflare na frente do R2 é configurado em modo passthrough nesta fase. Image Resizing/Polish do Cloudflare é melhoria futura.
16. **Multi-região / failover ativo** — uma região só (Railway US ou EU, decisão na fase Design).
17. **Auto-scaling sofisticado** — Railway usa o default do plano contratado; tunning de réplicas é fora.
18. **Observabilidade em produção** (APM, log shipping) — `fase-7-dx-infra` declarou Non-Goal; mantém-se Non-Goal aqui.

Qualquer item desta lista que se mostrar necessário durante a execução vira `Out-of-Scope Finding` (seção 2) e exige decisão explícita antes de ser absorvido.

---

## 4. Restrições permanentes

- **Workspace**: trabalho restrito a `c:\Users\edulanzarin\Documents\Dev\privello\`.
- **Idioma**: pt-BR consistente em código de usuário, mensagens e documentação.
- **Não tocar**: `node_modules/**`, `.env` real, `prisma/schema.prisma` (salvo necessidade absoluta justificada via `Out-of-Scope Finding`).
- **AGENTS_Rule**: consultar `node_modules/next/dist/docs/` antes de qualquer decisão técnica que envolva APIs do Next.js (em particular `next.config.ts > output`, route handlers de upload, e `next/image > remotePatterns`).
- **Comandos destrutivos**: NÃO usar `git push`, `git reset --hard`, `git clean`, `Remove-Item -Recurse -Force` em massa.
- **Testes**: manter 305+ testes verdes durante toda a migração. `npm run test` (Vitest) deve rodar sem rede e sem banco em ≤ 60s, mantendo o contrato declarado em `fase-2-testes/testing-conventions.md > §8`.
- **Lint / TS**: manter 0 lint problems e 0 erros TS (`npm run lint`, `npx tsc --noEmit`).

---

## Requirements

### Requirement 1: Módulo de storage `src/lib/storage.ts`

**User Story:** Como dev de manutenção do Privello, quero um único módulo que encapsule o cliente S3 contra o Cloudflare R2, para que os 5 pontos de upload consumam uma API estável e o produto fique trocável de provedor sem alterar 5 arquivos.

**Inputs:** novo arquivo `src/lib/storage.ts`; novas envvars `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL`.

#### Acceptance Criteria

1. THE Storage_Module SHALL exportar uma função `putObject(key: string, body: Buffer | Uint8Array, contentType: string)` que persiste o objeto no R2_Bucket sob a Object_Key fornecida e retorna a URL pública composta com R2_Public_URL.
2. THE Storage_Module SHALL exportar uma função `deleteObject(key: string)` que remove o objeto do R2_Bucket.
3. THE Storage_Module SHALL ler R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME e R2_PUBLIC_URL do `process.env` em tempo de inicialização.
4. WHEN R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY ou R2_BUCKET_NAME estiver ausente em runtime de produção (`NODE_ENV === "production"`), THE Storage_Module SHALL lançar um erro descritivo com o nome da envvar faltante.
4.1. THE Storage_Module SHALL validar apenas a **presença** das envvars R2 em inicialização — credenciais inválidas só são detectadas no primeiro `putObject`/`deleteObject`, propagando o erro do SDK S3 conforme acceptance criterion 1.8.
5. WHERE Storage_Local_Fallback estiver ativo — definido como ausência completa das envvars R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, e R2_BUCKET_NAME em `NODE_ENV !== "production"` — THE Storage_Module SHALL escrever o objeto em `public/<scope>/<owner_id>/<filename>` no filesystem local e retornar a URL relativa (`/<scope>/<owner_id>/<filename>`), preservando o fluxo de dev sem rede. Envvars presentes mas inválidas, ou R2 inacessível, NÃO ativam fallback — propagam erro original do SDK S3 (cf. acceptance criterion 1.8).
6. THE Storage_Module SHALL compor URLs públicas no formato `${R2_PUBLIC_URL}/${objectKey}` sem barra duplicada, independentemente da presença de barra final em R2_PUBLIC_URL.
7. THE Storage_Module SHALL aceitar Object_Keys com sub-paths arbitrários (`uploads/<id>/<file>`, `verification/<id>/<file>`, `audio/<id>/<file>`) sem validar formato — a responsabilidade de gerar a chave canônica é do caller.
8. WHEN o S3 SDK retornar erro de rede ou de credenciais, THE Storage_Module SHALL propagar o erro original sem mascarar, para que o caller decida o `HTTP status` apropriado.
9. THE Storage_Module SHALL ser testado por testes unitários em `src/lib/storage.test.ts` que cobrem: composição da URL pública, fallback local em ausência de credenciais, erro descritivo em produção sem credenciais, e idempotência da Object_Key (mesmo `key` chamado duas vezes resulta no mesmo objeto final, sem path duplicado).
10. IF a operação `putObject` for chamada com a mesma Object_Key duas vezes, THEN THE Storage_Module SHALL sobrescrever o objeto existente sem erro, preservando o contrato S3 padrão de PUT idempotente em chave igual.

### Requirement 2: Refactor de `src/app/api/upload/route.ts` para usar `Storage_Module`

**User Story:** Como provider, quero que minhas mídias (fotos e vídeos) sejam enviadas ao R2 e fiquem acessíveis em qualquer réplica do app, para que minhas fotos não desapareçam quando o Railway reiniciar o container.

**Inputs:** `src/app/api/upload/route.ts` (existente, refactor); consome `Storage_Module`.

#### Acceptance Criteria

1. THE Privello_App SHALL substituir as chamadas `mkdir` + `writeFile` em `src/app/api/upload/route.ts` por uma única chamada a `putObject` do Storage_Module com Object_Key `uploads/<profileId>/<filename>`.
2. THE Privello_App SHALL preservar todas as validações existentes deste route handler (auth via NextAuth, rate limit `upload`, validação Zod com `UploadBodySchema`, validação manual de MIME, validação de tamanho por categoria, header `Content-Length` máximo).
3. THE Privello_App SHALL preservar o contrato de retorno: 200 com `{ ok: true, url }` para REEL/story; 200 com `{ ok: true, media }` para imagem/vídeo normais (com `media.url` apontando para a Persisted_URL); 400/401/404/413/429 conforme antes.
4. WHEN a operação `putObject` falhar, THE Privello_App SHALL retornar HTTP 500 com `{ error: "Falha ao enviar arquivo." }` e logar a falha estruturada com `endpoint: "upload"`.
5. THE Privello_App SHALL persistir a URL pública retornada por `putObject` no campo `Media.url` (igual à Persisted_URL atual em formato `/uploads/...` no fallback local, e `https://...r2.dev/uploads/...` em produção).
6. THE Privello_App SHALL manter inalterada a regra de `isCover` (primeira foto pública do perfil é `isCover = true`).
7. THE Privello_App SHALL não conter chamadas a `mkdir` ou `writeFile` em `src/app/api/upload/route.ts` após o refactor — toda escrita passa exclusivamente pelo Storage_Module.

### Requirement 3: Refactor de `src/app/api/upload-audio/route.ts` para usar `Storage_Module`

**User Story:** Como provider, quero que o áudio de apresentação do meu perfil sobreviva a deploys da plataforma, para que minha gravação não seja perdida quando o servidor for reiniciado.

**Inputs:** `src/app/api/upload-audio/route.ts` (existente, refactor); consome `Storage_Module`.

#### Acceptance Criteria

1. THE Privello_App SHALL substituir `mkdir` + `writeFile` deste handler por uma chamada a `putObject` do Storage_Module com Object_Key `audio/<profileId>/audio-<timestamp>.<ext>`.
2. THE Privello_App SHALL preservar todas as validações existentes (auth via NextAuth, validação Zod com `UploadAudioBodySchema`, validação manual de MIME pelo `Content-Type` e nome do arquivo, validação de tamanho contra `MAX_AUDIO_BYTES`, header `Content-Length` máximo).
3. THE Privello_App SHALL persistir a URL pública retornada por `putObject` em `Profile.audioUrl`.
4. WHEN o handler `DELETE` for chamado, THE Privello_App SHALL setar `Profile.audioUrl = null` sem chamar `deleteObject` no R2. Outras operações de cleanup do handler (não relacionadas a R2) SHALL permanecer inalteradas. Retenção permanente do objeto no R2 é o comportamento intencional desta fase, espelhando exatamente a paridade com o comportamento atual em disco; não há job de orphan cleanup neste spec.
5. WHEN a operação `putObject` falhar, THE Privello_App SHALL retornar HTTP 500 com `{ error: "Falha ao enviar áudio." }` e logar a falha estruturada com `endpoint: "upload-audio"`.
6. THE Privello_App SHALL não conter chamadas a `mkdir` ou `writeFile` em `src/app/api/upload-audio/route.ts` após o refactor — toda escrita passa exclusivamente pelo Storage_Module.

### Requirement 4: Refactor de `src/app/api/upload/verification/route.ts` para usar `Storage_Module`

**User Story:** Como compliance / moderação, quero que documentos de verificação de identidade sejam armazenados de forma durável e privada, para que o processo de KYC do produto seja auditável e não perca evidências em rebuilds.

**Inputs:** `src/app/api/upload/verification/route.ts` (existente, refactor); consome `Storage_Module`.

#### Acceptance Criteria

1. THE Privello_App SHALL substituir `mkdir` + `writeFile` deste handler por uma chamada a `putObject` do Storage_Module com Object_Key `verification/<profileId>/<timestamp>-<rand>.<ext>`.
2. THE Privello_App SHALL preservar todas as validações existentes (auth via NextAuth, validação Zod com `UploadVerificationBodySchema`, validação manual de MIME, validação de tamanho separada para imagem (≤10 MB) e vídeo (≤150 MB)).
3. THE Privello_App SHALL retornar a URL pública composta como Persisted_URL no payload `{ ok: true, url }` para a server action `submitVerificationCase` consumir.
4. THE Privello_App SHALL preferir Presigned_URL para arquivos do scope `verification/*` quando a estratégia estiver implementada (decisão final na fase Design). WHERE Presigned_URL não estiver implementado, THE Privello_App SHALL aceitar URL pública como fallback temporário aceito, com a obrigatoriedade de migrar para Presigned_URL antes do go-live de produção real (registrado como blocker em `docs/deploy-railway.md`).
5. WHEN a operação `putObject` falhar, THE Privello_App SHALL retornar HTTP 500 com `{ error: "Falha ao enviar documento." }` e logar a falha estruturada com `endpoint: "upload-verification"`.
6. WHEN o logging estruturado da falha do `putObject` falhar (ex: stdout indisponível), THE Privello_App SHALL ainda assim retornar HTTP 500, sem propagar a exception do logger ao cliente.
7. THE Privello_App SHALL não conter chamadas a `mkdir` ou `writeFile` em `src/app/api/upload/verification/route.ts` após o refactor — toda escrita passa exclusivamente pelo Storage_Module.

### Requirement 5: Refactor de `registerProviderAction` em `src/app/_actions/auth.ts`

**User Story:** Como provider novo, quero que a foto enviada no meu cadastro inicial seja persistida durante o registro, para que meu perfil já apareça com foto desde a primeira sessão.

**Inputs:** `src/app/_actions/auth.ts` > `registerProviderAction` (existente, refactor); consome `Storage_Module`.

#### Acceptance Criteria

1. THE Privello_App SHALL substituir o bloco `import("fs/promises")` + `mkdir` + `writeFile` em `registerProviderAction` por uma chamada a `putObject` do Storage_Module com Object_Key `uploads/<profileId>/<timestamp>.<ext>`.
2. THE Privello_App SHALL preservar a semântica não-fatal do upload: WHEN a operação `putObject` falhar, THE Privello_App SHALL completar o cadastro mesmo assim, deixando o perfil sem foto inicial e logando a falha estruturada.
3. THE Privello_App SHALL persistir a URL pública retornada por `putObject` exatamente onde a URL `/uploads/...` era persistida hoje (na criação do registro `Media` inicial associado ao novo `Profile`).
4. THE Privello_App SHALL manter `signIn("credentials")` executando ao final de `registerProviderAction`, e o estado de auto-login SHALL ser preservado entre a falha do upload (Requirement 5.2) e o término da action.
5. THE Privello_App SHALL não conter chamadas a `mkdir` ou `writeFile` em `src/app/_actions/auth.ts` > `registerProviderAction` após o refactor — toda escrita passa exclusivamente pelo Storage_Module.

### Requirement 6: Refactor de `uploadClientAvatarAction` em `src/app/_actions/client-profile.ts`

**User Story:** Como cliente da plataforma, quero que meu avatar enviado pelo painel sobreviva a deploys, para que minha foto de perfil não seja resetada entre versões da aplicação.

**Inputs:** `src/app/_actions/client-profile.ts` > `uploadClientAvatarAction` (existente, refactor); consome `Storage_Module`.

#### Acceptance Criteria

1. THE Privello_App SHALL substituir `mkdir` + `writeFile` em `uploadClientAvatarAction` por uma chamada a `putObject` do Storage_Module com Object_Key `uploads/<userId>/<timestamp>-<rand>.<ext>`.
2. THE Privello_App SHALL preservar todas as validações existentes (auth via `auth()`, Zod com `UploadClientAvatarSchema`, validação manual de MIME, tamanho ≤ 5 MB).
3. THE Privello_App SHALL persistir a URL pública retornada por `putObject` em `User.image`.
4. THE Privello_App SHALL envolver a chamada a `putObject` em try/catch dentro de `uploadClientAvatarAction`, e em qualquer exception (incluindo erros não-S3 propagados pelo módulo), SHALL retornar `{ error: "Falha ao enviar avatar." }` sem propagar a exception para o boundary do server action.
5. THE Privello_App SHALL não conter chamadas a `mkdir` ou `writeFile` em `src/app/_actions/client-profile.ts` > `uploadClientAvatarAction` após o refactor — toda escrita passa exclusivamente pelo Storage_Module.

### Requirement 7: Atualizar `next.config.ts` para liberar imagens do `R2_Public_URL`

**User Story:** Como visitante do diretório, quero ver as fotos dos perfis carregando otimizadas via `next/image`, para ter a mesma experiência visual de hoje após a migração.

**Inputs:** `next.config.ts` (existente, edit); leitura de `R2_PUBLIC_URL` em build/runtime.

#### Acceptance Criteria

1. THE Privello_App SHALL adicionar uma entrada em `next.config.ts > images.remotePatterns` que case com o hostname extraído de `R2_PUBLIC_URL` (ex.: `pub-<id>.r2.dev` ou `cdn.privello.com.br`), com `protocol: "https"` e `pathname: "/**"`.
2. WHEN R2_PUBLIC_URL não estiver definido em build (dev local sem R2), THE Privello_App SHALL não adicionar a entrada — o array `remotePatterns` mantém apenas as entradas atuais (PRODUCTION_HOSTNAME, picsum, googleapis, googleusercontent).
3. THE Privello_App SHALL preservar todas as entradas atuais de `remotePatterns` sem modificação.
4. THE Privello_App SHALL evitar entradas curinga (`hostname: "**"`) ao adicionar o R2 — a entrada deve ser específica ao hostname extraído.

### Requirement 8: `Dockerfile` multi-stage para Next.js 16 + Prisma com `output: "standalone"`

**User Story:** Como dev de deploy, quero uma imagem Docker reproduzível para o Railway, para que builds em produção sejam determinísticos e independentes do ambiente Nixpacks.

**Inputs:** novo `Dockerfile` na raiz; novo `.dockerignore` na raiz; edit em `next.config.ts` para adicionar `output: "standalone"`.

#### Acceptance Criteria

1. THE Privello_App SHALL adicionar `output: "standalone"` ao export default de `next.config.ts`, após consulta documentada em comentário ao guia `node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/output.md` (AGENTS_Rule).
2. THE Privello_App SHALL conter um `Dockerfile` na raiz com pelo menos 3 estágios:
   - `deps`: instala dependências de produção via `npm ci`.
   - `builder`: gera cliente Prisma (`npx prisma generate`) e roda `npm run build`.
   - `runner`: imagem mínima (Node.js Alpine ou distroless) que copia `.next/standalone`, `.next/static`, `public/` e o cliente Prisma gerado, e expõe a porta `3000`.
3. THE Privello_App SHALL executar `npx prisma migrate deploy` no comando de boot do `runner` antes de iniciar o servidor Next.js.
4. THE Privello_App SHALL conter um `.dockerignore` na raiz que exclua, no mínimo, `node_modules`, `.next` (exceto o que o build gera), `.env`, `.git`, `coverage/`, `playwright-report/`, `test-results/`, `.kiro/`, `docs/legacy/`, `design/`, `public/uploads/` e `public/verification/`.
5. THE Privello_App SHALL produzir uma imagem Docker que inicia em ≤ 5 segundos a partir do `docker run`, mensurada em `docker.md` ou `deploy-railway.md` (smoke check manual).
6. THE Privello_App SHALL passar `npm run lint` (0 problems), `npx tsc --noEmit` (0 erros) e `npm run test` (305+ verdes) **antes** do `docker build` ser executado — esta é a porta de qualidade no host, independente da imagem Docker.
7. WHEN `docker build .` é executado na raiz, THE Privello_App SHALL completar sem erros de `prisma generate`, sem erros de copy de assets standalone, e produzir uma imagem startável. Erro em `prisma generate` durante o build Docker é bloqueante mesmo se o app TS/lint estiver OK no host (validação estrita do schema é exigida).

### Requirement 9: Crons no Railway substituindo `vercel.json`

**User Story:** Como dev de operação, quero os 2 jobs cron rodando em produção no Railway com a mesma cadência atual, para que planos expirem e contadores de "hot" resetem como esperado.

**Inputs:** documentação em `docs/deploy-railway.md` (instruções operacionais — provisionamento manual no painel Railway, não código).

#### Acceptance Criteria

1. THE deploy-railway documentation SHALL declarar 2 Railway_Service cron schedulers:
   - `cron-expire-plans` chamando `GET ${PRODUCTION_BASE_URL}/api/cron/expire-plans` em `0 6 * * *` UTC (equivalente a 03:00 BRT, considerando UTC-3).
   - `cron-reset-hot` chamando `GET ${PRODUCTION_BASE_URL}/api/cron/reset-hot` em `0 7 * * *` UTC (equivalente a 04:00 BRT).
2. THE deploy-railway documentation SHALL declarar que cada scheduler envia `Authorization: Bearer $CRON_SECRET` no request, consumindo o helper `verifyCronSecret` já existente em `src/lib/security/cron-auth.ts`.
3. THE deploy-railway documentation SHALL declarar que `?secret=` em query string NÃO deve ser usado pelos schedulers do Railway (a janela de transição encerra em `2026-06-15T00:00:00Z` por `CRON_SECRET` em `cron-auth.ts`; usar header de saída).
4. THE deploy-railway documentation SHALL incluir um comando de teste manual para validar cada cron antes do go-live (`curl -H "Authorization: Bearer $CRON_SECRET" https://.../api/cron/expire-plans`).

### Requirement 10: Documentação `docs/deploy-railway.md` substitui `docs/deploy-vercel.md`

**User Story:** Como dev novo no projeto, quero um único documento canônico de deploy em produção, para subir o app sem ter que adivinhar passos.

**Inputs:** novo `docs/deploy-railway.md`; remoção de `docs/deploy-vercel.md`.

#### Acceptance Criteria

1. THE Privello_App SHALL conter um documento `docs/deploy-railway.md` com seções, no mínimo:
   - **Pré-requisitos** (contas Cloudflare, Railway, Registro.br; credenciais Mercado Pago).
   - **Provisionamento R2** (criar bucket, gerar API tokens, anotar `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL`).
   - **Provisionamento Railway** (criar projeto, conectar repo, adicionar Postgres add-on, configurar envvars, habilitar Dockerfile build).
   - **Configuração de domínio** (registrar `.com.br` no Registro.br, apontar nameservers para Cloudflare, criar registro A/CNAME para o Railway).
   - **Configuração de cron** (provisionar os 2 Railway_Service cron schedulers do Requirement 9).
   - **Atualização do Webhook_MP_URL** (apontar webhook do Mercado Pago para `https://<dominio>/api/mp/webhook`).
   - **Rollback_Plan** (passo-a-passo para voltar atrás em caso de falha de deploy).
   - **Smoke checks pós-deploy** (criar conta provider seed, fazer upload de foto, verificar URL no R2, abrir checkout MP, etc.).
2. THE Privello_App SHALL remover `docs/deploy-vercel.md` ou movê-lo para `docs/legacy/deploy-vercel.md` para preservar o registro histórico sem confundir devs novos.
2.1. THE Privello_App SHALL documentar a decisão final (remover vs mover para `docs/legacy/deploy-vercel.md`) no `CHANGELOG.md` da entrega, junto com o rationale (1 linha) — para que devs novos saibam onde procurar histórico se precisarem.
3. THE Privello_App SHALL atualizar `CHANGELOG.md` registrando a entrega da migração na seção `Changed` (substituição do alvo de hospedagem) e `Added` (módulo `Storage_Module`, Dockerfile, `docs/deploy-railway.md`).
4. THE Privello_App SHALL atualizar quaisquer cross-refs internos em outros docs (`docs/env.md`, `docs/docker.md`, ADRs novos) que referenciem o arquivo legado.

### Requirement 11: Atualizar `.env.example` e `docs/env.md` com as envvars R2

**User Story:** Como dev novo, quero que `.env.example` e `docs/env.md` listem as envvars R2 com descrição e exemplo, para configurar o ambiente local sem ter que ler o código de `Storage_Module`.

**Inputs:** `.env.example` (edit); `docs/env.md` (edit).

#### Acceptance Criteria

1. THE Privello_App SHALL adicionar a `.env.example` 5 novas variáveis com comentários: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL`.
2. THE Privello_App SHALL marcar em `.env.example` que essas 5 variáveis são opcionais em dev (Storage_Local_Fallback ativo) e obrigatórias em produção.
3. THE Privello_App SHALL adicionar entradas correspondentes em `docs/env.md` na tabela canônica `Variable | Description | Example | Environment`, com `Environment = prod` para todas as 5.
4. THE Privello_App SHALL preservar todas as 16+4 envvars existentes em `.env.example` e `docs/env.md` sem modificá-las.

### Requirement 12: Smoke checks finais (lint, typecheck, testes, docker build local)

**User Story:** Como mantenedor, quero garantir que a migração não regrediu nada antes de virar produção, para evitar surpresas com a base já estável (305/305 testes, 0 erros TS, 0 lint problems).

**Inputs:** verificação local; documentação no `handoff` da fase.

#### Acceptance Criteria

1. THE Privello_App SHALL passar `npm run lint` com 0 lint problems após a migração (mesmo contrato consumido pela CI, conforme `fase-7-dx-infra/dx-conventions.md > §1 CI Pipeline`).
2. THE Privello_App SHALL passar `npx tsc --noEmit` com 0 erros após a migração.
3. THE Privello_App SHALL passar `npm run test` (Vitest) com 305+ testes verdes após a migração — incluindo os novos testes do `Storage_Module` (Requirement 1.9).
4. THE Privello_App SHALL completar `docker build .` em uma máquina dev sem erros, produzindo uma imagem que inicia com `docker run -p 3000:3000` e responde HTTP 200 em `GET /` em ≤ 10 segundos após boot (smoke check manual, com `R2_*` desativado e Storage_Local_Fallback ativo).
5. THE Privello_App SHALL deixar registrada uma entrada em `CHANGELOG.md` mencionando: módulo `Storage_Module`, Dockerfile, `docs/deploy-railway.md`, e os 5 pontos de upload migrados.

---

## 5. Non-Functional Requirements

### 5.1 Durabilidade e disponibilidade

- **NFR-DUR-1**: arquivos enviados ao R2_Bucket SHALL ter durabilidade ≥ 99.999999999% (11×9), conforme SLA Cloudflare R2 — herdado, não exigido por código.
- **NFR-DUR-2**: o Storage_Module SHALL não tentar retentar requests `PUT` falhos automaticamente nesta fase — o caller decide se retenta. Retentativa automática é melhoria futura.
- **NFR-DUR-3**: o `Railway_Postgres` SHALL ter backup diário automático ativo, configuração feita no painel Railway e documentada em `deploy-railway.md`.

### 5.2 Observabilidade

- **NFR-OBS-1**: cada upload-related route handler SHALL logar uma linha estruturada (`{ ts, endpoint, key, ownerId, contentType, size, ok | error }`) por upload, no mesmo padrão do log de rate-limit existente em `src/app/api/upload/route.ts`.
- **NFR-OBS-2**: o Storage_Module SHALL não logar credenciais R2 nem o conteúdo dos arquivos, apenas a Object_Key e o tamanho em bytes.
- **NFR-OBS-3**: erros do `putObject` SHALL ser propagados com a mensagem original do SDK S3 para diagnóstico, sem mascaramento.

### 5.3 Segurança

- **NFR-SEC-1**: as `R2_Credentials` SHALL viver exclusivamente em envvars do Railway (não versionadas) e nunca em commits, logs ou respostas HTTP.
- **NFR-SEC-2**: o `R2_Bucket` SHALL ser configurado como público para leitura apenas para os scopes `uploads/*` e `audio/*` (mídias do diretório, avatares, áudios). O scope `verification/*` SHALL ser mantido privado, com acesso por Presigned_URL ou (alternativa) bucket separado — decisão final na fase Design.
- **NFR-SEC-3**: o `Storage_Module` SHALL usar `signatureVersion: "v4"` no cliente S3 (default do SDK AWS v3 e exigido pelo R2).
- **NFR-SEC-4**: WHEN o usuário enviar um upload, THE Privello_App SHALL preservar a validação de MIME e tamanho **antes** de chamar `putObject`, mantendo a postura defensiva atual de rejeitar formatos inválidos sem tocar o storage externo.
- **NFR-SEC-5**: `MP_WEBHOOK_SECRET` continua obrigatório em produção (já existente). A migração apenas atualiza o destino do webhook no painel Mercado Pago para `https://<dominio>/api/mp/webhook`.

### 5.4 Custo

- **NFR-COST-1**: o R2_Bucket SHALL incorrer em zero egress fee, conforme política Cloudflare R2 — fator decisivo para um produto de mídia. Storage cobrado conforme tabela Cloudflare R2 vigente; expectativa documentada em `deploy-railway.md`.
- **NFR-COST-2**: o `Railway_Service` `web` SHALL usar o plano mais barato compatível com 1 réplica e ~1 GB de RAM. Tunning de tamanho fica para iteração futura baseada em métricas reais.
- **NFR-COST-3**: os 2 cron services SHALL usar o plano mínimo do Railway (executam 1× por dia, custo desprezível).

### 5.5 Rollback

- **NFR-RB-1**: o `Rollback_Plan` SHALL estar documentado em `docs/deploy-railway.md` e cobrir, no mínimo:
  - retomar o último deploy verde no painel Railway (built-in, 1 clique);
  - restaurar backup do `Railway_Postgres` para um snapshot ≤ 24h anterior;
  - manter o R2_Bucket intacto (não deletar objetos durante rollback);
  - reapontar DNS via Cloudflare se o domínio estiver corrompido.
- **NFR-RB-2**: o Dockerfile SHALL produzir imagens identificáveis por SHA do commit (label `org.opencontainers.image.revision`) para que rollbacks no Railway façam pin a um SHA conhecido.
- **NFR-RB-3**: o Storage_Module SHALL aceitar trocar a env `R2_PUBLIC_URL` sem mudar código (ex.: trocar de `pub-<id>.r2.dev` para `cdn.privello.com.br` quando o CDN entrar) — a URL pública é composta em runtime, não embutida em build.

### 5.6 Performance

- **NFR-PERF-1**: o `Storage_Module` SHALL adicionar latência ≤ 500 ms ao tempo total de um upload em condição normal (medido localmente no smoke check do Requirement 12).
- **NFR-PERF-2**: o boot da imagem Docker até HTTP 200 em `GET /` SHALL ser ≤ 10 segundos em hardware dev (Requirement 12.4).

### 5.7 Compatibilidade com a base existente

- **NFR-COMPAT-1**: a migração SHALL preservar a forma das URLs em DB para o caller (`Profile.audioUrl`, `Media.url`, `User.image`, `VerificationCase.*`) — mesma string, conteúdo composto pelo `Storage_Module`. Nenhum schema Prisma é alterado.
- **NFR-COMPAT-2**: a migração SHALL preservar todos os contratos de Server Actions e Route Handlers (assinatura, retorno, status codes), conforme detalhado em cada Requirement 2–6.
- **NFR-COMPAT-3**: a migração SHALL preservar `npm run test` rodando sem rede e sem banco (Storage_Module em testes usa fallback local ou mock), mantendo o contrato declarado em `fase-2-testes/testing-conventions.md > §8`.
