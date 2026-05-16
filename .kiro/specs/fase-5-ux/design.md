# Design Document — `fase-5-ux`

> Spec-filho promovido a partir do master `auditoria-geral`. Este documento detalha como **padronizar feedback de carregamento, erro e transição** em todas as rotas relevantes do App Router, **introduzir `<ViewTransition>`** (React 19 + flag `experimental.viewTransition`) onde traz ganho real, **adotar UI otimista com rollback** para curtir/favoritar/marcar visto, e **garantir conformidade com `prefers-reduced-motion`** sem comprometer microinterações já existentes. A execução das tarefas deste design vive em `tasks.md` (a ser produzido depois).

## Overview

A Fase 5 fecha lacunas de feedback visual em toda a árvore de rotas e padroniza três primitivos que faltam no design system entregue por `fase-4-design-system`. Síntese vinda do master e do estado real do código:

- **47 `page.tsx` + 25 `route.ts`** em `src/app/**` (count via `Get-ChildItem -Recurse` em 2026-05-17, total = **72 rotas**; o "~78" do master é uma estimativa que abrange `layout.tsx`/segmentos auxiliares).
- **4 `loading.tsx`** existentes (`src/app/painel/loading.tsx`, `src/app/painel/financeiro/loading.tsx`, `src/app/descobrir/[citySlug]/loading.tsx`, `src/app/p/[slug]/loading.tsx`) — apenas a do painel é spinner genérico; as 3 demais já são skeletons estruturados que servem de template.
- **4 `error.tsx`** existentes (`src/app/error.tsx`, `src/app/painel/error.tsx`, `src/app/descobrir/[citySlug]/error.tsx`, `src/app/p/[slug]/error.tsx`) — todas já implementam o padrão `<button onClick={reset}>Tentar novamente</button>`, mas com markup inline duplicado.
- **1 `not-found.tsx`** raiz (`src/app/not-found.tsx`) — preserva-se inalterado.
- **0 ocorrências** de `useOptimistic` em `src/`. **0 ocorrências** de `prefers-reduced-motion` em `src/` ou `globals.css`. **0 ocorrências** de `view-transition-name` ou `<ViewTransition>` em `src/` (verificados por `grep_search` em 2026-05-17).
- **EmptyState inexistente**: 14 sites com lista vazia ad-hoc identificados (cf. `requirements.md > §2.1 > item EmptyState`).
- **UI otimista manual sem rollback formal**: 5 sites identificados (`favorite-button`, `story-bar`, `reels-feed`, `media-gallery`, `profile-story-cover`) + hook `use-media-actions` que faz fetch sem otimismo.
- **AGENTS_Rule**: 1 área afetada (`view-transitions`). Consulta registrada em `requirements.md > §4` apontando para `node_modules/next/dist/docs/01-app/02-guides/view-transitions.md` e `viewTransition.md`.
- **Lint herdado**: 20–28 errors `react-hooks/refs`, `react-hooks/cant-call-impure-fn-during-render`, `setState-in-effect` em arquivos de UX/painel pesado (`age-gate.tsx`, `profile-story-cover`, `story-bar`, `media-gallery`, `painel/midias/midias-manager`, etc.). Refactor parcial desses arquivos durante a Wave 5 (UI otimista) **deve resolver muitos** desses erros como efeito colateral; quando restarem, ficam para fase-7.

A fase entrega:

1. `inventario-rotas.md` com 72 linhas classificadas (47 pages + 25 routes), categoria, decisão sobre `loading.tsx`/`error.tsx`, justificativa.
2. `<LoadingSkeleton>` em `src/components/ui/loading-skeleton.tsx` com variantes `card`, `list`, `detail`, `form`, `gallery`, `text-block`.
3. `<ErrorState>` em `src/components/ui/error-state.tsx` consumido pelos 4 `error.tsx` existentes + novos.
4. `<EmptyState>` em `src/components/ui/empty-state.tsx` aplicado em pelo menos 6 listas vazias críticas.
5. Padrão UI otimista com `useOptimistic` + `useTransition` + rollback formal aplicado a `favorite-button` e 5 sites de like/view + `use-media-actions`.
6. `experimental.viewTransition: true` em `next.config.ts` com 3 padrões aplicados (Suspense reveal em `/p/[slug]`, same-route crossfade em `/descobrir/[citySlug]`, directional slide no onboarding).
7. Regra global `@media (prefers-reduced-motion: reduce)` em `src/app/globals.css` cobrindo `*` e `::view-transition-*(*)`.
8. PBTs co-localizados validando Properties 1, 2, 3 (rollback idempotente, cobertura mínima de loading/error nas rotas elegíveis, conformidade reduced-motion).

A fase **não** entrega: WCAG ampla (Non-Goal), refactor de primitivos da fase-4, mudanças em queries/services da fase-3, mudanças em `prisma/schema.prisma`, CI / lint config (fase-7), UX mobile específica (fase-6), shared element morph entre grid e detalhe (fase futura), redesign do onboarding, otimização de bundle ampla, SEO/Core Web Vitals.

### AGENTS_Rule — consultas registradas

A regra dura E5 do master exige consulta a `node_modules/next/dist/docs/` antes de decisões em `view-transitions`. A consulta foi feita durante a redação deste design e está registrada na §4 do `requirements.md` deste spec-filho. Os achados materiais que moldam decisões deste design:

- **`view-transitions`**: `node_modules/next/dist/docs/01-app/02-guides/view-transitions.md` declara que `<ViewTransition>` é fornecido pelo React 19 e ativado por `experimental.viewTransition: true` em `next.config.ts`. Animações são acionadas por **Transitions** (`useTransition`), `<Suspense>` e `useDeferredValue` — `setState` regular **não** dispara. Em Next.js, navegações de rota **são** transitions, então `<ViewTransition>` ativa automaticamente em navegação. Suporte do navegador para View Transitions API é baseline mas algumas animações se comportam diferente em Safari; sem suporte, o app funciona normalmente, só não anima.
- **Padrões cobertos pelo guia**: (1) shared element morph com `name`, (2) Suspense reveal com `enter`/`exit`, (3) directional slide com `<Link transitionTypes>` + mapping em `enter`/`exit`, (4) same-route crossfade com `key={slug}` + `share="auto"`. O guia também trata de `prefers-reduced-motion` literalmente (linhas finais do guia): `@media (prefers-reduced-motion: reduce) { ::view-transition-old(*), ::view-transition-new(*), ::view-transition-group(*) { animation-duration: 0s !important; animation-delay: 0s !important; } }` — esta é a base da regra global da Wave 8.
- **`viewTransition.md`** (config): a flag está marcada como `version: experimental` (`experimental: { viewTransition: true }`). Confirma que `<ViewTransition>` é provided pelo React e que a flag Next.js apenas habilita integração com navegação de rota.

