# Handoff — Privello

**Última sessão:** 2026-05-18
**Último commit:** `6d4fbdb` (master, origin/master)
**Estado geral:** Redesign Tahoe Sensual v2 100% concluído + SEO foundation entregue.

---

## ⚡ Quick start (próxima sessão)

```bash
# 1. Pull último estado
git pull

# 2. Rodar gates antes de começar qualquer mudança
npx tsc --noEmit
node scripts/check-no-raw-palette.mjs   # 0/252 esperado
npx vitest --run src/components/_tests/touch-target.pbt.ts  # 2/2 esperado

# 3. Dev server — usuário roda manualmente
# (não usar npm run dev em ferramenta automatizada — long-running)
```

**Credenciais de teste (seed):**
- `admin@privello.com` / `Admin@privello2025` (admin)
- `eduardalanzarin@gmail.com` / `Admin@privello2025` (provider)
- `eduardolanzarin@gmail.com` / `Admin@privello2025` (cliente)

---

## 🎨 Design System — fonte de verdade

**Steering doc auto-incluído em todo prompt:**
[`.kiro/steering/design-system.md`](./steering/design-system.md)

**Mapa vivo de migração (todas as rotas/componentes):**
[`docs/component-map.md`](../docs/component-map.md)

**Identidade v2:** macOS Tahoe Sensual
- Inter only (display 700, body 400/500), tracking `-0.025em` em h1
- Rose `#e85a7a` accent + peach + plum + cream
- Glass v2.3 calibrado: `#ffffff` sólido nos cards, glass real só em
  `.glass-strip` (overlay sobre foto) e `.glass` (header sticky)
- `rounded-2xl` é o sweet spot para cards
- Background ambient pastel via `body { background: ... }` em globals.css

---

## ✅ O que foi concluído nesta sessão (e nas anteriores)

### Redesign visual Tahoe Sensual — 100%
**Status:** todas as rotas e componentes em 🟢 (component-map.md).

Páginas migradas (cobertas em commits anteriores e desta sessão):
- Públicas: `/`, `/descobrir`, `/descobrir/[citySlug]`, `/cidades`, `/p/[slug]`,
  `/em-alta`, `/em-destaque`, `/novidades`, `/reels`, `/reels/[slug]`,
  `/avaliar/[slug]`, `/solicitar/[slug]`, `/planos`, `/termos-de-uso`,
  `/politica-de-privacidade`
- Auth: `/entrar`, `/cadastro/**`, `/recuperar-senha/**`
- Cliente: `/conta/perfil`, `/conta/onboarding/**`
- Provider painel: `/painel`, `/painel/perfil`, `/painel/midias`,
  `/painel/reels`, `/painel/stories`, `/painel/valores`,
  `/painel/disponibilidade`, `/painel/avaliacoes`, `/painel/financeiro`,
  `/painel/plano`, `/painel/suporte`, `/painel/suporte/[id]`,
  **`/painel/verificacao` (movida de `/conta/verificacao` em `6d4fbdb`)**
- Pagamento: `/assinar`, `/assinar/sucesso`
- Admin: `/admin/moderacao`, `/admin/perfis`, `/admin/midias`,
  `/admin/verificacoes/[id]`, `/admin/financeiro`, `/admin/suporte`,
  `/admin/suporte/[id]`
- Erro/sistema: `error.tsx` (raiz + 40 segment-level), `not-found.tsx`

Componentes principais migrados:
- Layout: `site-header`, `site-footer`, `bottom-nav`, `auth-shell`,
  `legal-shell`, `dark-sidebar-shell`, `provider-banner`
- Profile: `profile-card`, `profile-list-row`, `profile-story-cover`,
  `media-gallery`, `audio-player`, `favorite-button`, etc.
- Painel: `painel-sidebar`, `media-manager`, `reels-manager`, `stories-manager`,
  `valores-form`, `availability-form`, `perfil-editor`, `financial-table`
- Admin: `admin-shell`, `admin-charts`, `warning-form`
- Stories: `story-bar`, `story-viewer`, `story-circle`
- Outros: `age-gate`, `ticket-chat`, `solicitar-whatsapp-panel`,
  `city-autocomplete`

### SEO Foundation (Fases 1-4) — entregue
- ✅ `metadataBase` + `keywords` + OG/twitter completos no root layout
- ✅ `src/app/sitemap.ts` dinâmico (rotas estáticas + cidades + perfis ativos +
  reels) com revalidate 1h
