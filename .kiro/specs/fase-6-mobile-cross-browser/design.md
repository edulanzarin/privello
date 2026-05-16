# Design Document — `fase-6-mobile-cross-browser`

> Spec-filho promovido a partir do master `auditoria-geral`. Este documento detalha como **garantir paridade comportamental e visual em iPhone Safari, Android Chrome, desktop Safari/Firefox/Edge**, alinhar a implementação aos 11 mockups em `design/`, e tratar especificidades de toque (44×44 px), teclado virtual, bottom-sheets, gestos (`touch-action`, `overscroll-behavior`, `pull-to-refresh`) e lightbox/drawer responsivos. Esta é a **última fase** da auditoria — depois dela, o master `auditoria-geral` fecha. A execução das tarefas deste design vive em `tasks.md` (a seguir).

## Overview

Hoje o projeto tem:

- **11 PNGs** em `c:\Users\edulanzarin\Documents\Dev\privello\design\` sem diff visual sistemático contra a implementação.
- **Playwright** com 2 projects (`ios-safari` + `desktop-chrome`) e 2 specs (`ios-bug-condition.spec.ts`, `preservation.spec.ts`) — cobertura escassa, herdada da bugfix iOS.
- **0 ocorrências** de `min-h-[44px]`/`min-w-[44px]` em `src/**` — nenhum controle declara alvo de toque mínimo explícito.
- **0 ocorrências** de `visualViewport` em `src/**` — nenhum tratamento de teclado virtual.
- **0 ocorrências** de `touch-action`, `overscroll-behavior`, `pull-to-refresh` em `src/**` — gestos nativos rodam sem restrição.
- **Modal `position`**: 0× `bottom`, 1× `center` explícito (`client-profile-edit.tsx:64`), 3× `fullscreen` (`midias-manager.tsx:397`, `story-bar.tsx:287`, `profile-story-cover.tsx:234`); demais consumidores defaultam ao primitivo (cf. tabela do inventário a refazer na Tarefa 2).
- **`100dvh`**: já em uso em `reels-feed.tsx:172,405` (único site) — alinhado com o padrão que vamos generalizar.
- **`100vh`**: 0 ocorrências — nenhuma migração massiva necessária.
- **2 OutOfScopeFindings herdados**: `media-gallery.tsx:178` (lightbox responsivo, registrado em fase-4) e bottom nav mobile redesign (registrado em fase-5).

A Fase 6 entrega seis grupos de mudança:

1. **Matriz de browsers** declarada em `mockups-diff.md > §Browser Matrix` + extensão de `playwright.config.ts > projects` para 4 projects (ios-safari, android-chrome, desktop-chrome, desktop-firefox; desktop Safari e desktop Edge como smoke manual).
2. **Touch target 44×44** em todos os `Critical_Control`s identificados na Tarefa 2 de inventário.
3. **Tratamento de teclado virtual** via `<meta name="viewport" content="..., interactive-widget=resizes-content">` + migração `vh` → `dvh` onde aplicável + smoke browser manual nos 4 fluxos (login, cadastro, comentário, suporte) + hook `useVirtualKeyboard` opcional se CSS não bastar.
4. **Bottom-sheet** aplicado em consumidores Modal `center` em viewport mobile via prop responsiva consumidora (estratégia (a) — não mexe no Modal primitivo).
5. **Diff visual** dos 11 mockups em `mockups-diff.md > §Mockups`, com 11 entradas (`mockup_path`, `tela_alvo`, `divergencias_aceitas`, `divergencias_a_corrigir`, `observacoes`).
6. **Gestos por plataforma** — `touch-action: none` em lightboxes/story viewers fullscreen; `overscroll-behavior: contain` em containers com scroll interno; `overscroll-behavior-y: none` em rotas onde pull-to-refresh é destrutivo.
7. **Lightbox responsivo + Drawer mobile + bottom nav redesign** — absorção dos 2 OutOfScopeFindings herdados via primitivos derivados (`<MediaLightbox>` e `<Drawer>`) e refactor pontual do `bottom-nav.tsx`.

A fase **não** entrega: app nativo, PWA installable, push notifications, mudanças em primitivos da fase-4, mudanças em queries/services da fase-3, mudanças em `prisma/schema.prisma`, CI / lint config (já entregue por fase-7), View Transitions novas, refactor visual amplo dos mockups, otimização de bundle, snapshot/visual regression automatizado por pixel, mudanças em APIs do Next.js — vira `OutOfScopeFinding`.

### Decisões de design importantes

- **`<meta name="viewport" content="..., interactive-widget=resizes-content">`** em vez de hook JS por default. Justificativa: a flag CSS-side resolve 90% dos casos de teclado virtual; hook é opt-in para casos onde header sticky precisa colapsar quando teclado abre OU CTA fixo precisa ser empurrado para acima do teclado.
- **Migração `vh` → `dvh`/`svh`** em vez de container queries customizadas. Justificativa: `dvh` é baseline em Safari 16+, Chrome 108+, Firefox 101+ — alinhado às versões mínimas da matriz; o único uso atual de `100dvh` (`reels-feed.tsx`) confirma que o padrão já é viável no projeto.
- **Bottom-sheet via prop responsiva no consumidor**, não via prop nova `position="auto"` no Modal primitivo. Justificativa: mexer no Modal primitivo da fase-4 é Non-Goal; estratégia consumidora preserva a separação de responsabilidades. Hook auxiliar `useMediaQuery` é criado em `src/lib/hooks/use-media-query.ts` somente se ≥ 2 sites consumirem (caso contrário, uso direto de `window.matchMedia` no site único).
- **`<MediaLightbox>` como wrapper sobre Modal**, não primitivo standalone. Justificativa: reusa Modal+focus trap+scroll lock entregues por fase-4. Primitivo derivado fica em `src/components/profile/media-lightbox.tsx` (próximo do consumidor original `media-gallery.tsx`) ou `src/components/ui/lightbox.tsx` (se reuso por outras superfícies for esperado — decisão registrada em `mockups-diff.md > §Lightbox responsivo`).
- **`<Drawer>` como primitivo novo em `src/components/ui/drawer.tsx`**, NÃO extensão da prop `position` do Modal. Justificativa: drawer tem comportamento de transição lateral (`translate-x`), backdrop e tipos de fechamento (incluindo swipe-back) suficientemente distintos de Modal para justificar primitivo separado. Decisão tomada na Tarefa de design da Wave Drawer; alternativa "manter inline em `painel-sidebar.tsx`" é registrada em `mockups-diff.md > §Drawer mobile` se a complexidade do primitivo exceder o ganho.
- **Diff visual manual**, não snapshot automatizado por pixel. Justificativa: 11 mockups com tolerâncias específicas (dados reais vs mock, copy editorial) tornam comparação por pixel inadequada; humano olhando lado a lado é o método correto. Snapshot automatizado seria contraprodutivo nesta escala.
- **Cobertura Playwright parcial dos 5 browsers da matriz**: 4 projects rodáveis (ios-safari, android-chrome, desktop-chrome, desktop-firefox) + 2 como smoke manual (desktop Safari, desktop Edge). Justificativa: Playwright tem suporte nativo a WebKit (cobre Safari iOS e desktop por baixo, mas a engine de desktop Safari requer macOS; Edge usa Chromium mas exige instalação local). Smoke manual é declarado em `mockups-diff.md > §Browser Matrix > Cobertura Playwright vs manual` com critério de validação.
- **Sem novos testes E2E amplos**. Esta fase pode adicionar **smoke E2E por viewport** (1–3 specs) se for entregável real — opcional, não bloqueia Done. Refactor amplo da suite Playwright é Non-Goal herdado de fase-2.
- **Lint anti-regressão para `min-h-[44px]`/`min-w-[44px]`** — opcional. Se for tentado, é variante de regra ESLint custom (cf. fase-4); custo/benefício é avaliado durante a execução. Se não couber, registrar como `OutOfScopeFinding` para fase-7 (já `Done`, exigiria reabertura).

### O que está fora de escopo

- App nativo, PWA installable, push notifications (Non-Goals herdados).
- Refactor de primitivos da fase-4 (Modal, Switch, Dropdown, etc.) além de adicionar prop responsiva nos **consumidores**.
- Refactor de queries/services da fase-3.
- Auditoria WCAG ampla.
- View Transitions novas (fase-5 entregou 3 padrões; aqui só validamos cross-browser).
- Snapshot/visual regression automatizado por pixel.
- Lint anti-regressão para touch target (opcional).

## Architecture

```
+-- mockups-diff.md                                    [novo — entregável principal de doc desta fase]
|     §Browser Matrix                                   - 5 linhas (iOS Safari, Android Chrome, Safari/Firefox/Edge desktop)
|     §Mockups                                          - 11 entradas
|     §Smoke teclado virtual                            - notas dos 4 fluxos validados em iOS+Android
|     §Bottom-sheet decisões                            - lista de Modais classificados em 4 categorias
|     §Gestos                                           - tabela superficie/gesto/comportamento esperado
|     §Lightbox responsivo                              - decisão MediaLightbox vs inline + commit
|     §Drawer mobile                                    - decisão <Drawer> vs inline + commit
|     §Bottom nav redesign                              - lista de divergências aceitas/a corrigir
|     §Smoke checks finais                              - logs de lint/tsc/test/build/playwright
|
+-- playwright.config.ts                               [refactor — extender projects para 4]
|     projects:
|       - ios-safari (já existe — preservar)
|       - desktop-chrome (já existe — preservar)
|       - desktop-firefox (novo)
|       - android-chrome (novo — Pixel 7 device descriptor)
|     desktop-safari + desktop-edge → smoke manual (não Playwright)
|
+-- src/app/layout.tsx                                  [refactor pequeno — viewport meta]
|     metadata.viewport = { ..., interactiveWidget: "resizes-content" }
|     OU export const viewport = { ..., interactiveWidget: "resizes-content" }
|
+-- src/app/globals.css                                [refactor — gestos + viewport units]
|     html, body { overscroll-behavior-y: contain | none por rota }
|     classes utilitárias para touch-action quando necessário
|
+-- src/lib/hooks/                                     [novos hooks — opcionais]
|   +-- use-media-query.ts                             [novo — opcional, se ≥ 2 consumidores]
|   |     export useMediaQuery(query: string): boolean
|   +-- use-virtual-keyboard.ts                        [novo — opcional, se CSS não bastar]
|         export useVirtualKeyboard(): { isOpen, height }
|
+-- src/components/ui/                                 [novos primitivos derivados]
|   +-- drawer.tsx                                     [novo — opcional, se Wave Drawer decidir criar]
|   +-- drawer.test.tsx                                [novo — se drawer criado]
|   +-- lightbox.tsx (ou src/components/profile/       [novo — wrapper sobre Modal com position responsivo]
|       media-lightbox.tsx)
|   +-- lightbox.test.tsx                              [novo]
|
+-- src/components/**                                  [refactor — touch target + gestos + bottom-sheet]
|   wave 2: Critical_Controls (44×44)                  ~10–20 arquivos identificados na Tarefa 2
|   wave 4: bottom-sheet em consumidores               ~3–6 sites Modal center → bottom em mobile
|   wave 6: gestos                                     ~4–6 sites (lightboxes, reels, drawer, body)
|   wave 7: <MediaLightbox> aplicado                   1 site (media-gallery.tsx:178)
|   wave 7: <Drawer> aplicado                          1 site (painel-sidebar.tsx:225)
|   wave 7: bottom-nav redesign                        1 arquivo (layout/bottom-nav.tsx)
|
+-- src/app/**                                          [refactor — telas correspondentes aos mockups]
|   diff visual identifica os arquivos                 11 telas, escopo limitado às divergencias_a_corrigir
|
+-- tests/e2e/                                         [extensão opcional]
|   +-- mobile-smoke.spec.ts                           [opcional — smoke por viewport se for entregável real]
|
+-- *.test.tsx co-localizados                          [novos — Properties 1 e 2]
|     touch-target.test.tsx (varios sites repr.)        - mede getBoundingClientRect
|     bottom-sheet-responsive.test.tsx                  - matchMedia mock
```

### Boundaries

- **`mockups-diff.md` vs commits no master**: o `mockups-diff.md` é um documento vivo do spec-filho. Ele identifica divergências; o que é absorvido vira tarefa nas demais Waves; o que extrapola vira `OutOfScopeFinding` com commit no master ANTES de qualquer absorção (regra dura E4).
- **Primitivos novos vs `useMediaQuery`**: `<MediaLightbox>` e `<Drawer>` consomem `useMediaQuery` quando o behavior responsivo for interno; consumidores diretos de Modal podem usar `useMediaQuery` direto OU calcular `position` no JSX (preferência: extrair para `useMediaQuery` se ≥ 2 sites; senão, inline).
- **Hook `useVirtualKeyboard`**: só é criado se CSS sozinho não bastar. Default desta fase: CSS-only via meta viewport + `dvh`. Hook é opt-in.
- **Playwright projects extras vs smoke manual**: Playwright cobre 4 dos 5 browsers; desktop Safari e desktop Edge ficam como smoke manual com critério declarado.
- **Cobertura de testes determinísticos**: 1 teste por categoria de Critical_Control (~7 categorias) + 1 teste por Modal `bottom_sheet_em_mobile` representativo. Cobertura exaustiva é via lint anti-regressão (opcional).

## Components and Interfaces

### 1. Browser Matrix (Requirement 1)

A matriz canônica fica em `mockups-diff.md > §Browser Matrix`. Aqui declaramos a forma:

| Plataforma | Browser | Versão mínima alvo | Método de validação | Justificativa da versão |
|---|---|---|---|---|
| iOS | Safari | 16+ | Playwright project `ios-safari` (WebKit + iPhone 14) | View Transitions baseline a partir de Safari 18; `dvh` desde 15.4; aceitamos 16+ por já alinhar à instalação majoritária |
| Android | Chrome | em Android 10+ | Playwright project `android-chrome` (Chromium + Pixel 7) | Chromium tracking estável; Android 10 cobre ≥ 90% dos devices ativos |
| macOS | Safari | 16+ | Smoke browser manual | Engine WebKit já validada via iOS Safari; smoke confirma desktop layout |
| Windows/macOS/Linux | Firefox | 115 ESR+ | Playwright project `desktop-firefox` | ESR é o baseline corporate; cobre `dvh`, `:has()` e demais features usadas |
| Windows/macOS | Edge | 120+ | Smoke browser manual | Chromium-based desde 2020; smoke confirma render no Windows |

Extensão do `playwright.config.ts`:

```ts
projects: [
  {
    name: "ios-safari",                              // já existe
    use: { ...devices["iPhone 14"], browserName: "webkit" },
  },
  {
    name: "desktop-chrome",                           // já existe
    use: { ...devices["Desktop Chrome"], browserName: "chromium" },
  },
  {
    name: "desktop-firefox",                          // novo
    use: { ...devices["Desktop Firefox"], browserName: "firefox" },
  },
  {
    name: "android-chrome",                           // novo
    use: { ...devices["Pixel 7"], browserName: "chromium" },
  },
],
```

Validação mínima de Done: `npm run test:e2e -- --list` lista specs nos 4 projects sem erro de configuração. Execução completa é opcional (depende de browsers instalados localmente).

### 2. Touch_Target convention (Requirement 2)

Regra: **todos os `Critical_Control`s declaram `min-h-[44px] min-w-[44px]`** ou equivalente via padding interno. Categorias canônicas (lista exata congelada na Tarefa 2 do `tasks.md`):

| Categoria | Exemplos representativos |
|---|---|
| (a) Botões de ação primários | `<Button>` consumido em `entrar/login-form.tsx`, `cadastro/.../page.tsx`, `painel/suporte/.../page.tsx` |
| (b) Ícones de navegação | `bottom-nav.tsx`, header de `painel-sidebar.tsx`, breadcrumb (se houver), tabs |
| (c) Botão fechar Modal | botão "X" em `src/components/ui/modal.tsx` (se renderizado) e em consumidores |
| (d) Botões de like/favorite/comments em mídia | `favorite-button.tsx`, ícones em `media-gallery.tsx`, `story-bar.tsx`, `reels-feed.tsx`, `profile-story-cover.tsx` |
| (e) Switches | `<Switch>` consumido (5 sites + primitivo); o primitivo já tem altura suficiente — validar |
| (f) Dropdown triggers | `<DropdownTrigger>` (entregue por fase-4) — validar `Critical_Control` por consumidor |
| (g) Pagination/carousel chevrons | chevrons de paginação em listagens, swipe-arrows em galerias |

Estratégia de aplicação:

- Quando o glifo visual cabe em ≤ 44×44, aumentar hit-region via `padding`: `<button className="p-3 ...">` (12px de padding em cada lado dá ~24px ao redor de glifo 16×16 = 40px+; ajustar para `min-h-[44px] min-w-[44px]`).
- Quando o controle já tem layout `flex items-center justify-center`, aplicar `min-h-[44px] min-w-[44px]` no `<button>` raiz.
- Quando o controle está dentro de linha clicável (ex.: `DropdownItem`), validar via `getBoundingClientRect()` em teste.

Lint anti-regressão (opcional): regra ESLint custom que detecta `<button>`/`<a>` sem `min-h-[44px]` em paths classificados como `Critical_Control`. Decisão de implementar fica para a Tarefa de design da Wave Touch Target; se não couber, vira `OutOfScopeFinding`.

### 3. Virtual_Keyboard handling (Requirement 3)

Estratégia em camadas:

1. **Camada 1 — meta viewport**: declarar `interactive-widget=resizes-content` em `<meta name="viewport">` (via `metadata.viewport` ou `export const viewport` em `src/app/layout.tsx`):

   ```ts
   // src/app/layout.tsx (alteração mínima)
   export const viewport: Viewport = {
     width: "device-width",
     initialScale: 1,
     // novo:
     interactiveWidget: "resizes-content",
   };
   ```

   Comportamento esperado: em iOS Safari 16+ e Android Chrome moderno, abrir o teclado virtual reduz o viewport CSS em vez de overlay; conteúdo `100dvh` se ajusta automaticamente.

2. **Camada 2 — viewport units**: usar `dvh`/`svh` em vez de `vh` nos sites onde altura é relevante. Hoje `100dvh` aparece em `reels-feed.tsx`; outros consumidores potencialmente afetados são identificados na execução. `100vh` não aparece (medido), portanto migração em massa não é necessária.

3. **Camada 3 — hook (opcional)**: se algum caso identificar que CSS não basta (ex.: header sticky que precisa colapsar quando teclado abre, OU CTA fixo que precisa ser empurrado para acima do teclado em vez de coberto), criar `src/lib/hooks/use-virtual-keyboard.ts`:

   ```ts
   export interface UseVirtualKeyboardReturn {
     isOpen: boolean;
     height: number;  // altura do teclado em px (0 quando fechado)
   }

   export function useVirtualKeyboard(): UseVirtualKeyboardReturn {
     // useSyncExternalStore com window.visualViewport.resize
     // isOpen: visualViewport.height < window.innerHeight - threshold
     // height: window.innerHeight - visualViewport.height
   }
   ```

   Hook usa `useSyncExternalStore` ou `useEffect + useState` lendo `window.visualViewport.resize`. Cobre apenas iOS Safari e Android Chrome — fallback `{ isOpen: false, height: 0 }` em browsers sem `visualViewport`.

Smoke browser manual nos 4 fluxos: login (`/entrar`), cadastro (`/cadastro/cliente`, `/cadastro/acompanhante`), comentário (overlay em `/p/[slug]` ou `/reels`), suporte (`/painel/suporte`, `/painel/suporte/[id]`). Anotar em `mockups-diff.md > §Smoke teclado virtual` com browser + device usado e resultado.

### 4. Bottom_Sheet pattern (Requirement 4)

Estratégia padrão: **prop responsiva no consumidor**.

```tsx
// Antes (src/app/conta/perfil/client-profile-edit.tsx)
<Modal open={open} onClose={() => setOpen(false)} position="center" className="...">
  ...
</Modal>

// Depois
const isMobile = useMediaQuery("(max-width: 640px)");
<Modal
  open={open}
  onClose={() => setOpen(false)}
  position={isMobile ? "bottom" : "center"}
  className="..."
>
  ...
</Modal>
```

Hook `useMediaQuery`:

```ts
// src/lib/hooks/use-media-query.ts (criação opcional, só se ≥ 2 consumidores)
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (callback) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", callback);
      return () => mql.removeEventListener("change", callback);
    },
    () => window.matchMedia(query).matches,
    () => false,  // SSR fallback
  );
}
```

SSR-safe: o subscribe usa `useSyncExternalStore` com snapshot server-side `false` (default desktop). Hidratação no cliente lê o valor real e re-renderiza.

Classificação dos Modais consumidores em 4 categorias (preenchida na Tarefa 2 do `tasks.md`):

| Categoria | Comportamento |
|---|---|
| `bottom_sheet_em_mobile` | center em desktop, bottom em mobile (<sm) |
| `manter_center` | center em ambos (Modal pequeno, ≤ 400×300, cabe em mobile) |
| `manter_fullscreen` | fullscreen em ambos (lightbox, story viewer) — 3 sites já em `position="fullscreen"` |
| `decisao_caso_a_caso` | misto — registrar decisão em `mockups-diff.md > §Bottom-sheet decisões` |

Mínimo identificado para `bottom_sheet_em_mobile`: `client-profile-edit.tsx:64`. Outros candidatos surgem do inventário Tarefa 2.

### 5. Visual_Diff metodologia (Requirement 5)

`mockups-diff.md > §Mockups` tem 11 entradas. Forma da entrada:

```markdown
### Mockup N: <Nome do PNG>

- **mockup_path**: `c:\Users\edulanzarin\Documents\Dev\privello\design\<arquivo>.png`
- **tela_alvo**: `c:\Users\edulanzarin\Documents\Dev\privello\src\app\<segmento>\page.tsx`
- **divergencias_aceitas**:
  - <descrição factual + justificativa, ex.: "dados reais (perfis ativos) vs mock — paridade aceitável">
  - <descrição factual>
- **divergencias_a_corrigir**:
  - <descrição factual + path:linha + cross-reference a Requirement 2/3/4/6/7 quando aplicável>
- **observacoes**: <texto livre — pode ser vazio>
```

Tolerâncias aceitáveis sem registro:
- dados reais vs mock;
- copy editorial (palavras diferentes que dizem a mesma coisa);
- ordem de cards quando funcionalmente equivalente;
- paleta levemente diferente desde que dentro dos tokens da fase-4;
- divergências que decorrem de features não-implementadas (registrar como `tela_alvo: nao_implementada`).

Mapeamento provisório (refazer caso a caso na Tarefa 5):

| Mockup | Tela alvo provável |
|---|---|
| Dashboard / visão geral | `src/app/painel/page.tsx` |
| Fila de moderação | `src/app/admin/moderacao/page.tsx` |
| Financeiro (Premium) | `src/app/painel/financeiro/page.tsx` |
| Home / landing | `src/app/page.tsx` |
| Listagem com filtros | `src/app/buscar/page.tsx` ou `src/app/descobrir/[citySlug]/page.tsx` (decidir caso a caso) |
| Onboarding / Passo 03 / Fotos | `src/app/conta/onboarding/fotos/page.tsx` |
| Perfil público | `src/app/p/[slug]/page.tsx` |
| Planos e preços | `src/app/planos/page.tsx` |
| Solicitações pendentes | `src/app/painel/page.tsx` (cards de solicitação) — confirmar |
| Solicitar encontro (cliente logado) | `src/app/solicitar/[slug]/page.tsx` |
| Verificação de identidade | `src/app/conta/verificacao/page.tsx` |

### 6. Gesture_Specification (Requirement 6)

`mockups-diff.md > §Gestos` tem uma tabela com colunas `superficie`/`gesto`/`comportamento_esperado_iOS`/`comportamento_esperado_Android`/`comportamento_esperado_desktop`/`mecanismo`. Linhas alvo (a refazer caso a caso):

| Superfície | Gesto | iOS | Android | Desktop | Mecanismo |
|---|---|---|---|---|---|
| `media-gallery` lightbox / `story-bar` viewer / `profile-story-cover` viewer / `midias-manager` lightbox | pinch | sem zoom (não desejado) | sem zoom | n/a (sem touch) | `touch-action: none` no overlay raiz |
| `reels-feed` container vertical | overscroll | snap-y mantido; sem propagação para body | idem | idem | `overscroll-behavior-y: contain` (preserva snap-y) |
| Lista de comentários em modal | overscroll | sem propagação | idem | n/a | `overscroll-behavior: contain` no scroll container |
| Drawer mobile (`painel-sidebar`) | overscroll | sem propagação | idem | n/a | `overscroll-behavior: contain` no painel |
| `/painel/midias` durante upload, `/painel/reels` durante upload | pull-to-refresh | desativado (refresh acidental destrói upload em curso) | idem | n/a | `overscroll-behavior-y: none` em body durante upload OU em container raiz da rota |
| `body` global (default) | pull-to-refresh | manter padrão da plataforma | idem | n/a | sem mecanismo (default) |

Aplicação em CSS:

```css
/* src/app/globals.css */
.touch-none {
  touch-action: none;
}

