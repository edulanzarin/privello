# Requirements Document

> Spec-filho `fase-1-seguranca` promovido a partir do master spec da Auditoria Geral.
> Master: `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\specs\auditoria-geral\requirements.md`.

---

## Introduction

Este spec-filho executa a **Fase 1 — Endurecimento de segurança** do roadmap mestre `auditoria-geral`. O objetivo é fechar superfícies de ataque conhecidas em endpoints de dev/cron, otimizador de imagens, validação de input, rate limit, configuração do NextAuth e headers, antes que outras fases otimizem ou refaçam fluxos sobre essas mesmas rotas.

A fase **não tem dependências** no grafo (`PROMOCAO.md > §5`) e pode rodar em paralelo com `fase-2-testes` (Onda 1). Ela toca duas `NextApiArea` (`images-config`, `headers`) e por isso a seção 4 deste documento (consultas a `node_modules/next/dist/docs/`) é obrigatória antes da primeira decisão técnica nessas áreas.

Os EARS herdados do `Requirement 2` do master spec definem o resultado esperado; novos requisitos abaixo destrincham as superfícies tocadas e adicionam EARS de detalhe verificáveis. Achados que extrapolarem o escopo voltam ao master via `OutOfScopeFinding` (seção 3).

---

## 1. Cabeçalho de proveniência

