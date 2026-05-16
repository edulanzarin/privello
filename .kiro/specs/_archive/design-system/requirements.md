# Requirements Document

## Introduction

Design system consistente para a plataforma Privello — uma aplicação Next.js 16 com estética premium inspirada em macOS. O sistema padroniza tokens de design (cores, tipografia, espaçamento, sombras, border-radius), componentes reutilizáveis (buttons, modals, cards, inputs, dropdowns, badges) e padrões de interação (animações, transições, estados). O objetivo é eliminar duplicações, garantir consistência visual, melhorar acessibilidade e fornecer documentação clara para o time de desenvolvimento.

## Glossary

- **Design_System**: Conjunto de tokens, componentes e padrões documentados que garantem consistência visual na plataforma Privello
- **Design_Token**: Variável CSS centralizada que define valores primitivos de cor, tipografia, espaçamento, sombra e border-radius
- **Component_Library**: Coleção de componentes React reutilizáveis em `src/components/ui/` que implementam os tokens do Design_System
- **Token_Scale**: Escala hierárquica de valores (ex: spacing-xs, spacing-sm, spacing-md) que define progressão consistente
- **macOS_Aesthetic**: Estilo visual inspirado no macOS: cantos arredondados, sombras sutis, glassmorphism, font-weight semibold, transições suaves
- **WCAG_AA**: Nível de conformidade de acessibilidade que exige contraste mínimo de 4.5:1 para texto normal e 3:1 para texto grande
- **Tailwind_Theme**: Configuração de tema inline no `globals.css` usando `@theme` que expõe tokens como classes utilitárias do Tailwind v4

## Requirements

### Requirement 1: Design Tokens — Cores

**User Story:** Como desenvolvedor, quero um sistema de cores centralizado com tokens semânticos, para que todas as páginas usem cores consistentes sem valores hardcoded.

#### Acceptance Criteria

1. THE Design_System SHALL define all color tokens as CSS custom properties in `globals.css` and expose them via Tailwind_Theme inline configuration
2. THE Design_System SHALL provide semantic color tokens for: primary (coral), foreground, background, muted, line, success, warning, danger, and blue
3. WHEN a component references a brand color, THE Component_Library SHALL use the Tailwind semantic class (e.g., `bg-coral`, `text-success`) instead of hardcoded hex values
4. THE Design_System SHALL define opacity variants for each semantic color at 4%, 6%, 10%, 12%, and 20% levels
5. IF a hardcoded hex color value is used in a component, THEN THE Design_System SHALL flag the usage as non-compliant during code review

### Requirement 2: Design Tokens — Tipografia

**User Story:** Como desenvolvedor, quero uma escala tipográfica padronizada, para que textos tenham hierarquia visual clara e consistente em toda a aplicação.

#### Acceptance Criteria

1. THE Design_System SHALL define a typography scale with the following sizes: xs (11px), sm (12px), base (13px), md (14px), lg (15px), xl (16px), 2xl (18px), 3xl (22px), 4xl (28px)
2. THE Design_System SHALL use `font-semibold` (weight 600) as the primary emphasis weight, following the macOS_Aesthetic convention
3. WHEN a heading is rendered, THE Component_Library SHALL apply `tracking-tight` letter-spacing
4. THE Design_System SHALL define text color pairings: foreground for primary text, muted for secondary text, and specific semantic colors for status indicators
5. IF `font-bold` (weight 700) is used in a component, THEN THE Design_System SHALL replace the usage with `font-semibold` unless the context requires display-level emphasis (4xl size or larger)

### Requirement 3: Design Tokens — Espaçamento

**User Story:** Como desenvolvedor, quero uma escala de espaçamento consistente, para que layouts tenham ritmo visual uniforme.

#### Acceptance Criteria

1. THE Design_System SHALL define a spacing scale based on a 4px base unit: 1 (4px), 1.5 (6px), 2 (8px), 3 (12px), 4 (16px), 5 (20px), 6 (24px), 8 (32px), 10 (40px), 12 (48px)
2. THE Design_System SHALL define component-level spacing tokens: card-padding (20px), section-gap (24px), form-gap (6px between label and input), and page-padding (24px mobile, 32px desktop)
3. WHEN a Card component is rendered, THE Component_Library SHALL use the card-padding token for internal spacing

