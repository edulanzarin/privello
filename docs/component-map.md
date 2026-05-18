# Privello — Mapa de Componentes & Migração v2 (Tahoe Sensual)

**Última atualização**: 2026-05-17 (reels migrado: feed + city-filter + 2 rotas)
**Steering**: [`.kiro/steering/design-system.md`](../.kiro/steering/design-system.md)
**Identidade**: macOS Tahoe + sensual — Inter only, rose `#e85a7a` accent, peach + plum + cream secundárias, ambient gradient pastel, glass calibrado v2.3.

Este documento é o **inventário completo** de todos os componentes e páginas
do site, com status de migração para o design v2. Toda alteração de visual
passa por aqui pra garantir consistência e reuso entre as 80+ páginas.

> **Como usar como agente futuro:**
>
> 1. Antes de criar componente novo, procure aqui por algo equivalente.
> 2. Antes de migrar página, marque o status na §3 e adicione novos
>    componentes compostos identificados na §2.2.
> 3. Quando migrar uma página, atualize a coluna **Status v2** + **Commit**
>    na §3.

---

## 1. Convenções de status

| Símbolo | Significado |
|---------|-------------|
| 🟢 | Migrado para v2 (Tahoe Sensual) — alinhado com steering atual |
| 🟡 | Parcialmente migrado — usa tokens v2 mas precisa polish |
| 🔴 | Ainda v1 (Sonoma cream + coral, ou pré-redesign) — não tocado |
| ⚪ | Headless / não-visual (utilitário, server-side, sem UI) |
| 🆕 | Componente criado durante a migração v2 (não existia antes) |

---

## 2. Inventário de componentes

### 2.1 Primitivos (`src/components/ui/**`) — fundação do design system

| Componente | Arquivo | Status v2 | Variantes / Sizes | Uso pelo produto |
|------------|---------|-----------|--------------------|------------------|
| Avatar | `ui/avatar.tsx` | 🟢 | `sm`/`md`/`lg`/`xl` | Headers, listas, comments |
| Badge | `ui/badge.tsx` | 🟢 | `default`, `rose`, `success`, `warning`, `muted`, `info`, `danger`, `premium`, `boost`, `verified` | Status pills (online, verificada, plano) |
| Button | `ui/button.tsx` | 🟢 | `primary` (rose), `secondary` (glass outline), `ghost`, `danger`, `whatsapp`, `outline` × `sm`/`md`/`lg`. Polimórfico — passa `href` pra render como `<Link>`. | Toda CTA |
| Card | `ui/card.tsx` | 🟢 | `glass`, `solid`, `success-subtle`, `warning-subtle`, `danger-subtle` × padding `none`/`sm`/`md`/`lg` | Áreas de conteúdo |
| Dropdown | `ui/dropdown.tsx` | 🟢 | menus contextuais | City switcher, sort, ações inline |
| EmptyState | `ui/empty-state.tsx` | 🟢 | `default`, ícone customizável | Listas vazias |
| ErrorState | `ui/error-state.tsx` | 🟢 | `error`, `not-found` | Páginas error.tsx |
| Input | `ui/input.tsx` | 🟢 | `default`, com prefix/suffix | Forms |
| KPICard | `ui/kpi-card.tsx` | 🟢 | número grande + label uppercase | Dashboards |
| LoadingSkeleton | `ui/loading-skeleton.tsx` | 🟢 | `card`, `list`, `text`, `avatar` | Suspense fallback |
| Modal | `ui/modal.tsx` | 🟢 | `center`, `bottom`, `fullscreen` | Story viewer, lightbox, age gate, BottomSheet |
| 🆕 SearchBar | `ui/search-bar.tsx` | 🟢 | `<SearchBar>` shell + `<SearchField>` slots + `<SearchSubmit>` CTA | HeroSearchForm + HandleSearchForm — paridade visual entre Home + Descobrir |
| Select | `ui/select.tsx` | 🟢 | dropdown nativo estilizado | Forms |
| StatCard | `ui/stat-card.tsx` | 🟢 | variação compacta de KPICard | Painel sidebar |
| 🆕 StoryCircle | `ui/story-circle.tsx` | 🟢 | `sm` (48), `md` (62), `lg` (96), `xl` (160/192) | StoryBar, futuras listagens de stories |
| 🆕 SealsList | `ui/seals-list.tsx` | 🟢 | lista hairline `divide-line` | /p/[slug] (selos verificada/membro/views), reusable em qualquer entidade |
| 🆕 PriceTag | `ui/price-tag.tsx` | 🟢 | `hero`/`card`/`inline`/`compact` × `rose`/`ink`/`white` | /p/[slug] hero, ProfileCard, ProfileListRow, futuras listagens |
| 🆕 RatingStars | `ui/rating-stars.tsx` | 🟢 | `xs`/`sm`/`md`, value 0–5 | Reviews em /p/[slug] e futuro /avaliar/[slug] e admin |
| 🆕 ListingHeader | `ui/listing-header.tsx` | 🟢 | eyebrow `rose`/`peach`/`plum`/`info`/`muted` × título Inter Bold | /em-alta, /em-destaque, /novidades. Reusable em qualquer listing cross-city |
| Switch | `ui/switch.tsx` | 🟢 | macOS toggle (bolinha) | Filtros, configurações |
| Table | `ui/table.tsx` | 🟢 | `Table`/`THead`/`TR`/`TH`/`TD` | Admin, financeiro |
| Tabs | `ui/tabs.tsx` | 🟢 | `pills`, `underline` | Navegação interna |
| Textarea | `ui/textarea.tsx` | 🟢 | com hint | Forms longos |
| Toast | `ui/toast.tsx` | 🟢 | `success`, `error`, `info` | Feedback efêmero |
| ToggleChip | `ui/toggle-chip.tsx` | 🟢 | `on`/`off` | Quick filters |

