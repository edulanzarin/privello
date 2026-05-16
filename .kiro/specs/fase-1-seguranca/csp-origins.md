# CSP Origin Inventory — `fase-1-seguranca`

> Artefato da **Tarefa 7.1** (`tasks.md`). Insumo da Tarefa 7.2 (CSP `Report-Only` em `next.config.ts`). Este documento **não** ativa CSP — apenas inventaria as origens reais usadas pelo app e propõe valor recomendado por diretiva.
>
> Referências (AGENTS_Rule, área `headers`): `requirements.md > §4` e `design.md > Overview > AGENTS_Rule`.
> - `node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/headers.md`
> - `node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md`
> Decisão herdada: CSP estático em `Report-Only` via `next.config.ts > headers()` (sem nonce, sem `proxy.ts`). Aceita-se `'unsafe-inline'` em `script-src` e `style-src` nesta fase para preservar static rendering planejado pela Fase 3.

---

## 1. Metodologia

Inventário extraído de:

- **Scripts**: busca por `<script\s`, `next/script`, `dangerouslySetInnerHTML`, GTM/GA/Hotjar/Segment.
- **Estilos**: busca por `<link rel="stylesheet"`, `@import`, `fonts.googleapis.com`.
- **Fontes**: `next/font`, `@font-face`, `fonts.gstatic.com`.
- **Imagens**: `<Image src=`, `<img src=`, `URL.createObjectURL`, `readAsDataURL`, `next.config.ts > images.remotePatterns`, hosts em colunas de mídia do Prisma.
- **Conexões fetch/xhr/ws**: `fetch(`, `axios.`, `new WebSocket`, `new EventSource`.
- **Iframes/embeds**: `<iframe`.
- **Form actions externas**: `action="https://..."`.

Caminhos de evidência abaixo são `path:linha`. Pesquisa rodada em `2026-03-14` contra a árvore atual de `src/`, `prisma/`, `next.config.ts`, `src/app/globals.css`, `package.json`.

Repositório foi auditado em busca de SDKs de terceiros carregados via tag (MercadoPago Bricks, Google Sign-In, GA, GTM, Hotjar, Segment, Sentry, Recaptcha) e **nenhum** foi encontrado. A integração com MercadoPago é exclusivamente **server-side** (`src/lib/mercadopago.ts`), o checkout retorna `init_point` e o cliente faz `window.location.href = data.url` — uma **navegação top-level**, fora do escopo de `connect-src`/`frame-src` (CSP não restringe navegação top-level por padrão).

---

## 2. Achados por diretiva

### 2.1 `default-src`

- **Recomendado**: `'self'`
- **Justificativa**: nada que não seja explicitamente coberto por outra diretiva precisa ser permitido. `default-src 'self'` é o fallback mínimo seguro.

### 2.2 `script-src`

| Origem | Onde aparece | Necessária? |
|---|---|---|
| `'self'` | bundles do Next.js servidos pela própria origem | sim |
| `'unsafe-inline'` | scripts inline injetados pelo Next.js (hidratação, RSC payload) | sim — concessão registrada em `requirements.md > §4` |
| `'unsafe-eval'` | hot reload do React em dev | apenas em dev |

**Evidência de varredura**:

- `next/script`: nenhum uso (busca `next/script` em `src/**` retornou 0).
- `<script ` literal em JSX: nenhum uso.
- `dangerouslySetInnerHTML`: nenhum uso.
- GTM/GA/Hotjar/Segment/Recaptcha: nenhuma referência.

**Recomendado (prod)**: `script-src 'self' 'unsafe-inline'`
**Recomendado (dev)**: `script-src 'self' 'unsafe-inline' 'unsafe-eval'`

> Comentário a registrar em `next.config.ts`: `'unsafe-inline'` é mantido nesta fase porque a decisão do design é CSP estático sem nonce (ver `design.md > Overview > AGENTS_Rule`). `'unsafe-eval'` é restrito a dev (React Refresh / Fast Refresh).

### 2.3 `style-src`

| Origem | Onde aparece | Necessária? |
|---|---|---|
| `'self'` | `globals.css` bundlado via Tailwind/PostCSS | sim |
| `'unsafe-inline'` | classes do Tailwind/Next-Image geram `style=""` inline; React inline `style={{...}}` | sim — concessão registrada |

