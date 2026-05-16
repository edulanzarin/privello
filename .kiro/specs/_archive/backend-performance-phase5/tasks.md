# Implementation Plan: Backend Performance Phase 5

## Overview

This plan implements the Phase 5 performance optimizations for Privello in incremental steps. The order is: foundational types/validators → rate limiter → service layer → auth guard → cache layer (Next.js 16 `use cache` + `cacheLife` + `cacheTag`) → skeleton components → database indices → frontend optimizations (lazy loading, memoization, virtual scroll, Suspense) → bundle optimization → SEO → dead code elimination → performance documentation. Each step builds on the previous, ensuring no orphaned code.

**Important**: This project uses Next.js 16 with Cache Components (`cacheComponents: true` in `next.config.ts`). The new cache model uses `'use cache'` directive + `cacheLife()` + `cacheTag()` for caching, and `updateTag()`/`revalidateTag()` for invalidation. Always check `node_modules/next/dist/docs/` before writing cache-related code.

## Tasks

- [ ] 1. Set up foundational types and service layer interfaces
  - [ ] 1.1 Create service result types and shared interfaces
    - Create `src/lib/services/types.ts` with `ServiceResult<T>`, `ServiceError`, `PaginatedResult<T>`, `ProfileCard`, `ProfileDetail` types
    - Define error codes: `NOT_FOUND`, `VALIDATION`, `FORBIDDEN`, `CONFLICT`, `INTERNAL`
    - Export all types for use across services
    - _Requirements: 5.4, 5.7, 6.4_

  - [ ] 1.2 Create Zod validator infrastructure
    - Create `src/lib/validators/validate.ts` with generic `validate<T>()` function
    - Define `ValidationResult<T>` and `ValidationError` types
    - Ensure all validation errors include field path, rule code, and expected constraint
    - _Requirements: 3.1, 3.2, 3.6, 3.8_

  - [ ] 1.3 Create Zod schemas for all domains
    - Create `src/lib/validators/profile.schema.ts` (profileCreateSchema, profileUpdateSchema)
    - Create `src/lib/validators/user.schema.ts` (userRegisterSchema)
    - Create `src/lib/validators/review.schema.ts` (reviewCreateSchema)
    - Create `src/lib/validators/media.schema.ts` (mediaUploadSchema)
    - Create `src/lib/validators/financial.schema.ts` (financialRecordSchema)
    - Create `src/lib/validators/index.ts` barrel export with inferred types
    - Enforce constraints: displayName max 100, slug max 60 `^[a-z0-9-]+$`, age 18-99, bio max 2000, priceHour 1-99999900, email RFC 5322, phone `^\+\d{10,15}$`, rating 1-5
    - _Requirements: 3.3, 3.5_

  - [ ]* 1.4 Write property tests for schema constraint enforcement
    - **Property 7: Schema Constraint Enforcement**
    - Test that values exceeding max length, outside numeric range, or violating format regex are rejected
    - Test that values within bounds are accepted
    - Use fast-check with 100+ iterations
    - **Validates: Requirements 3.3**

  - [ ]* 1.5 Write property tests for validation error completeness
    - **Property 6: Validation Error Completeness**
    - Test that N invalid fields produce exactly N error entries with field path, rule code, and expected value
    - **Validates: Requirements 3.2, 3.6, 3.8**

- [ ] 2. Implement rate limiter
  - [ ] 2.1 Create sliding window rate limiter
    - Create `src/lib/rate-limiter.ts` with `createRateLimiter(config)` factory
    - Implement sliding window algorithm using `Map<string, number[]>` for timestamps
    - Implement `check(key): RateLimitResult` and `reset(key): void`
    - Create pre-configured instances: `loginLimiter` (5/15min), `uploadLimiter` (20/1hr), `waClickLimiter` (10/1hr)
    - Include periodic cleanup of expired entries to prevent memory leaks
    - _Requirements: 4.1, 4.2, 4.3_

  - [ ]* 2.2 Write property tests for rate limiting enforcement
    - **Property 8: Rate Limiting Enforcement**
    - Test that (M+1)th request within window W is rejected, first M are allowed
    - Use fast-check with arbitrary maxRequests and windowMs values
    - **Validates: Requirements 4.1, 4.2, 4.3**