/* aplicar via classe utilitária Tailwind ou class direta nos overlays */
```

Tailwind v4 já gera `touch-none` (`touch-action: none`), `overscroll-contain`, `overscroll-y-contain`, `overscroll-y-none` como utilitárias. Não precisamos adicionar classes custom; aplicamos no JSX dos sites identificados.

### 7. Lightbox_Responsive — `<MediaLightbox>` (Requirement 7)

```tsx
// src/components/profile/media-lightbox.tsx (caminho recomendado — pertence ao domínio profile)
//   OU src/components/ui/lightbox.tsx (se reuso por outras superfícies)
import { Modal, type ModalProps } from "@/components/ui/modal";
import { useMediaQuery } from "@/lib/hooks/use-media-query";
import type { ReactNode } from "react";

export interface MediaLightboxProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
}

export function MediaLightbox({ open, onClose, children, className }: MediaLightboxProps): JSX.Element {
  const isMobile = useMediaQuery("(max-width: 640px)");
  return (
    <Modal
      open={open}
      onClose={onClose}
      position={isMobile ? "fullscreen" : "center"}
      className={className}
    >
      {children}
    </Modal>
  );
}
```

API mínima: `<MediaLightbox open onClose>{children}</MediaLightbox>`. Substitui o overlay inline em `media-gallery.tsx:178`. Casos previstos:

- `media-gallery.tsx:178` → `<MediaLightbox>` (substituição direta).
- Outros consumidores (story-bar, profile-story-cover, midias-manager) já usam `Modal position="fullscreen"` — **não migrar** automaticamente; só se decidir-se que `<MediaLightbox>` deve ser primitivo geral (registrar em `mockups-diff.md > §Lightbox responsivo`).

### 8. Drawer_Mobile — `<Drawer>` (Requirement 7)

```tsx
// src/components/ui/drawer.tsx (criação opcional — decisão registrada em mockups-diff.md)
export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  side?: "left" | "right";  // default "left"
  children: ReactNode;
  className?: string;
}