> **Regra**: nunca quebra API pública dos primitivos durante migração.
> Variantes podem ser estendidas, removidas só com PR explícito.

### 2.2 Compostos por domínio (`src/components/{discover,profile,...}`)

#### `discover/` — fluxo de busca

| Componente | Status v2 | API resumida | Notas |
|------------|-----------|--------------|-------|
| `discover-toolbar.tsx` | 🟢 | `<DiscoverToolbar city sort viewMode />` | Sticky header só com city + filtros (decisão D, v2.4 final) |
| `filter-drawer.tsx` | 🟢 | `<FilterDrawer />` flutuante mobile+desktop | Contém `Section` + `SegmentedButton` + `SwitchRow` (steering §14) |
| `city-switcher.tsx` | 🟢 | dropdown de cidades | Usa primitivo `Dropdown` |
| `filter-chip.tsx` | 🟢 | chip on/off horizontal | Não usado mais no header, ainda exportado |
| `discover-view-toggle.tsx` | 🟢 | grid ⇄ lista | Usa `SegmentedButton` |
| `city-session-saver.tsx` | ⚪ | efeito de sessionStorage | Headless |

#### `profile/` — listagem e visualização

| Componente | Status v2 | API resumida | Notas |
|------------|-----------|--------------|-------|
| `profile-card.tsx` | 🟢 | `<ProfileCard profile storyRing />` | v2.4 split layout, badges em ambos os cantos (v2.5) |
| `profile-list-row.tsx` | 🟢 | `<ProfileListRow profile />` | Variação compacta horizontal |
| `profile-story-cover.tsx` | 🟢 | `<ProfileStoryCover storyGroup coverUrl displayName isClient />` | Capa XL + indicador, delega viewer |
| `media-gallery.tsx` | 🟢 | grid de mídia + lightbox | Tabs Fotos/Reels, PostModal interno reusa `<MediaLightbox>` |
| `media-lightbox.tsx` | 🟢 | overlay de mídia | Wrapper de `<Modal>` com `position` responsivo (fullscreen mobile / center desktop) |
| ~~`photo-carousel.tsx`~~ | ❌ | _removed_ | Componente legado sem consumidor — deletado em 2026-05-17 |
| `audio-player.tsx` | 🟢 | player completo | Card branco border-line, rose accent, play button bg-rose |
| `audio-play-button.tsx` | 🟢 | botão inline ▶ | Pill rose-soft / bg-rose, usado em ProfileCard |
| `favorite-button.tsx` | 🟢 | toggle de favoritar | bg-rose quando on, white+border-line quando off |
| `share-button.tsx` | 🟢 | compartilhar/copiar link | Padrão secondary CTA white+line |
| `whatsapp-button.tsx` | 🟢 | CTA WhatsApp | bg-whatsapp, alinhado com Button variant whatsapp |
| `view-tracker.tsx` | ⚪ | efeito de tracking | Headless |