### Requirement 4: Design Tokens — Sombras

**User Story:** Como desenvolvedor, quero uma escala de sombras padronizada, para que a profundidade visual seja consistente e siga a estética macOS.

#### Acceptance Criteria

1. THE Design_System SHALL define a shadow scale with four levels: shadow-xs (inset subtle), shadow-sm (card resting), shadow-md (card hover/elevated), shadow-lg (modal/dropdown)
2. THE Design_System SHALL define shadow-xs as `inset 0 0.5px 2px rgba(0,0,0,0.04)` for input fields
3. THE Design_System SHALL define shadow-sm as `0 0.5px 1px rgba(0,0,0,0.03), 0 4px 16px rgba(0,0,0,0.04)` for cards at rest
4. THE Design_System SHALL define shadow-md as `0 2px 8px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.06)` for elevated elements
5. THE Design_System SHALL define shadow-lg as `0 4px 16px rgba(0,0,0,0.08), 0 16px 48px rgba(0,0,0,0.12)` for modals and overlays
6. WHEN a Card component receives hover interaction, THE Component_Library SHALL transition from shadow-sm to shadow-md using a 200ms ease transition

### Requirement 5: Design Tokens — Border Radius

**User Story:** Como desenvolvedor, quero uma hierarquia de border-radius documentada, para que cantos arredondados sejam aplicados de forma consistente.

#### Acceptance Criteria

1. THE Design_System SHALL define a border-radius scale: radius-sm (6px/rounded-md) for inputs and small buttons, radius-md (8px/rounded-lg) for buttons and form elements, radius-lg (12px/rounded-xl) for smaller cards and toasts, radius-xl (16px/rounded-2xl) for main cards and modals, radius-full (9999px/rounded-full) for avatars, badges, and pills
2. THE Design_System SHALL document which radius level applies to each component category
3. WHEN a new component is created, THE Component_Library SHALL select the border-radius from the defined scale based on the component's visual hierarchy

### Requirement 6: Design Tokens — Animações e Transições

**User Story:** Como desenvolvedor, quero padrões de animação consistentes, para que interações sejam suaves e sigam a estética macOS.

#### Acceptance Criteria

1. THE Design_System SHALL define transition durations: fast (150ms) for micro-interactions, normal (200ms) for state changes, slow (300ms) for enter/exit animations
2. THE Design_System SHALL use `cubic-bezier(0.16, 1, 0.3, 1)` as the default easing curve for enter animations, matching macOS spring behavior
3. THE Design_System SHALL define standard animation patterns: fade-in (opacity + translateY 6px), scale-in (opacity + scale 0.97), slide-in (opacity + translateX)
4. WHEN a button receives active state, THE Component_Library SHALL apply `scale(0.98)` transform with the fast duration
5. WHEN a modal opens, THE Component_Library SHALL animate the backdrop with fade-in and the content with scale-in using the slow duration

### Requirement 7: Componente Button

**User Story:** Como desenvolvedor, quero um componente Button com variantes padronizadas, para que botões tenham aparência e comportamento consistentes.

#### Acceptance Criteria

1. THE Component_Library SHALL provide Button with variants: primary (blue), coral (brand), secondary (white/bordered), ghost (transparent), and danger (red)
2. THE Component_Library SHALL provide Button with sizes: sm (padding 12x5, text 12px), md (padding 16x7, text 13px), lg (padding 24x9, text 14px)
3. WHEN Button is in loading state, THE Component_Library SHALL display a spinner icon and disable pointer events
4. WHEN Button is disabled, THE Component_Library SHALL reduce opacity to 40% and disable pointer events
5. THE Component_Library SHALL render Button with `font-medium` weight and the appropriate border-radius from the Token_Scale
6. THE Button component SHALL support a `ref` prop via React.forwardRef for integration with form libraries

### Requirement 8: Componente Input, Textarea e Select

