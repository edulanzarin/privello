# Requirements Document

## Introduction

FASE 4 — UX Premium para a plataforma Privello. Este documento especifica melhorias profundas na experiência do usuário, focando em velocidade percebida, fluidez, microinterações, feedback visual e sensação premium estilo app nativo macOS. O escopo abrange todas as áreas da aplicação (páginas públicas, área do cliente, painel do provider, painel admin e onboarding), construindo sobre o design system já especificado na spec `design-system`.

## Glossary

- **UX_Engine**: Camada de experiência do usuário da plataforma Privello responsável por transições, loading states, feedback visual e microinterações
- **Skeleton_Loader**: Componente placeholder animado que simula a estrutura do conteúdo durante carregamento, transmitindo velocidade percebida
- **Page_Transition**: Animação suave aplicada durante navegação entre páginas para manter continuidade visual
- **Microinteraction**: Resposta visual sutil a ações do usuário (hover, click, toggle, drag) que comunica estado e reforça a sensação premium
- **Empty_State**: Tela exibida quando uma seção não possui dados, com ilustração, mensagem contextual e call-to-action
- **Loading_State**: Estado visual exibido enquanto dados são carregados, substituindo spinners genéricos por skeleton loaders contextuais
- **Feedback_Visual**: Resposta imediata do sistema a uma ação do usuário (toast, animação de sucesso, shake de erro, progress indicator)
- **Perceived_Performance**: Sensação subjetiva de velocidade experimentada pelo usuário, influenciada por skeleton loaders, transições e feedback imediato
- **Onboarding_Flow**: Fluxo guiado de cadastro de providers com etapas progressivas (dados, fotos, verificação)
- **Visual_Hierarchy**: Organização de elementos por importância usando tamanho, peso, cor e espaçamento para guiar o olhar do usuário
- **Discoverability**: Capacidade do usuário de encontrar funcionalidades e navegar intuitivamente sem instrução explícita
- **Native_Feel**: Qualidade de interação que simula apps nativos macOS — respostas instantâneas, animações com spring physics, ausência de jank

## Requirements

### Requirement 1: Skeleton Loaders Contextuais

**User Story:** Como usuário, quero ver placeholders animados que simulam o conteúdo durante carregamento, para que a interface pareça rápida e eu saiba o que esperar.

#### Acceptance Criteria

1. WHEN a page begins loading data, THE UX_Engine SHALL display a Skeleton_Loader that matches the layout structure (same number of rows, columns, and element dimensions) of the expected content within 50ms of navigation start
2. THE UX_Engine SHALL provide Skeleton_Loader variants for: card grid (discover/search), profile detail, dashboard stats, table rows, media gallery, form sections, and sidebar navigation
3. THE Skeleton_Loader SHALL animate with a shimmer effect using a left-to-right gradient sweep at 1.5s duration with `ease-in-out` timing
4. WHEN content finishes loading, THE UX_Engine SHALL transition from Skeleton_Loader to real content using a 200ms fade-in animation
5. IF content loads in less than 200ms, THEN THE UX_Engine SHALL skip the Skeleton_Loader display entirely to prevent a visual flash
6. THE UX_Engine SHALL replace all generic spinner loading states (`animate-spin rounded-full border`) with contextual Skeleton_Loader components
7. WHEN a Skeleton_Loader is displayed for more than 4 seconds, THE UX_Engine SHALL show a "Carregando..." text indicator (font-size no larger than 12px, opacity 0.6) below the skeleton
8. IF a Skeleton_Loader is displayed for more than 15 seconds without content loading, THEN THE UX_Engine SHALL display an error state with a retry action replacing the skeleton
9. THE Skeleton_Loader SHALL include an `aria-busy="true"` attribute and an accessible label (e.g., `aria-label` indicating loading state) so that assistive technologies announce the loading status to the user

### Requirement 2: Transições de Página

**User Story:** Como usuário, quero que a navegação entre páginas seja fluida e sem cortes abruptos, para que a experiência pareça um app nativo.

#### Acceptance Criteria