#### `stories/` — formato story

| Componente | Status v2 | API resumida | Notas |
|------------|-----------|--------------|-------|
| `story-bar.tsx` | 🟢 | `<StoryBar groups isClient />` | Wrapper de StoryCircle + StoryViewer (~80 linhas) |
| 🆕 `story-viewer.tsx` | 🟢 | `<StoryViewer groups initialGroupIdx onClose onChange isClient />` | Modal fullscreen único, multi/single-group automático |

#### `layout/` — chrome do site

| Componente | Status v2 | API resumida | Notas |
|------------|-----------|--------------|-------|
| `site-header.tsx` | 🟢 | `<SiteHeader />` | Mobile = só logo, desktop = logo + Entrar/Criar |
| `site-footer.tsx` | 🟡 | `<SiteFooter />` | Funcional, visual ok mas pode polish |
| `bottom-nav.tsx` | 🟢 | `<BottomNav />` | Pill flutuante glass em todos breakpoints, auto-hide quando `body[data-modal-open]` |
| `bottom-nav-wrapper.tsx` | 🟢 | server wrapper | Headless |
| 🆕 `auth-shell.tsx` | 🟢 | `<AuthShell footer caption width>` | Shell centralizado para /entrar, /cadastro, /recuperar-senha, /cadastro/sucesso |
| 🆕 `legal-shell.tsx` | 🟢 | `<LegalShell title version validFrom>` + `<LegalSection n title>` | Shell editorial Inter Bold tracking apertado para `/termos-de-uso` e `/politica-de-privacidade`. Container `max-w-3xl` (reading) sobre tokens ink/ink-dim. Sem `font-serif`. |
| `dark-sidebar-shell.tsx` | 🟢 | Sidebar ink (preto ameixa) compartilhada por painel + admin. Tokens v2 (rose focus, ink offset). |
| `provider-banner.tsx` | 🔴 | banner topo p/ providers | Não migrado |

#### `home/` — landing

| Componente | Status v2 | Notas |
|------------|-----------|-------|
| `profile-section.tsx` | 🟢 | Renderiza grid + "ver mais" | Consumido em "Em destaque" e "Em alta" |

#### `marketing/` — search público

| Componente | Status v2 | Notas |
|------------|-----------|-------|
| `hero-search-form.tsx` | 🟢 | Hero search bar v2 — usa `<SearchBar>` |
| `handle-search-form.tsx` | 🟢 | Busca por nome/@perfil — usa `<SearchBar>` |
| `city-autocomplete.tsx` | 🟢 | Autocomplete de cidades |

#### `painel/` — dashboard provider