export function Drawer({ open, onClose, side = "left", children, className }: DrawerProps): JSX.Element {
  // useScrollLock(open) - reusa hook da fase-4
  // useEscapeKey(open, onClose) - reusa hook da fase-4
  // useFocusTrap(panelRef, open) - reusa hook da fase-4
  //
  // Backdrop: <div className="fixed inset-0 bg-black/30 ..." onClick={onClose} />
  // Painel: <div className={cn(
  //   "fixed top-0 bottom-0 w-full max-w-xs bg-white shadow-xl transition-transform",
  //   side === "left" ? "left-0" : "right-0",
  //   open
  //     ? "translate-x-0"
  //     : (side === "left" ? "-translate-x-full" : "translate-x-full"),
  // )}>
  //   {children}
  // </div>
  //
  // Aplicar `overscroll-behavior: contain` no painel.
  // Não confundir com Modal: API/visual diferente o suficiente para justificar primitivo separado.
}
```

Substitui o drawer inline em `painel-sidebar.tsx:225`. Decisão de criar vs manter inline registrada em `mockups-diff.md > §Drawer mobile` antes da implementação.

### 9. Bottom nav redesign (Requirement 7)

`src/components/layout/bottom-nav.tsx` é refatorado pontualmente para alinhar ao(s) mockup(s) de `design/` que mostram bottom nav. Mudanças aceitas:

- Aplicar tokens da fase-4 onde ainda houver hex literal residual (hoje deveria estar 0 — confirmar).
- Aplicar `min-h-[44px]` em cada item (Requirement 2 — Critical_Control categoria b).
- Adicionar/ajustar labels conforme mockup.
- Adicionar/ajustar badges de notificação conforme mockup.
- Aplicar `prefers-reduced-motion` é desnecessário (regra global da fase-5 já cobre).

Mudanças que viram `OutOfScopeFinding`: redesign completo (mais ícones, layout radicalmente diferente), substituição por outro componente.

## Data Models

A fase **NÃO toca `prisma/schema.prisma`** (Non-Goal explícito). Os "modelos" aqui são tipos TypeScript dos novos primitivos:

- **`<MediaLightbox>`**: `MediaLightboxProps` (declarado em §7).
- **`<Drawer>`**: `DrawerProps` (declarado em §8) — opcional, só se criado.
- **`useMediaQuery`**: `(query: string) => boolean` — opcional.
- **`useVirtualKeyboard`**: `() => { isOpen: boolean, height: number }` — opcional.

Artefatos textuais produzidos pelo spec-filho:

- `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\specs\fase-6-mobile-cross-browser\requirements.md` — já existe.
- `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\specs\fase-6-mobile-cross-browser\design.md` — este documento.
- `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\specs\fase-6-mobile-cross-browser\tasks.md` — produzido a seguir.
- `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\specs\fase-6-mobile-cross-browser\mockups-diff.md` — produzido durante a execução (entrega obrigatória do Requirement 5; também recebe seções de outras Waves).

## Error Handling

- **Refactor amplo do Playwright** (mais de extender 2 projects, ex.: reescrever specs existentes ou criar 5+ specs novos): **vira `OutOfScopeFinding`** para fase-2 (já `Done`, exigiria reabertura) ou fase futura. A fase-6 limita-se a **extender `projects`** + **opcionalmente** 1–3 specs de smoke.
- **Mudança de schema Prisma** (ex.: o diff visual identifica feature que exigiria nova coluna): **vira `OutOfScopeFinding`** para fase-3 (já `Done`) ou fase futura.
- **Primitivo da fase-4 quebrando** durante refactor de bottom-sheet (ex.: Modal `position="bottom"` tem bug não previsto): **vira `OutOfScopeFinding`** para reabertura da fase-4. Não absorver silenciosamente.
- **Nova lib externa** (ex.: alguém propõe `framer-motion` para gestos): **vira `OutOfScopeFinding`** — Non-Goal.
- **Toque em API do Next.js** (ex.: alguém propõe `metadata.viewport.themeColor` ou middleware para device detection): **vira `OutOfScopeFinding`** — fase declarou `agents_rule_areas: nenhuma`. Se absorvido, exige adicionar área em §4 e consulta a `node_modules/next/dist/docs/` ANTES.
- **Mockup descreve feature não-implementada**: marcar `tela_alvo: nao_implementada` e mover para `divergencias_a_corrigir = []` + `observacoes` (cf. Requirement 5.6). NÃO virar tarefa.
- **Lint anti-regressão para touch target produz muitos falsos positivos**: relaxar selector OU registrar como `OutOfScopeFinding` para fase-7. Lint é **opcional** nesta fase.
- **Hook `useVirtualKeyboard` não cobre Windows/macOS desktop quando teclado físico está conectado**: aceitar — fallback `{ isOpen: false, height: 0 }` é correto. Smoke desktop confirma.

Em qualquer caso: **não absorver fora-de-escopo silenciosamente**. Tudo vira `OutOfScopeFinding` (`requirements.md > §3`) com commit no master spec antes de continuar.

## Testing Strategy

A Fase 6 consome a infraestrutura da Fase 2 (Vitest + fast-check + jsdom + Testing Library — entregues por fase-2 e ampliadas pela fase-4 com `@testing-library/react`) e a Playwright já configurada.

### Determinísticos (`*.test.tsx`)

- **Touch target validation** (`src/components/**/touch-target.test.tsx` ou similar): para cada categoria canônica de `Critical_Control` (a–g em §2), renderizar um site representativo e afirmar `getBoundingClientRect()` retorna `width >= 44 && height >= 44`. Cobertura: 1 teste por categoria; cobertura exaustiva é responsabilidade do lint anti-regressão (opcional).
- **Bottom-sheet responsive** (`src/components/**/bottom-sheet-responsive.test.tsx`): mockar `window.matchMedia("(max-width: 640px)")` para `true` e `false` e afirmar que o consumidor passa `position="bottom"` ou `position="center"` ao Modal correspondente. Cobertura: 1 teste para o site representativo.
- **`<MediaLightbox>` smoke**: renderiza com `useMediaQuery` mockado para `true` e `false` e afirma que `Modal` recebe `position="fullscreen"` ou `position="center"`. ARIA preservado (Modal já fornece `role="dialog"`).
- **`<Drawer>` smoke** (se criado): renderiza com `open=true`, `side="left"`/`right"`; afirma backdrop renderizado, painel com transform correto, click no backdrop dispara `onClose`, ESC dispara `onClose`. Focus trap delegado a `useFocusTrap` (já testado por fase-4 — não retesta aqui).