1. WHEN the user navigates between pages, THE UX_Engine SHALL apply a Page_Transition animation with fade and subtle vertical slide (opacity 0→1, translateY 8px→0) using 250ms duration and `cubic-bezier(0.16, 1, 0.3, 1)` easing
2. WHEN the user navigates back (browser back or explicit back action), THE UX_Engine SHALL apply a reverse transition (opacity 0→1, translateY -8px→0) using 250ms duration and `cubic-bezier(0.16, 1, 0.3, 1)` easing to communicate directional context
3. WHEN the user navigates back to a previously visited page within the same browser tab lifecycle, THE UX_Engine SHALL restore the scroll position to the exact vertical offset the user had before leaving that page
4. WHILE a Page_Transition is animating, THE UX_Engine SHALL maintain the previous page visible until the new page content has completed its initial render
5. IF the new page content does not complete its initial render within 3 seconds after navigation is triggered, THEN THE UX_Engine SHALL complete the transition by displaying the new page in its current loading state to prevent indefinite blank screens
6. THE UX_Engine SHALL apply Page_Transition to all route changes within the application shell (excluding full page reloads and external navigation)

### Requirement 3: Microinterações de Botões e Elementos Interativos

**User Story:** Como usuário, quero que botões e elementos clicáveis respondam imediatamente ao meu toque, para que eu sinta que a interface está viva e responsiva.

#### Acceptance Criteria

1. WHEN the user presses an enabled button, THE UX_Engine SHALL apply a scale transform of `scale(0.97)` with 100ms duration and spring easing, returning to `scale(1)` within 100ms on release
2. WHEN the user hovers over an interactive card, THE UX_Engine SHALL elevate the card shadow from shadow-sm to shadow-md and apply `translateY(-1px)` with 200ms transition, reversing the effect with 200ms transition on hover-out
3. WHEN the user hovers over a navigation link, THE UX_Engine SHALL display a background highlight with 150ms fade-in using 4% opacity of the foreground color, and remove it with 150ms fade-out on hover-out
4. WHEN a toggle switch changes state, THE UX_Engine SHALL animate the thumb position with a 200ms spring animation and apply a 300ms color pulse on the track
5. IF the user clicks a destructive action button marked as irreversible, THEN THE UX_Engine SHALL display a confirmation prompt before executing the action, applying a 150ms horizontal shake animation of 2px displacement if the user attempts to proceed without confirming
6. WHEN a form field receives focus, THE UX_Engine SHALL animate the border color transition and display a focus ring with 150ms duration, removing the focus ring with 150ms transition on blur
7. IF the user has enabled prefers-reduced-motion in their operating system, THEN THE UX_Engine SHALL disable all transition animations defined in criteria 1–6 and apply state changes instantaneously
8. WHILE a button or interactive element is in a disabled state, THE UX_Engine SHALL suppress all hover, press, and focus microinteractions defined in criteria 1–6

### Requirement 4: Feedback Visual de Ações

**User Story:** Como usuário, quero receber feedback visual imediato após cada ação, para que eu saiba que o sistema processou minha interação.

#### Acceptance Criteria

1. WHEN the user submits a form successfully, THE UX_Engine SHALL display a success toast with slide-in animation and a checkmark animation (scale 0→1 with 20% overshoot) over 400ms, and auto-dismiss the toast after 4 seconds
2. IF a form submission fails, THEN THE UX_Engine SHALL display an error toast that persists until manually dismissed and apply a horizontal shake animation (3px amplitude, 300ms duration) to the form container
3. WHEN the user performs a save action, THE UX_Engine SHALL show an inline "Salvo" indicator with a 200ms fade-in near the save button that auto-dismisses after 2 seconds
4. WHEN the user adds an item to favorites, THE UX_Engine SHALL animate the heart icon with a scale pulse (1→1.3→1) and color fill transition over 300ms
5. WHEN a file upload begins, THE UX_Engine SHALL display a progress bar with linear width animation (updating at least every 500ms) and percentage text, replacing any indeterminate spinners
6. WHEN a file upload completes, THE UX_Engine SHALL animate the progress bar to 100% and transition to a success checkmark icon over 200ms
7. IF a network request fails, THEN THE UX_Engine SHALL display an error state with a retry button and a horizontal shake animation (3px amplitude, 300ms duration) on the error message
8. WHEN any toast or feedback indicator is displayed, THE UX_Engine SHALL announce the feedback message to assistive technologies via an ARIA live region with politeness level "polite" for success and "assertive" for errors
9. IF multiple feedback events occur within 500ms of each other, THEN THE UX_Engine SHALL stack toasts vertically with 8px spacing, displaying a maximum of 3 simultaneous toasts and queuing additional ones