| Componente | Status v2 | Notas |
|------------|-----------|-------|
| `painel-sidebar.tsx` | 🟢 | Sidebar ink (preto ameixa) com nav + status do plano + avatar/logout |
| `media-manager.tsx` | 🟡 | Editor de mídia (tokens migrados, estrutura mantida) |
| `reels-manager.tsx` | 🟡 | Editor de reels (tokens migrados, estrutura mantida) |
| `online-toggle.tsx` | 🟢 | Switch de online (Switch primitive) |
| `provider-heartbeat.tsx` | ⚪ | Headless |
| `logout-button.tsx` | 🟢 | Visual ok |
| `save-form.tsx` | 🟢 | Botão de save sticky |

#### `admin/` — moderação

| Componente | Status v2 | Notas |
|------------|-----------|-------|
| `admin-shell.tsx` | 🟢 | Wrapper de DarkSidebarShell para admin (props: displayName, role, handle, avatarUrl) |
| `admin-charts.tsx` | 🟡 | Recharts com cores v1 (precisa rever chart-tokens) |
| `admin-city-filter.tsx` | 🟢 | Filtro de cidade |
| `media-actions.tsx` | 🟢 | Aprovar/rejeitar |
| `quick-actions.tsx` | 🟢 | Atalhos |
| `warning-form.tsx` | 🟢 | Form de warning |

#### `reels/` — vídeos

| Componente | Status v2 | Notas |
|------------|-----------|-------|
| `reels-feed.tsx` | 🟢 | Feed vertical TikTok-style com IntersectionObserver, autoplay, comments slide-up |
| `city-filter.tsx` | 🟢 | Filtro de cidade dropdown sobre o feed (rose active state) |
| `city-restorer.tsx` | ⚪ | Headless |

#### Outros

| Componente | Status v2 | Notas |
|------------|-----------|-------|
| `age-gate.tsx` | 🔴 | Modal +18 |
| `onboarding/onboarding-sidebar.tsx` | 🟢 | Sidebar do onboarding |
| `solicitar/solicitar-whatsapp-panel.tsx` | 🔴 | Painel de solicitação |
| `support/ticket-chat.tsx` | 🔴 | Chat de suporte |

---

## 3. Inventário de páginas (rotas)

### 3.1 Público (não autenticado)

| Rota | Arquivo | Status v2 | Commit | Notas |
|------|---------|-----------|--------|-------|
| `/` | `app/page.tsx` | 🟢 | `5223afb` | Hero + Em destaque + Em alta + Verificação séria |
| `/descobrir` | `app/descobrir/page.tsx` | 🟢 | _next_ | Hub sem cidade — city picker + busca global @handle (substituiu /buscar em 2026-05-17) |
| `/descobrir/[citySlug]` | `app/descobrir/[citySlug]/page.tsx` | 🟢 | `5223afb` | Toolbar sticky + grid masonry |
| ~~`/buscar`~~ | ~~`app/buscar/`~~ | ❌ | _removed_ | Eliminada em 2026-05-17. 308 redirect para `/descobrir` (preserva `?q=`) |
| `/cidades` | `app/cidades/page.tsx` | 🔴 | — | Listagem de cidades |
| `/p/[slug]` | `app/p/[slug]/page.tsx` | 🟢 | _next_ | Hero split + selos hairline + Quem sou/Características/Valores/Atende/Disponibilidade + Reviews em cards |
| `/em-alta` | `app/em-alta/page.tsx` | 🟢 | _next_ | Listing v2 — ListingHeader + grid 3-col ProfileCard |
| `/em-destaque` | `app/em-destaque/page.tsx` | 🟢 | _next_ | Listing v2 — eyebrow peach |
| `/novidades` | `app/novidades/page.tsx` | 🟢 | _next_ | Reading max-w-3xl, Card glass placeholder |
| `/reels` | `app/reels/page.tsx` | 🟢 | _next_ | Feed global ink; rose accent on city pill + privello dot |
| `/reels/[slug]` | `app/reels/[slug]/page.tsx` | 🟢 | _next_ | Feed por perfil |
| `/avaliar/[slug]` | `app/avaliar/[slug]/page.tsx` | 🔴 | — | Form de avaliação |
| `/solicitar/[slug]` | `app/solicitar/[slug]/page.tsx` | 🔴 | — | Solicitar encontro |
| `/planos` | `app/planos/page.tsx` | 🟢 | _next_ | ListingHeader + 3 plan cards (Basic neutro / Plus ink / Premium rose) + Boost à la carte (Card glass) + FAQ details |
| `/termos-de-uso` | `app/termos-de-uso/page.tsx` | 🟢 | _next_ | Tahoe Sensual via `<LegalShell>` + `<LegalSection>` (Inter Bold, sem `font-serif`) |
| `/politica-de-privacidade` | `app/politica-de-privacidade/page.tsx` | 🟢 | _next_ | Mesmo shell de termos; usa `LegalSubheading` local para subdivisões 2.x |

