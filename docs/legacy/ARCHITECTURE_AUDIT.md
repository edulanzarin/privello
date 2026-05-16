# Privello — Architecture Audit

> Diagnóstico técnico profundo. Escrito para o time de desenvolvimento.  
> Data: Maio 2026 | Stack: Next.js 15 · Prisma 5 · Tailwind v4 · PostgreSQL

---

## Sumário Executivo

O projeto tem fundação sólida: App Router bem organizado, Prisma com tipos automáticos, design system próprio com tokens macOS, separação clara entre server e client. O problema é **acúmulo de dívida técnica por crescimento acelerado**. Componentes visuais cresceram sem controle, lógica de negócio vazou para camadas erradas, e o design system existe no papel mas não é respeitado consistentemente no código.

**Rating geral:** 6.5/10  
**Risco imediato:** Médio (segurança + manutenibilidade)  
**Risco de crescimento:** Alto (componentes monstruosos, sem testes, sem error boundaries)

---

## 1. Estrutura do Projeto

```
src/
  app/                    # 78+ rotas e páginas
    api/                  # 25+ endpoints REST
    _actions/             # Server actions globais
    painel/               # Dashboard do provider
    admin/                # Painel administrativo
    conta/                # Fluxo do cliente
    cadastro/             # Registro de provider
    (páginas públicas)    # p/[slug], descobrir, reels...
  components/
    ui/                   # Primitivos do design system
    painel/               # Componentes do dashboard
    marketing/            # Landing/hero
    profile/              # Visualização de perfil público
    layout/               # Header, footer, bottom nav
    support/              # Chat de suporte
    reels/                # Feed de reels
    stories/              # Stories
    admin/                # UI do admin
    discover/             # Busca e listagem
  lib/                    # 13 arquivos utilitários
  types/                  # Definições de tipo globais
```

**Estatísticas críticas:**
| Arquivo | Linhas | Status |
|---------|--------|--------|
| `components/profile/media-gallery.tsx` | 508 | 🔴 Urgente dividir |
| `components/reels/reels-feed.tsx` | 379 | 🔴 Urgente dividir |
| `components/stories/story-bar.tsx` | ~340 | 🟡 Dividir |
| `app/painel/perfil/perfil-editor.tsx` | ~465 | 🟡 Dividir |
| `components/painel/media-manager.tsx` | ~290 | 🟡 Dividir |
| `app/conta/verificacao/page.tsx` | ~389 | 🟡 Dividir |
| `app/admin/moderacao/page.tsx` | ~381 | 🟡 Dividir |

---

## 2. Frontend

### 2.1 Componentes Duplicados

#### Toggle Switch — 4 implementações diferentes

```tsx
// 1. UI component — src/components/ui/toggle-chip.tsx
// 2. Inline em availability-form.tsx (copiado de valores-form.tsx)
// 3. OnlineToggle — src/components/painel/online-toggle.tsx
// 4. DiscoverViewToggle — src/components/discover/...

// Todas fazem a mesma coisa. Deveria existir UMA:
// <Switch checked={...} onChange={...} />
```

#### Upload de Arquivo — 3 implementações

```tsx
// 1. src/app/conta/onboarding/fotos/photo-uploader.tsx
// 2. src/components/painel/media-manager.tsx (lógica inline)
// 3. src/app/painel/perfil/perfil-editor.tsx (audio upload inline)

// Padrão repetido em todos:
// useState(uploading), fetch('/api/upload'), FormData, toast
// Deveria ser um hook: useFileUpload(endpoint)
```

#### Modal/Overlay — 3 implementações

```tsx
// 1. Lightbox em media-gallery.tsx (500 linhas!)
// 2. Story viewer em story-bar.tsx
// 3. Comment panel em reels-feed.tsx

// Cada um reinventa: backdrop click, scroll lock, Escape key, z-index
// Deveria ser: <Modal> genérico + sub-componentes específicos
```

---

### 2.2 Loading States

**Situação atual:** Quase todos os estados de carregamento são incompletos.

| Componente | Estado atual | Problema |
|---|---|---|
| Reels feed | `loadingComments` (boolean) | Sem spinner visível |
| Media gallery | Sem loading no comentário | UI trava silenciosamente |
| Painel pages | Sem `loading.tsx` | Página branca durante navegação |
| Perfil público | `force-dynamic` sem Suspense | Sem skeleton |

**Completamente ausente:**
- Zero arquivos `loading.tsx` no App Router
- Zero `error.tsx` files (todos os erros bubblam para o usuário sem tratamento)
- Zero Suspense boundaries nos dados pesados