### Requirement 5: Empty States Informativos

**User Story:** Como usuário, quero ver mensagens úteis e ações sugeridas quando uma seção está vazia, para que eu saiba o que fazer e não me sinta perdido.

#### Acceptance Criteria

1. WHEN a list or grid section completes data fetching and returns zero items, THE UX_Engine SHALL display an Empty_State with: a section-specific SVG illustration (maximum 120x120px), a title stating what content is missing (maximum 60 characters), a subtitle providing guidance on how to populate the section (maximum 120 characters), and a primary call-to-action button that navigates to the relevant action for that section
2. THE UX_Engine SHALL provide Empty_State variants for: favoritos vazios (CTA: navegar para descobrir perfis), sem solicitações (CTA: explorar perfis disponíveis), sem mídias (CTA: adicionar primeira mídia), sem avaliações (CTA: informativo sem ação destrutiva), sem resultados de busca (CTA: limpar filtros), sem transações financeiras (CTA: ver planos disponíveis), e sem mensagens de suporte (CTA: abrir novo ticket)
3. WHEN search results return zero items, THE UX_Engine SHALL display the Empty_State with up to 3 actionable text suggestions rendered as clickable links (e.g., broadening filters, removing keywords, or exploring other cities)
4. WHEN the Empty_State component is rendered, THE UX_Engine SHALL animate it in with the standard fade-in animation (opacity 0→1 + translateY 6px→0, 300ms duration)
5. THE Empty_State illustration SHALL use the muted foreground color at 20% opacity to maintain consistency with the macOS_Aesthetic
6. IF the data fetch fails with an error, THEN THE UX_Engine SHALL NOT display the Empty_State and SHALL instead display the error state with retry option as defined in the Feedback_Visual patterns

### Requirement 6: Navegação e Discoverability

**User Story:** Como usuário, quero que a navegação seja intuitiva e que eu consiga encontrar funcionalidades facilmente, para que eu não precise de instrução para usar a plataforma.

#### Acceptance Criteria

1. WHEN the user is on a page within the provider panel, THE UX_Engine SHALL highlight the active navigation item with a filled background (6% foreground opacity) and bold text weight
2. IF the current page depth is greater than 2 levels (e.g., painel > financeiro > detalhes), THEN THE UX_Engine SHALL display breadcrumb navigation with clickable path segments showing up to 5 hierarchy levels, truncating intermediate segments with an ellipsis when exceeded
3. WHEN the user first accesses a feature flagged as new (released within the last 30 days), THE UX_Engine SHALL display a tooltip or highlight pulse on the new element for 5 seconds, shown only once per user per feature, dismissible by tap or click
4. WHILE the viewport width is ≥1024px, THE UX_Engine SHALL render all page-level action buttons (create, submit, filter) within the initially visible area without requiring vertical scrolling
5. WHILE the viewport width is <768px, THE UX_Engine SHALL display a fixed bottom navigation bar with 4 section icons and labels, highlighting the active section with a state indicator that transitions within 200ms
6. IF the user is on a detail page (depth > 2 levels), THEN THE UX_Engine SHALL display a back navigation arrow icon in the top-left with the parent section name as label, navigating to the immediate parent page on activation

### Requirement 7: Onboarding Flow Premium

**User Story:** Como novo provider, quero que o fluxo de cadastro seja guiado, claro e motivador, para que eu complete todas as etapas sem frustração.

#### Acceptance Criteria