- [ ] 3. Implement auth guard
  - [ ] 3.1 Create auth guard utilities
    - Create `src/lib/auth-guard.ts` with `requireAuth()` and `requireAdmin()` functions
    - `requireAuth()` checks session, redirects to `/entrar` if missing
    - `requireAdmin()` checks role is ADMIN or MODERATOR, redirects to `/` otherwise
    - No technical error details exposed in redirects
    - _Requirements: 4.4, 4.5, 4.7_

  - [ ]* 3.2 Write property tests for authorization enforcement
    - **Property 9: Authorization Enforcement**
    - Test that unauthenticated calls redirect to `/entrar` without writes
    - Test that non-admin calls to admin actions redirect to `/`
    - **Validates: Requirements 4.4, 4.5**

- [ ] 4. Checkpoint - Ensure foundational layers compile and tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Implement service layer
  - [ ] 5.1 Create ProfileService
    - Create `src/lib/services/profile.service.ts` with `createProfileService(db?)` factory
    - Implement `getBySlug(slug, options?)` — max 12 media items, offset-based pagination, `mediaOffset < 0` treated as 0
    - Implement `listForCity(options)` — SQL ordering via Prisma `orderBy` (featuredUntil desc nulls last, planTier weight, ratingAvg desc), no in-memory sort
    - Implement `getSectionProfiles(type, offset?, limit?)` — optimized query with `offset + limit + 1` pattern
    - Use explicit `select` limiting relation fields to ≤10 per relation
    - Return `ServiceResult<T>` pattern, never throw exceptions
    - Accept `PrismaClient` as optional parameter for DI/testing
    - _Requirements: 1.1, 1.2, 1.3, 1.6, 1.7, 5.1, 5.2, 5.5, 5.7, 10.7_

  - [ ]* 5.2 Write property tests for media pagination invariant
    - **Property 1: Media Pagination Invariant**
    - Test that getBySlug returns at most 12 media items for any mediaOffset
    - Test that negative mediaOffset produces same result as 0
    - **Validates: Requirements 1.1, 1.7**

  - [ ]* 5.3 Write property tests for profile ordering correctness
    - **Property 2: Profile Ordering Correctness**
    - Test that featured profiles appear before non-featured
    - Test planTier ordering within groups (PREMIUM > DESTAQUE > ESSENCIAL)
    - **Validates: Requirements 1.2, 1.3**

  - [ ] 5.4 Create MediaService
    - Create `src/lib/services/media.service.ts` with `createMediaService(db?)` factory
    - Migrate media-related logic from queries.ts
    - Implement upload validation integration with Zod schemas
    - Return `ServiceResult<T>` pattern
    - _Requirements: 5.1, 5.3, 5.4_

  - [ ] 5.5 Create SubscriptionService
    - Create `src/lib/services/subscription.service.ts` with `createSubscriptionService(db?)` factory
    - Migrate subscription/plan logic from queries.ts and server actions
    - Return `ServiceResult<T>` pattern
    - _Requirements: 5.1, 5.3, 5.4_

  - [ ] 5.6 Create CityService and StoryService
    - Create `src/lib/services/city.service.ts` with `createCityService(db?)` factory
    - Create `src/lib/services/story.service.ts` with `createStoryService(db?)` factory
    - Implement `listStoriesForCity` using Prisma `distinct` by profileId (no manual Map grouping)
    - _Requirements: 1.4, 5.1, 5.3_

  - [ ]* 5.7 Write property tests for stories distinct by profile
    - **Property 3: Stories Distinct by Profile**
    - Test that each profileId appears at most once in results
    - Test total groups equals distinct profiles with non-expired stories
    - **Validates: Requirements 1.4**

  - [ ] 5.8 Create VerificationService, FinancialService, and SupportService
    - Create `src/lib/services/verification.service.ts`
    - Create `src/lib/services/financial.service.ts`
    - Create `src/lib/services/support.service.ts`
    - Each with factory function accepting optional PrismaClient
    - Return `ServiceResult<T>` pattern
    - _Requirements: 5.1, 5.3, 5.4, 5.5_

  - [ ] 5.9 Create services barrel export
    - Create `src/lib/services/index.ts` exporting all services
    - Ensure all service methods have explicit TypeScript return types
    - _Requirements: 5.4, 6.4_

  - [ ]* 5.10 Write property tests for service result pattern
    - **Property 10: Service Result Pattern**
    - Test that business errors return `{ ok: false, error: ServiceError }` never throwing
    - Test that calling code can pattern-match on error code
    - **Validates: Requirements 5.5, 5.7**

  - [ ]* 5.11 Write property tests for maximum records per page
    - **Property 15: Maximum Records Per Page**
    - Test that regardless of limit parameter (including > 60), at most 60 records returned
    - **Validates: Requirements 10.7**

