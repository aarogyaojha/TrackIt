# TrackIt System Architecture

This document provides a technical overview of TrackIt's system design, monorepo layout, multi-tenant isolation model, security boundaries, and runtime flows. For engineering rules, conventions, and implementation guidelines, refer to [AGENTS.md](AGENTS.md).

---

## 1. System Overview

TrackIt is a multi-tenant ticketing and status-tracking SaaS designed for service businesses (e.g., repair shops, tailors, auto mechanics). The system consists of an authenticated administrative web portal for organizations and superadmins, an anonymous public tracking surface for customers, a versioned REST API backend, and a replica-set MongoDB database.

```
+-------------------------------------------------------------------------------+
|                                    Browser                                    |
|                                                                               |
|   +------------------------------------+   +------------------------------+   |
|   |   Authenticated App Router Portal  |   | Anonymous Public Status Page |   |
|   |  (/dashboard, /superadmin, /auth)  |   |     (/:orgSlug/t/:code)      |   |
|   +-----------------+------------------+   +--------------+---------------+   |
+---------------------|-------------------------------------|-------------------+
                      | (Next.js SSR / Client React)        | (Next.js Client)
                      v                                     v
+-------------------------------------------------------------------------------+
|                                apps/web (Next.js)                             |
|                                                                               |
|   - Redux Toolkit (In-memory Access Token)   - Isolated Unauth Fetcher        |
|   - TanStack Query (Server Cache)            - No Auth Headers / Cookies      |
|   - Axios with Refresh Deduplication         - Privacy-Preserving Errors      |
+---------------------+-------------------------------------+-------------------+
                      | Bearer JWT + Cookies                | Anonymous HTTP
                      | (/api/v1/*)                         | (/api/v1/public/*)
                      v                                     v
+-------------------------------------------------------------------------------+
|                                apps/api (NestJS)                              |
|                                                                               |
|   [ThrottlerGuard] (Default: 100/min | Auth: 20/min | Public: 30/min)        |
|   [JwtAuthGuard & TenantGuard] (Token Verification & Tenant Isolation)        |
|   [Controller -> Service -> Repository] (CSR Layering)                        |
+---------------------------------------+---------------------------------------+
                                        | Mongoose ODM / Transactions
                                        v
+-------------------------------------------------------------------------------+
|                            MongoDB 7 (Replica Set)                            |
|                                                                               |
|   Collections: organizations, users, tickets, plans, subscriptions,           |
|                platform_settings                                              |
+-------------------------------------------------------------------------------+
```

---Copyright (c) 2026 Aarogya Ojha. All Rights Reserved.

## 2. Monorepo Structure

The repository is organized as a Turborepo-managed monorepo with npm workspaces:

```
.
├── apps/
│   ├── api/             # NestJS REST API backend application
│   │   ├── src/         # Feature modules, common middleware, guards, schemas
│   │   └── test/        # Jest end-to-end (e2e) test suites
│   └── web/             # Next.js 16 (App Router) frontend application
│       ├── public/      # Static web assets and brand icons
│       └── src/         # App router groups, feature components, Redux store
├── packages/
│   ├── config/          # Shared configuration packages
│   │   ├── eslint/      # Shared ESLint configuration presets
│   │   └── typescript/  # Shared tsconfig base files
│   └── types/           # Shared TypeScript interfaces, DTOs, and domain enums
├── docker-compose.yml   # Local single-node MongoDB replica set definition
├── package.json         # Workspace root scripts and devDependencies
└── turbo.json           # Turborepo task pipeline definitions
```

- **`apps/api`**: Pure REST API backend built on NestJS, TypeScript, Mongoose, and Swagger. Exposes versioned endpoints under `/api/v1` and health checks under `/health`.
- **`apps/web`**: Frontend application built on Next.js (App Router), React 19, Tailwind CSS v4, shadcn/ui primitives, TanStack Query, and Redux Toolkit.
- **`packages/types`**: Single source of truth for cross-app TypeScript types, data transfer objects, and domain enums (`Role`, `OrgStatus`, `PlanTier`, `TicketStatus`).
- **`packages/config`**: Reusable configurations for TypeScript and ESLint across all workspaces.

