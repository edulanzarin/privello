# Privello — Refactor Plan

> Roadmap de melhorias baseado no ARCHITECTURE_AUDIT.md  
> Ordenado por impacto × esforço. Não altere código sem confirmar a fase.

---

## Princípios

1. **Segurança primeiro** — antes de qualquer feature nova
2. **Não quebrar o que funciona** — refactor incremental, não big bang
3. **Uma coisa por vez** — PRs pequenos e focados
4. **Teste antes de refatorar** — adicionar testes antes de mexer em código crítico

---

## Fase 0 — Segurança Imediata (1-2 dias)

> Bloqueadores que devem ser resolvidos ANTES de qualquer outra coisa.

### 0.1 Verificação de Assinatura do Webhook MP 🔴

**Problema:** Qualquer pessoa pode fazer POST em `/api/mp/webhook` com dados falsos e acionar upgrade de plano fraudulento.

**Implementação:**
```ts
// api/mp/webhook/route.ts
import crypto from "crypto";

function verifyMPSignature(
  xSignature: string | null,
  xRequestId: string | null,
  body: string,
  secret: string,
): boolean {
  if (!xSignature || !xRequestId) return false;
  const parts = Object.fromEntries(xSignature.split(",").map(p => p.split("=")));
  const ts = parts["ts"];
  const v1 = parts["v1"];
  const manifest = `id:${xRequestId};request-id:${xRequestId};ts:${ts};`;
  const expected = crypto.createHmac("sha256", secret).update(manifest).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(v1 ?? ""), Buffer.from(expected));
}
```

**Env var necessária:** `MP_WEBHOOK_SECRET` (disponível no painel MP → Configurações → Webhooks)

### 0.2 Cabeçalhos de Segurança HTTP 🔴

```ts
// next.config.ts — adicionar headers
const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(self), geolocation=()" },
];
```

### 0.3 Validação de Tamanho em Upload 🟡

```ts
// api/upload/route.ts
const contentLength = parseInt(req.headers.get("content-length") ?? "0");
if (contentLength > 20 * 1024 * 1024) {  // 20MB
  return NextResponse.json({ error: "Arquivo muito grande" }, { status: 413 });
}
```

---

## Fase 1 — Estabilidade (1 semana)

> Evita que o app quebre silenciosamente para os usuários.

### 1.1 Error Boundaries — App Router

Criar `error.tsx` nos segmentos críticos:

```
src/app/error.tsx                 # Global fallback
src/app/painel/error.tsx         # Dashboard
src/app/p/[slug]/error.tsx       # Perfil público
src/app/descobrir/[...]/error.tsx # Descobrir
```

```tsx
// Template padrão
"use client";
export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 py-16">
      <p className="text-[14px] text-muted">Algo deu errado.</p>
      <button onClick={reset} className="rounded-lg bg-foreground px-4 py-2 text-sm text-white">
        Tentar novamente
      </button>
    </div>
  );
}
```

### 1.2 Loading States — App Router

Criar `loading.tsx` nas rotas principais:

```
src/app/painel/loading.tsx
src/app/painel/financeiro/loading.tsx
src/app/p/[slug]/loading.tsx
src/app/descobrir/[citySlug]/loading.tsx
```

### 1.3 Arquivo de Constantes

**Criar:** `src/lib/constants.ts`

```ts
export const PLAN_DURATION_MS = 30 * 24 * 60 * 60 * 1000;
export const BOOST_DURATION_MS = 24 * 60 * 60 * 1000;
export const SUBSCRIPTION_DURATION_MS = 30 * 24 * 60 * 60 * 1000;
export const SUSPENSION_THRESHOLD = 3;
export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;
export const MAX_AUDIO_BYTES = 20 * 1024 * 1024;
export const PLAN_PRICES = { ESSENCIAL: 3990, DESTAQUE: 8900, PREMIUM: 18900 }; // em centavos
export const DAYS_PT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
```

### 1.4 Índices Faltantes no Banco

```prisma
// Adicionar ao schema.prisma:
// Profile
@@index([planTier, planExpiresAt])
@@index([isOnline, cityId])
@@index([featuredUntil])

// Subscription
@@index([userId, status, expiresAt])
```

---

## Fase 2 — Componentes (2-3 semanas)

> Maior impacto em manutenibilidade. Dividir componentes gigantes.

### 2.1 Extrair `<Modal>` Genérico

**Criar:** `src/components/ui/modal.tsx`

```tsx
export function Modal({ open, onClose, children }: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  // Backdrop, Escape key, scroll lock — implementados UMA vez
}
```

**Substituir em:**
- `media-gallery.tsx` — lightbox usa modal próprio
- `story-bar.tsx` — viewer usa modal próprio
- `reels-feed.tsx` — comments usa modal próprio

### 2.2 Dividir `media-gallery.tsx` (508 linhas → 4 arquivos)

```
src/components/profile/media/
  index.tsx              # Exporta MediaGallery (composição)
  media-grid.tsx         # Grid de fotos/vídeos (~80 linhas)
  media-lightbox.tsx     # Modal de visualização (~150 linhas)
  media-comments.tsx     # Sistema de comentários (~120 linhas)
  use-media-actions.ts   # Hook: like, comment, upload actions
```