**Evidência**:

- `<link rel="stylesheet"`: nenhum uso (Tailwind é bundlado, não carregado de CDN).
- `@import` em CSS: apenas `@import "tailwindcss";` em `src/app/globals.css:1` — resolvido em build time, não vira request HTTP.
- `fonts.googleapis.com` (CSS de fonte externa): não utilizado.
- `url(...)` em CSS: nenhum uso (busca em `**/*.{css,scss}` retornou 0).

**Recomendado**: `style-src 'self' 'unsafe-inline'`

### 2.4 `img-src`

| Origem | Onde aparece | Necessária? |
|---|---|---|
| `'self'` | `/public/uploads/<profileId>/*.{jpg,png,webp,gif}` (uploads de perfis) e `/public/verification/<profileId>/*.png` (verificação) | sim |
| `data:` | `FileReader.readAsDataURL` em `src/app/conta/perfil/client-avatar-upload.tsx:25` (preview de avatar como data URL) | sim |
| `blob:` | `URL.createObjectURL` em `src/app/painel/stories/stories-manager.tsx:48`, `src/app/painel/perfil/perfil-editor.tsx:93`, `src/app/painel/midias/midias-manager.tsx:112`, `src/app/conta/verificacao/page.tsx:133`, `src/app/conta/onboarding/fotos/photo-uploader.tsx:25`, `src/app/cadastro/acompanhante/provider-register-form.tsx:143`, `src/components/painel/reels-manager.tsx:30` | sim |
| `https://picsum.photos` | placeholder de cover quando `profile.media[0]` é `undefined`, evidências em `src/lib/queries.ts:441,501`, `src/components/profile/profile-card.tsx:44`, `src/components/profile/profile-list-row.tsx:42`, `src/app/conta/perfil/favorites-list.tsx:56`; também em `prisma/seed.ts` e `scripts/seed-media-eduarda.ts` — gera URLs persistidas em DB | sim em produção (URLs persistidas via seed podem chegar ao cliente) |
| `https://commondatastorage.googleapis.com` | `scripts/seed-media-eduarda.ts:10–19` — vídeos de amostra usados como mídia inicial; thumbnail/poster pode vir desse host | sim se DB tiver seed |
| `https://storage.googleapis.com` | `prisma/seed.ts:79–92` — vídeos de verificação e reels de amostra | sim se DB tiver seed |
| `https://*.googleusercontent.com` | Hoje configurado em `next.config.ts:24` para tolerar avatares Google. **Sem evidência de uso runtime**: o único provider NextAuth ativo é `Credentials` (`src/lib/auth.ts:43–72`), não há OAuth Google. Mantido por compatibilidade futura. | opcional (manter por simetria com `next.config.ts`) |

**Recomendado**:
```
img-src 'self' data: blob:
        https://picsum.photos
        https://commondatastorage.googleapis.com
        https://storage.googleapis.com
        https://*.googleusercontent.com
```

> A whitelist coincide com `images.remotePatterns` proposta na Tarefa 3.2 (sem o `hostname: "**"`). `data:` e `blob:` são essenciais para previews de upload.

### 2.5 `connect-src`

| Origem | Onde aparece | Necessária? |
|---|---|---|
| `'self'` | todas as chamadas `/api/*` listadas abaixo | sim |
| `https://servicodados.ibge.gov.br` | `src/components/marketing/city-autocomplete.tsx:72` — fetch direto (client-side) ao endpoint público `/api/v1/localidades/municipios` do IBGE | sim |

**Evidência de fetch interno** (todas same-origin, cobertas por `'self'`):