---

## 3. Backend Architecture & Request Lifecycle

The backend enforces a strict **Controller -> Service -> Repository (CSR)** architectural pattern:

```
[ HTTP Request ]
       |
       v
[ Global ThrottlerGuard ] ---------> (Rejects if limit exceeded: 429 RATE_LIMITED)
       |
       v
[ Global JwtAuthGuard ] -----------> (Bypassed if @Public(); verifies Access Token)
       |
       v
[ Global RolesGuard ] -------------> (Checks @Roles(); enforces RBAC permissions)
       |
       v
[ TenantGuard ] -------------------> (Ensures authenticated non-superadmins have organizationId)
       |
       v
[ Global ValidationPipe ] ---------> (Validates DTO payload & transforms types)
       |
       v
[ Controller ] --------------------> (Extracts DTO / params, delegates to Service)
       |
       v
[ Service ] -----------------------> (Executes business logic, assertions, transactions)
       |
       v
[ Repository ] --------------------> (Direct Mongoose Model queries; strictly tenant-scoped)
       |
       v
[ Response Mapper ] ---------------> (Whitelists fields via to<Entity>Response mapper)
       |
       v
[ Global ResponseInterceptor ] ----> (Wraps payload in standard { success: true, data, meta? })
       |
       v
[ HTTP Response Envelope ]
```

- **Repositories (`*.repository.ts`)**: The only layer permitted to interact with Mongoose models. Every tenant data operation strictly scopes queries with `{ organizationId }`.
- **Services (`*.service.ts`)**: Encapsulates all domain validation, role/tenant assertions, and multi-document transactions (via `@InjectConnection()`).
- **Controllers (`*.controller.ts`)**: Thin HTTP dispatchers that parse request parameters, execute service logic, and pass output to explicit response mappers.
- **Response Shaping**: Entities are never returned raw. Explicit response mappers (`toTicketResponse`, `toOrgResponse`, etc.) sanitize payloads and generate asynchronous artifacts like QR codes.
- **Exception Filter**: `AllExceptionsFilter` intercepts standard NestJS and custom `AppException` errors, transforming them into a uniform `{ success: false, error: { code, message, details? } }` structure.

---

## 4. Multi-Tenancy Model

TrackIt uses a **logical database partitioning** strategy within a shared MongoDB database:

1. **Tenant Identification**: Every organization has a globally unique `slug` (e.g., `acme-repairs`) used for routing.
2. **Reserved Slugs**: A pre-compiled list of reserved slugs (`login`, `register`, `dashboard`, `superadmin`, `api`, `health`, `public`, `t`, `admin`, `app`, `www`) prevents collisions with static application routes. The organization registration routine automatically appends numeric suffixes if a collision is detected.
3. **Data Isolation**: All tenant-owned collections (`tickets`, `users`, `subscriptions`) contain an indexed `organizationId` field.
4. **Authenticated Scoping**: For authenticated tenant operations, `TenantGuard` and the `@CurrentOrg()` decorator resolve `organizationId` directly from the validated JWT payload. Request bodies or query parameters are never trusted for tenant scoping.
5. **Public Scoping**: For customer status lookups, the tenant is resolved via the URL path slug `/:orgSlug/t/:code`, querying against a compound index `{ organizationId, code }`.

---

## 5. Authentication, Security & the `has_session` Pattern

### Token Lifecycle & Rotation

- **Access Tokens**: Short-lived (15 minutes), signed with `JWT_ACCESS_SECRET`. Stored strictly in memory on the frontend (via Redux) and sent via `Authorization: Bearer <token>` headers.
- **Refresh Tokens**: Long-lived (7 days), signed with `JWT_REFRESH_SECRET`. Stored in MongoDB only as SHA-256 hashes (`refreshTokenHash`). Delivered via an `httpOnly`, `SameSite=Strict`, `Path=/auth` cookie (`secure: true` in production).
- **Single-Flight Refresh Deduplication**: The frontend Axios client intercepts `401 Unauthorized` responses and multiplexes concurrent failing requests into a single in-flight token rotation promise, preventing race conditions.

