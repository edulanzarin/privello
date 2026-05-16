# Public_Input_Endpoints — inventário Zod & origens externas

> Artefato das **Tarefas 4.3 e 3.1** do `tasks.md`. Insumo direto da Tarefa 4.2 (criar `src/lib/validation/<endpoint>.schema.ts`) e da Tarefa 3.2 (whitelist `images.remotePatterns`).
>
> Ver definições em `requirements.md > Glossary`:
> - **Public_Input_Endpoints** = Server Actions em `src/app/_actions/**` e `src/app/painel/_actions/**` + Route Handlers em `src/app/api/**` que aceitam body, formData ou query parametrizada.
> - **Image_Whitelist** = hosts efetivamente usados pelo app, replicados aqui a partir de `csp-origins.md > §2.4 img-src`.
>
> Convenção de erro herdada de `design.md > Components and Interfaces > 4`:
> - **Route Handler** → `400` com `result.error.flatten()` no body.
> - **Server Action** → objeto tipado `{ error: string, issues: ZodIssue[] }`.
> - Endpoints especiais (cron, dev, webhook MP) **não** ganham schema Zod nesta fase porque já são gateados por outro helper de auth/assinatura.

Varredura rodada em `2026-03-14` contra a árvore atual. Caminhos abaixo são `path:linha` da linha de declaração da função/handler.

---

## 1. Sumário

| Categoria | Total |
|---|---|
| Server Actions em `src/app/_actions/**` | 41 |
| Server Actions em `src/app/painel/_actions/**` | 10 |
| **Total Server Actions** | **51** |
| Route Handlers em `src/app/api/**` | 24 (arquivos) |
| Hosts externos `img-src` (Imagens externas) | 4 |

Server Actions sem input externo (não recebem `FormData` nem argumentos validáveis e portanto não precisam de schema): `logoutAction`, `getClientFavorites`, `publishProfile`, `createSubscriptionAction`, `getVerificationStatus`, `useFreeBoost` (6 no total).

Route Handlers sem input externo (apenas autenticação por sessão/header, sem body/query): `GET /api/cities`, `GET /api/top-cities`, `POST /api/provider/heartbeat`, `DELETE /api/upload-audio` (4 no total).

---

## 2. Server Actions — `src/app/_actions/**`

### 2.1 `admin-moderation.ts`

| Handler | Localização | Input shape (atual) | Schema (Tarefa 4.2) | Erro |
|---|---|---|---|---|
| `giveWarning` | `src/app/_actions/admin-moderation.ts:25` | `(profileId: string, reason: string)` — atualmente valida `reason.trim()` manualmente | `GiveWarningSchema` { `profileId`: cuid, `reason`: trim, min 1, max 500 } | `{ error, issues }` |
| `suspendProfile` | `src/app/_actions/admin-moderation.ts:64` | `(profileId: string, note: string)` | `SuspendProfileSchema` { `profileId`: cuid, `note`: trim, max 500 } | `{ error, issues }` |
| `unsuspendProfile` | `src/app/_actions/admin-moderation.ts:88` | `(profileId: string)` | `UnsuspendProfileSchema` { `profileId`: cuid } | `{ error, issues }` |
| `deleteAdminMedia` | `src/app/_actions/admin-moderation.ts:111` | `(mediaId: string)` | `DeleteAdminMediaSchema` { `mediaId`: cuid } | `{ error, issues }` |
| `toggleMediaVisibility` | `src/app/_actions/admin-moderation.ts:127` | `(mediaId: string)` | `ToggleMediaVisibilitySchema` { `mediaId`: cuid } | `{ error, issues }` |

### 2.2 `auth.ts`