- [ ] 6. Checkpoint - Ensure service layer compiles and tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Implement cache layer with Next.js 16 Cache Components
  - [ ] 7.1 Enable Cache Components in next.config.ts
    - Add `cacheComponents: true` to `next.config.ts`
    - Add `optimizePackageImports: ['lucide-react', 'recharts']` to config
    - _Requirements: 2.1, 11.5_

  - [ ] 7.2 Create cached query functions
    - Create `src/lib/queries/cached.ts` with `'use cache'` directive functions
    - `getCachedProfileBySlug(slug)` — `cacheLife('minutes')`, `cacheTag(\`profile:\${slug}\`)`
    - `getCachedDiscoverProfiles(citySlug)` — `cacheLife('minutes')`, `cacheTag(\`discover:\${citySlug}\`)`
    - `getCachedHomeSections()` — `cacheLife('seconds')`, `cacheTag('home-sections')`
    - Each function delegates to the corresponding service method
    - _Requirements: 2.1, 2.2, 2.4_

  - [ ] 7.3 Implement cache invalidation in Server Actions
    - Update Server Actions that modify profile data to call `updateTag(\`profile:\${slug}\`)` and `revalidateTag(\`discover:\${citySlug}\`, 'max')`
    - Use `updateTag` for read-your-own-writes (profile edits by owner)
    - Use `revalidateTag` for background refresh (admin actions, public listings)
    - _Requirements: 2.3, 2.5_

  - [ ] 7.4 Wrap data-fetching functions with React.cache for request deduplication
    - Wrap service calls used in both `generateMetadata` and page components with `cache()` from React
    - Ensure same-request deduplication for `getProfileBySlug`, `getCityBySlug`
    - _Requirements: 10.1_

  - [ ]* 7.5 Write property tests for request deduplication
    - **Property 12: Request Deduplication via React.cache**
    - Test that calling cached function N times with same params results in 1 DB query
    - **Validates: Requirements 10.1**

- [ ] 8. Implement database indices
  - [ ] 8.1 Add composite indices to Prisma schema
    - Add `@@index([cityId, servesMen, isSuspended])` to Profile model
    - Add `@@index([cityId, servesWomen, isSuspended])` to Profile model
    - Add `@@index([cityId, servesCouples, isSuspended])` to Profile model
    - Add `@@index([featuredUntil, isSuspended, planTier])` to Profile model
    - Generate and apply migration
    - _Requirements: 1.5_

- [ ] 9. Integrate validators and rate limiter into Server Actions
  - [ ] 9.1 Integrate Zod validation into existing Server Actions
    - Add `validate(schema, data)` calls at the top of each Server Action before DB operations
    - Return structured validation errors preserving form state for client-side display
    - Ensure all Server Actions are ≤30 lines of executable code, delegating to services
    - _Requirements: 3.1, 3.4, 3.7, 5.6_

  - [ ] 9.2 Integrate rate limiter into login, upload, and wa-click endpoints
    - Apply `loginLimiter` to login Server Action/API route (key: IP)
    - Apply `uploadLimiter` to media upload actions (key: userId)
    - Apply `waClickLimiter` to `/api/wa-click` route (key: profileId+IP)
    - Return 429 with retry-after info when limited
    - Log rate-limited login attempts with IP and timestamp
    - _Requirements: 4.1, 4.2, 4.3, 4.8_

  - [ ] 9.3 Add Content-Type validation to API routes
    - Reject requests without `Content-Type: application/json` or `multipart/form-data` with 415
    - _Requirements: 4.6_

  - [ ]* 9.4 Write property tests for input validation before processing
    - **Property 5: Input Validation Before Processing**
    - Test that invalid input is rejected before any DB write executes
    - **Validates: Requirements 3.1, 3.4**