### The `has_session` Presence Cookie Workaround

A subtle cross-boundary challenge arises from strict cookie scoping:

1. The real `refreshToken` cookie is scoped to `Path=/auth` (or `/api/v1/auth`) for defense-in-depth, preventing it from being leaked to unrelated API endpoints or third-party paths.
2. Next.js Edge Middleware runs before rendering pages on paths like `/dashboard` or `/superadmin`. Because the browser respects `Path=/auth`, the Next.js middleware cannot see the `refreshToken` cookie on `/dashboard`.
3. To enable client-side and Edge middleware routing heuristics without weakening the security of the actual refresh token, the auth service sets a companion cookie: `has_session=1` (`Path=/`, `httpOnly: true`).
4. Next.js middleware checks only for the existence of `has_session` to quickly redirect unauthenticated visitors to `/login`. The API itself remains the authoritative gatekeeper, verifying the real in-memory access token on every request.

### Rate Limiting

Throttling is enforced globally via `@nestjs/throttler` across three distinct tiers:

- **Default Tier**: 100 requests/minute per IP across standard authenticated endpoints.
- **Auth Tier**: 20 requests/minute per IP, evaluated independently per critical endpoint (`/auth/login`, `/auth/refresh`, `/organizations/register`).
- **Public Tier**: 30 requests/minute per IP for public tracking lookups.
- **/health**: Explicitly exempted from rate limiting via `@SkipThrottle()`.

### Role-Based Access Control (RBAC)

- `SUPERADMIN`: Platform-level operator with global access to organization management, settings, and plan definitions. Has no `organizationId`.
- `ORG_ADMIN`: Organization administrator with full control over tickets, organization settings, and staff.
- `ORG_STAFF`: Operational staff member authorized to create and update tickets within their organization.

---

## 6. Subscriptions, Plans & Usage Enforcement

TrackIt features a tiered subscription model (`FREE`, `BASIC`, `PRO`):

- **Plan Limits**: Defined in the database (with fallback defaults) specifying:
  - `maxActiveTickets` (e.g., 20 for Free, 100 for Basic, Unlimited for Pro)
  - `maxStaffUsers` (e.g., 2 for Free, 10 for Basic, Unlimited for Pro)
  - `maxTicketsPerMonth` (e.g., 50 for Free, 300 for Basic, Unlimited for Pro)
- **Enforcement (`assertPlanLimit`)**: Before creating a ticket, `SubscriptionsService.assertPlanLimit()` verifies current usage against the plan limits. If a threshold is reached, an `AppException(409, PLAN_LIMIT_EXCEEDED)` is thrown.
- **Monthly Usage Reset**: A scheduled cron job (`@nestjs/schedule`) executes at `00:00` on the 1st of every month to reset `ticketsThisMonth` counters across all active subscriptions.
- **Payment Seam**: Currently, subscription tier changes are executed directly by superadmins. The subscription service cleanly encapsulates limits and status checks, ready to connect to external billing gateways (e.g., Stripe) in the future.

---

## 7. Ticket Lifecycle & Public Tracking Surface

### Ticket State Machine
Tickets transition through a deterministic lifecycle:

```
   [ RECEIVED ] ---> [ IN_PROGRESS ] ---> [ READY ] ---> [ DELIVERED ]
        |                   |                 |             (Terminal)
        |                   |                 |
        +-------------------+-----------------+
                            |
                            v
                      [ CANCELLED ]
                       (Terminal)
```

- **Transitions**:
  - `RECEIVED` $\rightarrow$ `IN_PROGRESS`, `CANCELLED`
  - `IN_PROGRESS` $\rightarrow$ `READY`, `CANCELLED`
  - `READY` $\rightarrow$ `DELIVERED`, `CANCELLED`
  - `DELIVERED` & `CANCELLED` are terminal states.