### 3.2 Auth (entrar / cadastro / recuperar)

| Rota | Arquivo | Status v2 |
|------|---------|-----------|
| `/entrar` | `app/entrar/page.tsx` | 🟢 |
| `/cadastro` | `app/cadastro/page.tsx` | 🟢 |
| `/cadastro/cliente` | `app/cadastro/cliente/page.tsx` | 🟢 |
| `/cadastro/acompanhante` | `app/cadastro/acompanhante/page.tsx` | 🟢 |
| `/cadastro/sucesso` | `app/cadastro/sucesso/page.tsx` | 🟢 |
| `/recuperar-senha` | `app/recuperar-senha/page.tsx` | 🟢 |
| `/recuperar-senha/[token]` | `app/recuperar-senha/[token]/page.tsx` | 🟢 |

### 3.3 Cliente logado (`/conta/**`)

| Rota | Status v2 |
|------|-----------|
| `/conta/perfil` | 🟢 |
| `/conta/onboarding/perfil` | 🟢 |
| `/conta/onboarding/fotos` | 🟢 |
| `/conta/onboarding/valores` | 🟢 |
| `/conta/onboarding/publicar` | 🟢 |
| `/conta/verificacao` | 🟢 |

### 3.4 Provider logado (`/painel/**`)

| Rota | Status v2 |
|------|-----------|
| `/painel` | 🟢 |
| `/painel/perfil` | 🟢 |
| `/painel/midias` | 🟢 |
| `/painel/reels` | 🟢 |
| `/painel/stories` | 🟢 |
| `/painel/valores` | 🟢 |
| `/painel/disponibilidade` | 🟢 |
| `/painel/avaliacoes` | 🟢 |
| `/painel/financeiro` | 🟢 |
| `/painel/plano` | 🟢 |
| `/painel/suporte` | 🟢 |
| `/painel/suporte/[id]` | 🟢 |

### 3.5 Pagamento

| Rota | Status v2 |
|------|-----------|
| `/assinar` | 🔴 |
| `/assinar/sucesso` | 🔴 |

### 3.6 Admin (`/admin/**`)

| Rota | Status v2 |
|------|-----------|
| `/admin/moderacao` | 🟢 |
| `/admin/perfis` | 🟢 |
| `/admin/midias` | 🟢 |
| `/admin/verificacoes/[id]` | 🟢 |
| `/admin/financeiro` | 🟢 |
| `/admin/suporte` | 🟢 |
| `/admin/suporte/[id]` | 🟢 |

### 3.7 Erro / sistema

| Rota | Status v2 |
|------|-----------|
| `/error` (root) | 🟢 |
| `/not-found` | 🟢 |

---

## 4. Decisões arquiteturais relevantes