### Property-based (`*.pbt.ts`)

Mínimo 2 properties (cf. instruções do orquestrador):

- **Property 1 — bottom-sheet responsivo determinístico**: para todo viewport `width ∈ [320, 1920]`, o consumidor classificado como `bottom_sheet_em_mobile` resolve `position` como `"bottom"` quando `width <= 640` e `"center"` caso contrário. Geradores: `fc.integer({ min: 320, max: 1920 })`. Implementação: mock `window.matchMedia` em função de `width`, render via Testing Library, leitura da prop `position` aplicada ao Modal.
- **Property 2 — Critical_Control bounding rect**: para cada `Critical_Control` representativo de cada categoria canônica, `getBoundingClientRect()` retorna `width >= 44 && height >= 44`. Geradores paramétricos sobre o conjunto fixo de `Critical_Control`s (lista congelada na Tarefa 2): `fc.constantFrom(...lista)`. Implementação: render via Testing Library, leitura do retângulo. Como a lista é fixa e finita, esta é uma "property" que se beneficia de `fc.constantFrom` mais que de geradores aleatórios — mas atende o critério mínimo exigido.

> Property 1 é determinística (sem espaço de geração realmente aleatório), portanto pode ser implementada como `it("for each width in [320, 1920]", ...)` com um loop ou como `test.prop` com `fc.integer`. A redação do `tasks.md` permite as duas formas.