- ✅ `src/app/robots.ts` (Allow / + Disallow áreas privadas)
- ✅ JSON-LD em `src/lib/seo.ts`: Organization, WebSite com SearchAction,
  Person (com aggregateRating), BreadcrumbList, ItemList
- ✅ Per-route metadata em `/p/[slug]` (canonical, OG type=profile, twitter,
  noindex condicional para perfis suspensos/sem plano)
- ✅ Per-route metadata em `/descobrir/[citySlug]` + ItemList JSON-LD
- ✅ OG images programáticas via `next/og` ImageResponse:
  - `src/app/opengraph-image.tsx` (home)
  - `src/app/planos/opengraph-image.tsx`
  - `src/app/p/[slug]/opengraph-image.tsx` (humaniza slug)
  - `src/app/descobrir/[citySlug]/opengraph-image.tsx` (humaniza slug)
- ✅ Helper de fontes em `src/lib/og-fonts.ts` (resolve Inter via Google Fonts
  CSS endpoint, cache em memória)

### Lint guard estendido — entregue
`scripts/check-no-raw-palette.mjs` agora detecta:
- Raw palette Tailwind (zinc/amber/sky/etc.)
- `outline-none` sem ring substituto
- **Legacy v1 tokens** (text-foreground, bg-foreground, text-muted, text-coral,
  font-serif, border-black/[0.0X])
- **Raw shadows hardcoded** (`shadow-[<rgba>]`)
- **Blue focus rings v1** (`focus:shadow-[0_0_0_3px_rgba(10,132,255...)]`)

Strip comments antes de matching (não dispara em docstrings explicando
anti-patterns).

Excluído via `@source not` em globals.css: `scripts/`, `.kiro/`, tests, PBTs.

### Verificação reorganizada (último commit `6d4fbdb`)
- `/conta/verificacao` movida para `/painel/verificacao` (herda PainelLayout
  com sidebar/hamburger)
- Reescrita inteira em Tahoe Sensual (sem hero ink lateral v1)
- Redirect 308 mantido em `/conta/verificacao` para preservar bookmarks
- `revalidatePath` em `verification.ts` atualizado
- Item da sidebar atualizado em `painel-sidebar.tsx`

### 6 páginas do painel padronizadas
Headers consistentes em todas: eyebrow uppercase tracking-wider + título
Inter Bold tracking apertado + subtítulo `text-md text-ink-dim`. Aplicado em
`/painel/{perfil, midias, reels, stories, valores, disponibilidade}`.

---

## 📌 Estado dos gates

| Gate | Comando | Status |
|---|---|---|
| TypeScript | `npx tsc --noEmit` | ✅ 0 errors |
| Palette guard | `node scripts/check-no-raw-palette.mjs` | ✅ 0/252 |
| Touch-target PBT | `npx vitest --run src/components/_tests/touch-target.pbt.ts` | ✅ 2/2 |

---

## 🎯 Próximos passos sugeridos