---

### 2.3 Acessibilidade — Estado Crítico

**11 `aria-label` encontrados em 200+ componentes.**

Problemas sistemáticos:
```tsx
// Botões icon-only sem label — ilegíveis para screen readers
<button onClick={onFavorite}>
  <Heart className="h-5 w-5" />  {/* sem aria-label */}
</button>

// Formulários sem atributos
<Input name="email" />  {/* sem aria-required, aria-invalid */}

// Modais sem role="dialog" aria-modal="true"
<div className="fixed inset-0 z-50">  {/* modal semântico ausente */}
```

---

### 2.4 Performance

**43 páginas com `export const dynamic = "force-dynamic"`**

A maioria não precisa disso. Exemplos problemáticos:

```tsx
// descobrir/[citySlug]/page.tsx — dados mudam raramente
// Poderia: export const revalidate = 300; (5 minutos)

// p/[slug]/page.tsx — perfil público
// Poderia: revalidate = 60 com revalidatePath() no webhook

// Custo: Zero cache = zero CDN = todo request bate no servidor
```

**Sem lazy loading nos componentes pesados:**
```tsx
// media-gallery.tsx (508 linhas) carregado de forma síncrona em toda visita de perfil
// Deveria ser: const MediaGallery = dynamic(() => import('./media-gallery'), { ssr: false })
```

**Imagens sem placeholder:**
```tsx
<Image src={url} fill />
// Deveria ser: <Image src={url} fill placeholder="blur" blurDataURL={...} />
// CLS (Cumulative Layout Shift) alto
```

---

### 2.5 Estado / Prop Drilling

```tsx
// PostModal recebe 9 props
<PostModal
  items={items}          // array grande
  startIdx={startIdx}
  slug={slug}
  displayName={displayName}
  isClient={isClient}
  isSubscriber={isSubscriber}
  currentUserId={currentUserId}
  isOwner={isOwner}
  onClose={onClose}
/>
// Solução: Context de "visualização de mídia"
```

---

## 3. Backend

### 3.1 Segurança — Problemas Críticos

#### 🔴 Webhook sem verificação de assinatura

```tsx
// src/app/api/mp/webhook/route.ts
export async function POST(req: NextRequest) {
  // QUALQUER pessoa pode fazer POST aqui com dados falsos
  // e acionar upgrade de plano ou boost fraudulento
  
  // MP envia X-Signature header que deve ser verificado:
  // const signature = req.headers.get("x-signature");
  // HMAC-SHA256 do body com MP_WEBHOOK_SECRET
}
```

#### 🟡 Sem rate limiting global

```tsx
// /api/auth — login sem limite de tentativas
// /api/upload — upload sem limite por usuário/hora
// /api/wa-click — click tracking sem throttle
// /api/stories/view — view sem throttle

// Solução: middleware com upstash/ratelimit ou similar
```

#### 🟡 Sem cabeçalhos de segurança

```ts
// next.config.ts — sem Content-Security-Policy
// Sem X-Frame-Options (clickjacking)
// Sem X-Content-Type-Options
// Sem Referrer-Policy
```

---

### 3.2 Queries — Gargalos

#### getProfileBySlug — Query pesada

```ts
include: {
  media: { orderBy: { createdAt: "desc" } },    // TODOS os media sem paginação
  reviews: { take: 12, include: { user: ... } }, // 12 queries de usuário (N+1)
  availabilityRules: { orderBy: [...] },
  durationOptions: { ... },
}
// Na prática: 1 profile + N reviews usuarios = N+1 queries
```

#### getSectionProfiles — Sort em memória

```ts
// queries.ts
const rows = await prisma.profile.findMany({
  take: offset + limit + 100,  // busca mais do que precisa
});
// Depois sort em JS:
const sorted = [...rows].sort((a, b) => ...)
// Deveria ser: ORDER BY no SQL
```

#### Índices faltantes no schema

```prisma
// Faltam:
@@index([planTier, planExpiresAt])        // para expirar planos
@@index([userId, status, expiresAt])      // para isSubscriber()
@@index([featuredUntil])                  // para perfis em destaque
@@index([isOnline, cityId])               // para busca "online agora"
```

---

### 3.3 Validação — Lacunas

```ts
// auth.ts — falta limite superior de idade
if (isNaN(age) || age < 18) return { error: "..." };
// age poderia ser 999 → sem validação

// Nenhuma sanitização de XSS no bio/displayName/tagline
// React escapa por padrão, mas conteúdo vai para meta tags
// e og:description sem sanitização

// Upload: sem validação de Content-Length antes de processar
// Possível DoS com arquivo de 1GB
```