- `src/app/_actions/track-view.ts` e várias outras Server Actions (chamada interna)
- `src/components/solicitar/solicitar-whatsapp-panel.tsx:119` → `/api/wa-click`
- `src/components/stories/story-bar.tsx:148,171` → `/api/stories/view`, `/api/stories/like`
- `src/components/reels/reels-feed.tsx:120,134,143,361` → `/api/media/like`, `/api/media/comment`, `/api/reels`
- `src/components/profile/media-gallery.tsx:103,135,145,161` → `/api/media/comment`, `/api/media/like`
- `src/components/profile/profile-story-cover.tsx:131,144` → `/api/stories/view`, `/api/stories/like`
- `src/components/painel/media-manager.tsx:126`, `src/app/painel/midias/midias-manager.tsx:128`, `src/app/painel/stories/stories-manager.tsx:63`, `src/app/painel/perfil/perfil-editor.tsx:128`, `src/app/conta/onboarding/fotos/photo-uploader.tsx:33` → `/api/upload`
- `src/app/painel/perfil/perfil-editor.tsx:144,152` → `/api/upload-audio`
- `src/app/conta/verificacao/page.tsx:138` → `/api/upload/verification`
- `src/components/marketing/city-autocomplete.tsx:47` → `/api/cities`
- `src/components/home/profile-section.tsx:24` → `/api/profiles/section`
- `src/app/buscar/buscar-form.tsx:22` → `/api/top-cities`
- `src/app/cadastro/sucesso/page.tsx:25` → `/api/cadastro/verificar`
- `src/app/avaliar/[slug]/page.tsx:22` → `/api/review`
- `src/app/painel/plano/upgrade-button.tsx:32,82`, `src/app/assinar/subscribe-button.tsx:17` → `/api/mp/checkout`
- `src/lib/hooks/use-file-upload.ts:52`, `src/lib/hooks/use-media-actions.ts:23,44`

**Não precisa** (negativos confirmados):

- WebSocket / EventSource: nenhum uso (busca por `new WebSocket`, `new EventSource` retornou 0).
- MercadoPago JS SDK no cliente: não carregado. O fluxo é **server-side** via `mercadopago` npm package (`src/lib/mercadopago.ts`). O cliente só faz `window.location.href = data.url` (top-level navigation, fora de `connect-src`).
- `wa.me` / WhatsApp: aparece em `<a href="https://wa.me/...">` (`src/lib/whatsapp-booking.ts:51`, `src/components/profile/whatsapp-button.tsx:22`) — top-level navigation via `<a target="_blank">`, fora de `connect-src`.
- `google.com` / `mercadopago.com` / outros: navegações top-level apenas, não fetches.

**Recomendado**:
```
connect-src 'self' https://servicodados.ibge.gov.br
```

> Surpresa do inventário: o **único** host externo de `connect-src` é o IBGE. O autocomplete de cidades faz uma chamada client-side direta a `https://servicodados.ibge.gov.br/api/v1/localidades/municipios?orderBy=nome` (`src/components/marketing/city-autocomplete.tsx:72`). Considerar mover essa chamada para um Route Handler proxy (`/api/cities/ibge`) em fase futura para fechar a CSP em `'self'` e evitar dependência cruzada do cliente com o serviço do IBGE — registrar como possível `OutOfScopeFinding` se vira tarefa.

### 2.6 `font-src`

| Origem | Onde aparece | Necessária? |
|---|---|---|
| `'self'` | `Inter` carregado via `next/font/google` em `src/app/layout.tsx:2,8` | sim |
| `data:` | tolerância para fontes embarcadas em CSS (algumas libs CSS podem inlinar woff via data URI) | sim (defensivo) |

**Importante**: `next/font/google` **baixa as fontes em build time e as serve da própria origem**. Não há request runtime para `fonts.googleapis.com` nem `fonts.gstatic.com` (verificado no docs: `node_modules/next/dist/docs/.../next-font.md`). Logo **não** precisa adicionar esses dois hosts em `font-src`.

- `@font-face`: nenhum uso direto em `src/**/*.css`.
- `fonts.googleapis.com`/`fonts.gstatic.com`: nenhuma referência.

**Recomendado**: `font-src 'self' data:`

### 2.7 `media-src`

| Origem | Onde aparece | Necessária? |
|---|---|---|
| `'self'` | `/uploads/<profileId>/*.{mp4,webm,mov}` (vídeos de mídia/stories) e `/uploads/<profileId>/audio-*.webm` (áudio gravado), `/api/upload-audio` retorna URLs same-origin | sim |
| `blob:` | `<video src={preview}>` onde `preview` vem de `URL.createObjectURL` em managers de stories/reels/midias | sim |
| `https://commondatastorage.googleapis.com` | seed `scripts/seed-media-eduarda.ts:10–19` — usado se vídeos seed estão em `Media.url` no DB | sim em ambientes seedados |
| `https://storage.googleapis.com` | seed `prisma/seed.ts:79–92` — vídeos de verificação e reels de amostra | sim em ambientes seedados |