Esses achados moldam três decisões deste design:

1. **Adoção condicional rota a rota**: a flag é ativada uma vez (`next.config.ts`) mas `<ViewTransition>` é aplicado pontualmente em 3 padrões com ganho claro. Não se borrifa `<ViewTransition>` em toda navegação — isso dispararia animações em locais sem ganho real.
2. **`prefers-reduced-motion` é dever desta fase**: o próprio guia consultado tem a media query como item explícito. Adotar View Transitions sem cobrir reduced-motion seria fechar metade do escopo.
3. **Sem shared element morph nesta fase**: o Step 1 do guia (morph entre thumbnail e hero) exige refactor amplo de `MediaGallery` (consolidação de mídia entre `/descobrir/[citySlug]/page.tsx` → cards e `/p/[slug]/page.tsx` → hero), o que está fora do escopo. Fica como `Out of scope desta fase` com nota.

## Architecture

```
+-- src/components/ui/                                  [novos primitivos + testes]
|   +-- loading-skeleton.tsx                            [novo — variantes card/list/detail/form/gallery/text-block]
|   +-- loading-skeleton.test.ts                        [novo — variantes renderizam aria-busy + estrutura]
|   +-- error-state.tsx                                 [novo — props title/description/onRetry/homeHref/variant]
|   +-- error-state.test.ts                             [novo — role=alert, botão Tentar novamente, variants]
|   +-- empty-state.tsx                                 [novo — props title/description/icon/action]
|   +-- empty-state.test.ts                             [novo — render + cta href vs onClick]
|
+-- src/lib/hooks/                                      [novos hooks]
|   +-- use-optimistic-toggle.ts                        [novo — wrapper de useOptimistic + useTransition + rollback]
|   +-- use-optimistic-toggle.test.ts                   [novo — fluxo otimismo + rollback determinístico]
|   +-- use-optimistic-toggle.pbt.ts                    [novo — Property 1: rollback idempotente]
|   +-- use-reduced-motion.ts                           [opcional — hook para casos JS-side; default é CSS-only]
|
+-- src/app/globals.css                                 [refactor]
|   +-- @media (prefers-reduced-motion: reduce) { ... } [novo — neutraliza animation/transition + view-transition-*]
|   +-- @keyframes fade, @keyframes slide-y,            [novos — usados por <ViewTransition>]
|       @keyframes slide
|   +-- ::view-transition-old/new(.slide-up)            [novos — Suspense reveal]
|   +-- ::view-transition-old/new(.slide-down)
|   +-- ::view-transition-old/new(.nav-forward)         [novos — directional slide no onboarding]
|   +-- ::view-transition-old/new(.nav-back)
|
+-- next.config.ts                                      [refactor]
|   +-- experimental: { viewTransition: true }          [adicionado em commit dedicado, com comentário-citação]
|
+-- src/app/**/loading.tsx                              [novos arquivos por wave de rotas]
|   +-- src/app/painel/loading.tsx                      [refactor — substituir spinner por <LoadingSkeleton variant="form">]
|   +-- src/app/painel/{midias,perfil,plano,reels,
|       stories,suporte,valores,disponibilidade,
|       avaliacoes,reels}/loading.tsx                   [novos — variant="list" ou "form" conforme rota]
|   +-- src/app/conta/{perfil,onboarding/*}/loading.tsx [novos]
|   +-- src/app/p/[slug]/loading.tsx                    [já existe — sem mudança]
|   +-- src/app/descobrir/[citySlug]/loading.tsx        [já existe — sem mudança]
|   +-- ... outras rotas elegíveis conforme inventario-rotas.md
|
+-- src/app/**/error.tsx                                [novos arquivos por wave de rotas]
|   +-- src/app/error.tsx                               [refactor — consumir <ErrorState variant="page">]
|   +-- src/app/painel/error.tsx                        [refactor]
|   +-- src/app/descobrir/[citySlug]/error.tsx          [refactor]
|   +-- src/app/p/[slug]/error.tsx                      [refactor]
|   +-- src/app/{conta,admin,em-alta,em-destaque,...}/  [novos por wave]
|       error.tsx
|
+-- src/app/p/[slug]/page.tsx                           [refactor — Suspense reveal com <ViewTransition>]
+-- src/app/descobrir/[citySlug]/page.tsx               [refactor — same-route crossfade com <ViewTransition key>]
+-- src/app/conta/onboarding/{perfil,fotos,             [refactor — directional slide]
    valores,publicar}/page.tsx
+-- src/app/conta/onboarding/                           [refactor — Link transitionTypes={['nav-forward'|'nav-back']}]
    onboarding-nav.tsx (novo helper)
|
+-- src/components/profile/favorite-button.tsx          [refactor — useOptimistic + rollback formal]
+-- src/components/profile/media-gallery.tsx            [refactor — toggleLike via use-optimistic-toggle]
+-- src/components/profile/profile-story-cover.tsx      [refactor — toggleLike via use-optimistic-toggle]
+-- src/components/stories/story-bar.tsx                [refactor — toggleLike via use-optimistic-toggle]
+-- src/components/reels/reels-feed.tsx                 [refactor — toggleLike via use-optimistic-toggle]
+-- src/lib/hooks/use-media-actions.ts                  [refactor — wrapper sobre use-optimistic-toggle]
|
+-- .kiro/specs/fase-5-ux/                              [docs do spec-filho]
|   +-- inventario-rotas.md                             [novo — 72 linhas com classificação]
|   +-- requirements.md                                  [já entregue]
|   +-- design.md                                        [este arquivo]
|   +-- tasks.md                                         [próximo]
```