**User Story:** Como desenvolvedor, quero componentes de formulário padronizados, para que todos os campos de entrada tenham aparência e comportamento consistentes.

#### Acceptance Criteria

1. THE Component_Library SHALL provide Input, Textarea, and Select components with consistent visual styling: border-black/10, shadow-xs inset, rounded-lg, text-md (14px)
2. WHEN a form field receives focus, THE Component_Library SHALL display a blue border and a 3px focus ring with 25% opacity blue
3. WHEN a form field has a validation error, THE Component_Library SHALL display a red border, red focus ring, and an error message below the field in text-sm (12px) red
4. THE Component_Library SHALL support optional `label`, `hint`, and `error` props on all form field components
5. WHEN a form field is disabled, THE Component_Library SHALL apply a subtle background tint and reduce text to muted color
6. THE Component_Library SHALL associate labels with inputs using `htmlFor`/`id` attributes for accessibility

### Requirement 9: Componente Card

**User Story:** Como desenvolvedor, quero um componente Card flexível, para que containers de conteúdo tenham aparência consistente.

#### Acceptance Criteria

1. THE Component_Library SHALL provide Card with variants: default (glass-card), solid (white with border), and dark (sidebar color)
2. THE Component_Library SHALL provide Card with padding options: none, sm (16px), md (20px), lg (24px)
3. THE Component_Library SHALL provide CardHeader, CardTitle, and CardDescription sub-components for structured content
4. THE Card component SHALL use shadow-sm from the Token_Scale at rest and transition to shadow-md on hover when interactive

### Requirement 10: Componente Modal

**User Story:** Como desenvolvedor, quero um componente Modal genérico, para que overlays tenham comportamento consistente sem reimplementação.

#### Acceptance Criteria

1. THE Component_Library SHALL provide a Modal component with backdrop blur, Escape key dismissal, and scroll lock
2. THE Modal component SHALL support position variants: center, bottom (mobile sheet), and fullscreen
3. WHEN the user clicks the backdrop, THE Modal component SHALL close unless the `persistent` prop is set to true
4. THE Modal component SHALL render with `role="dialog"` and `aria-modal="true"` attributes for accessibility
5. WHEN the Modal opens, THE Component_Library SHALL trap focus within the modal content
6. WHEN the Modal closes, THE Component_Library SHALL return focus to the element that triggered the opening

### Requirement 11: Componente Badge

**User Story:** Como desenvolvedor, quero um componente Badge com variantes semânticas, para que indicadores de status sejam consistentes.

#### Acceptance Criteria

1. THE Component_Library SHALL provide Badge with variants: default (neutral), coral (brand/alert), success (green), warning (orange), muted (subtle), and dark (inverted)
2. THE Badge component SHALL render with rounded-full, text-xs (11px), font-semibold, and horizontal padding of 8px
3. WHEN a Badge variant uses a semantic color, THE Component_Library SHALL apply a 10-12% opacity background with full-strength text color

### Requirement 12: Componente Dropdown

**User Story:** Como desenvolvedor, quero um componente Dropdown reutilizável, para que menus contextuais tenham aparência e comportamento consistentes.

#### Acceptance Criteria

1. THE Component_Library SHALL provide a Dropdown component with trigger element, content panel, and item sub-components
2. WHEN the Dropdown opens, THE Component_Library SHALL position the content panel below the trigger with shadow-lg and rounded-xl
3. WHEN the user clicks outside the Dropdown, THE Component_Library SHALL close the content panel
4. WHEN the user presses Escape while the Dropdown is open, THE Component_Library SHALL close the content panel
5. THE Dropdown items SHALL support variants: default, danger (red text), and disabled (muted + no pointer events)
6. THE Dropdown component SHALL support keyboard navigation with arrow keys between items

### Requirement 13: Componente Avatar

**User Story:** Como desenvolvedor, quero um componente Avatar padronizado, para que imagens de perfil tenham tamanhos e fallbacks consistentes.

#### Acceptance Criteria