### 2.3 Extrair `useFileUpload` Hook

**Criar:** `src/lib/hooks/use-file-upload.ts`

```ts
export function useFileUpload(endpoint: string) {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  async function upload(file: File, extra?: Record<string, string>) {
    setUploading(true);
    const fd = new FormData();
    fd.set("file", file);
    if (extra) Object.entries(extra).forEach(([k, v]) => fd.set(k, v));
    const res = await fetch(endpoint, { method: "POST", body: fd });
    const data = await res.json();
    setUploading(false);
    if (!res.ok) { toast(data.error ?? "Erro ao enviar.", "error"); return null; }
    return data;
  }

  return { upload, uploading };
}
```

**Substituir nos 3 lugares que duplicam esse padrão.**

### 2.4 Unificar Toggle Switch

**Criar:** `src/components/ui/switch.tsx`

```tsx
// Baseado no padrão já existente em valores-form.tsx — o mais correto
export function Switch({ checked, onChange, disabled }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "flex h-[22px] w-[40px] shrink-0 items-center rounded-full transition-colors duration-200",
        checked ? "bg-[#30d158]" : "bg-black/[0.09]",
        disabled && "opacity-50 cursor-not-allowed",
      )}
    >
      <span className={cn(
        "ml-[2px] h-[18px] w-[18px] rounded-full bg-white shadow-sm transition-transform duration-200",
        checked && "translate-x-[18px]",
      )} />
    </button>
  );
}
```

**Substituir em:** `valores-form.tsx`, `availability-form.tsx`, `online-toggle.tsx`, `admin/` components.

### 2.5 Dividir `reels-feed.tsx` (379 linhas → 3 arquivos)

```
src/components/reels/
  reels-feed.tsx          # Orquestração, scroll infinito (~80 linhas)
  reel-player.tsx         # Vídeo individual, controles (~120 linhas)
  reel-comments.tsx       # Sistema de comentários (~100 linhas)
```

---

## Fase 3 — Backend (1-2 semanas)

### 3.1 Rate Limiting

**Instalar:** `@upstash/ratelimit` + `@upstash/redis`  
(ou solução em memória para desenvolvimento)

**Proteger:**
```ts
// Middleware ou por rota:
const limit = ratelimit({ requests: 5, window: "15m" });

// Rotas críticas:
POST /api/auth/login          → 5 req / 15 min por IP
POST /api/upload              → 20 req / hora por userId
POST /api/stories/view        → 50 req / hora por userId
GET  /api/wa-click            → 10 req / hora por profileId+IP
```

### 3.2 Otimizar `getProfileBySlug`

```ts
// Antes: inclui TODOS os media
media: { orderBy: { createdAt: "desc" } }

// Depois: paginated + separado
media: {
  where: { isPublic: true },
  orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }],
  take: 12,  // primeira página
},
// Media privada só carregada se isSubscriber
```

### 3.3 Mover Sort para SQL

```ts
// getSectionProfiles — antes (sort em JS):
const sorted = [...rows].sort((a, b) => {
  const boost = Number(!!b.featuredUntil) - Number(!!a.featuredUntil);
  return boost || b.viewsCurrentPeriod - a.viewsCurrentPeriod;
});

// Depois (Prisma):
orderBy: [
  { featuredUntil: { sort: "desc", nulls: "last" } },
  { viewsCurrentPeriod: "desc" },
],
take: limit,
skip: offset,
```

### 3.4 Validação com Zod

**Instalar:** `zod`

```ts
// src/lib/validators/profile.ts
import { z } from "zod";

export const ProfileSchema = z.object({
  displayName: z.string().min(2).max(60),
  age: z.number().int().min(18).max(80),
  bio: z.string().min(20).max(2000),
  whatsappPhone: z.string().regex(/^\+\d{10,15}$/).optional(),
  tagline: z.string().max(120).optional(),
});
```

**Aplicar em:** `registerProviderAction`, `saveOnboardingPerfil`, `updateFinancialRecord`.

### 3.5 Serviço de Negócio Centralizado

```
src/lib/services/
  subscription.service.ts    # isSubscriber, createSub, expireSubs
  profile.service.ts         # getBySlug, updatePlan, expirePlans
  media.service.ts           # upload, delete, setCover
  notification.service.ts    # email, in-app (futuro)
```

---

## Fase 4 — Design System (1 semana)

### 4.1 Standardizar Typography

**Definir escala no Tailwind config:**
```ts
// Criar aliases no tailwind:
// text-label  = text-[11px] font-medium (labels de campos)
// text-caption = text-[12px]            (textos auxiliares)
// text-body   = text-[13px]             (body padrão)
// text-default = text-[14px]            (texto principal)
// text-heading = text-[22px] font-semibold tracking-tight
```

### 4.2 Substituir Cores Hardcoded

**Grep e substitua sistematicamente:**
```
"#0a84ff"  → use class: text-[#0a84ff] → criar: text-system-blue
"#30d158"  → use class: bg-[#30d158]   → criar: bg-system-green
"#ff375f"  → já tem: text-coral ✓
"#1d1d1f"  → já tem: text-foreground ✓
"#ff9500"  → criar: text-system-orange / bg-amber
```