### Fluxos

**Suspense reveal em `/p/[slug]` (Requirement 6):**

```
Antes:
  src/app/p/[slug]/page.tsx
    export default async function PublicProfilePage({ params }) {
      const { slug } = await params;
      const profile = await getProfileBySlug(slug, ...);  // carrega tudo no RSC
      return <ProfileDetail profile={profile} />;
    }
  src/app/p/[slug]/loading.tsx
    skeleton estruturado (já existe)

  Comportamento: Next renderiza loading.tsx até o RSC resolver, depois substitui pelo conteúdo
  sem transição visual (corte direto).

Depois:
  src/app/p/[slug]/page.tsx
    export default async function PublicProfilePage({ params }) {
      const { slug } = await params;
      return (
        <Suspense fallback={
          <ViewTransition exit="slide-down">
            <ProfileDetailSkeleton />
          </ViewTransition>
        }>
          <ViewTransition enter="slide-up" default="none">
            <ProfileDetailLoader slug={slug} />
          </ViewTransition>
        </Suspense>
      );
    }

  Comportamento: skeleton sai com slide-down + fade, conteúdo entra com slide-up + fade após
  delay (asymmetric timing do guia consultado). prefers-reduced-motion neutraliza ambos.
```

**Same-route crossfade em `/descobrir/[citySlug]` (Requirement 6):**

```
Antes:
  /descobrir/sao-paulo → /descobrir/rio: hard cut (sem animação).

Depois:
  src/app/descobrir/[citySlug]/page.tsx
    export default async function DiscoverPage({ params, searchParams }) {
      const { citySlug } = await params;
      // ...
      return (
        <Suspense fallback={<DiscoverGridSkeleton />}>
          <ViewTransition
            key={citySlug}
            name="discover-grid"
            share="auto"
            enter="auto"
            default="none"
          >
            <DiscoverGrid slug={citySlug} sort={sort} filters={filters} />
          </ViewTransition>
        </Suspense>
      );
    }

  Comportamento: troca de citySlug dispara crossfade default do React no grid; header e filtros
  permanecem fixos (não estão dentro do <ViewTransition>).
```

**Directional slide no onboarding (Requirement 6):**

```
Estrutura atual: 4 rotas em src/app/conta/onboarding/{perfil,fotos,valores,publicar}/page.tsx;
navegação via <Link href="/conta/onboarding/fotos">Próximo</Link> sem direção.

Depois:
  src/app/conta/onboarding/onboarding-nav.tsx (novo helper):
    export function OnboardingNext({ href, children }) {
      return <Link href={href} transitionTypes={['nav-forward']}>{children}</Link>;
    }
    export function OnboardingBack({ href, children }) {
      return <Link href={href} transitionTypes={['nav-back']}>{children}</Link>;
    }

  Cada page.tsx do onboarding:
    return (
      <ViewTransition
        enter={{ 'nav-forward': 'nav-forward', 'nav-back': 'nav-back', default: 'none' }}
        exit={{  'nav-forward': 'nav-forward', 'nav-back': 'nav-back', default: 'none' }}
        default="none"
      >
        {/* conteúdo do passo */}
      </ViewTransition>
    );

  globals.css adiciona keyframes slide com offsets ±60px conforme guia consultado.
```

**UI otimista com rollback (Requirement 5):**

```
Estado atual (favorite-button.tsx:17-30):
  const [favorited, setFavorited] = useState(initialFavorited);
  const [pending, startTransition] = useTransition();

  function handleClick() {
    if (!isLoggedIn) return;
    startTransition(async () => {
      const res = await toggleFavorite(profileId);
      if ("error" in res) {
        // ⚠️ NÃO há rollback — UI fica dessincronizada se servidor falhar
        toast(res.error, "error");
        return;
      }
      setFavorited(res.favorited);  // setState DEPOIS do await — perde "otimismo"
    });
  }

Estado alvo (com use-optimistic-toggle):
  const { value: favorited, toggle, pending } = useOptimisticToggle({
    initialValue: initialFavorited,
    action: async (next) => {
      const res = await toggleFavorite(profileId);
      if ("error" in res) throw new Error(res.error);
      return res.favorited;
    },
    onError: (err) => toast(err.message, "error"),
  });

  function handleClick() {
    if (!isLoggedIn) return;
    toggle();  // estado vai para !favorited IMEDIATAMENTE (otimismo);
               // se action falhar, useOptimistic reverte automaticamente
  }

Implementação interna (use-optimistic-toggle.ts):
  export function useOptimisticToggle<T>({ initialValue, action, onError }) {
    const [committed, setCommitted] = useState<T>(initialValue);
    const [optimistic, applyOptimistic] = useOptimistic<T, T>(
      committed,
      (_, next) => next
    );
    const [pending, startTransition] = useTransition();

    function toggle(next: T) {
      startTransition(async () => {
        applyOptimistic(next);   // estado externo já está em `next`
        try {
          const result = await action(next);
          setCommitted(result);  // commit servidor → commit local
        } catch (err) {
          onError?.(err as Error);
          // não chama setCommitted — useOptimistic reverte para `committed`
          // automaticamente quando a transition termina
        }
      });
    }

    return { value: optimistic, toggle, pending };
  }
```

### Boundaries