1. WHILE the user is in the Onboarding_Flow, THE UX_Engine SHALL display a progress indicator showing the current step number (1–4), total steps (4), and completion percentage as an integer (0%, 25%, 50%, 75%, 100%)
2. WHEN the user completes a step in the Onboarding_Flow by successfully submitting the step form, THE UX_Engine SHALL animate the progress bar advancement with a 400ms ease transition and display a success micro-animation lasting no more than 600ms
3. WHEN the user navigates between onboarding steps, THE UX_Engine SHALL apply a horizontal slide transition (left-to-right for forward, right-to-left for backward) with 300ms duration
4. WHILE the user is in the Onboarding_Flow, THE UX_Engine SHALL display contextual help text (max 120 characters) and input examples within each form field as placeholder or helper text, visible without requiring additional clicks
5. IF the user attempts to leave the Onboarding_Flow with unsaved field modifications, THEN THE UX_Engine SHALL display a confirmation modal with a warning message about potential data loss, a confirm button to leave, and a cancel button to remain on the current step
6. WHEN all onboarding steps are complete and the profile is published, THE UX_Engine SHALL display a celebration animation (confetti or checkmark burst) lasting no more than 1500ms, followed by a next-steps summary listing actionable items (view public profile, upload more photos, configure availability)
7. WHILE the user is in the Onboarding_Flow, THE UX_Engine SHALL allow navigation to any previously visited step via the sidebar step indicators without losing data already saved in other steps

### Requirement 8: Loading States para Ações Assíncronas

**User Story:** Como usuário, quero saber que uma ação está sendo processada, para que eu não clique repetidamente ou pense que o sistema travou.

#### Acceptance Criteria

1. WHEN the user triggers an asynchronous action (save, delete, submit, upload), THE UX_Engine SHALL disable the trigger button and display an inline loading indicator within 100ms of the action being triggered
2. THE UX_Engine SHALL use contextual loading indicators: spinner inside buttons for form submissions, progress bar for uploads, skeleton shimmer for content refresh
3. WHILE an asynchronous action is in progress, THE UX_Engine SHALL prevent duplicate submissions by disabling the trigger element and all form inputs within the same form or action group
4. WHEN an asynchronous action takes longer than 3 seconds, THE UX_Engine SHALL display a descriptive status text adjacent to the loading indicator indicating the type of operation in progress
5. IF an asynchronous action times out after 15 seconds, THEN THE UX_Engine SHALL cancel the pending request, display a timeout error message with a "Tentar novamente" button that re-triggers the same action and a "Cancelar" button that dismisses the message and restores the form to its pre-submission state
6. IF an asynchronous action fails due to a non-timeout error (network failure, server error), THEN THE UX_Engine SHALL display an error message indicating the failure reason, re-enable all previously disabled elements, and preserve any user-entered data in the form
7. WHEN an asynchronous action completes successfully, THE UX_Engine SHALL remove the loading indicator, re-enable all previously disabled elements, and display a success confirmation within 200ms of receiving the response

### Requirement 9: Hierarquia Visual e Clareza

**User Story:** Como usuário, quero que as informações sejam organizadas por importância visual, para que eu encontre rapidamente o que preciso sem sobrecarga cognitiva.

#### Acceptance Criteria

1. THE UX_Engine SHALL limit visible information density to a maximum of 3 levels of hierarchy per section (title, subtitle, body), where a section is defined as a visually bounded content area separated by 32px spacing or a distinct card/panel container
2. THE UX_Engine SHALL use progressive disclosure for secondary information (details, advanced settings, and historical data): collapsed by default with a visible expand trigger (chevron icon or "Ver mais" text link) that reveals content inline without page navigation
3. WHEN a page contains more than 5 action buttons, THE UX_Engine SHALL group actions marked as secondary into a "Mais opções" dropdown menu, keeping only the 2 actions marked as primary visible at the top level, where primary actions are those that fulfill the page's main purpose (e.g., "Salvar", "Enviar")
4. THE UX_Engine SHALL apply consistent spacing rhythm: 8px between related items within a group, 16px between groups of related items, and 32px between distinct sections
5. THE UX_Engine SHALL restrict emphasis colors to a maximum of one color category per distinct information type: coral exclusively for primary CTAs, blue exclusively for navigational links, green exclusively for success/confirmation states, and gray at 60% opacity or lower for secondary text
6. WHEN displaying numerical data (stats, finances), THE UX_Engine SHALL render primary values at font size 2xl (1.5rem) to 3xl (1.875rem) with semibold (600) weight, and render associated labels at font size sm (0.875rem) with normal (400) weight and 60% opacity relative to the primary text color
7. IF a user activates a progressive disclosure expand trigger, THEN THE UX_Engine SHALL reveal the collapsed content within 300ms and update the trigger icon to indicate the expanded state (e.g., chevron rotated 180°)