### Opção A — SEO validação em produção
Quando subir em produção:
1. `https://privello.com.br/robots.txt` → confirma 200
2. `https://privello.com.br/sitemap.xml` → confirma 200 com URLs reais
3. [Rich Results Test](https://search.google.com/test/rich-results) com
   `https://privello.com.br/p/<slug>` → valida Person + Breadcrumb JSON-LD
4. WhatsApp/Telegram preview de link → ver OG images renderizando
5. Google Search Console → submeter `sitemap.xml` manualmente após deploy

### Opção B — Acessibilidade WCAG audit
- Rodar Lighthouse + axe-core nas rotas-chave
- Checar contraste WCAG AA em pares novos via `src/lib/a11y/contrast.ts`
- Auditar focus management em modais (story-viewer, media-lightbox, age-gate)
- Skip links em layouts complexos (painel, admin)

### Opção C — Performance
- Lighthouse mobile/desktop nas rotas críticas (home, descobrir, perfil)
- Audit de imagens (next/image vs `<img>`, sizes, priority)
- Code splitting em managers do painel (lazy load tabs)
- LCP/INP/CLS metrics em RUM

### Opção D — Observability
- Logger estruturado em produção (Railway logs)
- Error tracking (Sentry-like)
- Métricas de negócio (views, conversões de assinatura, boost)
- Alertas em cron jobs (`/api/cron/*`)

### Opção E — Migrações Prisma pendentes
Confirmar com `npx prisma migrate status` se há drift entre schema e
migrations versionadas. Lembrete da regra do projeto (AGENTS.md):
**Nunca usar `prisma db push` para mudanças que vão subir.**

---

## 🚨 Convenções importantes (não esquecer)

### Git
- Commits sempre single-line message (PowerShell mangle multi-line `-m`)
- Push depois de cada commit aceito
- CRLF warnings em Windows são esperados — só ignorar
- Nunca force push, nunca `--amend` em commits pushed

### Workflow
- **Não delegar para subagents em sessões interativas de design** — usuário
  prefere hands-on iteration direta
- **Não usar `prisma db push`** — sempre `prisma migrate dev --name <X>`
- **Não usar `npm install` automaticamente** — só quando usuário pedir
- **Background processes:** dev server `npm run dev` é long-running, usuário
  roda manualmente. Para testes: `vitest --run` (sem watch)

### Design system (do steering)
- Sempre usar primitivos `<Card>` / `<Button>` / `<Input>` / `<Textarea>` /
  `<Select>` em vez de classNames inline
- Shadows: tokens `shadow-[var(--shadow-sm/md/lg/hairline)]` — **nunca** raw
- Colors: tokens `text-ink/text-ink-dim/text-ink-faint`, `bg-rose/bg-peach/...`
  — **nunca** `text-muted/text-foreground/bg-coral`
- Focus: `focus-visible:ring-2 focus-visible:ring-rose/40 ...` (nunca azul)
- BottomNav: visible em todos breakpoints (steering §13.1), auto-hide quando
  `body[data-modal-open]`
- "@handle" → "@perfil" (usuários não entendem "handle")

### Estrutura de spec workflow (Kiro)
- Specs em `.kiro/specs/<feature>/`
- Steering files em `.kiro/steering/*.md` (auto-incluído)
- Componentes UI primitivos em `src/components/ui/**` (excluído do palette
  guard — eles definem as variantes oficiais)

---

## 📂 Arquivos importantes para próxima sessão ler

1. **`.kiro/steering/design-system.md`** — Auto-incluído. Fonte de verdade.
2. **`docs/component-map.md`** — Mapa vivo de migração.
3. **`AGENTS.md`** — Auto-incluído. Regras Next.js + Prisma.
4. **`.kiro/handoff.md`** — Este documento.
5. **`scripts/check-no-raw-palette.mjs`** — Lint guard (estendido nesta sessão).

---

## 🐛 Bugs conhecidos / pontos de atenção

Nenhum bug ativo conhecido. Coisas que podem aparecer:

- **Tailwind v4 + Turbopack:** `next/og` em rotas dinâmicas roda em Edge
  runtime por default e ignora `export const runtime = "nodejs"` em
  `opengraph-image.tsx`. Solução atual: dynamic OGs derivam display name por
  humanização do slug (sem Prisma). Se quiser enriquecer no futuro, criar
  endpoint `/api/og/profile/[slug]` que devolva dados via fetch interno.
- **CRLF:** Git no Windows converte automaticamente — warnings podem ser
  ignorados.
- **Background gradient:** vem de `body { background: ... }` em
  `src/app/globals.css`, não de `bg-background` em layout. Não adicionar
  `bg-background` no body.

---

## 🔗 Trilha de commits desta sessão

```
6d4fbdb  feat(painel): move verificacao to /painel/verificacao + standardize 6 painel page headers to v2
c69c041  fix(tailwind): exclude scripts/ + .kiro/ + tests from Tailwind v4 source scan
2ca0297  feat(redesign): deep v2 audit fix - painel + admin + cadastro + extended palette guard (21 files)
9f35cb8  feat(redesign): polish final v2 yellows - site-footer, admin-charts, media-manager, reels-manager
2e68ec0  feat(seo): add programmatic OG images via next/og (home, planos, descobrir, p)
e9c492f  feat(seo): add metadataBase, sitemap.ts, robots.ts, JSON-LD
b1f8f44  feat(redesign): final v2 sweep - cidades, avaliar, solicitar, assinar, age-gate, ticket-chat
9af37c2  feat(error): migrate not-found.tsx to v2 + cleanup error.tsx
b5a8ee3  feat(legal): migrate /termos-de-uso + /politica-de-privacidade (LegalShell)
```

Estado: **redesign + SEO entregues, projeto pronto para deploy ou nova fase.**