- **`<LoadingSkeleton>` vs `<Suspense fallback>`**: `loading.tsx` é Next.js convention que usa `<Suspense>` por baixo. `<LoadingSkeleton>` é o **conteúdo** do fallback, não o boundary. Os dois coexistem: `loading.tsx` retorna `<LoadingSkeleton variant="..." />`. Em casos onde Suspense reveal com `<ViewTransition>` é desejado (Requirement 6.3), o `loading.tsx` é substituído por `<Suspense>` inline na page.
- **`<ErrorState>` vs `error.tsx`**: `error.tsx` é Next.js convention de error boundary. `<ErrorState>` é o **conteúdo** do error boundary, com props `title`/`description`/`onRetry`. Os dois coexistem: `error.tsx` chama `<ErrorState variant="page" onRetry={reset} />`.
- **`<EmptyState>` vs lista vazia inline**: `<EmptyState>` substitui o markup inline (`<div className="...py-16 text-center">...</div>`). RSCs e Client Components consomem o mesmo primitivo.
- **UI otimista vs `useTransition` puro**: `useTransition` puro (atual em 14 sites) é mantido para ações que **não** têm um valor "otimista óbvio" (e.g. login, save de form, criação de reel). UI otimista entra apenas para **toggle de estado binário** (curtir, favoritar, marcar visto, marcar como privado). Migrar todas as ações para otimismo seria sobre-engenharia.
- **`<ViewTransition>` vs animação CSS imperativa**: animações JS imperativas (`framer-motion`, `react-spring`) **não** são introduzidas. Todas as transições novas vão por `<ViewTransition>` + classes CSS. Esta é a recomendação implícita do guia consultado e mantém o projeto sem dependências de animação.
- **`prefers-reduced-motion` global vs hook JS**: a regra global `@media (prefers-reduced-motion: reduce)` em `globals.css` cobre 99% dos casos. Um hook `useReducedMotion` (lendo `window.matchMedia`) só é introduzido se aparecer caso JS-side concreto durante a Wave 8 (e.g. animação imperativa que precisa ser desligada antes de iniciar). Default desta fase: **CSS-only**, sem hook.
- **Refactor de `lint herdado` vs Non-Goal**: a Wave 5 (UI otimista) toca `favorite-button`, `story-bar`, `reels-feed`, `media-gallery`, `profile-story-cover`, `use-media-actions`. Erros de lint pré-existentes nestes arquivos (`react-hooks/refs`, `cant-call-impure-fn-during-render`) podem ser resolvidos como efeito colateral do refactor — não como objetivo declarado. Se ficarem após o refactor, ficam para fase-7. Não vira tarefa específica.

## Components and Interfaces

### 1. Inventário de rotas (Requirement 1)

A matriz completa (72 linhas) vive em `inventario-rotas.md`. Aqui registramos as 5 categorias usadas e exemplos canônicos:

| Categoria | Heurística | `loading.tsx`? | `error.tsx`? | Exemplos canônicos |
|---|---|---|---|---|
| `tela_autenticada` | `auth()` em RSC + redirect; segmento sob `/painel`, `/admin`, `/conta` | criar | criar | `src/app/painel/avaliacoes/page.tsx`, `src/app/conta/perfil/page.tsx` |
| `listagem_publica` | RSC com `await getXxx({ ... })` + render de lista de ≥10 itens | criar | criar | `src/app/em-alta/page.tsx`, `src/app/em-destaque/page.tsx`, `src/app/cidades/page.tsx`, `src/app/buscar/page.tsx` |
| `formulario` | rota com form principal (login, cadastro, recuperar-senha) | criar (mínimo skeleton de form) | criar | `src/app/entrar/page.tsx`, `src/app/recuperar-senha/page.tsx` |
| `pagina_informativa` | conteúdo estático `revalidate=N`, sem `await` em DB | nao_aplicavel | criar (uma para o segmento ancestor) | `src/app/planos/page.tsx`, `src/app/novidades/page.tsx` |
| `route_handler` | arquivo `route.ts` (não há UI; fallback é JSON) | nao_aplicavel | nao_aplicavel | `src/app/api/profiles/section/route.ts`, `src/app/api/media/like/route.ts` |

Em `inventario-rotas.md`, cada uma das 47 `page.tsx` recebe sua categoria + decisão; cada uma das 25 `route.ts` recebe `route_handler` + decisão `nao_aplicavel` para ambas, com justificativa única ("Route Handler — fallback via JSON com status apropriado").

### 2. `<LoadingSkeleton>` primitive (Requirement 2)

```tsx
// src/components/ui/loading-skeleton.tsx
import { cn } from "@/lib/utils";

export type LoadingSkeletonVariant =
  | "card"        // grid 2/3 cols com aspect ratio
  | "list"        // linhas verticais (table-like)
  | "detail"      // hero + texto + grid de mídia (perfil, ticket detalhe)
  | "form"        // labels + inputs alinhados
  | "gallery"     // grid de mídia 3 cols
  | "text-block"; // só linhas de texto (artigo)

export interface LoadingSkeletonProps {
  variant: LoadingSkeletonVariant;
  count?: number;          // quantos itens repetir (default por variant)
  className?: string;
  ariaLabel?: string;      // pt-BR, default "Carregando..."
}

export function LoadingSkeleton(props: LoadingSkeletonProps): JSX.Element;
```

Implementação consome **exclusivamente** tokens da fase-4: `bg-black/[0.04]` (placeholder neutro), `rounded-xl`/`rounded-lg`/`rounded`, `animate-pulse`, classes da escala tipográfica para dimensionar `<div>`s simulando texto. Aplica `aria-busy="true"` + `aria-label={ariaLabel ?? "Carregando..."}` no container raiz.

### 3. `<ErrorState>` primitive (Requirement 3)

```tsx
// src/components/ui/error-state.tsx
import type { ReactNode } from "react";

export interface ErrorStateProps {
  title: string;
  description?: string;
  onRetry: () => void;
  homeHref?: string;       // mostra link secundário para "Voltar ao início"
  variant?: "inline" | "page";  // inline: min-h-[20vh]; page: min-h-[60vh]
  digest?: string;          // exibido em texto pequeno apenas se variant === "page"
  className?: string;
}

export function ErrorState(props: ErrorStateProps): JSX.Element;
```

Implementação aplica `role="alert"` quando `variant === "page"`, `role="status"` quando `variant === "inline"` (status é menos intrusivo para tecnologias assistivas — adequado para erros parciais). O botão "Tentar novamente" é `<button onClick={onRetry}>` (não `<a>`). `homeHref` renderiza `<Link>` secundário. Tokens da fase-4 — zero hex literal, zero `text-[Npx]`.