### Requirement 10: UX Mobile Otimizada

**User Story:** Como usuário mobile, quero que a interface seja otimizada para toque e telas pequenas, para que a experiência seja tão boa quanto no desktop.

#### Acceptance Criteria

1. WHILE the viewport width is 768px or less, THE UX_Engine SHALL ensure all touch targets have a minimum size of 44x44px with at least 8px spacing between adjacent targets
2. WHEN a modal is displayed on a viewport of 768px or less, THE UX_Engine SHALL render it as a bottom sheet with a visible drag handle, supporting drag-to-dismiss when the user drags downward beyond 40% of the sheet height, and cancelling the dismiss if the user releases before that threshold
3. THE UX_Engine SHALL support pull-to-refresh gesture on list pages (discover, favorites, requests) requiring a minimum pull distance of 60px to trigger, displaying a loading indicator using the application's primary color that remains visible until data refresh completes
4. WHEN the user scrolls down more than 50px on a viewport of 768px or less, THE UX_Engine SHALL hide the top header with a 200ms slide-up animation using ease-out timing, and reveal it again when the user scrolls up more than 30px
5. THE UX_Engine SHALL optimize form inputs for mobile by applying appropriate HTML input types (tel, email, number) to matching fields, auto-focusing the first editable field on page load, and scrolling the focused field into view with at least 16px clearance above the virtual keyboard
6. WHEN displaying a gallery on a viewport of 768px or less, THE UX_Engine SHALL support horizontal swipe navigation between images with momentum-based scrolling and center-aligned snap points, displaying a position indicator (e.g., dots or "2/5" counter) showing current image and total count
7. IF the user swipes on the first image in a gallery toward the previous direction or on the last image toward the next direction, THEN THE UX_Engine SHALL display a rubber-band resistance effect and remain on the current image

### Requirement 11: UX Desktop Refinada

**User Story:** Como usuário desktop, quero aproveitar o espaço de tela com layouts otimizados e interações precisas, para que a experiência seja eficiente e premium.

#### Acceptance Criteria

1. WHILE the viewport width is 1024px or greater, THE UX_Engine SHALL provide hover states for all interactive elements (cards, buttons, links, table rows, and navigation items) by applying a visible style change (opacity shift, background color change, or elevation change) within a transition duration of 150ms
2. WHEN the user hovers over a profile card in the discover grid, THE UX_Engine SHALL reveal additional quick-action buttons (favorite, view profile) with a fade-in overlay completing within 200ms
3. THE UX_Engine SHALL support keyboard shortcuts for common actions in the provider panel: Ctrl+S for save, Escape for close modal, arrow keys for navigation between items
4. IF a keyboard shortcut conflicts with a native browser shortcut, THEN THE UX_Engine SHALL call preventDefault on the event and execute the application-defined action
5. WHEN displaying data tables on desktop (viewport ≥1024px), THE UX_Engine SHALL provide sortable column headers with directional indicators (ascending/descending arrow) and row reordering animation completing within 300ms
6. WHILE the viewport width is 1024px or greater, THE UX_Engine SHALL use multi-column layouts (sidebar + content, or 2-3 column grids) ensuring a minimum content column width of 320px
7. WHEN the user resizes the browser window across layout breakpoints, THE UX_Engine SHALL adapt the layout with CSS transitions of no more than 300ms and maintain a Cumulative Layout Shift (CLS) score of 0.1 or less

### Requirement 12: Animações de Entrada e Saída

**User Story:** Como usuário, quero que elementos apareçam e desapareçam com animações suaves, para que a interface pareça polida e profissional.

#### Acceptance Criteria