| Handler | Localização | Input shape (atual) | Schema (Tarefa 4.2) | Erro |
|---|---|---|---|---|
| `loginAction` | `src/app/_actions/auth.ts:11` | `FormData` { `email`, `password`, `callbackUrl?` } | `LoginActionSchema` { `email`: email.toLowerCase, `password`: string min 1, `callbackUrl`: string optional } | `{ error, issues }` |
| `registerClientAction` | `src/app/_actions/auth.ts:42` | `FormData` { `name`, `slug`, `email`, `password` } — valida regex slug e min length manualmente | `SignupClientSchema` { `name`: trim min 2 max 60, `slug`: regex `^[a-z0-9][a-z0-9-]*$` min 3, `email`: email, `password`: min 8 } | `{ error, issues }` |
| `registerProviderAction` | `src/app/_actions/auth.ts:73` | `FormData` { `email`, `password`, `displayName`, `slug`, `age`, `citySlug`, `cityQuery`, `bio`, `tagline?`, `whatsapp?`, `heightCm?`, `dressSize?`, `hair?`, `eyes?`, `languages?`, `servesMen`/`servesWomen`/`servesCouples`/`hasOwnPlace`/`homeVisit`/`travelsNational`/`travelsInternational` (booleanos via `=== "1"`), `paymentMethods?`, `durationsJson` (JSON string), `photo` (File) } | `SignupProviderSchema` { ...campos acima com tipos coercidos; `durations` validado via `z.array(DurationSchema)` após `JSON.parse`; `photo` validado por tipo MIME e tamanho } | `{ error, issues }` |

### 2.3 `client-profile.ts`

| Handler | Localização | Input shape (atual) | Schema (Tarefa 4.2) | Erro |
|---|---|---|---|---|
| `uploadClientAvatarAction` | `src/app/_actions/client-profile.ts:11` | `FormData` { `avatar`: File ≤ 5MB; MIME ∈ JPG/PNG/WebP } | `UploadClientAvatarSchema` { `avatar`: `z.instanceof(File)` + checks de MIME e size } | `{ error, issues }` |
| `updateClientNameAction` | `src/app/_actions/client-profile.ts:43` | `FormData` { `name` trim, 2–60 chars } | `UpdateClientNameSchema` { `name`: trim min 2 max 60 } | `{ error, issues }` |
| `updateClientSlugAction` | `src/app/_actions/client-profile.ts:60` | `FormData` { `slug` trim lowercase, 3–30 chars, regex } | `UpdateClientSlugSchema` { `slug`: trim, lowercase, regex `^[a-z0-9][a-z0-9-]*[a-z0-9]$`, 3–30 chars } | `{ error, issues }` |

### 2.4 `favorites.ts`

| Handler | Localização | Input shape (atual) | Schema (Tarefa 4.2) | Erro |
|---|---|---|---|---|
| `toggleFavorite` | `src/app/_actions/favorites.ts:7` | `(profileId: string)` | `ToggleFavoriteSchema` { `profileId`: cuid } | `{ error, issues }` |
| `getFavoriteStatus` | `src/app/_actions/favorites.ts:38` | `(profileId: string)` | `GetFavoriteStatusSchema` { `profileId`: cuid } | retorna `false` em parse fail (mantém contrato silencioso) |
| `getClientFavorites` | `src/app/_actions/favorites.ts:46` | sem input | _N/A_ | _N/A_ |

### 2.5 `logout.ts`

| Handler | Localização | Input shape (atual) | Schema (Tarefa 4.2) | Erro |
|---|---|---|---|---|
| `logoutAction` | `src/app/_actions/logout.ts:5` | sem input | _N/A_ | _N/A_ |

### 2.6 `onboarding.ts`

| Handler | Localização | Input shape (atual) | Schema (Tarefa 4.2) | Erro |
|---|---|---|---|---|
| `saveOnboardingPerfil` | `src/app/_actions/onboarding.ts:21` | `FormData` { `cityQuery`, `citySlug`, `bio`, `tagline?`, `whatsappPhone?`, `heightCm?` (number), `dressSize?`, `hair?`, `eyes?`, `languages?`, `servesMen`/`servesWomen`/`servesCouples`/`hasOwnPlace`/`homeVisit`/`travelsNational`/`travelsInternational` (booleanos via `=== "on"`), `_from?` } | `OnboardingPerfilSchema` (espelha campos com `z.coerce.boolean()` para checkbox e `z.coerce.number()` para `heightCm`) | `{ error, issues }` |
| `addPhotoByUrl` | `src/app/_actions/onboarding.ts:79` | `FormData` { `url`, `isPublic?` } | `AddPhotoByUrlSchema` { `url`: URL válida, `isPublic`: `z.coerce.boolean()` default true } | `{ error, issues }` |
| `removePhoto` | `src/app/_actions/onboarding.ts:97` | `(mediaId: string)` | `RemovePhotoSchema` { `mediaId`: cuid } | `{ error, issues }` |
| `setCoverPhoto` | `src/app/_actions/onboarding.ts:114` | `(mediaId: string)` | `SetCoverPhotoSchema` { `mediaId`: cuid } | `{ error, issues }` |
| `updateMediaCaption` | `src/app/_actions/onboarding.ts:121` | `(mediaId: string, caption: string)` | `UpdateMediaCaptionSchema` { `mediaId`: cuid, `caption`: trim, max 500 } | `{ error, issues }` |
| `saveOnboardingValores` | `src/app/_actions/onboarding.ts:141` | `FormData` { `paymentMethods?`, `enabled_<key>` para 7 durações, `price_<key>` (number) por duração } | `OnboardingValoresSchema` (transformação que coleta tuplas `(key, enabled, price)` em `z.array(DurationOptionSchema)` com `priceBrl` ≥ 1) | `{ error, issues }` |
| `publishProfile` | `src/app/_actions/onboarding.ts:184` | `(_?: FormData)` — só checa estado da DB | _N/A_ | _N/A_ |

