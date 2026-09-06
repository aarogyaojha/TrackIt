# AGENTS.md

## Project

TrackIt — multi-tenant ticketing/status-tracking SaaS for service businesses (garages, tailors, repair shops, etc). An org's staff logs a customer's item (e.g. bike, garment) as a ticket; the customer gets a link + QR code to a public, no-login status page. Orgs self-register and require superadmin approval before going live (toggleable via a global setting). Tiered subscription: Free / Basic / Pro with usage limits.

## Stack

- Monorepo: Turborepo + npm workspaces (apps/web, apps/api, packages/*)
- Backend: NestJS, TypeScript, MongoDB + Mongoose, class-validator/class-transformer, @nestjs/swagger, @nestjs/jwt + passport-jwt, @nestjs/config, @nestjs/schedule, qrcode
- Frontend: Next.js (App Router), TypeScript, Tailwind, shadcn/ui, TanStack Query, axios, react-hook-form + zod
- Tests: Jest + mongodb-memory-server (backend), Vitest + React Testing Library (frontend)

## Repo layout

apps/web        Next.js frontend (admin portal, superadmin portal, public status page)
apps/api        NestJS backend
packages/types   shared TS interfaces/DTOs/enums used by both apps
packages/config  shared eslint + tsconfig

## Commands

### Root (Turborepo)
- `npm run dev` — Run all apps concurrently in development mode
- `npm run build` — Build all workspaces
- `npm run lint` — Lint all workspaces
- `npm run test` — Run test suites across workspaces

### Backend (`apps/api`)
- `npm run start:dev --workspace=api` — Start NestJS dev server with watch mode
- `npm run build --workspace=api` — Compile NestJS application
- `npm run lint --workspace=api` — Lint backend codebase
- `npm run test --workspace=api` — Run backend Jest unit tests
- `npm run test:e2e --workspace=api` — Run backend e2e tests
- `npm run seed:superadmin --workspace=api` — Seed superadmin account

### Frontend (`apps/web`)
- `npm run dev --workspace=web` — Start Next.js development server
- `npm run build --workspace=web` — Build Next.js production bundle
- `npm run lint --workspace=web` — Lint frontend codebase
- `npm run test --workspace=web` — Run frontend tests

## Backend Architecture — Strict Layering (CSR)

`controller -> service -> repository`

- `*.repository.ts` is the only place a Mongoose model is touched. No `Model.find()` etc. in services or controllers.
- `service` holds business logic, authorization/ownership checks, and org-scoping.
- `controller` parses request (DTO + validation pipe), calls service, returns via standard response envelope. No business logic here.
- Feature-based modules under `src/modules/<feature>/` — each with controller, service, repository, dto/, schema, spec files.
- Multi-step operations spanning more than one repository (e.g. creating an Organization and its admin User together) use a Mongoose session/transaction owned by the service layer via `@InjectConnection` — this is the one exception to "repository is the only place touching Mongoose," since a session is connection-level, not model-level. Separate the retry logic for actual uniqueness conflicts (advance to a new candidate value) from transient transaction errors (retry the same operation unchanged).

## Multi-tenancy

- `Organization` has a globally-unique `slug` (used in URLs and as the "unique code").
- Every tenant-owned resource (tickets, staff users) stores `organizationId`. All repository queries for tenant data must filter by it — no exceptions.
- `Ticket.code` is unique only within an org: compound unique index `{ organizationId, code }`, not globally unique. Normalized to uppercase before persisting (via schema `uppercase: true` and service normalization).
- Authenticated admin/staff routes resolve the org from the JWT via `TenantGuard` + `@CurrentOrg()` decorator. Never trust an org id from the request body/query for scoping.
- Public status-page routes resolve the org from the URL slug (`/:orgSlug/t/:code`), no auth — deliberately public, still org-scoped by the slug + compound index lookup.
- Roles: `SUPERADMIN` (platform, no org), `ORG_ADMIN`, `ORG_STAFF`. `RolesGuard` + `@Roles()` decorator.

## Response Envelope & Errors

- Success: `{ success: true, data, meta? }`
- Error: `{ success: false, error: { code, message, details? } }`
- Throw `AppException(httpStatus, code, message, details?)` from services/controllers. Never call `res.status().json()` manually — a global exception filter formats every error.
- A global response interceptor wraps every successful response in the envelope — controllers just return the raw payload.

## Response Shaping

Controllers never return a raw Mongoose document. Every entity has a dedicated `<entity>.response.ts` with a `to<Entity>Response()` function that explicitly whitelists fields — this is the single source of truth for what that entity exposes over the API, used by every controller/service that returns it. Schema-level `toJsonTransform` (common/database/schema-options.ts) is a defense-in-depth backstop for accidental leaks, not a substitute for explicit mapping. New modules follow this from the start — add the mapper in the same step as the schema. Note: Ticket response mappers are the first async mappers in the codebase (`toTicketResponse`) because they generate QR code data URLs asynchronously via `qrcode.toDataURL()`.

## Constants

Backend-only values centralized in `apps/api/src/constants/` (barrel export from `index.ts`): `error-codes.ts`, `error-messages.ts`, `swagger.constants.ts`. No magic strings for error codes, Swagger metadata, or controller response messages anywhere else. Module-specific messages and Swagger strings live in `<module>.constants.ts`.
Cross-app enums that both frontend and backend need — `Role`, `OrgStatus`, `PlanTier`, and later `TicketStatus` — live in `packages/types` instead. Never redefine one of these locally in either app; both import the same source of truth from `@trackit/types`.

## Configuration

All env var access goes through `src/config/configuration.ts` + `AppConfigService` — never call `process.env.X` anywhere else in the app. Adding a new env var means updating three places together: `env.validation.ts`, `configuration.ts`, and `AppConfigService`. Local MongoDB runs via `docker compose up -d` (see docker-compose.yml) — don't assume a locally-installed Mongo.

## API Versioning

- Global API prefix is set via `API_PREFIX` (`api/v1`) in `apps/api/src/constants/api.constants.ts`. This is a code-level API surface contract, not an environment variable.
- `/health` is explicitly excluded (`{ exclude: ['health'] }`) so platform probes, container orchestration, and load balancers can query health unversioned.
- Swagger UI is served unversioned at `/api/docs`.
- The frontend API client (Phase 8) must target base URL + `/api/v1`.

## Organization Lifecycle

- Self-registration creates an `Organization` (`status: PENDING`) + its first `ORG_ADMIN` user in one transaction.
- A global setting (superadmin-controlled, stored in a `PlatformSettings` doc) toggles `requireOrgApproval`. When true, `PENDING` orgs can't log in past a "pending approval" screen until a superadmin approves. When false, orgs go straight to `ACTIVE`.
- Superadmin can also `SUSPEND` an active org.

## Auth

- Access tokens expire in 15m; refresh tokens expire in 7d with automatic rotation on each refresh request.
- Refresh tokens are stored on the `User` document strictly as SHA-256 hashes (`refreshTokenHash`), never plaintext.
- Refresh tokens are delivered and received via an `httpOnly`, `SameSite=Strict`, `Path=/auth` cookie (`secure: true` in production). Access tokens are returned directly in the response body.
- `JwtAuthGuard` is registered globally as `APP_GUARD` in `AppModule`. All routes are protected by default; public endpoints (e.g. `/auth/login`, `/auth/refresh`, `/organizations/register`, `/health`) must be explicitly annotated with `@Public()`.
- `RolesGuard` is registered globally as `APP_GUARD` in `AppModule` following `JwtAuthGuard`. Role checks are opt-in via `@Roles(Role.XYZ)` (same shape as `@Public()`); use `@SuperAdminOnly()` as the standard alias decorator to gate a superadmin-only route.
- `TenantGuard` verifies that the authenticated caller (`req.user`) has an active `organizationId`. It blocks platform `SUPERADMIN` (or any context lacking an organization scope) from hitting tenant-scoped routes without explicit tenant context, and ensures tenant scoping for downstream operations.

## Pagination

List endpoints use PaginationQueryDto (page/limit) and BaseRepository.findPaginated(). Controllers return { data: items, meta: { total, page, limit, totalPages } } — the response interceptor from Phase 2 already splits data/meta automatically.

## Subscription / Plans

- `Plan` is DB-backed (get-or-create pattern like `PlatformSettings`), defines tier (`FREE` / `BASIC` / `PRO`) and limits (`maxActiveTickets`, `maxStaffUsers`, `maxTicketsPerMonth`). Default limits are defined in `plan.constants.ts`.
- `Subscription` doc per org: links `organizationId` to `planTier` + usage counters (`ticketsThisMonth`, `currentPeriodStart`).
- `assertPlanLimit()` helper exists in `SubscriptionsService` and is tested, ready for Phase 6 ticket creation and future staff-invite features. Throws `PLAN_LIMIT_EXCEEDED` (409) when at/over limits.
- Monthly usage counters reset on the 1st of each calendar month via `@nestjs/schedule` cron calling a directly-testable `resetMonthlyUsageCounters()` method.
- Plan tier changes are instant and superadmin-only with no proration.
- No real payment gateway yet — plan changes are superadmin-actioned for now; leave a clean seam to slot one in later.

## Rate Limiting

- Three-tier throttling (`default` / `auth` / `public`) implemented via `@nestjs/throttler` and registered as global `APP_GUARD`.
- Limits are defined as named constants in `common/throttle/throttle.constants.ts` (not env-configurable — deliberate MVP choice, revisit with real traffic data): default (100 req/min), auth (20 req/min), public (30 req/min).
- `/health` is explicitly exempt from throttling via `@SkipThrottle()`.
- Auth-critical routes (`POST /auth/login`, `POST /auth/refresh`, `POST /organizations/register`) use the stricter `auth` tier (`@Throttle({ auth: { limit: AUTH_THROTTLE_LIMIT, ttl: AUTH_THROTTLE_TTL_MS } })`). Each endpoint using the 'auth' tier gets its own independent 20-req/min counter per IP — the limit is not a combined pool across login/refresh/register.
- Public status-page routes (`GET /public/:orgSlug/tickets/:code`) use the `public` tier (`@Throttle({ public: { limit: PUBLIC_THROTTLE_LIMIT, ttl: PUBLIC_THROTTLE_TTL_MS } })`).
- 429 errors are formatted through the standard response envelope as `RATE_LIMITED` via `AllExceptionsFilter`, preserving any rate-limiting / retry headers set by the library.
- The default in-memory storage does NOT work correctly across multiple API instances — revisit with a shared store (e.g. Redis) before any horizontal scaling.

## Swagger

- Served at `/api/docs`. Every DTO decorated with `@ApiProperty`. Every controller method has `@ApiOperation`.
- For success responses, use NestJS's shorthand decorators (`@ApiOkResponse`, `@ApiCreatedResponse`, etc.) instead of the generic `@ApiResponse({ status: ... })`.
- All Swagger annotations — including summary, description, tag, success response description strings (`@ApiOkResponse({ description: ... })`, `@ApiCreatedResponse({ description: ... })`), and DTO `@ApiProperty` metadata (description, example) — must come from named constants in `<module>.constants.ts` (or root `constants/` if shared), never bare strings.
- For error responses shared across multiple endpoints, use `ApiStandardErrors(...codes)` from `common/decorators/api-standard-errors.decorator.ts` — it wraps NestJS's built-in error shorthands with wording pulled from `error-messages.ts`, so the text only lives in one place. Pass only the codes that endpoint can actually return.
- Bearer auth scheme registered for protected routes.

## New Endpoint Checklist

1. DTO with class-validator decorators + `@ApiProperty`
2. Response mapper (`<entity>.response.ts`) exists for anything this endpoint returns, if one doesn't already exist for that entity.
3. Repository method (only place touching Mongoose)
4. Service method — business logic, org-scoping, authorization
5. Controller handler — thin, delegates to service
6. Guards/decorators applied (`@Roles`, `@CurrentOrg`, etc.)
7. Swagger annotations (summary/description/tag text as named constants — module-local `<module>.constants.ts` or root `constants/` if shared, never a bare string)
8. Any route param referencing a Mongo document _id must use ParseObjectIdPipe (common/pipes/) — an unvalidated malformed id reaches the repository as an uncaught CastError and surfaces as a 500 instead of a clean 400.
9. Unit test (service, mocked repository) + e2e test

Run the test suite before reporting a step done — don't call something finished because it compiles.

## Frontend Conventions

- Feature-based structure under `apps/web/src/features/<name>/`.
- TanStack Query for all server state.
- Redux Toolkit for global client-only state (auth session, etc.) — explicit project decision as of Phase 8, supersedes the earlier Zustand mention.
- `react-hook-form` + zod resolvers for all forms.
- shadcn/ui primitives — no hand-rolled buttons/inputs/dialogs once the equivalent primitive exists.
- Route files (page.tsx/layout.tsx) stay thin — compose feature components and hooks, no inline form JSX or business logic. Feature UI (forms, shells) lives in `features/<name>/components/`; data-fetching hooks in `features/<name>/api/`; reusable cross-page logic (e.g. auth gating) in `features/<name>/hooks/`.
- Every route with server data has a matching skeleton component and a Next.js `loading.tsx` using it. No blank screens or spinner-only loading states.
- All user-facing strings and error-code-to-message mappings live in `apps/web/src/constants/`.
- No bare user-facing string literals in components — every piece of copy is a named constant in that feature's `<feature>.constants.ts` (or root `src/constants/app.constants.ts` if shared), mirroring the backend's Swagger-string convention. Internal route paths use the `ROUTES` map from `app.constants.ts`, never bare path strings.

## Theming

- Dark mode via `next-themes` (`attribute="class"`, default `"system"`).
- Single source of truth for color is the CSS custom properties in `globals.css` — components use only semantic Tailwind classes (`bg-primary`, `text-foreground`, etc.), never raw hex/rgb/oklch values or arbitrary Tailwind color utilities like `text-blue-600`.
- Font variable gotcha: `--font-sans` in `@theme inline` must point at `--font-geist-sans`, a self-reference silently falls back to browser defaults — verify computed `font-family` after any font-related change, don't assume the CSS took effect.
- Spacing rhythm: Standardize on Tailwind's default scale (4, 6, 8, 12, 16) consistently for card padding, form field gaps, and section spacing; avoid arbitrary one-off values.
- Elevation: Default `Card` carries `shadow-sm` at rest (`hover:shadow-md transition-shadow` for interactive cards); default/primary `Button` variant carries `shadow-sm`.
- Layout chrome: Marketing/public pages get `<Navbar />` (sticky, with ThemeToggle, login link, register button) and `<Footer />` (minimal single-row copyright); auth pages stay minimal-chrome (small top-left logo link, top-right ThemeToggle, no full nav, no footer) to reduce distraction on conversion-critical flows.
- Note that ticket-status semantic colors are a deliberately separate, later decision (Phase 9), not covered by this pass.

## Frontend Auth

- Access tokens are stored in-memory only via Redux (`authSlice`), never in localStorage or sessionStorage.
- Session rehydration occurs via a one-time refresh-on-mount call in `AuthProvider`, rotating the httpOnly refresh cookie into an in-memory access token.
- Single-flight refresh token deduplication is implemented in the axios response interceptor (`src/lib/api/client.ts`), ensuring concurrent 401s reuse a single in-flight refresh promise rather than triggering redundant token rotations.
- The axios interceptor accesses the Redux store instance directly (`store.getState().auth.accessToken` and `store.dispatch()`) since interceptors run outside React's render tree.
- The Next.js middleware (`src/middleware.ts`) checks the presence of a lightweight `has_session` cookie (`Path=/`, `value: '1'`, `httpOnly: true`) as a UX heuristic only, not a security boundary. Because the real `refreshToken` cookie is restricted to `Path=/auth` for defense-in-depth, it is invisible on `/dashboard` or non-auth routes in the browser. The companion `has_session` cookie provides broad path visibility without carrying any sensitive data — presence alone is the signal, and the API's own guards and JWT validations remain the real enforcement for all protected data and operations.
- Error codes in `apps/web/src/constants/error-codes.ts` deliberately mirror a subset of `apps/api/src/constants/error-codes.ts` without shared package imports to avoid invasive backend refactors.

## Rules & Constraints

- No cross-tenant query without an explicit, reviewed reason.
- Never expose Mongo `_id` where a slug or public code should be used instead (public status page uses `orgSlug` + ticket `code`, never `_id`).
- Don't hand-roll auth/JWT logic outside the `auth` module.
- Don't add a payment gateway without an explicit decision logged here first.

## Commits

Conventional commits (`feat:`, `fix:`, `test:`, `docs:`, `chore:`), small and scoped per module.