### Smoke browser manual (não automatizável por agente)

- **Teclado virtual** nos 4 fluxos (Requirement 3.4): smoke em iOS Safari + Android Chrome.
- **Gestos** nos 4 sites (Requirement 6.7): smoke em iOS Safari + Android Chrome.
- **Diff visual** dos 11 mockups (Requirement 5): smoke desktop comparando PNG vs tela.
- **Cross-browser** desktop Safari + desktop Edge (Requirement 1.4): smoke manual.

Todas as notas anexadas em `mockups-diff.md > §Smoke teclado virtual`, `§Smoke gestos`, `§Mockups`, `§Smoke checks finais`.

### Smoke checks finais (não-tests, mas critério de saída)

- `npm run lint` — zero erros novos introduzidos pela fase-6 em arquivos do escopo.
- `npx tsc --noEmit` — zero erros.
- `npm run test` — todos os testes verdes; contagem ≥ baseline da fase-5 (293 testes em 2026-05-17) + novos (touch target + bottom-sheet responsivo + lightbox + drawer + properties).
- `npm run build` — sucesso (em ambiente com DB acessível; falha pré-existente sem DB local não é regressão).
- `npm run test:e2e -- --list` lista specs em ≥ 4 projects sem erro.

## Correctness Properties

As propriedades a seguir nascem como artefatos desta fase e validam invariantes universais. Cada uma é candidata a virar arquivo `.pbt.ts` ou `.test.tsx` co-localizado no consumidor.