### 2.7 `password-reset.ts`

| Handler | Localização | Input shape (atual) | Schema (Tarefa 4.2) | Erro |
|---|---|---|---|---|
| `requestPasswordReset` | `src/app/_actions/password-reset.ts:15` | `FormData` { `email` } | `RequestPasswordResetSchema` { `email`: email.toLowerCase trim } | `{ error, issues }` |
| `resetPassword` | `src/app/_actions/password-reset.ts:46` | `FormData` { `token`, `password` (≥8), `confirm` } com refinement `password === confirm` | `ResetPasswordSchema` { `token`: string min 1, `password`: min 8, `confirm`: min 8 } com `.refine(p => p.password === p.confirm)` | `{ error, issues }` |

### 2.8 `reels.ts`

| Handler | Localização | Input shape (atual) | Schema (Tarefa 4.2) | Erro |
|---|---|---|---|---|
| `createReel` | `src/app/_actions/reels.ts:17` | `FormData` { `url`, `caption?`, `isPrivate?` } | `CreateReelSchema` { `url`: URL, `caption`: trim max 500 nullable, `isPrivate`: `z.coerce.boolean()` } | `{ error, issues }` |
| `deleteReel` | `src/app/_actions/reels.ts:42` | `(mediaId: string)` | `DeleteReelSchema` { `mediaId`: cuid } | `{ error, issues }` |
| `toggleReelPrivacy` | `src/app/_actions/reels.ts:48` | `(mediaId: string)` | `ToggleReelPrivacySchema` { `mediaId`: cuid } | `{ error, issues }` |

### 2.9 `stories.ts`

| Handler | Localização | Input shape (atual) | Schema (Tarefa 4.2) | Erro |
|---|---|---|---|---|
| `createStory` | `src/app/_actions/stories.ts:17` | `FormData` { `mediaUrl`, `caption?`, `mediaType?` (default `IMAGE`) } | `CreateStorySchema` { `mediaUrl`: URL, `caption`: trim max 500 nullable, `mediaType`: enum `["IMAGE", "VIDEO"]` default `IMAGE` } | `{ error, issues }` |
| `deleteStory` | `src/app/_actions/stories.ts:32` | `FormData` { `storyId` } | `DeleteStorySchema` { `storyId`: cuid } | `{ error, issues }` |

### 2.10 `subscription.ts`

| Handler | Localização | Input shape (atual) | Schema (Tarefa 4.2) | Erro |
|---|---|---|---|---|
| `createSubscriptionAction` | `src/app/_actions/subscription.ts:7` | sem input externo | _N/A_ | _N/A_ |

### 2.11 `support.ts`

| Handler | Localização | Input shape (atual) | Schema (Tarefa 4.2) | Erro |
|---|---|---|---|---|
| `openTicket` | `src/app/_actions/support.ts:18` | `FormData` { `subject`, `text` } | `OpenTicketSchema` { `subject`: trim min 1 max 120, `text`: trim min 1 max 5000 } | `{ error, issues }` |
| `replyTicket` | `src/app/_actions/support.ts:38` | `(ticketId: string, text: string)` | `ReplyTicketSchema` { `ticketId`: cuid, `text`: trim min 1 max 5000 } | `{ error, issues }` |
| `closeTicket` | `src/app/_actions/support.ts:84` | `(ticketId: string)` | `CloseTicketSchema` { `ticketId`: cuid } | `{ error, issues }` |
| `reopenTicket` | `src/app/_actions/support.ts:94` | `(ticketId: string)` | `ReopenTicketSchema` { `ticketId`: cuid } | `{ error, issues }` |