### 4. `<EmptyState>` primitive (Requirement 4)

```tsx
// src/components/ui/empty-state.tsx
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export interface EmptyStateAction {
  label: string;
  href?: string;            // <Link href={...}> quando informado
  onClick?: () => void;     // <button onClick={...}> quando informado
}

export interface EmptyStateProps {
  title: string;            // ≤ 60 caracteres (validado em runtime via prop check em dev — opcional)
  description?: string;     // ≤ 160 caracteres
  icon?: LucideIcon | ReactNode;
  action?: EmptyStateAction;
  className?: string;
}

export function EmptyState(props: EmptyStateProps): JSX.Element;
```

Comportamento de `action`:
- Se `href` informado: renderiza `<Link href={action.href}>`.
- Se `onClick` informado (e não `href`): renderiza `<button onClick={action.onClick}>`.
- Se ambos informados: prefere `href`, dispara `onClick` como handler complementar (não-bloqueante) via `onClick` do próprio `<Link>`.

Estilo via tokens — `bg-white border border-black/[0.06] rounded-2xl px-6 py-14 text-center shadow-sm`, `text-xl font-semibold` no título, `text-md text-muted` na descrição. Ícone (`<Icon className="mx-auto h-10 w-10 text-muted" strokeWidth={1} />`).

### 5. UI otimista com `useOptimisticToggle` (Requirement 5)

```tsx
// src/lib/hooks/use-optimistic-toggle.ts
import { useOptimistic, useState, useTransition } from "react";

export interface UseOptimisticToggleOptions<T> {
  initialValue: T;
  action: (next: T) => Promise<T>;       // resolve com valor confirmado pelo servidor
  onError?: (err: Error) => void;
}

export interface UseOptimisticToggleReturn<T> {
  value: T;                               // valor mostrado no UI (otimista)
  committed: T;                           // valor confirmado pelo servidor
  toggle: (next: T) => void;              // dispara transition + otimismo
  pending: boolean;                       // true durante a transition
}

export function useOptimisticToggle<T>(
  opts: UseOptimisticToggleOptions<T>
): UseOptimisticToggleReturn<T>;
```

Invariante de **idempotência do rollback** (Property 1):

> Para todo `s0`, executar `toggle(s1)` (com servidor falhando) deixa `committed === s0` e, ao final da transition, `value === s0` (rollback automático). Para qualquer sequência `[a, b, c]` onde `c` falha, `committed` reflete o último sucesso (`b`) e `value` converge para `committed`.

Esta invariante é validada por `*.pbt.ts` co-localizado.

### 6. View Transitions condicional (Requirement 6)

Decisão de adoção:

| Padrão | Aplicado em | `<ViewTransition>` props | Justificativa |
|---|---|---|---|
| Suspense reveal | `src/app/p/[slug]/page.tsx` | `enter="slide-up"` + fallback `exit="slide-down"`, `default="none"` | skeleton já existe; reveal animado torna handoff fluido |
| Same-route crossfade | `src/app/descobrir/[citySlug]/page.tsx` | `key={citySlug}` + `share="auto"`, `enter="auto"`, `default="none"` | troca de cidade muda só o grid; header permanece fixo |
| Directional slide | `src/app/conta/onboarding/{perfil,fotos,valores,publicar}/page.tsx` + `<Link transitionTypes={['nav-forward'\|'nav-back']}>` | `enter`/`exit` mapeados por tipo, `default="none"` | onboarding é fluxo linear; direção comunica progresso |

Padrão **não adotado** nesta fase: shared element morph entre grid e detalhe (`name="photo-${id}"` em thumbnail e hero). Justificativa: exige consolidação de mídia entre `discover/[citySlug]` cards e `/p/[slug]` hero — refactor amplo que extrapola escopo. Registrado em `Out of scope desta fase`.

CSS auxiliar adicionado a `src/app/globals.css`:

```css
:root {
  --vt-duration-exit: 150ms;
  --vt-duration-enter: 210ms;
}

@keyframes fade {
  from { filter: blur(3px); opacity: 0; }
  to   { filter: blur(0);   opacity: 1; }
}
@keyframes slide-y {
  from { transform: translateY(10px); }
  to   { transform: translateY(0); }
}
@keyframes slide {
  from { translate: var(--slide-offset); }
  to   { translate: 0; }
}

::view-transition-old(.slide-down) {
  animation:
    var(--vt-duration-exit) ease-out both fade reverse,
    var(--vt-duration-exit) ease-out both slide-y reverse;
}
::view-transition-new(.slide-up) {
  animation:
    var(--vt-duration-enter) ease-in var(--vt-duration-exit) both fade,
    400ms ease-in both slide-y;
}

::view-transition-old(.nav-forward) { --slide-offset: -60px; animation: 150ms ease-in both fade reverse, 400ms ease-in-out both slide reverse; }
::view-transition-new(.nav-forward) { --slide-offset:  60px; animation: 210ms ease-out 150ms both fade, 400ms ease-in-out both slide; }
::view-transition-old(.nav-back)    { --slide-offset:  60px; animation: 150ms ease-in both fade reverse, 400ms ease-in-out both slide reverse; }
::view-transition-new(.nav-back)    { --slide-offset: -60px; animation: 210ms ease-out 150ms both fade, 400ms ease-in-out both slide; }
```

(Esses são literalmente os keyframes documentados no guia consultado, com nomes adaptados.)

### 7. Microinteraction com `prefers-reduced-motion` (Requirement 7)