---

### 3.4 Valores Hardcoded

```ts
// Espalhados pelo código:
"R$19,90/mês"                    // reels-feed.tsx — preço hardcoded
const SUSPENSION_THRESHOLD = 3;  // admin-moderation.ts
const dias = ["Dom", "Seg"...]    // p/[slug]/page.tsx
"https://privello.com.br"        // múltiplos arquivos
30 * 24 * 60 * 60 * 1000        // duração de plano em ms (3 lugares)
```

**Deveriam estar em:** `src/lib/constants.ts`

---

### 3.5 Separação de Responsabilidades

```ts
// Business logic em rotas de API:
// api/stories/view/route.ts faz:
// 1. Autenticação
// 2. Busca story
// 3. Verifica se não é o dono
// 4. Cria view
// 5. Atualiza contador
// Deveria ser: StoryService.recordView(storyId, userId)

// Validação duplicada: provider-register-form.tsx valida
// exatamente o mesmo que registerProviderAction no servidor
// Um bugs no cliente pode diferir do servidor silenciosamente
```

---

## 4. Design System

### 4.1 Tokens Definidos mas Não Usados Sistematicamente

```css
/* globals.css — tokens existem */
--privello-coral: #ff375f;
--privello-green: #30d158;
--privello-blue: #0a84ff;

/* Mas no código: */
className="bg-[#30d158]"    /* 12 ocorrências */
className="text-[#0a84ff]"  /* 8 ocorrências */
className="border-[#ff375f]" /* 6 ocorrências */
```

### 4.2 Typography Inconsistente

```tsx
// 3 sistemas de tamanho coexistindo:
text-sm       // Tailwind padrão (14px)
text-[13px]   // Arbitrário
text-xs       // Tailwind (12px)
text-[12px]   // Mesmo tamanho, classe diferente

// 107 instâncias de font-bold
// macOS usa font-semibold — font-bold é pesado demais
```

### 4.3 Sombras Inconsistentes

```tsx
shadow-sm                                          // 5 arquivos
shadow-[0_1px_3px_rgba(0,0,0,0.04)]              // 18 arquivos
shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_...]    // 7 arquivos
shadow-lg                                          // 3 arquivos
// Sem escala definida: sm/md/lg/card/modal
```

### 4.4 Border Radius Sem Hierarquia

```
rounded-md    → formulários antigos
rounded-lg    → inputs, botões
rounded-xl    → cards menores
rounded-2xl   → cards, modais
rounded-full  → avatares, badges
// Sem documentação de quando usar cada um
```

---

## 5. Testes

**Zero arquivos de teste encontrados.**

Fluxos sem cobertura:
- Registro de provider
- Upload de mídia
- Pagamento + webhook
- Expiração de plano
- Moderação admin

**Risco:** Qualquer refactor pode quebrar funcionalidades críticas sem aviso.

---

## 6. Código Morto e Técnica de Dívida

| Item | Localização | Impacto |
|---|---|---|
| `stripeSubscriptionId` (renomeado para `mpPaymentId` recentemente) | ~~schema.prisma~~ | Resolvido |
| Preço hardcoded "R$19,90/mês" | `reels-feed.tsx:64` | Médio |
| `DiscoverViewToggle` duplicando lógica de toggle | `discover/` | Baixo |
| `LogoutButton` importado em 3 lugares com lógica repetida | Múltiplos | Baixo |
| Comentários de debug (`console.log`) | Verificar | Baixo |

---

## 7. Matriz de Risco

| Problema | Probabilidade | Impacto | Prioridade |
|---|---|---|---|
| Webhook MP sem assinatura | Alta (ataque simples) | Crítico (fraude) | 🔴 P0 |
| Sem error boundaries | Média | Alto (UX quebrada) | 🔴 P0 |
| N+1 em getProfileBySlug | Alta (com escala) | Alto (timeout) | 🟡 P1 |
| force-dynamic em tudo | Alta | Médio (custo) | 🟡 P1 |
| Componentes >400 linhas | Alta (manutenção) | Médio (bugs) | 🟡 P1 |
| Sem rate limiting | Média | Alto (DoS/abuse) | 🟡 P1 |
| Acessibilidade zero | Alta | Médio (legal) | 🟡 P1 |
| Sem testes | Certeza | Alto (regressões) | 🟠 P2 |
| Upload sem size limit | Baixa | Alto (DoS) | 🟠 P2 |
| Valores hardcoded | Certeza | Baixo (manutenção) | 🟢 P3 |