| Decisão | Onde foi tomada | Resumo |
|---------|------------------|--------|
| Container max-width por arquétipo | Steering §5.1 | Listing `7xl`, reading `4xl`, form `2xl`, dashboard `screen-xl` |
| BottomNav todos breakpoints | Steering §13.1 | Mobile + desktop sempre presente. Pill flutuante glass. |
| BottomNav auto-hide modal | `globals.css` + `useScrollLock` | `body[data-modal-open]` faz fade na pill |
| Glass v2.3 cards = sólido | Steering §3.6 | `#ffffff` puro nos cards. Glass real só em strip + header sticky |
| Inter exclusivo, peso > tamanho | Steering §4.2 | Display em 700 negrito, body em 400/500 |
| Stories: `StoryCircle` + `StoryViewer` | Steering §15 | Não duplique lógica de viewer — reuse |
| Filtros densos: `Section`+`SegmentedButton`+`SwitchRow` | Steering §14 | Helpers locais hoje em `filter-drawer.tsx`; promover quando ≥ 3 consumidores |
| Paleta proibida via lint | Steering §8 + `scripts/check-no-raw-palette.mjs` | CI strict: 0 violations |

---

## 5. Próxima fila de migração (sugerida)

Ordem por impacto + dependência:

1. ~~**`/p/[slug]`**~~ ✅ done
2. ~~**`MediaGallery` + `media-lightbox` + `photo-carousel`**~~ ✅ done
3. ~~**`favorites-list.tsx` + `client-profile-edit.tsx` + `/conta/perfil`**~~ ✅ done
4. ~~**`/em-alta`, `/em-destaque`, `/novidades`**~~ ✅ done
5. ~~**`/entrar` + `/cadastro/**` + `/recuperar-senha/**`**~~ ✅ done
6. ~~**`/planos`**~~ ✅ done
7. ~~**`/conta/onboarding/**` + `/conta/verificacao`**~~ ✅ done
8. ~~**`/painel/**`**~~ ✅ done
9. ~~**`/admin/**`**~~ ✅ done
10. ~~**`/reels/**`**~~ ✅ done (decisão: NÃO extrair `<MediaActions>` — APIs por consumer divergem demais; cada uso < 30 linhas; YAGNI)
11. ~~**Legal (`/termos-de-uso`, `/politica-de-privacidade`)**~~ ✅ done (`<LegalShell>` + `<LegalSection>` extraídos para `src/components/layout/legal-shell.tsx`)
12. ~~**Erro/sistema (`error.tsx`, `not-found.tsx` por rota)**~~ ✅ done (41 `error.tsx` já consumiam `<ErrorState>` v2; `not-found.tsx` raiz refatorado para Inter Bold + Button polimórfico, sem `font-serif`)

---

## 6. Anti-padrões detectáveis

A presença de qualquer um abaixo num PR é red flag — provavelmente
não foi seguido o steering:

- **Hex literais em `.tsx`** (ex.: `bg-[#e85a7a]`) — usar token (`bg-rose`)
- **Tailwind palette crua** (`bg-rose-500`, `text-zinc-700`, etc.) — banido por lint
- **`outline: none` sem `focus-visible:ring`** — banido por lint
- **`<table>` cru** — usar `<Table>`/`<TR>`/`<TD>`
- **Tile KPI ad-hoc** (`rounded border bg-white shadow-sm`) — usar `<KPICard>`
- **Componente exclusivo de uma página** sem reuso planejado
- **Glass com opacity < 0.98** em cards estruturais
- **Italic em display** ou **serif em UI** — só Inter, hierarquia por peso
- **Story viewer reescrito** — usar `<StoryViewer>` compartilhado

---

## 7. Como atualizar este mapa

Quando você (agente) migrar algo:

1. Atualize a coluna **Status v2** + **Commit** da página/componente afetado.
2. Se criou primitivo novo, adicione na §2.1 com 🆕.
3. Se identificou padrão promovível (apareceu em ≥ 3 lugares), mova de
   compostos para primitivos e atualize ambas seções.
4. Se quebrou regra do steering, registre na §6.
5. Atualize "Última atualização" no topo.

Esse mapa é amigo do `git diff` — texto puro com tabelas legíveis.