Regra global em `src/app/globals.css`, **única** fonte de verdade:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-delay: 0.01ms !important;
    transition-duration: 0.01ms !important;
    transition-delay: 0.01ms !important;
  }

  ::view-transition-old(*),
  ::view-transition-new(*),
  ::view-transition-group(*) {
    animation-duration: 0s !important;
    animation-delay: 0s !important;
  }
}
```

Justificativa do `0.01ms` em vez de `0`: alguns navegadores (Safari < 17) têm bugs com `0s` em `animation-duration`; `0.01ms` é praticamente instantâneo e seguro. Para `view-transition-*`, o guia consultado usa `0s` literal — preservamos.

Protocolo para introduzir nova microinteração:

1. Definir a animação via classe utilitária Tailwind (`transition-*`, `animate-*`) **ou** via `@keyframes` em `globals.css`.
2. **Não** declarar regra paralela `@media (prefers-reduced-motion: reduce)` — a global cobre.
3. Validar em ambiente local com `Settings > Accessibility > Reduce motion` (macOS) ou via `Rendering > Emulate CSS media feature` (Chrome DevTools).

Hook opcional `useReducedMotion` (NÃO criado por padrão nesta fase — só se Wave 8 encontrar necessidade JS-side):

```ts
// src/lib/hooks/use-reduced-motion.ts (criação condicional)
export function useReducedMotion(): boolean {
  // useSyncExternalStore com window.matchMedia('(prefers-reduced-motion: reduce)')
}
```

## Data Models

### **NÃO tocar `prisma/schema.prisma`**

Esta fase **não altera o schema Prisma**. Justificativa:

- `auditoria-geral/requirements.md > Non-Goals item 3` proíbe mudanças de schema sem justificativa de consequência direta.
- Esta fase consome a API existente das services de fase-3 (`@/lib/services/{profile,discover,...}`) e Server Actions de fase-1.
- Adicionar tabela / coluna para "marcar visto" persistente seria mudança de schema; fica como `OutOfScopeFinding` se aparecer durante a execução.

### Tipos derivados (apenas em código, sem mudança de DB)

```ts
// src/components/ui/loading-skeleton.tsx
export type LoadingSkeletonVariant = "card" | "list" | "detail" | "form" | "gallery" | "text-block";
export interface LoadingSkeletonProps { variant: LoadingSkeletonVariant; count?: number; className?: string; ariaLabel?: string; }

// src/components/ui/error-state.tsx
export type ErrorStateVariant = "inline" | "page";
export interface ErrorStateProps { title: string; description?: string; onRetry: () => void; homeHref?: string; variant?: ErrorStateVariant; digest?: string; className?: string; }

// src/components/ui/empty-state.tsx
export interface EmptyStateAction { label: string; href?: string; onClick?: () => void; }
export interface EmptyStateProps { title: string; description?: string; icon?: LucideIcon | ReactNode; action?: EmptyStateAction; className?: string; }

// src/lib/hooks/use-optimistic-toggle.ts
export interface UseOptimisticToggleOptions<T> { initialValue: T; action: (next: T) => Promise<T>; onError?: (err: Error) => void; }
export interface UseOptimisticToggleReturn<T> { value: T; committed: T; toggle: (next: T) => void; pending: boolean; }
```

### Inventário de rotas (modelo textual)

```ts
type RouteCategory = "tela_autenticada" | "listagem_publica" | "formulario" | "pagina_informativa" | "route_handler";
type DecisaoLoading = "existente" | "criar" | "nao_aplicavel";
type DecisaoError = "existente" | "criar" | "nao_aplicavel";

interface RouteInventoryEntry {
  caminho: string;            // ex.: "src/app/painel/avaliacoes/page.tsx"
  categoria: RouteCategory;
  loading: DecisaoLoading;
  error: DecisaoError;
  justificativa?: string;     // ≤ 30 palavras, obrigatória quando alguma decisão é "nao_aplicavel"
}
```

72 entradas em `inventario-rotas.md` durante a Wave 2.

## Error Handling

A Fase 5 não adiciona novos pontos de falha — apenas refatora o que existe e adiciona primitivos. Os procedimentos abaixo cobrem situações em que a fase **não pode ser absorvida silenciosamente**.

### E1. Refactor de UI otimista quebra fluxo existente

**Sintoma:** após migrar `favorite-button.tsx` para `useOptimisticToggle`, o "favoritar" deixa de funcionar (toggle não persiste, ou persiste duplo).

**Tratamento:** **não promover o commit**. O teste determinístico (`use-optimistic-toggle.test.ts`) deveria ter pego antes. Se passou: (a) reverter o commit, (b) reproduzir local, (c) escrever teste adicional cobrindo o caso, (d) corrigir a implementação, (e) re-aplicar.

### E2. `<ViewTransition>` quebra rota em produção (build mode)

**Sintoma:** após `experimental.viewTransition: true`, alguma rota retorna 500 em produção ou as animações não disparam em Safari.

**Tratamento:** desligar a flag em commit dedicado, registrar a rota afetada em `OutOfScopeFinding` apontando o sintoma + browser + diagnóstico. Voltar `<ViewTransition>` para os 3 sites originais e investigar caso a caso. Não há "ativar e torcer" — o guia consultado avisa que Safari pode comportar diferente.

### E3. `prefers-reduced-motion` não cobre nova microinteração

**Sintoma:** novo componente animado é introduzido (e.g. `<Toast>` com slide-in) e ignora a regra global porque usa `transform` controlado por JS via `useEffect` em vez de CSS.

**Tratamento:** revisor rejeita o PR. A regra é: animações JS-side só são introduzidas se o autor adicionar `useReducedMotion` no componente. Caso contrário, animar via classe CSS / `<ViewTransition>`.

### E4. Item de schema mudou no Next entre a consulta e a entrega

**Sintoma:** durante a Wave 6, surge `next@16.x.y` (minor) que renomeia `experimental.viewTransition` ou muda comportamento do `<Link transitionTypes>`.

**Tratamento:** **adicionar nova linha** em `requirements.md > §4` (AGENTS_Rule) com a nova consulta. Não sobrescreve a linha existente — invariante do template.

### E5. Lista vazia ad-hoc não cabe no `<EmptyState>`

**Sintoma:** durante a Wave 3, descobre-se que uma lista vazia (e.g. `admin/moderacao` com tabela complexa) tem lógica embutida que `<EmptyState>` não cobre (e.g. estado de erro + estado vazio coabitam o mesmo render path).

**Tratamento:** registrar como nota em `inventario-rotas.md > Listas vazias não migradas` com motivo. Não vira `OutOfScopeFinding` — é decisão local do componente.

### E6. Refactor de UI otimista expõe lint herdado pré-existente

**Sintoma:** ao tocar `story-bar.tsx` para migrar para `useOptimisticToggle`, lint adiciona novos errors (efeito colateral) — ou existentes não somem.

**Tratamento:** corrigir o que sair barato (≤ 5 minutos por error). Caso contrário, deixar como estava (já era pré-existente, fase-7 cuida). Comentário inline `// fase-5: refactor parcial; lint completo na fase-7` se houver dúvida.