**Evidência de uso**:

- `<video src={...}>`: `src/components/painel/media-manager.tsx:70,261`, `src/app/painel/stories/stories-manager.tsx:123,188`, `src/app/painel/midias/midias-manager.tsx:248,300,414`, `src/app/admin/verificacoes/[id]/page.tsx:26`, `src/components/painel/reels-manager.tsx:190`, `src/components/profile/media-gallery.tsx:204`
- `<audio src={...}>` / `new Audio(src)`: `src/components/profile/audio-play-button.tsx:16`, `src/components/profile/audio-player.tsx:40`, `src/app/painel/perfil/perfil-editor.tsx:232,272`

**Recomendado**:
```
media-src 'self' blob:
          https://commondatastorage.googleapis.com
          https://storage.googleapis.com
```

### 2.8 `frame-ancestors`

- **Recomendado**: `'self'`
- **Justificativa**: hoje `X-Frame-Options: SAMEORIGIN` em `next.config.ts:11`. `frame-ancestors 'self'` é o equivalente CSP-3 e cobre o mesmo caso. Nenhum parceiro embarca o app via iframe (não há acordo conhecido).

### 2.9 `frame-src` (e `child-src`)

- **Recomendado**: `'none'`
- **Evidência**: nenhuma `<iframe>` no `src/**` (busca retornou 0). MercadoPago checkout é redirecionamento top-level, não iframe (a integração não usa Bricks/CardForm embedados nesta fase).

### 2.10 `object-src`

- **Recomendado**: `'none'`
- **Justificativa**: nenhum `<object>`, `<embed>` ou `<applet>` no app. Bloquear é gratuito e cobre vetores de XSS via Flash/PDF embarcados.

### 2.11 `base-uri`

- **Recomendado**: `'self'`
- **Justificativa**: previne injeção de `<base href="evil.com">` que reescreveria URLs relativas.

### 2.12 `form-action`

- **Recomendado**: `'self'`
- **Justificativa**: nenhuma `<form action="https://...">` no código (busca por `action=["']https?://` retornou 0). Forms hoje submetem para Server Actions ou Route Handlers same-origin.

### 2.13 `upgrade-insecure-requests`

- **Recomendado**: incluir (sem valor; é um flag).
- **Justificativa**: força browser a reescrever requests `http://` para `https://` antes de enviá-los. Defensivo contra mídia legada com URL `http://` que tenha entrado no DB. Combina com HSTS (Tarefa 7.3).

---

## 3. Política CSP recomendada (Report-Only nesta fase)

Concatenação proposta para a Tarefa 7.2 (registrar como `Content-Security-Policy-Report-Only` em `next.config.ts > headers()`):

```text
default-src 'self';
script-src 'self' 'unsafe-inline' 'unsafe-eval';
style-src 'self' 'unsafe-inline';
img-src 'self' data: blob: https://picsum.photos https://commondatastorage.googleapis.com https://storage.googleapis.com https://*.googleusercontent.com;
connect-src 'self' https://servicodados.ibge.gov.br;
font-src 'self' data:;
media-src 'self' blob: https://commondatastorage.googleapis.com https://storage.googleapis.com;
frame-ancestors 'self';
frame-src 'none';
object-src 'none';
base-uri 'self';
form-action 'self';
upgrade-insecure-requests
```

Notas sobre o split dev/prod:

- `'unsafe-eval'` em `script-src` é necessário **em desenvolvimento** (React Refresh/Fast Refresh do Next compila on-the-fly via `eval`). Em produção ele pode ser removido se a janela de validação `Report-Only` não reportar violação.
- A Tarefa 7.2 deve construir a string CSP a partir de `process.env.NODE_ENV` e registrar em comentário a aceitação de `'unsafe-inline'` (decisão de design) e a remoção planejada de `'unsafe-eval'` em prod.

Comentário sugerido para o `next.config.ts` (a ser adicionado na Tarefa 7.2):

```ts
// CSP estático em Report-Only (sem nonce). 'unsafe-inline' é aceito nesta fase
// para preservar static rendering planejado pela Fase 3 — ver
// `requirements.md > §4` e `design.md > Overview > AGENTS_Rule` deste spec-filho.
// 'unsafe-eval' apenas em dev (React Fast Refresh).
// Origens listadas têm evidência em `.kiro/specs/fase-1-seguranca/csp-origins.md`.
// Consulta AGENTS_Rule em 2026-03-14:
//  - node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/headers.md
//  - node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md
```