### 2.12 `track-view.ts`

| Handler | Localização | Input shape (atual) | Schema (Tarefa 4.2) | Erro |
|---|---|---|---|---|
| `trackProfileView` | `src/app/_actions/track-view.ts:15` | `(profileId: string)` | `TrackProfileViewSchema` { `profileId`: cuid } | retorno silencioso (try/catch existente, mantém contrato) |

### 2.13 `verification.ts`

| Handler | Localização | Input shape (atual) | Schema (Tarefa 4.2) | Erro |
|---|---|---|---|---|
| `submitVerificationCase` | `src/app/_actions/verification.ts:17` | `FormData` { `documentFrontUrl`, `documentBackUrl`, `selfieUrl`, `videoUrl?`, `documentType?` (default `RG`) } | `SubmitVerificationCaseSchema` { `documentFrontUrl`/`documentBackUrl`/`selfieUrl`: URL min 1, `videoUrl`: URL nullable, `documentType`: enum `["RG", "CNH", "PASSAPORTE"]` default `RG` } | `{ error, issues }` |
| `getVerificationStatus` | `src/app/_actions/verification.ts:49` | sem input | _N/A_ | _N/A_ |
| `approveVerification` | `src/app/_actions/verification.ts:69` | `(caseId: string)` | `ApproveVerificationSchema` { `caseId`: cuid } | `{ error, issues }` |
| `rejectVerification` | `src/app/_actions/verification.ts:88` | `(caseId: string, note?: string)` | `RejectVerificationSchema` { `caseId`: cuid, `note`: trim max 1000 nullable } | `{ error, issues }` |
| `adminToggleVerification` | `src/app/_actions/verification.ts:111` | `(profileId: string)` | `AdminToggleVerificationSchema` { `profileId`: cuid } | `{ error, issues }` |
| `adminSetPlan` | `src/app/_actions/verification.ts:118` | `(profileId: string, plan: string)` | `AdminSetPlanSchema` { `profileId`: cuid, `plan`: enum `["ESSENCIAL", "DESTAQUE", "PREMIUM"]` } | `{ error, issues }` |

---

## 3. Server Actions — `src/app/painel/_actions/**`

### 3.1 `provider-settings.ts`

| Handler | Localização | Input shape (atual) | Schema (Tarefa 4.2) | Erro |
|---|---|---|---|---|
| `createStory` | `src/app/painel/_actions/provider-settings.ts:9` | `FormData` { `mediaUrl`, `caption?` } | `PainelCreateStorySchema` { `mediaUrl`: URL, `caption`: trim max 500 nullable } | `{ error, issues }` |
| `deleteStory` | `src/app/painel/_actions/provider-settings.ts:23` | `FormData` { `storyId` } | `PainelDeleteStorySchema` { `storyId`: cuid } | `{ error, issues }` |
| `saveAvailabilityWindows` | `src/app/painel/_actions/provider-settings.ts:39` | `FormData` { `wd_<0..6>_open` (checkbox), `wd_<0..6>_start` (HH:MM), `wd_<0..6>_end` (HH:MM) } | `SaveAvailabilityWindowsSchema` { array de 7 dias com `weekday: 0–6`, `open: boolean`, `startTime`/`endTime`: regex `^\d{2}:\d{2}$` validando `end > start` quando `open` } | `{ error, issues }` |
| `saveDurationOptions` | `src/app/painel/_actions/provider-settings.ts:69` | `FormData` { `dur_<i>_minutes`, `dur_<i>_label?`, `dur_<i>_price` para `i` em `0..11`, `paymentMethods?` } | `SaveDurationOptionsSchema` (parse iterativo que filtra rows válidas, `minutes` 15–2880, `priceBrl` ≥ 0) | `{ error, issues }` |
| `updateFinancialRecord` | `src/app/painel/_actions/provider-settings.ts:108` | `FormData` { `recordId`, `clientLabel`, `durationLabel`, `locationLabel`, `paymentLabel`, `amountBrl` (number), `isNoShow?` } | `UpdateFinancialRecordSchema` { `recordId`: cuid, `clientLabel`: trim min 1 max 120, `durationLabel`/`locationLabel`/`paymentLabel`: trim max 120, `amountBrl`: int positivo, `isNoShow`: `z.coerce.boolean()` } | `{ error, issues }` |
| `deleteFinancialRecord` | `src/app/painel/_actions/provider-settings.ts:130` | `FormData` { `recordId` } | `DeleteFinancialRecordSchema` { `recordId`: cuid } | `{ error, issues }` |
| `changeHandle` | `src/app/painel/_actions/provider-settings.ts:142` | `FormData` { `handle` (regex `^[a-z0-9_-]{3,30}$` após strip de `@`) } | `ChangeHandleSchema` { `handle`: transform para lowercase, regex `^[a-z0-9_-]{3,30}$` } | `{ error, issues }` |
| `addFinancialRecord` | `src/app/painel/_actions/provider-settings.ts:160` | `FormData` { `clientLabel`, `durationLabel`, `locationLabel`, `paymentLabel`, `amountBrl` (number), `isNoShow?`, `notes?` } | `AddFinancialRecordSchema` (mesmos campos do update sem `recordId` + `notes`: trim max 2000 nullable) | `{ error, issues }` |
| `useFreeBoost` | `src/app/painel/_actions/provider-settings.ts:191` | sem input | _N/A_ | _N/A_ |
| `devActivatePlan` | `src/app/painel/_actions/provider-settings.ts:213` | `FormData` { `tier` ∈ `["ESSENCIAL", "DESTAQUE", "PREMIUM"]` } — gateado por `NODE_ENV !== "production"` | `DevActivatePlanSchema` { `tier`: enum `["ESSENCIAL", "DESTAQUE", "PREMIUM"]` } | `{ error, issues }` |

