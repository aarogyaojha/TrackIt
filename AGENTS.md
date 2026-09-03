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

## Constants
Centralized in `apps/api/src/constants/` (barrel export from `index.ts`): `error-codes.ts`, `error-messages.ts`, `roles.ts`, `plan-tiers.ts`, `swagger.constants.ts`. No magic strings for error codes/roles/plan names anywhere else. Shared enums both apps need (`TicketStatus`, `PlanTier`, `OrgStatus`) live in `packages/types` instead.

## Configuration
All env var access goes through `src/config/configuration.ts` + `AppConfigService` — never call `process.env.X` anywhere else in the app. Adding a new env var means updating three places together: `env.validation.ts`, `configuration.ts`, and `AppConfigService`. Local MongoDB runs via `docker compose up -d` (see docker-compose.yml) — don't assume a locally-installed Mongo.

## Organization Lifecycle
- Self-registration creates an `Organization` (`status: PENDING`) + its first `ORG_ADMIN` user in one transaction.
- A global setting (superadmin-controlled, stored in a `PlatformSettings` doc) toggles `requireOrgApproval`. When true, `PENDING` orgs can't log in past a "pending approval" screen until a superadmin approves. When false, orgs go straight to `ACTIVE`.
- Superadmin can also `SUSPEND` an active org.

## Subscription / Plans
- `Plan` defines tier (`FREE` / `BASIC` / `PRO`) and limits (max active tickets, max staff users, tickets/month).
- `Subscription` doc per org: current plan + usage counters. Usage checked in the relevant service (e.g. `TicketsService.create`) before writing — throw `PLAN_LIMIT_EXCEEDED` if over.
- Monthly usage counters reset via a `@nestjs/schedule` cron job.
- No real payment gateway yet — plan changes are superadmin-actioned for now; leave a clean seam to slot one in later.

## Swagger
- Served at `/api/docs`. Every DTO decorated with `@ApiProperty`. Every controller method has `@ApiOperation`.
- For success responses, use NestJS's shorthand decorators (`@ApiOkResponse`, `@ApiCreatedResponse`, etc.) instead of the generic `@ApiResponse({ status: ... })`.
- For error responses shared across multiple endpoints, use `ApiStandardErrors(...codes)` from `common/decorators/api-standard-errors.decorator.ts` — it wraps NestJS's built-in error shorthands with wording pulled from `error-messages.ts`, so the text only lives in one place. Pass only the codes that endpoint can actually return.
- A response unique to one endpoint (a one-off status code, a summary that nothing else shares) stays inline as a plain decorator. Don't create a constants entry or a shared decorator for something used exactly once — see the endpoint checklist for what does and doesn't get centralized.
- Bearer auth scheme registered for protected routes.

## New Endpoint Checklist
1. DTO with class-validator decorators + `@ApiProperty`
2. Repository method (only place touching Mongoose)
3. Service method — business logic, org-scoping, authorization
4. Controller handler — thin, delegates to service
5. Guards/decorators applied (`@Roles`, `@CurrentOrg`, etc.)
6. Swagger annotations (summary/description/tag text as named constants — module-local `<module>.constants.ts` or root `constants/` if shared, never a bare string)
7. Unit test (service, mocked repository) + e2e test

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

