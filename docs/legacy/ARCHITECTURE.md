# Privello — Arquitetura & Padrões

> Documento de referência para o time. Atualizado em Maio 2026.

---

## Estrutura de Pastas

```
src/
├── app/                          # App Router (rotas, layouts, pages)
│   ├── _actions/                 # Server Actions globais
│   ├── api/                      # API Routes (REST endpoints)
│   ├── admin/                    # Painel administrativo
│   ├── painel/                   # Dashboard do provider
│   │   └── _actions/            # Server Actions específicas do painel
│   ├── conta/                    # Área do cliente
│   ├── cadastro/                 # Registro
│   ├── descobrir/                # Busca por cidade
│   ├── p/[slug]/                 # Perfil público
│   └── ...                       # Demais páginas públicas
│
├── components/                   # Componentes React
│   ├── ui/                       # Primitivos do design system
│   ├── layout/                   # Header, footer, nav
│   ├── profile/                  # Perfil público
│   ├── painel/                   # Dashboard
│   ├── admin/                    # Admin
│   ├── reels/                    # Feed de reels
│   ├── stories/                  # Stories
│   ├── discover/                 # Busca/listagem
│   ├── marketing/                # Landing page
│   ├── home/                     # Home sections
│   ├── support/                  # Chat de suporte
│   ├── solicitar/                # Agendamento
│   └── onboarding/               # Onboarding
│
├── lib/                          # Utilitários e lógica compartilhada
│   ├── services/                 # Camada de serviços (business logic)
│   │   ├── index.ts             # Barrel export
│   │   ├── subscription.service.ts
│   │   ├── profile.service.ts
│   │   ├── city.service.ts
│   │   └── media.service.ts
│   ├── hooks/                    # React hooks reutilizáveis
│   │   ├── index.ts             # Barrel export
│   │   ├── use-file-upload.ts
│   │   ├── use-media-actions.ts
│   │   ├── use-scroll-lock.ts
│   │   └── use-escape-key.ts
│   ├── auth.ts                   # NextAuth config
│   ├── prisma.ts                 # Prisma client singleton
│   ├── constants.ts              # Constantes centralizadas
│   ├── queries.ts                # Queries de banco (legado, migrar para services)
│   ├── utils.ts                  # cn() utility
│   ├── money.ts                  # Formatação BRL
│   ├── time-utils.ts             # Helpers de tempo
│   ├── booking-slots.ts          # Lógica de agendamento
│   ├── discover-params.ts        # Parsing de filtros de busca
│   ├── whatsapp-booking.ts       # Builder de mensagem WhatsApp
│   ├── email.ts                  # Transporte de email
│   ├── email-templates.ts        # Templates HTML de email
│   └── mercadopago.ts            # Client MercadoPago
│
├── types/                        # Definições de tipo globais
│   └── next-auth.d.ts
│
└── proxy.ts                       # Auth guard (protege /painel, /conta)
```

---

## Padrões de Código

### Constantes

Todas as constantes de negócio ficam em `src/lib/constants.ts`:
- Preços, durações, limites de upload
- Labels reutilizáveis (dias da semana, nomes de planos)
- URLs da plataforma

```ts
import { PLAN_DURATION_MS, SUBSCRIPTION_PRICE_LABEL, DAYS_PT } from "@/lib/constants";
```

### Hooks

Hooks reutilizáveis ficam em `src/lib/hooks/`:

```ts
import { useFileUpload, useMediaActions, useScrollLock, useEscapeKey } from "@/lib/hooks";
```

### Services

Lógica de negócio fica em `src/lib/services/`:

```ts
import { isSubscriber, getProfileBySlug } from "@/lib/services";
```

> **Nota:** `queries.ts` ainda é usado amplamente. Novos códigos devem preferir a camada de services.

### Componentes UI

Primitivos do design system ficam em `src/components/ui/`:
- `Switch` — Toggle switch unificado (substitui 4 implementações)
- `Modal` — Modal genérico com backdrop, Escape, scroll lock
- `Button`, `Input`, `Card`, `Badge`, etc.

```tsx
import { Switch } from "@/components/ui/switch";
import { Modal } from "@/components/ui/modal";
```

### Error Boundaries & Loading States

Toda rota principal deve ter:
- `error.tsx` — Fallback de erro com botão "Tentar novamente"
- `loading.tsx` — Skeleton/spinner durante navegação

Rotas com error/loading:
- `src/app/error.tsx` (global)
- `src/app/painel/error.tsx` + `loading.tsx`
- `src/app/painel/financeiro/loading.tsx`
- `src/app/p/[slug]/error.tsx` + `loading.tsx`
- `src/app/descobrir/[citySlug]/error.tsx` + `loading.tsx`

---

## Segurança

### Headers HTTP

Configurados em `next.config.ts`:
- X-Frame-Options: SAMEORIGIN
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin
- Permissions-Policy

### Webhook MercadoPago

Verificação de assinatura HMAC-SHA256 em `api/mp/webhook/route.ts`.
Requer `MP_WEBHOOK_SECRET` no `.env`.

### Upload

- Validação de Content-Length no header antes de processar
- Validação de tamanho do arquivo (8MB imagens, 200MB vídeos, 20MB áudio)
- Validação de MIME type

---

## Banco de Dados

### Índices Otimizados

```prisma
// Profile
@@index([planTier, planExpiresAt])    // Expiração de planos
@@index([isOnline, cityId])           // Busca "online agora"
@@index([featuredUntil])              // Perfis em destaque

// Subscription
@@index([userId, status, expiresAt])  // isSubscriber()
```

---

## Convenções de Naming

| Tipo | Padrão | Exemplo |
|------|--------|---------|
| Componentes | PascalCase | `MediaGallery`, `ProfileCard` |
| Hooks | camelCase com `use` | `useFileUpload`, `useScrollLock` |
| Services | kebab-case + `.service.ts` | `subscription.service.ts` |
| Server Actions | camelCase + `Action` | `loginAction`, `createSubscriptionAction` |
| Constantes | UPPER_SNAKE_CASE | `PLAN_DURATION_MS`, `DAYS_PT` |
| Arquivos de rota | kebab-case | `page.tsx`, `loading.tsx`, `error.tsx` |
| API routes | kebab-case | `upload-audio/route.ts` |

---

## Aliases de Import

```json
// tsconfig.json
"paths": { "@/*": ["./src/*"] }
```

Uso: `import { cn } from "@/lib/utils"`

---

## Próximos Passos (do REFACTOR_PLAN.md)

1. ✅ Segurança (webhook, headers, upload validation)
2. ✅ Estabilidade (error boundaries, loading states, constants)
3. ✅ Organização (services, hooks)
4. 🔲 Dividir componentes gigantes (media-gallery, reels-feed)
5. 🔲 Rate limiting
6. 🔲 Validação com Zod
7. 🔲 Design system (typography, cores, sombras)
8. 🔲 Performance (reduzir force-dynamic, lazy loading)
9. 🔲 Testes