- [ ] 10. Checkpoint - Ensure integration layer works end-to-end
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 11. Implement skeleton components and Suspense boundaries
  - [ ] 11.1 Create skeleton components
    - Create `src/components/skeletons/ProfileCardSkeleton.tsx`
    - Create `src/components/skeletons/StoryBarSkeleton.tsx`
    - Create `src/components/skeletons/MediaGallerySkeleton.tsx`
    - Create `src/components/skeletons/ReviewSkeleton.tsx`
    - Each skeleton matches layout dimensions of final content with animated placeholders
    - _Requirements: 9.4_

  - [ ] 11.2 Add Suspense boundaries to home page
    - Wrap "em alta" and "em destaque" sections in independent `<Suspense>` with skeleton fallbacks
    - Each section renders independently as data arrives
    - _Requirements: 9.1_

  - [ ] 11.3 Add Suspense boundaries to profile page
    - Wrap hero section, reviews, and media gallery in separate `<Suspense>` boundaries
    - Hero (name, photo, city, price, verification) renders first
    - Reviews and gallery stream in separately
    - _Requirements: 9.2_

  - [ ] 11.4 Add Suspense boundaries to discover page
    - Wrap stories and profile list in separate `<Suspense>` boundaries
    - Each section loads independently
    - _Requirements: 9.3_

  - [ ] 11.5 Implement ErrorBoundaryWithRetry component
    - Create `src/components/ErrorBoundaryWithRetry.tsx` as client component
    - Accepts `fallback` render prop with retry callback
    - Isolates errors to individual sections without breaking the page
    - _Requirements: 9.5, 10.3_

  - [ ]* 11.6 Write property tests for partial failure resilience
    - **Property 13: Partial Failure Resilience**
    - Test that if 1 of K parallel queries fails, page renders with K-1 successful results
    - Error state only in the failed section
    - **Validates: Requirements 10.3**

- [ ] 12. Implement frontend optimizations
  - [ ] 12.1 Add lazy loading with next/dynamic
    - Load `MediaGallery` via `next/dynamic` with `ssr: false` and skeleton loading
    - Load `ReelsFeed` via `next/dynamic` with `ssr: false` and skeleton loading
    - Load `StoryBar` via `next/dynamic` with `ssr: false` and skeleton loading
    - Add error handling with retry for failed dynamic imports (10s timeout)
    - _Requirements: 7.1, 7.2, 7.3, 7.7_

  - [ ] 12.2 Implement memoization patterns
    - Apply `React.memo` to `ProfileCard` and list item components
    - Apply `useCallback` to callbacks passed as props to children
    - Apply `useMemo` to expensive derived computations (>2ms)
    - _Requirements: 8.1, 8.2, 8.3_

  - [ ] 12.3 Implement virtual scroll for reels feed
    - Implement virtualization keeping max 10 DOM elements rendered
    - Pause videos outside viewport, load max 3 simultaneously on mobile
    - Maintain 30fps scroll performance
    - _Requirements: 8.4, 8.7, 14.3_

  - [ ] 12.4 Implement cursor-based pagination for list endpoints
    - Add `nextCursor` and `hasMore` fields to list API responses
    - Implement cursor-based pagination in reels (batch 10) and comments (batch 20)
    - Ensure no overlapping items between pages
    - _Requirements: 10.4, 10.5_

  - [ ]* 12.5 Write property tests for cursor pagination correctness
    - **Property 14: Cursor Pagination Correctness**
    - Test that following nextCursor produces no overlapping items
    - Test that `hasMore: false` means no further pages
    - **Validates: Requirements 10.4**

  - [ ] 12.6 Optimize parallel data fetching
    - Use `Promise.allSettled` for independent queries on profile page
    - Handle partial failures gracefully (render available data, error state for failed section)
    - Ensure total response time ≤ slowest query + 50ms overhead
    - _Requirements: 10.2, 10.3_

  - [ ] 12.7 Add image optimizations
    - Ensure all profile/media images use `next/image` with WebP/AVIF
    - Add responsive `sizes` prop (100vw mobile, 50vw tablet, 33vw desktop)
    - Add `loading="lazy"` with explicit width/height on ProfileCard images
    - Add error fallback placeholder for failed image loads
    - _Requirements: 11.1, 11.2, 11.7, 8.5_