### Property 1: Bottom-sheet responsivo determinístico

**Validates: Requirements 4.3, 4.5**

Para todo `width ∈ [320, 1920]` (espaço de viewports razoáveis), o consumidor classificado como `bottom_sheet_em_mobile` (lista congelada na Tarefa 2) resolve `position` como:

- `"bottom"` se `width <= 640`;
- `"center"` se `width > 640`.

Implementação: `fc.assert(fc.property(fc.integer({ min: 320, max: 1920 }), (width) => { ... }))` ou loop `it.each`. Mock `window.matchMedia` para retornar `matches: width <= 640`. Render via Testing Library; ler prop `position` aplicada ao `Modal` filho via DOM ou via `vi.spyOn`.

`numRuns: 100` (default herdado da fase-2).

### Property 2: Critical_Control bounding rect

**Validates: Requirements 2.5, 2.6**

Para todo `control ∈ Critical_Controls` (lista finita congelada na Tarefa 2 — set de paths/names), `getBoundingClientRect()` retorna `width >= 44 && height >= 44` quando renderizado em viewport mobile (≤ 640) e em viewport desktop (≥ 1024).

Implementação: `fc.assert(fc.property(fc.constantFrom(...controls), (control) => { ... }))` OU `it.each(controls)`. Render via Testing Library + jsdom; usar `vi.spyOn(HTMLElement.prototype, "getBoundingClientRect")` ou medir via classe Tailwind aplicada (`min-h-[44px] min-w-[44px]` resulta em `width: 44, height: 44` no jsdom quando classes Tailwind são parseadas — alternativa: medir via `style` resolvido).