### `OutOfScopeFinding` schema (para uso na §3 do `requirements.md`)

```ts
interface OutOfScopeFinding {
  discoveredIn: "fase-5-ux";
  description: string;
  proposedTarget: PhaseId | "novo-spec-filho";
  evidence: string;  // path:linha, hash de commit ou link de PR
}
```

Casos típicos esperados (registrar como `OutOfScopeFinding` **se ocorrerem**):

- `<ViewTransition>` quebra rota em Safari (proposedTarget: ampliar fase-5 ou fase-6).
- Lista vazia exige refactor de tabela complexa (proposedTarget: fase futura ou nova fase de admin).
- Componente pesado descoberto sem skeleton possível sem lazy load (proposedTarget: ampliar fase-5).
- "Marcar visto" exige tabela nova no schema (proposedTarget: novo Phase Card de schema-changes).

## Testing Strategy

A Fase 5 consome a infraestrutura de `fase-2-testes` (Vitest + fast-check, configurada e `Done`). O contrato é:

- **Para cada primitivo novo** (`<LoadingSkeleton>`, `<ErrorState>`, `<EmptyState>`): `*.test.ts` co-localizado com Testing Library (`@testing-library/react` + jsdom — já disponíveis pela fase-2/4 com `dropdown.test.ts`, `modal.test.ts`, `use-focus-trap.test.ts`). Testes determinísticos cobrem ARIA, variantes e CTA.
- **Para `useOptimisticToggle`**: `*.test.ts` cobre fluxo determinístico (toggle → action sucesso → committed atualiza; toggle → action falha → rollback) e `*.pbt.ts` cobre Property 1 (idempotência do rollback) com `numRuns: 100`.
- **Para o inventário** (Requirement 1): teste declarativo que parsa `inventario-rotas.md` e valida cobertura — Property 2 abaixo.
- **Para `prefers-reduced-motion`** (Requirement 7): teste que parsa `globals.css` e valida presença das duas regras (`*` e `::view-transition-*(*)`) — Property 3 abaixo. Não há jsdom para CSS em runtime; validamos via parsing textual do arquivo.
- **Para `<ViewTransition>`**: **não há teste automatizado** — animações dependem de browser real e `chrome --enable-features=ViewTransitions`. Verificação é manual via `npm run dev` + smoke browser. O `npm run build` valida que a flag não introduz erro de tipo.

Itens que **nunca** rodam nesta fase:

- Cobertura de componentes React além de Testing Library (e.g. visual regression com snapshots de imagem) — fora do escopo (cf. `fase-2-testes > out_of_scope`).
- Testes E2E novos no Playwright — fora do escopo.
- Lighthouse CI ou Core Web Vitals — fora do escopo (fase-7 cuida do CI).
- Testes de carga / penetração — fora do escopo de qualquer fase desta auditoria.

### Estrutura de testes

```
src/components/ui/
  loading-skeleton.tsx
  loading-skeleton.test.ts          ← variantes renderizam aria-busy + estrutura
  error-state.tsx
  error-state.test.ts                ← role=alert/status, botão Tentar novamente, variantes
  empty-state.tsx
  empty-state.test.ts                ← cta href vs onClick, render

src/lib/hooks/
  use-optimistic-toggle.ts
  use-optimistic-toggle.test.ts      ← toggle → success → committed; toggle → fail → rollback
  use-optimistic-toggle.pbt.ts       ← Property 1: rollback idempotente (numRuns: 100)

.kiro/specs/fase-5-ux/
  inventario-rotas.test.ts           ← (opcional) parser que valida cobertura — Property 2
  globals-css-reduced-motion.test.ts ← (opcional) parser que valida regra global — Property 3
```

(As "Properties" 2 e 3 podem ser implementadas como testes determinísticos com fast-check apenas se houver entrada parametrizável; caso contrário, ficam como assertions diretas.)

### Saída de testes (gate)

Antes de promover qualquer commit das Waves 3, 4, 5:

```bash
npm run test
# OU
npx vitest --run --reporter=verbose src/components/ui/{loading-skeleton,error-state,empty-state}.test.ts \
                                    src/lib/hooks/use-optimistic-toggle.{test,pbt}.ts
```

Em caso de falha, o protocolo da `fase-2-testes/testing-conventions.md > Persistência de contraexemplos` se aplica.

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

A Fase 5 enuncia 3 propriedades universais. Elas viram `*.pbt.ts` ou testes paramétricos co-localizados. Rodam com `numRuns: 100` (default herdado de `fase-2-testes`).

### Property 1: Rollback idempotente em `useOptimisticToggle`

**Validates: Requirements 5.1, 5.4, 5.5, 5.7**

*Para todo* estado inicial `s0` e *toda* sequência de toggles `[t1, t2, ..., tk]` aplicados via `useOptimisticToggle`, onde cada `ti` corresponde a uma `action` que pode falhar (`Promise.reject`) ou ter sucesso (`Promise.resolve(novoValor)`), o estado `committed` ao final converge para o resultado da última `action` que **teve sucesso**, e `value` (o estado otimista mostrado no UI) **converge para `committed`** após o término da última `transition`. Em particular, se *todas* as actions falharem, `committed === s0` e `value === s0`.

Equivalência declarada:
```
Para todo s0 ∈ T e toda sequência [(t_i, success_i)] com i ∈ [1, k]:
  committed_final = última posição com success_i === true (ou s0 se nenhuma)
  value_final     = committed_final
  ∀ i: durante a transition de t_i, value === t_i (otimismo aplicado)
  Após a transition: se success_i, committed === t_i; senão committed permanece inalterado.
```