- [ ] 13. Checkpoint - Ensure frontend optimizations work correctly
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 14. Implement bundle optimization and mobile performance
  - [ ] 14.1 Optimize icon and chart imports
    - Convert all `lucide-react` imports to individual named imports
    - Convert all `recharts` imports to individual named imports
    - Verify no full-package imports remain in bundle
    - _Requirements: 7.6, 11.4_

  - [ ] 14.2 Configure fonts and mobile optimizations
    - Ensure `next/font` with `display: swap` and preload is configured
    - Add `touch-action: manipulation` to interactive elements globally via CSS
    - Use `will-change` and `transform` for animations (no reflow properties)
    - Add prefetch to visible links in viewport
    - _Requirements: 11.6, 14.2, 14.4, 14.5_

  - [ ] 14.3 Implement AbortController pattern for useEffect fetches
    - Add AbortController to all `useEffect` fetch calls
    - Ensure cleanup function calls `controller.abort()` on unmount
    - Handle AbortError gracefully (no setState on unmounted components)
    - _Requirements: 13.2, 13.6_

  - [ ] 14.4 Fix memory leaks in existing components
    - Add cleanup to `ProviderHeartbeat` component (clearInterval on unmount)
    - Add cleanup to all setInterval/setTimeout/addEventListener in useEffects
    - _Requirements: 13.2, 13.4_

- [ ] 15. Implement SEO optimizations
  - [ ] 15.1 Create dynamic metadata generators
    - Implement `generateMetadata` for profile pages (`/p/[slug]`) with title ≤60 chars, description ≤160 chars
    - Implement `generateMetadata` for city pages (`/descobrir/[citySlug]`)
    - Add fallback values for incomplete profiles (derive from name + city)
    - Add `og:image` metadata
    - _Requirements: 12.1, 12.7_

  - [ ]* 15.2 Write property tests for metadata generation correctness
    - **Property 16: Metadata Generation Correctness**
    - Test title ≤60 chars, description ≤160 chars, neither empty
    - Test incomplete profiles use fallback values
    - **Validates: Requirements 12.1, 12.7**

  - [ ] 15.3 Create dynamic sitemap
    - Create `src/app/sitemap.ts` generating valid Sitemaps XML
    - Include all active public profiles and city pages
    - _Requirements: 12.2_

  - [ ]* 15.4 Write property tests for sitemap validity
    - **Property 17: Sitemap Validity**
    - Test generated sitemap is valid XML conforming to Sitemaps protocol
    - Test one `<url>` entry per active profile and per city page
    - **Validates: Requirements 12.2**

  - [ ] 15.5 Add JSON-LD structured data to profile pages
    - Add `schema.org/LocalBusiness` JSON-LD to public profile pages
    - Include required fields: `name`, `address`, `url` (all non-empty)
    - _Requirements: 12.6_

  - [ ]* 15.6 Write property tests for JSON-LD structured data
    - **Property 18: JSON-LD Structured Data**
    - Test rendered JSON-LD contains valid LocalBusiness with name, address, url non-empty
    - **Validates: Requirements 12.6**

