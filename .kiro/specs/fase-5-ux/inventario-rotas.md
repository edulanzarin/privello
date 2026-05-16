# Inventário de rotas — `fase-5-ux`

> **Autoria**: orquestrador de execução de `fase-5-ux`.
> **Data**: 2026-05-17.
> **Master spec**: `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\specs\auditoria-geral\requirements.md`.
> **Phase id**: `fase-5-ux`.
> **Count baseline**: **47 `page.tsx` + 25 `route.ts` = 72 rotas** (verificado em 2026-05-17 via `Get-ChildItem -Recurse`).

---

## §1. Cabeçalho

Este documento materializa o Requirement 1 do `requirements.md` deste spec-filho — inventariar e classificar cada rota do App Router quanto à necessidade de `loading.tsx` e `error.tsx`. Serve como entrada para as Waves 4 (Loading) e 5 (Error) e como oráculo da Property 2 (cobertura de loading/error).

## §2. Metodologia

### Categorias

| Categoria | Heurística |
|---|---|
| `tela_autenticada` | RSC com `auth()` + redirect; segmento sob `/painel`, `/admin`, `/conta` |
| `listagem_publica` | RSC com `await getXxx({ ... })` + render de lista de ≥10 itens |
| `formulario` | rota com form principal (login, cadastro, recuperar-senha) |
| `pagina_informativa` | conteúdo estático `revalidate=N`, sem `await` em DB pesado |
| `route_handler` | arquivo `route.ts` (não há UI; fallback é JSON) |

### Decisões `loading`

- **`criar`** — rota satisfaz pelo menos uma destas condições:
  - é tela autenticada (`auth()` em RSC);
  - faz `await` em service que toca DB;
  - renderiza listagem dinâmica de mais de 10 itens.
- **`existente`** — `loading.tsx` já existe no segmento.
- **`nao_aplicavel`** — rota estática, página informativa simples, ou Route Handler.

### Decisões `error`

- **`criar`** — espelha as rotas com `loading: criar` ou `loading: existente` (no mínimo).
- **`existente`** — `error.tsx` já existe no segmento.
- **`nao_aplicavel`** — Route Handler (fallback é JSON com status apropriado) ou rota estática que herda `error.tsx` de ancestor.

---

## §3. Inventário de rotas

### Páginas (`page.tsx`) — 47

