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

(fill in once scaffolded: dev, build, lint, test per workspace + root)

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
- `Ticket.code` is unique only within an org: compound unique index `{ organizationId, code }`, not globally unique.
- Authenticated admin/staff routes resolve the org from the JWT via `TenantGuard` + `@CurrentOrg()` decorator. Never trust an org id from the request body/query for scoping.
- Public status-page routes resolve the org from the URL slug (`/:orgSlug/t/:code`), no auth — deliberately public, still org-scoped by the slug + compound index lookup.
- Roles: `SUPERADMIN` (platform, no org), `ORG_ADMIN`, `ORG_STAFF`. `RolesGuard` + `@Roles()` decorator.

## Response Envelope & Errors

- Success: `{ success: true, data, meta? }`
- Error: `{ success: false, error: { code, message, details? } }`
- Throw `AppException(httpStatus, code, message, details?)` from services/controllers. Never call `res.status().json()` manually — a global exception filter formats every error.
- A global response interceptor wraps every successful response in the envelope — controllers just return the raw payload.

## Response Shaping

Controllers never return a raw Mongoose document. Every entity has a dedicated `<entity>.response.ts` with a `to<Entity>Response()` function that explicitly whitelists fields — this is the single source of truth for what that entity exposes over the API, used by every controller/service that returns it. Schema-level `toJsonTransform` (common/database/schema-options.ts) is a defense-in-depth backstop for accidental leaks, not a substitute for explicit mapping. New modules follow this from the start — add the mapper in the same step as the schema.

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

- `Plan` defines tier (`FREE` / `BASIC` / `PRO`) and limits (max active tickets, max staff users, tickets/month).
- `Subscription` doc per org: current plan + usage counters. Usage checked in the relevant service (e.g. `TicketsService.create`) before writing — throw `PLAN_LIMIT_EXCEEDED` if over.
- Monthly usage counters reset via a `@nestjs/schedule` cron job.
- No real payment gateway yet — plan changes are superadmin-actioned for now; leave a clean seam to slot one in later.

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
- TanStack Query for all server state. Reach for Zustand only if a real global client-only state need shows up (auth session) — not by default.
- `react-hook-form` + zod resolvers for all forms.
- shadcn/ui primitives — no hand-rolled buttons/inputs/dialogs once the equivalent primitive exists.
- Every route with server data has a matching skeleton component and a Next.js `loading.tsx` using it. No blank screens or spinner-only loading states.
- All user-facing strings and error-code-to-message mappings live in `apps/web/src/constants/`.

## Rules & Constraints

- No cross-tenant query without an explicit, reviewed reason.
- Never expose Mongo `_id` where a slug or public code should be used instead (public status page uses `orgSlug` + ticket `code`, never `_id`).
- Don't hand-roll auth/JWT logic outside the `auth` module.
- Don't add a payment gateway without an explicit decision logged here first.

## Commits

Conventional commits (`feat:`, `fix:`, `test:`, `docs:`, `chore:`), small and scoped per module.