1. WHEN a list of items loads, THE UX_Engine SHALL stagger the entry animation of each item with a 50ms delay between items up to a maximum of 20 items, using fade-in + translateY(8px) with 250ms duration and ease-out easing; items beyond the 20th SHALL appear immediately without stagger delay
2. WHEN an item is removed from a list, THE UX_Engine SHALL animate the removal with fade-out + scale(0.95) over 200ms, then collapse the space with a 200ms height animation using ease-out easing
3. WHEN a dropdown or popover opens, THE UX_Engine SHALL animate with scale(0.95→1) + opacity(0→1) from the trigger element's position with 150ms duration and ease-out easing
4. WHEN a dropdown or popover closes, THE UX_Engine SHALL animate with scale(1→0.95) + opacity(1→0) over 100ms with ease-in easing
5. WHEN a notification badge count changes, THE UX_Engine SHALL apply a brief scale pulse animation (1→1.2→1) over 200ms to draw attention
6. IF the user's operating system has `prefers-reduced-motion: reduce` enabled, THEN THE UX_Engine SHALL disable all animations defined in criteria 1 through 5 and apply property changes instantly with 0ms duration
7. IF an animation from criteria 1 through 5 is interrupted by a new trigger before completion, THEN THE UX_Engine SHALL cancel the in-progress animation and immediately begin the new animation from the element's current visual state

### Requirement 13: Coerência Visual Entre Páginas

**User Story:** Como usuário, quero que todas as páginas tenham a mesma linguagem visual e padrões de interação, para que a experiência seja previsível e confiável.

#### Acceptance Criteria

1. THE UX_Engine SHALL enforce consistent page layout patterns: page title (text-2xl semibold) + optional subtitle (text-muted) + content area with page-padding of 16px on mobile (< sm breakpoint), 24px on tablet (sm–lg), and 32px on desktop (lg+)
2. THE UX_Engine SHALL enforce consistent action button placement: a maximum of 2 primary actions in the top-right of page headers on desktop, and as a fixed bottom bar (minimum height 64px, page-padding horizontal) on mobile viewports
3. THE UX_Engine SHALL enforce consistent card patterns: border-radius from the Token_Scale (radius-xl/16px), shadow-sm at rest transitioning to shadow-md on hover, and card-padding (20px) across all card instances in the application
4. THE UX_Engine SHALL enforce consistent form patterns: labels in text-sm font-medium above inputs, input height of 40px, form-gap of 6px between label and input, 16px between field groups, error messages in text-sm red below the field, and submit button right-aligned on desktop or full-width on mobile
5. THE UX_Engine SHALL enforce consistent empty/loading/error state patterns across all pages using shared components from the Component_Library
6. WHEN a page uses a data table, THE UX_Engine SHALL apply consistent table styling from the Design_System: header with muted background, row hover at 4% foreground opacity, cell padding of 12px horizontal and 10px vertical, and 1px border-line between rows
7. THE UX_Engine SHALL enforce consistent icon sizing within each context: 16px for inline text icons, 20px for button icons, and 24px for navigation icons, using a single icon style (outline or solid) per icon set throughout the application

### Requirement 14: Velocidade Percebida e Otimismo

**User Story:** Como usuário, quero que a interface responda instantaneamente às minhas ações, para que eu sinta que o sistema é rápido mesmo durante operações de rede.

#### Acceptance Criteria

1. WHEN the user performs a toggle action (favorite, online status, switch), THE UX_Engine SHALL apply the optimistic UI update within 100ms of the user action, and IF the server request fails or does not respond within 5000ms, THEN THE UX_Engine SHALL revert the UI to the previous state and display a non-blocking notification indicating the action failed
2. WHEN the user submits a form, THE UX_Engine SHALL transition the submit button to a disabled state with a visible spinner indicator within 50ms of click, before the network request begins
3. WHEN the user hovers over a navigation link for at least 150ms (desktop) or WHEN a navigation link enters 50% of the viewport (mobile), THE UX_Engine SHALL prefetch the linked page data so that subsequent navigation renders content within 200ms
4. WHEN displaying images, THE UX_Engine SHALL show a blurred placeholder of maximum 20px intrinsic width scaled to target dimensions while the full-resolution image loads, and SHALL transition to the full image within 300ms once loaded
5. THE UX_Engine SHALL render all content within the initial viewport height first, and SHALL defer loading of content below the initial viewport until it enters 0% intersection with the viewport via intersection observer
6. WHEN the user navigates to a previously visited page within the same browser session, THE UX_Engine SHALL display cached content within 100ms while revalidating with the server in the background, and IF the cached content is older than 30 minutes, THEN THE UX_Engine SHALL show a loading indicator instead of stale cached content