- **QR Code Generation**: Upon ticket retrieval, the backend generates an inline base64 QR code data URL (`qrcode.toDataURL`) encoding the public status URL `/:orgSlug/t/:code`.

### Privacy-Preserving Public Tracking

When an anonymous customer queries a ticket status:

1. The public tracking controller queries the organization by `slug` and ticket by `code`.
2. **Privacy Design**: If the organization does not exist, or the organization is `PENDING`/`SUSPENDED`/`REJECTED`, or the ticket `code` is invalid, the endpoint deliberately returns a uniform `404 TICKET_NOT_FOUND` error.
3. This prevents malicious actors from enumerating valid organization slugs or testing for the existence of suspended accounts.

---

## 8. Frontend Architecture

The frontend application uses Next.js App Router structured around route groups and feature modules:

- **Route Groups**:
  - `(auth)`: Login, registration, and pending approval screens with minimal layout chrome.
  - `(dashboard)`: Organization portal (`/dashboard`, `/dashboard/tickets`, `/dashboard/settings`) gated by auth and active status.
  - `(superadmin)`: Superadmin portal (`/superadmin`, `/superadmin/organizations`, `/superadmin/plans`, `/superadmin/settings`) gated by `SUPERADMIN` role.
  - `[orgSlug]/t/[code]`: Public tracking status page rendered with zero auth requirements.
- **State Management**:
  - **Redux Toolkit (`authSlice`)**: Scoped exclusively to client-side auth state (in-memory access token, user profile, active role).
  - **TanStack Query (React Query)**: Manages all server state, cache invalidation, and background synchronization.
- **Forms & Validation**: `react-hook-form` paired with `zod` schemas for client-side validation.
- **Design System & Theming**: Built on Tailwind CSS v4 and shadcn/ui primitives. All styling references semantic CSS custom properties in `globals.css` (supporting seamless light/dark modes via `next-themes`).

---

## 9. API Versioning & Documentation

- **Version Prefix**: All API endpoints (except `/health`) are prefixed with `/api/v1` via NestJS global prefixing.
- **Health Probes**: `/health` is served unversioned at the root for container orchestrators and load balancers.
- **OpenAPI / Swagger**: Interactive Swagger documentation is served unversioned at `/api/docs`. All DTOs, query parameters, and responses are annotated using centralized constants.

---

## 10. Testing Strategy

The repository employs automated testing for backend components:

| Scope | Test Runner / Framework | Current Test Count | Coverage Summary |
| :--- | :--- | :--- | :--- |
| **Backend Unit Tests** | Jest + Mocked Repositories / In-memory | **15 suites / 83 tests** (Passing) | Service logic, response mappers, pipes, plan assertions, auth flows |
| **Backend E2E Tests** | Jest + `mongodb-memory-server` + Supertest | **7 suites / 61 tests** (Passing) | Auth rotation, throttling limits, health probes, tickets, superadmin |
| **Frontend Tests** | *None configured* | **0 tests** | Frontend test suite not yet implemented |

*Total automated test coverage: 144 passing backend tests across 22 suites.*

---

## 11. Known Limitations

The following items represent current technical constraints and architectural trade-offs:

1. **Single-User Organizations**: There is currently no staff invitation or multi-user member onboarding flow. Organizations are presently restricted to the initial admin user created during registration.
2. **No Frontend Test Coverage**: The Next.js web application currently lacks automated unit and component test suites (`npm run test --workspace=web` returns a placeholder).
3. **No CI/CD Pipeline**: Continuous integration and deployment pipelines are not yet configured; all validation has been performed via local test execution.
4. **In-Memory Rate Limiting**: The NestJS throttler uses the default in-memory storage adapter. Rate limiting counters do not synchronize across horizontally scaled API instances (requires a distributed Redis store before multi-instance deployment).
5. **No Billing Gateway Integration**: Plan tier upgrades and downgrades are managed directly by platform superadmins without an integrated payment gateway (e.g. Stripe).