Geradores: `fc.boolean()` para `T = boolean` (toggle binário); `fc.array(fc.tuple(fc.boolean(), fc.boolean()), { minLength: 1, maxLength: 10 })` para sequência de toggles + sucesso/falha. Mock de `action` que resolve/rejeita conforme bit aleatório.

Tempo limite: ≤ 5s no `npm run test`. Se exceder, reduzir `numRuns` para 50 com nota em `testing-conventions.md`.

### Property 2: Cobertura mínima de loading/error nas rotas elegíveis

**Validates: Requirements 1.1, 1.2, 1.4, 1.5**

*Para toda* rota `r` em `inventario-rotas.md` com `categoria ∈ {"tela_autenticada", "listagem_publica", "formulario"}` e `loading === "criar"`, **existe** o arquivo correspondente em disco em `src/app/<segmento>/loading.tsx` E o arquivo importa `<LoadingSkeleton>` de `@/components/ui/loading-skeleton`. Mesma invariante para `error.tsx` consumindo `<ErrorState>`.

Equivalência declarada:
```
∀ r ∈ inventário, categoria(r) ∈ {tela_autenticada, listagem_publica, formulario}, loading(r) === "criar":
  fileExists(deriveLoadingPath(r))                        === true
  fileContent(deriveLoadingPath(r)).includes("LoadingSkeleton") === true

∀ r ∈ inventário, categoria(r) ∈ {tela_autenticada, listagem_publica, formulario}, error(r) === "criar":
  fileExists(deriveErrorPath(r))                          === true
  fileContent(deriveErrorPath(r)).includes("ErrorState")  === true
```

Geradores: parser determinístico que lê `inventario-rotas.md`, extrai a tabela, e para cada linha valida o filesystem. Não há aleatoriedade — é teste paramétrico, não property test no sentido estrito de fast-check. Pode rodar como `*.test.ts` com `test.each(rows)` se mais conveniente.

### Property 3: Conformidade com `prefers-reduced-motion`

**Validates: Requirements 7.1, 7.2, 7.3**

*Para todo* arquivo CSS efetivo (`src/app/globals.css`), **existe** uma regra `@media (prefers-reduced-motion: reduce)` que cobre `*, *::before, *::after` (com `animation-duration` e `transition-duration` neutralizados) E uma regra paralela cobrindo `::view-transition-old(*), ::view-transition-new(*), ::view-transition-group(*)` (com `animation-duration: 0s`).

Equivalência declarada:
```
Seja css = readFile("src/app/globals.css"):
  css contém "@media (prefers-reduced-motion: reduce)" === true
  css contém "*, *::before, *::after"                  === true (dentro do media block)
  css contém "animation-duration"                       === true (dentro do media block)
  css contém "transition-duration"                      === true (dentro do media block)
  css contém "::view-transition-old(*)"                 === true (dentro do media block)
  css contém "::view-transition-new(*)"                 === true (dentro do media block)
  css contém "::view-transition-group(*)"               === true (dentro do media block)
```

Implementação: parser textual simples que lê o arquivo como string e roda regex/substring checks. Não há aleatoriedade — é teste paramétrico. Roda em `*.test.ts` no diretório `src/app/` ou em `.kiro/specs/fase-5-ux/`.

> Estas 3 Properties são gate das Waves 5, 4 e 8 respectivamente. Falha bloqueia o commit que entrega a wave correspondente. Persistência de contraexemplos segue `testing-conventions.md > Persistência de contraexemplos` da `fase-2-testes`.

## Out of scope desta fase

- **Shared element morph entre grid e detalhe** (`<ViewTransition name={"photo-${id}"}>`): Step 1 do guia consultado em §4. Exige consolidação de mídia entre `discover/[citySlug]` cards e `/p/[slug]` hero. Fica como candidata futura.
- **Bottom nav mobile redesign**: refactor de `src/components/layout/bottom-nav.tsx` com transições nativas. Vai para `fase-6-mobile-cross-browser`.
- **Onboarding redesign visual**: progress bar com 25/50/75/100% explícito, celebração ("confetti"), help text contextual. Fica fora desta fase — apenas directional slide é entregável.
- **Toast com checkmark animado** (overshoot scale, shake horizontal): cosmético, fora.
- **`<Suspense>` boundaries adicionais** (além do RSC default): cobertura ampla de Suspense em sub-árvores entra em fase futura ou parcialmente fase-3 (que não é mais reaberta).
- **Hook `useReducedMotion` JS-side**: criado **apenas se** Wave 8 encontrar caso concreto. Default desta fase: CSS-only.
- **Refactor de primitivos da fase-4**: Modal, Switch, Dropdown, Button, Input, Textarea, Select, Card, Badge, Avatar, Toast, ToggleChip, useFocusTrap, useFileUpload. Fora.
- **Mudanças em queries/services/`prisma/schema.prisma`**: fora.
- **CI / lint config / `eslint.config.mjs`**: fase-7.

## Saída deste design

Este `design.md` é considerado pronto quando:

- Cobre os 8 Requirements de `requirements.md` desta fase com decisões verificáveis.
- Lista os arquivos a criar/modificar (`src/components/ui/{loading-skeleton,error-state,empty-state}.tsx`, `src/lib/hooks/use-optimistic-toggle.ts`, `src/app/globals.css`, `next.config.ts`, `inventario-rotas.md`; refactors em `loading.tsx`/`error.tsx` por wave; refactors em `favorite-button` + 5 sites de like/view + `use-media-actions`; aplicação de `<ViewTransition>` em `/p/[slug]`, `/descobrir/[citySlug]`, e nos 4 passos do onboarding).
- Registra a decisão de `experimental.viewTransition: true` como única (com janela de validação manual via smoke browser).
- Aponta o que vira `OutOfScopeFinding` (Safari quebra View Transitions, lista vazia complexa, schema mudar para "marcar visto", componente pesado sem lazy possível).
- Declara as 3 Correctness Properties (rollback idempotente, cobertura de loading/error, conformidade reduced-motion) com geradores e equivalências.

A próxima etapa do workflow é o `tasks.md` deste mesmo spec-filho, que decompõe este design em sub-tarefas executáveis com dependências.