- [ ] 16. Implement dead code elimination and cleanup
  - [ ] 16.1 Migrate queries.ts functions to services
    - Move all functions with business logic from `queries.ts` to corresponding services
    - Keep only re-exports in `queries.ts` temporarily for compatibility
    - Resolve any circular dependencies before removing duplicates
    - _Requirements: 5.1, 13.1, 13.7_

  - [ ] 16.2 Remove dead code and consolidate utilities
    - Remove migrated functions from `queries.ts` once all imports updated
    - Consolidate duplicate `fmtDate` utilities into `src/lib/format.ts`
    - Ensure zero unused imports/variables (lint clean)
    - _Requirements: 13.1, 13.3, 13.5_

  - [ ] 16.3 Eliminate all explicit `any` types
    - Replace all `any` in `src/` with specific types or generics
    - Add explicit return types to all exported functions in `src/lib/` and `src/app/api/`
    - Define named prop interfaces for components with 1+ props
    - Use `satisfies` for configuration objects
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.7_

  - [ ] 16.4 Add external API response validation
    - Define TypeScript types for MercadoPago and NextAuth responses
    - Add runtime validation before processing external API data
    - Log field divergence on validation failure, reject invalid data
    - _Requirements: 6.5, 6.6_

  - [ ]* 16.5 Write property tests for external API response validation
    - **Property 11: External API Response Validation**
    - Test that non-matching response structures are rejected and logged
    - **Validates: Requirements 6.5**

- [ ] 17. Checkpoint - Ensure full build passes with zero type errors
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 18. Create performance documentation
  - [ ] 18.1 Create performance changelog and ADR documents
    - Create `docs/PERFORMANCE_CHANGELOG.md` documenting each optimization with before/after metrics
    - Create `docs/ADR/` directory with Architecture Decision Records for key decisions
    - Document baselines: getProfileBySlug <100ms p95, listProfilesForCity <200ms p95, listReels <150ms p95
    - Document Core Web Vitals thresholds: LCP <2500ms, CLS <0.1, INP <200ms
    - _Requirements: 15.1, 15.2, 15.4, 15.5, 15.6_

  - [ ]* 18.2 Write property tests for query field selection limit
    - **Property 4: Query Field Selection Limit**
    - Test that relation objects in queries contain no more than 10 fields each
    - **Validates: Requirements 1.6**

- [ ] 19. Final checkpoint - Ensure all tests pass and build succeeds
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- **Next.js 16 Cache Components**: Use `'use cache'` directive + `cacheLife()` profiles + `cacheTag()` for caching. Use `updateTag()` in Server Actions for read-your-own-writes, `revalidateTag()` for background refresh. Must enable `cacheComponents: true` in next.config.ts.
- **Important**: Always check `node_modules/next/dist/docs/` before writing Next.js code — this version has breaking changes from training data.
- The `revalidate` export is part of the previous caching model. With Cache Components enabled, use `'use cache'` + `cacheLife()` instead.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["1.3", "2.1", "3.1"] },
    { "id": 2, "tasks": ["1.4", "1.5", "2.2", "3.2"] },
    { "id": 3, "tasks": ["5.1", "5.4", "5.5", "5.6", "5.8"] },
    { "id": 4, "tasks": ["5.2", "5.3", "5.7", "5.9", "5.10", "5.11"] },
    { "id": 5, "tasks": ["7.1", "8.1"] },
    { "id": 6, "tasks": ["7.2", "7.3", "7.4"] },
    { "id": 7, "tasks": ["7.5", "9.1", "9.2", "9.3"] },
    { "id": 8, "tasks": ["9.4", "11.1", "11.5"] },
    { "id": 9, "tasks": ["11.2", "11.3", "11.4", "11.6"] },
    { "id": 10, "tasks": ["12.1", "12.2", "12.4", "12.6", "12.7"] },
    { "id": 11, "tasks": ["12.3", "12.5", "14.1", "14.2", "14.3", "14.4"] },
    { "id": 12, "tasks": ["15.1", "15.3", "15.5"] },
    { "id": 13, "tasks": ["15.2", "15.4", "15.6"] },
    { "id": 14, "tasks": ["16.1"] },
    { "id": 15, "tasks": ["16.2", "16.3", "16.4"] },
    { "id": 16, "tasks": ["16.5", "18.1", "18.2"] }
  ]
}
```