> Nota: jsdom não calcula layout por padrão; `getBoundingClientRect()` retorna 0×0 a menos que o teste configure layout explícito. Alternativa robusta: validar que o **className** contém `min-h-[44px] min-w-[44px]` (ou tokens equivalentes), em vez de medir geometria. Decisão entre as duas formas é tomada na Tarefa de testes; se medição direta não funcionar, fallback é assertion sobre className. A propriedade ainda é "para todo control ∈ lista" — mantém valor.

`numRuns: 100` ou cobertura exaustiva da lista (depende da implementação).

> Nenhuma destas Properties é exigida para considerar a fase concluída se a equivalência cair (ex.: Property 2 cair para assertion sobre className — ainda é válido). A meta é **2 propriedades** com valor real, conforme instruções do orquestrador.

## Saída deste design

Este `design.md` é considerado pronto quando:

- Cobre as 8 Requirements de `requirements.md` desta fase com decisões verificáveis.
- Lista os arquivos a criar (`<MediaLightbox>`, opcionalmente `<Drawer>`, opcionalmente `useMediaQuery`, opcionalmente `useVirtualKeyboard`, `mockups-diff.md`) e os arquivos a refatorar (consumidores Modal `center` → bottom-sheet, sites de gestos, telas dos 11 mockups na medida em que `divergencias_a_corrigir` exigir, `playwright.config.ts`, `src/app/layout.tsx`, `src/app/globals.css`).
- Declara a estratégia de adoção do `useMediaQuery`/`useVirtualKeyboard` como **opcional** (default CSS-only).
- Declara explicitamente o que vira `OutOfScopeFinding` (refactor amplo de Playwright, schema change, primitivos da fase-4 quebrando, nova lib externa, toque em API do Next).
- Aponta as 2 Correctness Properties (mínimo) com forma e geradores.

A próxima etapa do workflow é o `tasks.md` deste mesmo spec-filho, que decompõe este design em sub-tarefas executáveis com Task Dependency Graph em JSON.