---

## 4. Origens externas surpreendentes / candidatas a refactor

Itens que apareceram no inventário e merecem atenção da revisão antes de virar valor de produção:

1. **`https://servicodados.ibge.gov.br`** (`connect-src`): única dependência externa de fetch client-side. O autocomplete de cidades chama o IBGE direto do browser. Considerar mover para um Route Handler proxy (`/api/cities/ibge`) em fase futura — fecharia `connect-src 'self'` puro, com cache no servidor. **Não é tarefa desta fase**; registrar como possível `OutOfScopeFinding` se a ideia avança.

2. **`https://*.googleusercontent.com`** (`img-src`): listado em `next.config.ts:24` mas **sem uso runtime** detectado. NextAuth está com `Credentials` apenas. Recomenda-se manter por simetria com `images.remotePatterns` (Tarefa 3.2 vai mantê-lo na whitelist), mas reavaliar se Google OAuth não for adotado.

3. **`https://picsum.photos`** (`img-src`): **placeholder usado em produção** quando `profile.media[0]` é `undefined` (`src/lib/queries.ts:441,501`, `src/components/profile/profile-card.tsx:44`, `src/components/profile/profile-list-row.tsx:42`, `src/app/conta/perfil/favorites-list.tsx:56`). Não é só seed. Trocar por placeholder local SVG/PNG fecharia o host — fora do escopo desta fase.

4. **`commondatastorage.googleapis.com` e `storage.googleapis.com`** (`img-src` e `media-src`): URLs de **vídeos de seed** (`prisma/seed.ts`, `scripts/seed-media-eduarda.ts`). Em produção real (não seedada) provavelmente não são usados. Manter na whitelist permite ambientes de staging/dev que rodaram seed; em prod com banco limpo, podem ser removidos. Decisão pode ser tomada na Tarefa 7.2 conforme o ambiente de homologação.

5. **`https://www.google.com`** (`age-gate.tsx:53`): usado como link "sair" do age gate. É **navegação top-level via `<a href>`** — não entra em CSP `connect-src` nem `frame-src`. Nenhuma ação CSP necessária.

6. **`https://wa.me/`** (WhatsApp deeplinks): `src/lib/whatsapp-booking.ts:51`, `src/components/profile/whatsapp-button.tsx:22`. Top-level navigation com `target="_blank"`, fora de CSP `connect-src`/`frame-src`. Nenhuma ação CSP necessária.

7. **MercadoPago checkout** (`window.location.href = data.url` em `upgrade-button.tsx`, `subscribe-button.tsx`): redirecionamento top-level para `init_point` (URL gerada pelo SDK server-side). Fora do escopo de `connect-src`. **Se** futuramente virar Bricks (formulário inline ou iframe MP), serão necessários:
   - `frame-src https://www.mercadopago.com.br https://*.mercadopago.com` (se iframe)
   - `script-src https://sdk.mercadopago.com` (se SDK JS)
   - `connect-src https://api.mercadopago.com` (se chamadas client-side)
   Hoje **nenhum dos três** é necessário. Documentar a expectativa.

---

## 5. Observações finais para a Tarefa 7.2

- **Não ativar CSP nesta tarefa**. Apenas materializar a string acima como `Content-Security-Policy-Report-Only` em `next.config.ts > async headers()`, em `source: "/(.*)"`.
- **Janela de validação ≥ 7 dias** em produção (Requirement 7.3). A transição para `Content-Security-Policy` (sem `-Report-Only`) é **commit posterior**, fora do escopo desta entrega imediata (Tarefa 7.5 documenta isso).
- **HSTS** (Tarefa 7.3) entra no mesmo bloco `securityHeaders`, sem `preload`, `max-age=15552000; includeSubDomains`.
- Os quatro headers já aplicados (X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy) **não são alterados** (Requirement 7.5).
- Se durante a janela de `Report-Only` aparecerem violações em hosts não listados acima, **adicionar como linha adicional neste documento** (não sobrescrever a lista atual) e atualizar o `next.config.ts` em commit subsequente.