| caminho | categoria | loading | error | justificativa |
|---|---|---|---|---|
| `src/app/page.tsx` | `listagem_publica` | nao_aplicavel | nao_aplicavel | home com `revalidate=600`; herda `error.tsx` raiz |
| `src/app/admin/financeiro/page.tsx` | `tela_autenticada` | criar | criar | admin RSC + auth |
| `src/app/admin/midias/page.tsx` | `tela_autenticada` | criar | criar | admin RSC + auth, lista de mídias |
| `src/app/admin/moderacao/page.tsx` | `tela_autenticada` | criar | criar | admin RSC + auth, fila de moderação |
| `src/app/admin/perfis/page.tsx` | `tela_autenticada` | criar | criar | admin RSC + auth, lista de perfis |
| `src/app/admin/suporte/page.tsx` | `tela_autenticada` | criar | criar | admin RSC + auth, lista de chamados |
| `src/app/admin/suporte/[id]/page.tsx` | `tela_autenticada` | criar | criar | admin RSC + auth, detalhe de chamado |
| `src/app/admin/verificacoes/[id]/page.tsx` | `tela_autenticada` | criar | criar | admin RSC + auth, detalhe de verificação |
| `src/app/assinar/page.tsx` | `pagina_informativa` | nao_aplicavel | nao_aplicavel | conteúdo estático de planos/CTAs; herda `error.tsx` raiz |
| `src/app/assinar/sucesso/page.tsx` | `pagina_informativa` | nao_aplicavel | nao_aplicavel | confirmação pós-checkout |
| `src/app/avaliar/[slug]/page.tsx` | `formulario` | criar | criar | form de avaliação com auth |
| `src/app/buscar/page.tsx` | `listagem_publica` | criar | criar | RSC com listagem dinâmica |
| `src/app/cadastro/page.tsx` | `formulario` | criar | criar | escolha entre cliente/acompanhante |
| `src/app/cadastro/acompanhante/page.tsx` | `formulario` | criar | criar | form de cadastro |
| `src/app/cadastro/cliente/page.tsx` | `formulario` | criar | criar | form de cadastro |
| `src/app/cadastro/sucesso/page.tsx` | `pagina_informativa` | nao_aplicavel | nao_aplicavel | confirmação estática |
| `src/app/cidades/page.tsx` | `listagem_publica` | criar | criar | RSC com listagem dinâmica de cidades |
| `src/app/conta/onboarding/fotos/page.tsx` | `tela_autenticada` | criar | criar | RSC + auth + form |
| `src/app/conta/onboarding/perfil/page.tsx` | `tela_autenticada` | criar | criar | RSC + auth + form |
| `src/app/conta/onboarding/publicar/page.tsx` | `tela_autenticada` | criar | criar | RSC + auth + revisão |
| `src/app/conta/onboarding/valores/page.tsx` | `tela_autenticada` | criar | criar | RSC + auth + form |
| `src/app/conta/perfil/page.tsx` | `tela_autenticada` | criar | criar | conta cliente/provider RSC + auth |
| `src/app/conta/verificacao/page.tsx` | `tela_autenticada` | criar | criar | RSC + auth + upload |
| `src/app/descobrir/[citySlug]/page.tsx` | `listagem_publica` | existente | existente | RSC com grid; já há `loading.tsx` e `error.tsx` |
| `src/app/em-alta/page.tsx` | `listagem_publica` | criar | criar | RSC com lista de hot profiles |
| `src/app/em-destaque/page.tsx` | `listagem_publica` | criar | criar | RSC com lista de premium |
| `src/app/entrar/page.tsx` | `formulario` | criar | criar | form de login |
| `src/app/novidades/page.tsx` | `pagina_informativa` | nao_aplicavel | nao_aplicavel | revalidate alto, conteúdo estático |
| `src/app/p/[slug]/page.tsx` | `listagem_publica` | existente | existente | RSC com perfil público; já há `loading.tsx` e `error.tsx` |
| `src/app/painel/page.tsx` | `tela_autenticada` | existente | existente | painel raiz; já há `loading.tsx` e `error.tsx` (refactor para skeleton) |
| `src/app/painel/avaliacoes/page.tsx` | `tela_autenticada` | criar | criar | painel RSC + auth |
| `src/app/painel/disponibilidade/page.tsx` | `tela_autenticada` | criar | criar | painel RSC + auth + form |
| `src/app/painel/financeiro/page.tsx` | `tela_autenticada` | existente | criar | já há `loading.tsx`; falta `error.tsx` |
| `src/app/painel/midias/page.tsx` | `tela_autenticada` | criar | criar | painel RSC + auth + grid |
| `src/app/painel/perfil/page.tsx` | `tela_autenticada` | criar | criar | painel RSC + auth + form |
| `src/app/painel/plano/page.tsx` | `tela_autenticada` | criar | criar | painel RSC + auth |
| `src/app/painel/reels/page.tsx` | `tela_autenticada` | criar | criar | painel RSC + auth |
| `src/app/painel/stories/page.tsx` | `tela_autenticada` | criar | criar | painel RSC + auth |
| `src/app/painel/suporte/page.tsx` | `tela_autenticada` | criar | criar | painel RSC + auth |
| `src/app/painel/suporte/[id]/page.tsx` | `tela_autenticada` | criar | criar | painel RSC + auth + detalhe |
| `src/app/painel/valores/page.tsx` | `tela_autenticada` | criar | criar | painel RSC + auth + form |
| `src/app/planos/page.tsx` | `pagina_informativa` | nao_aplicavel | nao_aplicavel | conteúdo estático com `revalidate` |
| `src/app/recuperar-senha/page.tsx` | `formulario` | criar | criar | form de recuperação |
| `src/app/recuperar-senha/[token]/page.tsx` | `formulario` | criar | criar | form de redefinição |
| `src/app/reels/page.tsx` | `listagem_publica` | criar | criar | RSC com feed |
| `src/app/reels/[slug]/page.tsx` | `listagem_publica` | criar | criar | RSC com perfil de reels |
| `src/app/solicitar/[slug]/page.tsx` | `formulario` | criar | criar | form de solicitação |