### 4.3 Definir Escala de Sombras

```ts
// Em globals.css:
--shadow-card: 0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04);
--shadow-modal: 0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08);
--shadow-input: inset 0 0.5px 2px rgba(0,0,0,0.04);

// No código:
className="shadow-[var(--shadow-card)]"  // ou criar utility class
```

### 4.4 Documentar Design Tokens

Criar `src/components/ui/README.md` listando:
- Quando usar cada variante de Button
- Quando usar cada tipo de Card
- Escala de border radius
- Escala de shadows
- Paleta de cores completa

---

## Fase 5 — Performance (2 semanas)

### 5.1 Reduzir `force-dynamic`

```ts
// Perfis públicos — substituir force-dynamic por:
export const revalidate = 60; // revalida a cada 1 minuto

// Quando perfil é atualizado:
revalidatePath(`/p/${profile.slug}`);  // já fazemos isso em vários lugares ✓

// Descobrir por cidade — pode ter cache mais longo:
export const revalidate = 300; // 5 minutos
```

**Meta:** Reduzir de 43 para ~15 páginas com `force-dynamic`.

### 5.2 Lazy Loading de Componentes Pesados

```tsx
// Carregar media-gallery só quando necessário:
const MediaGallery = dynamic(() => import("@/components/profile/media/index"), {
  ssr: false,
  loading: () => <MediaGridSkeleton />,
});

// ReelsFeed:
const ReelsFeed = dynamic(() => import("@/components/reels/reels-feed"), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center py-16">
    <Loader2 className="h-6 w-6 animate-spin text-muted" />
  </div>,
});
```

### 5.3 Imagens com Blur Placeholder

```tsx
// Gerar blur hash no upload e salvar no Media
// Usar ao renderizar:
<Image
  src={media.url}
  alt=""
  fill
  placeholder="blur"
  blurDataURL={media.blurHash ?? PLACEHOLDER_BLUR}
  className="object-cover"
/>
```

### 5.4 Virtual Scroll no Feed

Instalar `@tanstack/react-virtual` para o feed de reels.  
Benefício: DOM fixo independente de quantos reels existam.

---

## Fase 6 — Testes (contínuo)

**Prioridade de cobertura:**

```
1. Webhook MP           → unit test (lógica de processamento)
2. registerProvider     → integration test
3. saveOnboardingPerfil → integration test
4. getProfileBySlug     → unit test (memoização)
5. isSubscriber         → unit test
6. Crons de expiração   → unit test
```

**Stack sugerida:** Vitest + Testing Library + Prisma (banco de teste)

---

## Backlog Futuro (não priorizado agora)

- [ ] Notificações por email quando plano expira (7 dias antes)
- [ ] Webhook MP com preapproval para billing recorrente automático
- [ ] Sitemap dinâmico para SEO de perfis
- [ ] Real-time notifications (via Server-Sent Events ou Pusher)
- [ ] Internacionalização (i18n) para textos
- [ ] Admin analytics dashboard
- [ ] Monitoramento de erros (Sentry)
- [ ] CI/CD pipeline com testes automáticos

---

## Resumo Executivo — Roadmap

```
Semana 1:  Fase 0 (segurança) + Fase 1 (estabilidade)
           → Webhook assinado, error boundaries, loading states, constants

Semana 2-3: Fase 2 (componentes)
           → Modal genérico, dividir media-gallery e reels-feed,
             Switch unificado, useFileUpload hook

Semana 4:  Fase 3 (backend)
           → Rate limiting, otimizar queries, Zod validators

Semana 5:  Fase 4 (design system)
           → Typography scale, cores padronizadas, shadow scale

Semana 6-7: Fase 5 (performance)
           → Reduzir force-dynamic, lazy loading, image blur

Semana 8+: Fase 6 (testes) — contínuo
```

### O que traz maior impacto primeiro

| Fase | Esforço | Impacto | ROI |
|------|---------|---------|-----|
| Fase 0 — Segurança | 2 dias | Evita fraude | ⭐⭐⭐⭐⭐ |
| Fase 1 — Estabilidade | 3 dias | UX muito melhor | ⭐⭐⭐⭐⭐ |
| Fase 3.1 — Rate Limiting | 2 dias | Evita abuso | ⭐⭐⭐⭐ |
| Fase 2.1 — Modal genérico | 2 dias | -300 linhas duplicadas | ⭐⭐⭐⭐ |
| Fase 3.2 — Query N+1 | 1 dia | Performance escala | ⭐⭐⭐⭐ |
| Fase 5.1 — Menos force-dynamic | 2 dias | Custo de servidor | ⭐⭐⭐⭐ |
| Fase 2.2 — Dividir gallery | 3 dias | Manutenibilidade | ⭐⭐⭐ |
| Fase 4 — Design system | 5 dias | Consistência visual | ⭐⭐⭐ |
| Fase 6 — Testes | ongoing | Confiança no deploy | ⭐⭐⭐ |