---

## 4. Route Handlers — `src/app/api/**`

### 4.1 Handlers com schema Zod a aplicar

| Path | Método | Localização | Input atual | Schema (Tarefa 4.2) | Erro |
|---|---|---|---|---|---|
| `/api/cadastro/iniciar` | POST | `src/app/api/cadastro/iniciar/route.ts:23` | `req.json()` { `email`, `password`, `displayName`, `slug`, `age`, `citySlug`, `cityQuery`, `bio`, `tagline?`, `whatsapp?`, `heightCm?`, `dressSize?`, `hair?`, `eyes?`, `languages`, `servesMen`/`servesWomen`/`servesCouples`/`hasOwnPlace`/`homeVisit`/`travelsNational`/`travelsInternational` (booleanos), `paymentMethods?`, `durations`: array, `tier`: string } | `SignupBodySchema` (espelha o body com `tier`: enum, `age`: int 18–99, `password`: min 8, `slug`: regex, `durations`: `z.array(DurationOptionSchema)` exigindo entry com `minutes === 60` e `priceBrl ≥ 50`) | `400` + `result.error.flatten()` |
| `/api/cadastro/verificar` | GET | `src/app/api/cadastro/verificar/route.ts:4` | `searchParams.s` (slug) | `VerificarCadastroQuerySchema` { `s`: trim, lowercase, regex `^[a-z0-9][a-z0-9-]*$` } | `400` + `flatten()` |
| `/api/cities/[slug]/bairros` | GET | `src/app/api/cities/[slug]/bairros/route.ts:4` | `params.slug` | `BairrosParamsSchema` { `slug`: trim, lowercase, regex `^[a-z0-9][a-z0-9-]*$` } | `400` + `flatten()` |
| `/api/media/comment` | GET | `src/app/api/media/comment/route.ts:6` | `searchParams.mediaId` | `CommentListQuerySchema` { `mediaId`: cuid } | `400` + `flatten()` |
| `/api/media/comment` | POST | `src/app/api/media/comment/route.ts:19` | `req.json()` { `mediaId`, `text` } com check de comprimento (≤500) manual | `CommentBodySchema` { `mediaId`: cuid, `text`: trim min 1 max 500 } | `400` + `flatten()` |
| `/api/media/comment` | DELETE | `src/app/api/media/comment/route.ts:39` | `req.json()` { `commentId` } | `CommentDeleteBodySchema` { `commentId`: cuid } | `400` + `flatten()` |
| `/api/media/like` | POST | `src/app/api/media/like/route.ts:5` | `req.json()` { `mediaId`, `liked`: boolean } | `MediaLikeBodySchema` { `mediaId`: cuid, `liked`: boolean } | `400` + `flatten()` |
| `/api/mp/checkout` | POST | `src/app/api/mp/checkout/route.ts:27` | `req.json()` { `type`: string, `tier?`: string } | `CheckoutBodySchema` { `type`: enum `["subscription", "plan", "boost"]`, `tier`: enum `["ESSENCIAL", "DESTAQUE", "PREMIUM"]` opcional, refinement: `tier` obrigatório se `type === "plan"` } | `400` + `flatten()` |
| `/api/profiles/check` | GET | `src/app/api/profiles/check/route.ts:4` | `searchParams.slug` | `ProfilesCheckQuerySchema` { `slug`: lowercase trim, regex `^[a-z0-9][a-z0-9-]*$` } | `400` + `flatten()` |
| `/api/profiles/section` | GET | `src/app/api/profiles/section/route.ts:6` | `searchParams.type` ∈ `["hot","boosted"]`, `searchParams.offset` (int ≥ 0) | `ProfilesSectionQuerySchema` { `type`: enum, `offset`: `z.coerce.number().int().min(0).default(0)` } | `400` + `flatten()` |
| `/api/reels` | GET | `src/app/api/reels/route.ts:6` | `searchParams.cityId?`, `profileId?`, `cursor?`, `limit?` (int) | `ReelsQuerySchema` { `cityId`: cuid optional, `profileId`: cuid optional, `cursor`: string optional, `limit`: `z.coerce.number().int().min(1).max(50).default(10)` } | `400` + `flatten()` |
| `/api/review` | POST | `src/app/api/review/route.ts:6` | `req.json()` { `profileSlug`, `rating`: 1–5, `comment?` } | `ReviewBodySchema` { `profileSlug`: trim regex slug, `rating`: int 1–5, `comment`: trim max 1000 nullable } | `400` + `flatten()` |
| `/api/stories/like` | POST | `src/app/api/stories/like/route.ts:5` | `req.json()` { `storyId` } | `StoriesLikeBodySchema` { `storyId`: cuid } | `400` + `flatten()` |
| `/api/stories/view` | POST | `src/app/api/stories/view/route.ts:5` | `req.json()` { `storyId` } | `StoriesViewBodySchema` { `storyId`: cuid } | `400` + `flatten()` |
| `/api/upload` | POST | `src/app/api/upload/route.ts:13` | `req.formData()` { `file`: File, `isPublic?` (default true), `caption?`, `mediaType?` (default `IMAGE`), `purpose?` (`""` ou `"story"`) } com validações manuais de Content-Length, MIME e tamanho | `UploadBodySchema` { `file`: `z.instanceof(File)` (mantém checks de MIME/size existentes — Tarefa 4.4 não duplica isso no Zod), `isPublic`: `z.coerce.boolean()` default true, `caption`: trim max 500 nullable, `mediaType`: enum `["IMAGE", "VIDEO", "REEL"]` default `IMAGE`, `purpose`: enum `["", "story"]` optional } | `400` + `flatten()` |
| `/api/upload/verification` | POST | `src/app/api/upload/verification/route.ts:12` | `req.formData()` { `file`: File } com validações de tamanho/MIME manuais | `UploadVerificationBodySchema` { `file`: `z.instanceof(File)` (checks de MIME/size existentes seguem no handler) } | `400` + `flatten()` |
| `/api/upload-audio` | POST | `src/app/api/upload-audio/route.ts:10` | `req.formData()` { `file`: File } com checks de MIME/size manuais | `UploadAudioBodySchema` { `file`: `z.instanceof(File)` } | `400` + `flatten()` |
| `/api/wa-click` | POST | `src/app/api/wa-click/route.ts:5` | `req.json()` { `profileId`, `source?` } | `WaClickBodySchema` { `profileId`: cuid, `source`: trim max 50 default `"perfil"` } | `400` + `flatten()` |