### Route Handlers (`route.ts`) — 25

Todos os Route Handlers seguem o mesmo padrão: categoria `route_handler`, `loading: nao_aplicavel`, `error: nao_aplicavel`, justificativa única "Route Handler — fallback via JSON com status apropriado".

| caminho | categoria | loading | error | justificativa |
|---|---|---|---|---|
| `src/app/api/auth/[...nextauth]/route.ts` | `route_handler` | nao_aplicavel | nao_aplicavel | Route Handler — fallback via JSON com status apropriado |
| `src/app/api/cadastro/iniciar/route.ts` | `route_handler` | nao_aplicavel | nao_aplicavel | Route Handler — fallback via JSON com status apropriado |
| `src/app/api/cadastro/verificar/route.ts` | `route_handler` | nao_aplicavel | nao_aplicavel | Route Handler — fallback via JSON com status apropriado |
| `src/app/api/cities/route.ts` | `route_handler` | nao_aplicavel | nao_aplicavel | Route Handler — fallback via JSON com status apropriado |
| `src/app/api/cities/[slug]/bairros/route.ts` | `route_handler` | nao_aplicavel | nao_aplicavel | Route Handler — fallback via JSON com status apropriado |
| `src/app/api/cron/expire-plans/route.ts` | `route_handler` | nao_aplicavel | nao_aplicavel | Route Handler — fallback via JSON com status apropriado |
| `src/app/api/cron/reset-hot/route.ts` | `route_handler` | nao_aplicavel | nao_aplicavel | Route Handler — fallback via JSON com status apropriado |
| `src/app/api/dev/activate-plans/route.ts` | `route_handler` | nao_aplicavel | nao_aplicavel | Route Handler — fallback via JSON com status apropriado |
| `src/app/api/dev/reset/route.ts` | `route_handler` | nao_aplicavel | nao_aplicavel | Route Handler — fallback via JSON com status apropriado |
| `src/app/api/media/comment/route.ts` | `route_handler` | nao_aplicavel | nao_aplicavel | Route Handler — fallback via JSON com status apropriado |
| `src/app/api/media/like/route.ts` | `route_handler` | nao_aplicavel | nao_aplicavel | Route Handler — fallback via JSON com status apropriado |
| `src/app/api/mp/checkout/route.ts` | `route_handler` | nao_aplicavel | nao_aplicavel | Route Handler — fallback via JSON com status apropriado |
| `src/app/api/mp/webhook/route.ts` | `route_handler` | nao_aplicavel | nao_aplicavel | Route Handler — fallback via JSON com status apropriado |
| `src/app/api/profiles/check/route.ts` | `route_handler` | nao_aplicavel | nao_aplicavel | Route Handler — fallback via JSON com status apropriado |
| `src/app/api/profiles/section/route.ts` | `route_handler` | nao_aplicavel | nao_aplicavel | Route Handler — fallback via JSON com status apropriado |
| `src/app/api/provider/heartbeat/route.ts` | `route_handler` | nao_aplicavel | nao_aplicavel | Route Handler — fallback via JSON com status apropriado |
| `src/app/api/reels/route.ts` | `route_handler` | nao_aplicavel | nao_aplicavel | Route Handler — fallback via JSON com status apropriado |
| `src/app/api/review/route.ts` | `route_handler` | nao_aplicavel | nao_aplicavel | Route Handler — fallback via JSON com status apropriado |
| `src/app/api/stories/like/route.ts` | `route_handler` | nao_aplicavel | nao_aplicavel | Route Handler — fallback via JSON com status apropriado |
| `src/app/api/stories/view/route.ts` | `route_handler` | nao_aplicavel | nao_aplicavel | Route Handler — fallback via JSON com status apropriado |
| `src/app/api/top-cities/route.ts` | `route_handler` | nao_aplicavel | nao_aplicavel | Route Handler — fallback via JSON com status apropriado |
| `src/app/api/upload/route.ts` | `route_handler` | nao_aplicavel | nao_aplicavel | Route Handler — fallback via JSON com status apropriado |
| `src/app/api/upload/verification/route.ts` | `route_handler` | nao_aplicavel | nao_aplicavel | Route Handler — fallback via JSON com status apropriado |
| `src/app/api/upload-audio/route.ts` | `route_handler` | nao_aplicavel | nao_aplicavel | Route Handler — fallback via JSON com status apropriado |
| `src/app/api/wa-click/route.ts` | `route_handler` | nao_aplicavel | nao_aplicavel | Route Handler — fallback via JSON com status apropriado |