- **master_spec_path**: `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\specs\auditoria-geral\requirements.md`
- **master_design_path**: `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\specs\auditoria-geral\design.md`
- **phase_id**: `fase-1-seguranca`
- **phase_title**: Endurecimento de segurança
- **promoted_at**: 2026-03-14
- **child_spec_path**: `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\specs\fase-1-seguranca\`
- **bridge_contract**: `design.md > Components and Interfaces > Child Spec Bridge`
- **agents_rule_areas**: `images-config`, `headers`
- **historical_refs**: nenhum (a Fase 1 não herda de specs arquivados em `.kiro/specs/_archive/`)

### Critérios de aceite herdados (EARS)

Os EARS abaixo foram copiados literalmente do `Requirement 2` do master spec (`requirements.md`). Eles definem o resultado esperado desta fase; novos requisitos podem **detalhar** as superfícies tocadas, mas não podem contradizer ou ampliar o escopo declarado aqui — o que extrapolar volta ao master via `OutOfScopeFinding` (seção 3).

- **Requirement 2.1** — `THE Phase_1_Spec SHALL cobrir endurecimento de /api/dev/*, exigindo, além de NODE_ENV !== "production", autenticação (sessão de admin ou token dedicado).`
- **Requirement 2.2** — `THE Phase_1_Spec SHALL substituir o segredo em query string de /api/cron/* por header (ex.: Authorization: Bearer <CRON_SECRET> ou X-Cron-Secret), mantendo compatibilidade durante a transição.`
- **Requirement 2.3** — `THE Phase_1_Spec SHALL definir whitelist explícita em next.config.ts > images.remotePatterns, removendo o curinga hostname: "**", e SHALL exigir consulta prévia a node_modules/next/dist/docs/ (AGENTS_Rule, área images-config) antes de adotar a forma final da whitelist.`
- **Requirement 2.4** — `THE Phase_1_Spec SHALL exigir validação de entrada com Zod em todas as Server Actions e API Routes que aceitem input do usuário, listando os endpoints alvo.`
- **Requirement 2.5** — `THE Phase_1_Spec SHALL definir rate limiting para login, upload, wa-click, comentários e visualização de stories, com limites positivos e mensuráveis por janela (qualquer valor ≥ 1 req/min é aceitável, desde que o número e a janela sejam declarados explicitamente por endpoint).`
- **Requirement 2.6** — `THE Phase_1_Spec SHALL documentar a configuração de produção do NextAuth (AUTH_URL em .env) substituindo trustHost: true aberto.`
- **Requirement 2.7** — `WHERE houver headers de segurança ausentes em next.config.ts, THE Phase_1_Spec SHALL avaliar inclusão de Content-Security-Policy e Strict-Transport-Security, com critérios de teste, exigindo consulta prévia a node_modules/next/dist/docs/ (AGENTS_Rule, área headers) antes de definir a forma final dos headers.`
- **Requirement 2.8** — `THE Phase_1_Spec SHALL declarar fora de escopo: rotação de chaves, auditoria de dependências (SCA) e WAF — esses itens ficam em DX/Infra ou em spec próprio futuro.`

---

## 2. Revalidação

> n/a — esta fase não herda nenhum spec arquivado.

A Fase 1 não tem entrada na tabela `ArchivedSpecRef` (`design.md > Data Models`) — segurança não foi tema de spec arquivado. Os itens já entregues que precisam ser **respeitados** durante a execução desta fase estão registrados como notas históricas no Phase Card do master (`requirements.md > Requirement 2 > Phase Card`):

- Webhook MercadoPago já tem HMAC-SHA256 implementado em `src/app/api/mp/webhook/route.ts`. Não vira tarefa desta fase. Cobertura por testes pode ser herdada pela Fase 2.
- Headers básicos (X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy) já aplicados em `next.config.ts`. O escopo de entrega aqui são exclusivamente CSP e HSTS.
- Validação de Content-Length, MIME e tamanho por categoria já existe em `/api/upload`. O que falta é Zod no payload (Requirement 2.4) e rate limit (Requirement 2.5), não a validação já existente.

---

## 3. Achados fora de escopo

> Nenhum achado fora de escopo registrado nesta fase.

Cada novo achado relevante que extrapolar o escopo desta fase será registrado como uma linha desta tabela (schema `OutOfScopeFinding` de `design.md > Data Models`) e disparará commit no master spec, **nunca** absorção silenciosa pelo spec-filho (regra dura E4 de `design.md > Error Handling`).

| discoveredIn | description | proposedTarget | evidence |
|---|---|---|---|
| _(vazio até a primeira descoberta)_ | | | |

---

## 4. Consultas a `node_modules/next/dist/docs/` (AGENTS_Rule)

Esta seção é OBRIGATÓRIA antes da primeira decisão técnica que toque uma `NextApiArea` deste Phase Card (`images-config`, `headers`). Cada linha registra a evidência da consulta, conforme exigido pela regra dura E5 de `design.md > Error Handling` e por `AGENTS.md`.

| area | path_consultado | trecho_relevante | decisao |
|---|---|---|---|
| `images-config` | `node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/images.md` + `node_modules/next/dist/shared/lib/image-config.d.ts` (type `RemotePattern`) | A página `images.md` cobre apenas loaders de CDN; o schema canônico de `RemotePattern` está no `.d.ts` instalado: `{ protocol?: "http"\|"https", hostname: string, port?: string, pathname?: string, search?: string }`. `**` casa qualquer número de subdomínios; `*` casa um único segmento. | Adotar whitelist explícita usando `RemotePattern` literal, sem `hostname: "**"`. Hosts do app declarados caso a caso no `next.config.ts`. _(consulta em 2026-03-14)_ |
| `headers` | `node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/headers.md` + `node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md` | `headers.md` traz exemplos canônicos para HSTS (`max-age=63072000; includeSubDomains; preload`), Permissions-Policy, X-Content-Type-Options, X-Frame-Options. CSP com nonce exige `proxy.ts` (Next 16 renomeou middleware → proxy) e força **dynamic rendering em todas as rotas cobertas**, desabilitando static optimization e ISR e sendo incompatível com PPR. SRI experimental (App Router only) é alternativa para CSP estático. | Adotar **CSP estático em `Content-Security-Policy-Report-Only` via `next.config.ts > headers()`** (sem nonce; aceita `'unsafe-inline'`) durante janela de validação ≥ 7 dias, depois transição para `Content-Security-Policy`. **HSTS sem `preload`**, `max-age=15552000` (180 dias). Justificativa: nonce-CSP conflita com Fase 3 (classificação de cache de 43 rotas). _(consulta em 2026-03-14)_ |

> Atualizações posteriores (mudança de versão, contradição encontrada na prática) viram linhas adicionais. Não se sobrescreve linha existente.

---

## Glossary

- **Phase_1_Spec**: este documento e os artefatos produzidos sob `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\specs\fase-1-seguranca\`.
- **Dev_Endpoints**: rotas em `src/app/api/dev/**` (atualmente `/api/dev/reset` e equivalentes), gateadas hoje apenas por `process.env.NODE_ENV !== "production"`.
- **Cron_Endpoints**: rotas em `src/app/api/cron/**` (atualmente `/api/cron/expire-plans`), que aceitam `?secret=` em query string.
- **Public_Input_Endpoints**: Server Actions em `src/app/_actions/**` e `src/app/painel/_actions/**` e Route Handlers em `src/app/api/**` que recebem input de usuário externo.
- **Rate_Limited_Endpoints**: subconjunto de `Public_Input_Endpoints` listado no Requirement 2.5 (login, `/api/upload`, `/api/wa-click`, comentários, visualização de stories).
- **Image_Whitelist**: valor final do array `next.config.ts > images.remotePatterns` após substituir o curinga `hostname: "**"`.
- **Security_Headers**: cabeçalhos retornados via `headers()` em `next.config.ts`. Já existem: X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy. Em escopo desta fase: CSP e HSTS.
- **NextAuth_Production_Config**: variáveis de ambiente e configuração que substituem `trustHost: true` aberto, sobretudo `AUTH_URL` em `.env`.

---

## 6. Non-Goals / Out of Scope

Os itens abaixo NÃO fazem parte desta fase e não devem virar tarefa:

1. Rotação de chaves (vai para `fase-7-dx-infra` ou spec próprio futuro).
2. Auditoria de dependências (SCA) — para `fase-7-dx-infra` ou spec próprio futuro.
3. WAF, DDoS protection ou regras em CDN/proxy.
4. Re-implementação do HMAC do webhook MercadoPago (já entregue).
5. Substituição da validação de Content-Length/MIME/tamanho de `/api/upload` (já entregue; aqui apenas adicionamos Zod ao payload e rate limit).
6. Substituição dos quatro headers básicos já aplicados; aqui apenas adicionamos CSP e HSTS.
7. Reescrita do NextAuth ou troca de provider; aqui apenas documentamos `AUTH_URL` para produção.
8. Implementação dos testes correspondentes às mudanças desta fase — testes ficam para `fase-2-testes` consumir.

Qualquer item que apareça nesta lista mas se mostre necessário durante a execução vira `OutOfScopeFinding` (seção 3) e exige commit no master spec antes de ser absorvido.

---

## Requirements

> Os requisitos abaixo são os EARS herdados (Requirement 2.1–2.8 do master) **destrinchados** por superfície tocada. Cada bloco identifica os arquivos envolvidos, mantém o EARS herdado como referência e adiciona EARS de detalhe que serão validados pelo spec-filho.

### Requirement 1: Endurecimento dos Dev_Endpoints

**User Story:** Como mantenedor, quero que rotas de desenvolvimento exijam autenticação além da verificação de ambiente, para que um vazamento acidental do build de produção não exponha endpoints destrutivos.

**Inputs:** `src/app/api/dev/**/*.ts`, `src/lib/auth.ts`.

#### Acceptance Criteria

1. THE Phase_1_Spec SHALL cobrir endurecimento de `/api/dev/*`, exigindo, além de `NODE_ENV !== "production"`, autenticação (sessão de admin ou token dedicado). _(EARS herdada — Requirement 2.1 do master.)_
2. WHEN um Dev_Endpoint é invocado em qualquer ambiente, THE Phase_1_Spec SHALL exigir uma das duas formas de credencial: sessão NextAuth com `role` em `{ADMIN, MODERATOR}` OU header `Authorization: Bearer <DEV_ENDPOINT_TOKEN>` cujo valor coincida com a variável de ambiente correspondente.
3. IF `process.env.NODE_ENV === "production"` E nenhuma das duas credenciais do critério 1.2 estiver presente E válida, THEN THE Phase_1_Spec SHALL retornar HTTP 404 (não 401/403) para não revelar a existência do endpoint.
4. THE Phase_1_Spec SHALL registrar em log estruturado toda invocação bem-sucedida de Dev_Endpoint com: timestamp ISO-8601, IP requisitante, identificador do usuário (se sessão) ou prefixo dos primeiros 6 caracteres do token (se token).

### Requirement 2: Cron_Endpoints com segredo via header

**User Story:** Como mantenedor, quero que segredos de cron deixem de aparecer em logs de servidor/proxy/CDN, para que um log compartilhado não vire credencial impressa.

**Inputs:** `src/app/api/cron/**/*.ts`.

#### Acceptance Criteria

1. THE Phase_1_Spec SHALL substituir o segredo em query string de `/api/cron/*` por header (ex.: `Authorization: Bearer <CRON_SECRET>` ou `X-Cron-Secret`), mantendo compatibilidade durante a transição. _(EARS herdada — Requirement 2.2 do master.)_
2. THE Phase_1_Spec SHALL aceitar tanto `Authorization: Bearer <CRON_SECRET>` quanto `X-Cron-Secret: <CRON_SECRET>` durante a janela de transição, com prioridade para `Authorization` se ambos vierem.
3. WHEN um Cron_Endpoint recebe segredo via query string (`?secret=`), THE Phase_1_Spec SHALL aceitar a requisição (compatibilidade) MAS registrar warning estruturado contendo a rota, o IP e a recomendação de migrar para header.
4. WHEN a janela de transição encerra (data declarada no commit que entrega esta EAR), THE Phase_1_Spec SHALL rejeitar com HTTP 401 qualquer requisição que envie segredo via query string.
5. IF nenhuma das três formas (Authorization, X-Cron-Secret, query string durante a transição) trouxer um segredo cuja comparação em tempo constante coincida com `process.env.CRON_SECRET`, THEN THE Phase_1_Spec SHALL rejeitar com HTTP 401 sem corpo.

### Requirement 3: Whitelist de `images.remotePatterns`

**User Story:** Como mantenedor, quero que o otimizador de imagens só aceite hosts conhecidos, para evitar abuso do `_next/image` como proxy aberto.

**Inputs:** `next.config.ts`.

#### Acceptance Criteria

1. THE Phase_1_Spec SHALL definir whitelist explícita em `next.config.ts > images.remotePatterns`, removendo o curinga `hostname: "**"`, e SHALL exigir consulta prévia a `node_modules/next/dist/docs/` (AGENTS_Rule, área `images-config`) antes de adotar a forma final da whitelist. _(EARS herdada — Requirement 2.3 do master.)_
2. THE Phase_1_Spec SHALL declarar a whitelist como lista finita de objetos `{ protocol, hostname, port?, pathname? }`, com hostnames explícitos para: domínio próprio em produção, domínio de armazenamento de mídia (uploads próprios) e quaisquer CDNs externas em uso real.
3. THE Phase_1_Spec SHALL incluir nos comentários do `next.config.ts` a referência ao caminho exato consultado em `node_modules/next/dist/docs/` e a data da consulta.
4. IF um host externo aparecer no código (via `<Image src="https://...">`) sem entrada correspondente na whitelist, THEN THE Phase_1_Spec SHALL falhar o build (essa falha é o comportamento desejado — não deve ser silenciada).

### Requirement 4: Validação Zod em Public_Input_Endpoints

**User Story:** Como mantenedor, quero que todo input externo seja validado antes de tocar o banco, para que o restante do código possa assumir tipos corretos sem checagens defensivas espalhadas.

**Inputs:** todas as Server Actions em `src/app/_actions/**` e `src/app/painel/_actions/**`, todos os Route Handlers em `src/app/api/**` que aceitam body ou query.

#### Acceptance Criteria

1. THE Phase_1_Spec SHALL exigir validação de entrada com Zod em todas as Server Actions e API Routes que aceitem input do usuário, listando os endpoints alvo. _(EARS herdada — Requirement 2.4 do master.)_
2. THE Phase_1_Spec SHALL produzir um documento `endpoints-zod.md` em `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\specs\fase-1-seguranca\` listando, para cada endpoint alvo: caminho do arquivo, nome da função/handler, schema Zod aplicado e formato do erro retornado.
3. WHEN um endpoint alvo recebe input que falha no schema, THE Phase_1_Spec SHALL retornar HTTP 400 (Route Handler) ou objeto de erro tipado (Server Action) listando todos os campos inválidos em uma única resposta.
4. THE Phase_1_Spec SHALL exportar o tipo TypeScript inferido de cada schema (`z.infer<typeof Schema>`) e usá-lo no consumidor, eliminando declarações `any` no input.
5. WHERE existir validação manual prévia (ex.: `if (!body.x) ...`) em um endpoint alvo, THE Phase_1_Spec SHALL substituir essa validação pelo schema Zod equivalente, removendo a versão manual.

### Requirement 5: Rate limiting em Rate_Limited_Endpoints

**User Story:** Como mantenedor, quero que endpoints sensíveis tenham limite por janela, para reduzir brute force, abuso de upload e flood de cliques rastreáveis.

**Inputs:** rota de login do NextAuth, `src/app/api/upload/route.ts`, `src/app/api/wa-click/route.ts`, endpoints de comentários, endpoints de visualização de stories.

#### Acceptance Criteria

1. THE Phase_1_Spec SHALL definir rate limiting para login, upload, `wa-click`, comentários e visualização de stories, com limites positivos e mensuráveis por janela (qualquer valor ≥ 1 req/min é aceitável, desde que o número e a janela sejam declarados explicitamente por endpoint). _(EARS herdada — Requirement 2.5 do master.)_
2. THE Phase_1_Spec SHALL declarar os valores na tabela abaixo dentro do código (constantes nomeadas) e replicar a tabela em documento `rate-limits.md` em `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\specs\fase-1-seguranca\`:

   | Endpoint | Chave | Janela | Limite | Resposta ao exceder |
   |---|---|---|---|---|
   | login (NextAuth) | IP | 15 min | 5 tentativas | HTTP 429 com `Retry-After` |
   | `/api/upload` | userId | 60 min | 20 uploads | HTTP 429 com mensagem |
   | `/api/wa-click` | profileId+IP | 60 min | 10 cliques | HTTP 200 silencioso (sem registrar) |
   | comentários | userId | 1 min | 5 comentários | HTTP 429 com mensagem |
   | visualização de stories | userId+storyId | 60 min | 1 visualização | HTTP 200 silencioso (idempotente) |

   _(Os valores acima são os de referência derivados do spec arquivado `backend-performance-phase5`. O spec-filho pode ajustá-los desde que mantenha valores positivos e a coluna "Resposta ao exceder".)_
3. THE Phase_1_Spec SHALL escolher entre as duas formas de implementação válidas e declarar a escolha em ADR no diretório do spec-filho:
   - (a) módulo único em `src/lib/rate-limit.ts` com store em memória + interface plugável para Redis/Upstash;
   - (b) middleware-proxy do Next 16 quando aplicável (consulta obrigatória a `node_modules/next/dist/docs/`, área `middleware-proxy`, registrada na seção 4 deste documento).
4. IF o limite for excedido em login, upload ou comentários, THEN THE Phase_1_Spec SHALL registrar evento de auditoria com IP, userId (se houver), endpoint e timestamp, sem expor detalhes ao cliente.

### Requirement 6: Configuração de produção do NextAuth

**User Story:** Como mantenedor, quero que `trustHost` deixe de ser aberto em produção, para evitar redirects e callbacks aceitos a partir de hosts arbitrários.

**Inputs:** `src/lib/auth.ts`, `.env`/`.env.example`.

#### Acceptance Criteria

1. THE Phase_1_Spec SHALL documentar a configuração de produção do NextAuth (`AUTH_URL` em `.env`) substituindo `trustHost: true` aberto. _(EARS herdada — Requirement 2.6 do master.)_
2. WHEN `process.env.NODE_ENV === "production"`, THE Phase_1_Spec SHALL exigir `AUTH_URL` definido e SHALL passar `trustHost: true` apenas se a origem da requisição coincidir com `AUTH_URL`; em desenvolvimento, mantém o comportamento atual.
3. THE Phase_1_Spec SHALL adicionar `AUTH_URL` ao `.env.example` (criando o arquivo se não existir) com comentário descrevendo o uso e exemplo de valor.
4. THE Phase_1_Spec SHALL atualizar `c:\Users\edulanzarin\Documents\Dev\privello\AGENTS.md` ou criar `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\specs\fase-1-seguranca\nextauth-prod.md` com o passo a passo de configuração em produção (Vercel/Docker), apontado a partir do README na entrega da Fase 7.

### Requirement 7: Avaliação de CSP e HSTS

**User Story:** Como mantenedor, quero CSP e HSTS avaliados e, quando aplicáveis, aplicados, para reduzir XSS e downgrade de TLS sem quebrar o app.

**Inputs:** `next.config.ts > async headers()`.

#### Acceptance Criteria

1. WHERE houver headers de segurança ausentes em `next.config.ts`, THE Phase_1_Spec SHALL avaliar inclusão de Content-Security-Policy e Strict-Transport-Security, com critérios de teste, exigindo consulta prévia a `node_modules/next/dist/docs/` (AGENTS_Rule, área `headers`) antes de definir a forma final dos headers. _(EARS herdada — Requirement 2.7 do master.)_
2. THE Phase_1_Spec SHALL produzir CSP em modo `Report-Only` primeiro, listando origens permitidas para `default-src`, `script-src`, `style-src`, `img-src`, `connect-src`, `font-src`, `media-src` e `frame-ancestors`, com base nas origens efetivamente usadas pela aplicação (uploads próprios, MercadoPago, Google fonts se aplicável, etc.).
3. THE Phase_1_Spec SHALL declarar a transição de `Content-Security-Policy-Report-Only` para `Content-Security-Policy` somente quando o relatório de violações ficar zerado por uma janela de validação declarada no commit (mínimo 7 dias em produção).
4. THE Phase_1_Spec SHALL aplicar HSTS via header `Strict-Transport-Security: max-age=15552000; includeSubDomains` (180 dias) sem `preload` nesta fase; `preload` exige avaliação separada e fica fora deste spec-filho.
5. THE Phase_1_Spec SHALL preservar os quatro headers já aplicados (X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy) sem alteração; modificá-los volta ao master spec via `OutOfScopeFinding`.

### Requirement 8: Itens fora de escopo declarados

**User Story:** Como mantenedor, quero que itens fora de escopo apareçam explicitamente, para que ninguém os absorva por engano.

#### Acceptance Criteria

1. THE Phase_1_Spec SHALL declarar fora de escopo: rotação de chaves, auditoria de dependências (SCA) e WAF — esses itens ficam em DX/Infra ou em spec próprio futuro. _(EARS herdada — Requirement 2.8 do master.)_
2. WHEN um item da seção "Non-Goals" deste documento aparecer durante a execução, THE Phase_1_Spec SHALL registrá-lo como `OutOfScopeFinding` na seção 3 deste documento e abrir commit no master spec antes de qualquer absorção.

---

## Saída desta fase

A Fase 1 é considerada `Done` quando:

- Todos os 8 Requirements desta seção têm seus EARS verificáveis e há evidência (path:linha de código, log de teste manual, ou link de PR) anexada para cada um.
- A seção 4 deste documento (AGENTS_Rule) tem linha preenchida para cada `NextApiArea` declarada (`images-config`, `headers`) ANTES da primeira decisão técnica que toque essa área.
- A seção 3 deste documento (`OutOfScopeFinding`) tem cada linha referenciando um commit no master spec, ou está marcada como vazia.
- O Phase Card desta fase no master `requirements.md` foi atualizado para `state: Done` com `doneAt` ISO-8601 e link para esta pasta.