### 4.2 Handlers fora do escopo Zod (gateados por outro mecanismo)

| Path | Método | Localização | Mecanismo | Justificativa |
|---|---|---|---|---|
| `/api/cron/expire-plans` | GET | `src/app/api/cron/expire-plans/route.ts:44` | `verifyCronSecret(req, { transitionEndsAt })` | Body/query são interpretados pelo helper de auth de cron. Resposta de erro: `401` sem corpo (contrato de `cron-auth`). Não recebe input de usuário. |
| `/api/cron/reset-hot` | GET | `src/app/api/cron/reset-hot/route.ts:44` | `verifyCronSecret(req, { transitionEndsAt })` | Idem. |
| `/api/dev/activate-plans` | GET | `src/app/api/dev/activate-plans/route.ts:8` | `requireAdminOrToken(req)` | Sem body/query do usuário. Resposta de erro: `404` em prod, `401` em dev (contrato de `dev-auth`). |
| `/api/dev/reset` | GET | `src/app/api/dev/reset/route.ts:8` | `requireAdminOrToken(req)` | Idem. |
| `/api/mp/webhook` | POST | `src/app/api/mp/webhook/route.ts:50` | HMAC-SHA256 (`verifyMPSignature`) + lookup `Payment.get` | Body é controlado pela API do MercadoPago e validado por assinatura. Listado em `requirements.md > §2` como já entregue (HMAC) — **fora do escopo desta fase**. Eventual schema Zod para o body do payment fica como melhoria futura, não EAR atual. |