### Contagens agregadas (validação)

| Decisão | `loading` | `error` |
|---|---:|---:|
| `criar` | 37 | 38 |
| `existente` | 4 | 3 |
| `nao_aplicavel` | 31 | 31 |
| **Total** | **72** | **72** |

Detalhe: `loading: existente` em `src/app/painel/loading.tsx` (refactor para skeleton), `src/app/painel/financeiro/loading.tsx`, `src/app/descobrir/[citySlug]/loading.tsx`, `src/app/p/[slug]/loading.tsx`. `error: existente` em `src/app/painel/error.tsx`, `src/app/descobrir/[citySlug]/error.tsx`, `src/app/p/[slug]/error.tsx` (todos refatorados na Wave 5 para consumir `<ErrorState>`). `src/app/error.tsx` raiz cobre `pagina_informativa` e por isso os 25 `route_handler` + 4 `pagina_informativa` aparecem como `nao_aplicavel` em `error`.

---

## §4. Listas vazias não migradas

> Sites com lista vazia não migrados para `<EmptyState>` (decisão tomada na Wave 3.9).

| caminho | motivo |
|---|---|
| `src/app/cidades/page.tsx:34-37` | item de lista único dentro de tabela complexa; markup inline vermelho/erro contextual; migrar adicionaria ruído visual |
| `src/app/admin/moderacao/page.tsx:292-298` | célula de tabela com `<td colSpan={6}>`; `<EmptyState>` quebraria o layout `<table>` |
| `src/app/p/[slug]/page.tsx:469-471` | `<p>` curto dentro de section "Avaliações"; `<EmptyState>` (com card+padding) seria desproporcional |
| `src/app/conta/onboarding/perfil/perfil-form.tsx:205-208` | UI do form (não é "lista vazia" canônica); aviso de validação inline |

---

## §5. Smoke checks

> Logs e evidências dos PBTs e validações são anexados aqui durante a Wave 9.

---

## §6. Smoke checks finais

> Anexar log de `npm run lint`, `npx tsc --noEmit`, `npm run test`, `npm run build` durante a Wave 10.

---

## §7. Smoke browser manual

> Anexar nota com browser usado e resultado durante a Wave 10.5.

---

## §8. Decisões

- **Shared element morph entre grid e detalhe** (`<ViewTransition name="photo-${id}">` entre cards de descobrir e hero de perfil): NÃO adotado nesta fase. Exigiria consolidação ampla de mídia entre `discover/[citySlug]` e `/p/[slug]`. Fica como candidata futura.
- **`useReducedMotion` JS-side**: NÃO criado. A regra global em `globals.css` cobre 100% das microinterações introduzidas (CSS-only).
- **Lazy load via `next/dynamic`**: Non-Goal. Apenas skeletons locais; refactor de bundle vira fase futura.