1. THE Component_Library SHALL provide Avatar with sizes: xs (28px), sm (36px), md (48px), lg (64px), xl (96px)
2. WHEN no image source is provided, THE Avatar component SHALL display initials derived from the fallback name on a neutral background
3. THE Avatar component SHALL support an optional ring indicator with color variants: coral, success, foreground, muted
4. THE Avatar component SHALL render with rounded-full and overflow-hidden for consistent circular clipping

### Requirement 14: Componente Toast

**User Story:** Como desenvolvedor, quero um sistema de notificações toast, para que feedback ao usuário seja consistente e não intrusivo.

#### Acceptance Criteria

1. THE Component_Library SHALL provide a Toast system with success and error variants
2. WHEN a toast is triggered, THE Component_Library SHALL display the notification in the bottom-right corner with slide-in animation
3. THE Toast component SHALL auto-dismiss after 3500ms
4. THE Toast component SHALL provide a dismiss button for manual closure
5. THE Toast component SHALL render with shadow-lg, rounded-xl, and a colored left border matching the variant

### Requirement 15: Acessibilidade

**User Story:** Como desenvolvedor, quero que todos os componentes do design system sejam acessíveis, para que a plataforma atenda padrões WCAG_AA.

#### Acceptance Criteria

1. THE Component_Library SHALL ensure all interactive elements have visible focus indicators using the blue focus ring pattern (3px, 25% opacity)
2. THE Component_Library SHALL ensure all icon-only buttons include an `aria-label` attribute describing the action
3. THE Component_Library SHALL ensure color contrast ratios meet WCAG_AA minimum of 4.5:1 for normal text and 3:1 for large text
4. THE Component_Library SHALL ensure all form inputs are associated with labels via `id`/`htmlFor` or `aria-label`
5. WHEN a component has an error state, THE Component_Library SHALL communicate the error via `aria-invalid="true"` and `aria-describedby` referencing the error message
6. THE Component_Library SHALL ensure keyboard navigation works for all interactive components (buttons, modals, dropdowns, switches)

### Requirement 16: Responsividade

**User Story:** Como desenvolvedor, quero que o design system defina breakpoints e padrões responsivos, para que componentes se adaptem a diferentes tamanhos de tela.

#### Acceptance Criteria

1. THE Design_System SHALL define responsive breakpoints aligned with Tailwind defaults: sm (640px), md (768px), lg (1024px), xl (1280px)
2. THE Design_System SHALL define page-level padding: 16px on mobile (< sm), 24px on tablet (sm-lg), 32px on desktop (lg+)
3. WHEN a Modal is rendered on mobile viewport (< sm), THE Component_Library SHALL use the bottom position variant as a sheet
4. WHEN a Card grid is rendered, THE Component_Library SHALL adapt from single column on mobile to multi-column on desktop using responsive grid classes

### Requirement 17: Documentação do Design System

**User Story:** Como desenvolvedor, quero documentação clara dos componentes e tokens, para que o time use o design system corretamente.

#### Acceptance Criteria

1. THE Design_System SHALL provide a documentation file listing all design tokens with their values and usage guidelines
2. THE Design_System SHALL document each component with: props interface, variants, sizes, usage examples, and accessibility notes
3. THE Design_System SHALL provide a migration guide explaining how to replace hardcoded values with design tokens
4. THE Design_System SHALL document the macOS_Aesthetic principles: font-semibold over bold, subtle shadows, smooth transitions, rounded corners hierarchy

### Requirement 18: Eliminação de Duplicações

**User Story:** Como desenvolvedor, quero que implementações duplicadas sejam consolidadas em componentes únicos, para que manutenção seja simplificada.

#### Acceptance Criteria

1. THE Component_Library SHALL provide a single Switch component replacing all toggle switch implementations in the codebase
2. THE Component_Library SHALL provide a single Modal component replacing all overlay/lightbox implementations
3. THE Component_Library SHALL provide a single Dropdown component replacing inline menu implementations
4. WHEN a duplicated pattern is identified, THE Design_System SHALL document the canonical component to use as replacement
5. THE Design_System SHALL provide a ToggleChip component for filter/selection chips distinct from the Switch toggle