### 4.3 Handlers sem input externo (apenas auth/sem body)

| Path | Método | Localização | Observação |
|---|---|---|---|
| `/api/cities` | GET | `src/app/api/cities/route.ts:6` | sem input |
| `/api/top-cities` | GET | `src/app/api/top-cities/route.ts:4` | sem input |
| `/api/provider/heartbeat` | POST | `src/app/api/provider/heartbeat/route.ts:5` | apenas sessão NextAuth |
| `/api/upload-audio` | DELETE | `src/app/api/upload-audio/route.ts:61` | apenas sessão; sem body |

---

## 5. Imagens externas (Tarefa 3.1)

> Replicado de `csp-origins.md > §2.4 img-src` (consulta em `2026-03-14`). Hosts efetivamente usados pelo app via `<Image src=`/`<img src=`/seed do Prisma. Os mesmos hosts entram em `next.config.ts > images.remotePatterns` na Tarefa 3.2 (substituindo o curinga `hostname: "**"`).

| Host | Tipo de uso | Evidência (path:linha) |
|---|---|---|
| `picsum.photos` | Placeholder de cover quando `profile.media[0]` é `undefined`; também em scripts de seed. URLs persistidas no DB chegam ao cliente em produção. | `src/lib/queries.ts:441`, `src/lib/queries.ts:501`, `src/components/profile/profile-card.tsx:44`, `src/components/profile/profile-list-row.tsx:42`, `src/app/conta/perfil/favorites-list.tsx:56`, `prisma/seed.ts`, `scripts/seed-media-eduarda.ts` |
| `commondatastorage.googleapis.com` | Vídeos de amostra (seed). Thumbnails/posters podem vir desse host. | `scripts/seed-media-eduarda.ts:10–19` |
| `storage.googleapis.com` | Vídeos de verificação e reels de amostra (seed). | `prisma/seed.ts:79–92` |
| `*.googleusercontent.com` | Configurado em `next.config.ts:24` para tolerar avatares Google. **Sem evidência runtime atual** (NextAuth está com `Credentials` apenas, não há OAuth Google). Mantido por compatibilidade futura. | `next.config.ts:24` |

Total: **4 hosts externos** mapeados para `img-src` e para a whitelist de `images.remotePatterns`. Nenhum host adicional surgiu nesta inventariação.

---

## 6. Notas de execução para a Tarefa 4.2

- Schemas devem ser criados em `src/lib/validation/<arquivo>.schema.ts` (um arquivo por endpoint ou um arquivo agrupado por superfície funcional, à critério da execução), com re-export nomeado em `src/lib/validation/index.ts`.
- Tipos inferidos via `z.infer<typeof Schema>` substituem declarações `as` no consumidor (Requirement 4.4).
- Para `FormData`, usar `z.preprocess` ou helpers utilitários para coercer strings/booleans antes do schema base. Padrão sugerido: criar `src/lib/validation/_form-utils.ts` com `formDataToObject(fd)` e `coerceCheckbox`/`coerceNumber`/`coerceJson` reutilizáveis entre actions.
- **Idempotência (Property 4 do `design.md`)**: schemas **não devem** usar `.transform()` que altere shape em cada chamada. `.trim()`, `.toLowerCase()` e parses idempotentes estão liberados.
- Validações manuais existentes (regex de slug, min lengths, enums) viram schema; o handler/action passa a chamar `Schema.safeParse(rawInput)` e devolver no formato declarado na coluna **Erro** acima.
