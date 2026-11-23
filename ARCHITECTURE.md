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
|   Collections: organizations, users, tickets, workflows, plans, subscriptions,|
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
- **`packages/types`**: Single source of truth for cross-app TypeScript types, data transfer objects, and domain enums (`Role`, `OrgStatus`, `PlanTier`, `TicketStatus`, `StatusCategory`, Workflow interfaces).
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
3. **Data Isolation**: All tenant-owned collections (`tickets`, `users`, `workflows`, `subscriptions`) contain an indexed `organizationId` field. Workflows enforce a partial unique index `{ organizationId: 1, isDefault: 1 }` with `partialFilterExpression: { isDefault: true }` to guarantee a single default workflow per tenant.
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
  - `maxWorkflows` (e.g., 1 for Free, 3 for Basic, 10 for Pro)
- **Enforcement (`assertPlanLimit`)**: Before creating a ticket or a custom workflow, `SubscriptionsService.assertPlanLimit()` verifies current usage against plan limits. If a threshold is reached, an `AppException(409, PLAN_LIMIT_EXCEEDED)` is thrown.
- **Live Usage Calculation**: Subscription summaries dynamically compute live counts for `staffUsers` (users repository), `workflows` (workflows repository), and `activeTickets` (tickets repository querying active categories `INITIAL`, `IN_PROGRESS`, `READY`).
- **Monthly Usage Reset**: A scheduled cron job (`@nestjs/schedule`) executes at `00:00` on the 1st of every month to reset `ticketsThisMonth` counters across all active subscriptions.
- **Payment Seam**: Currently, subscription tier changes are executed directly by superadmins. The subscription service cleanly encapsulates limits and status checks, ready to connect to external billing gateways (e.g., Stripe) in the future.

---

## 7. Ticket Lifecycle, Custom Workflows & Public Tracking

### Tenant-Defined Custom Workflows
Instead of hardcoding status flows across all organizations, TrackIt supports tenant-defined custom workflows:

- **Workflow Model**: Each organization defines one or more workflows containing between 2 and 12 ordered stages (`WorkflowStatus`).
- **Lifecycle Categories**: Every workflow status maps to a `StatusCategory` enum:
  - `INITIAL`: Ticket intake / received stage (at least one required per workflow).
  - `IN_PROGRESS`: Active servicing stages (e.g., diagnosis, repair, assembly).
  - `READY`: Service complete, awaiting pickup / delivery.
  - `COMPLETED`: Terminal collected / fulfilled stage (at least one required per workflow).
  - `CANCELLED`: Terminal cancellation stage.
- **Default Workflow Integrity**: Each org has a designated default workflow (auto-seeded upon org creation or lazy-seeded on first lookup). Race conditions during concurrent seeding are caught via duplicate key (11000) on the partial unique index `{ organizationId: 1, isDefault: 1 }` and recovered by re-fetching the existing default.
- **State Transitions**: Tickets advance along their workflow's ordered stages or transition to `CANCELLED`. Arbitrary jumps outside configured progression throw `409 INVALID_STATUS_TRANSITION`.
- **In-Use Safeguards**: Editing an active workflow to remove a status key or change its category is blocked with `409 WORKFLOW_STATUS_IN_USE` if any tickets currently hold that status or have it recorded in their audit history. Deleting or deactivating in-use workflows is rejected (`409 WORKFLOW_IN_USE`), and the default workflow cannot be deleted (`400 WORKFLOW_CANNOT_DELETE_DEFAULT`).

### QR Code Generation
Upon ticket retrieval, the backend generates an inline base64 QR code data URL (`qrcode.toDataURL`) encoding the public status URL `/:orgSlug/t/:code`.

### Organization Public Tracking Portal & Counter QR Stand
In addition to per-ticket status tracking QR codes (`/:orgSlug/t/:code`), organizations have a dedicated public tracking portal (`/:orgSlug`) and counter QR stand:

1. **Organization Counter QR Code**: The authenticated endpoint `GET /api/v1/organizations/me/check-in-qr` generates a high-resolution QR code data URL linking directly to the organization's public tracking portal (`/:orgSlug`). Front desk staff can copy the link, download the QR code image, or print a branded counter stand signage poster via a dedicated print dialog.
2. **Superadmin QR Inspection & Download**: Platform operators can inspect, copy URLs, print signage, and download QR codes for any tenant organization via `GET /api/v1/organizations/:id/check-in-qr` (`@SuperAdminOnly()`), available directly within the superadmin organizations table and detail view.
3. **Public Organization Metadata**: `GET /api/v1/public/:orgSlug/info` provides sanitized organization details (`organizationName`, `slug`). If the organization does not exist or is not `ACTIVE`, a privacy-preserving `404 NOT_FOUND` is returned.
4. **Public Ticket Lookup**: `GET /api/v1/public/:orgSlug/lookup?query=...` allows customers scanning the counter QR code or visiting `/:orgSlug` to search for their service tickets by entering their ticket code (with or without `TK-` prefix) or phone number. Returns sanitized public ticket shapes matching `toPublicTicketResponse`.
5. **Customer Self-Service Intake (Optional Alternative)**: `GET /api/v1/public/:orgSlug/intake` and `POST /api/v1/public/:orgSlug/tickets` support self-service customer item submission if counter kiosk check-in is desired. Tickets are assigned the initial workflow stage, unique `TK-XXXXXX` codes, and checked against plan limits.

### Privacy-Preserving Public Tracking
When an anonymous customer queries ticket status at `/:orgSlug/t/:code`:

1. The public tracking controller queries the organization by `slug` and ticket by `code`.
2. **Ambiguity & Privacy Design**: If the organization does not exist, or is `PENDING`/`SUSPENDED`/`REJECTED`, or the ticket `code` is invalid, the endpoint deliberately returns a uniform `404 TICKET_NOT_FOUND` error.
3. **Payload Sanitization**: `toPublicTicketResponse` strictly exposes only customer-safe attributes: `organizationName`, `code`, `customerName`, `itemDescription`, current `customerLabel`, `customerDescription`, `category`, ordered `stages` (with customer labels and categories), and `statusHistory` timestamps. Sensitive internal attributes (`workflowId`, MongoDB `_id`, staff-facing status names, `customerPhone`, staff `changedBy` user IDs) are strictly omitted.

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
| **Backend Unit Tests** | Jest + Mocked Repositories / In-memory | **19 suites / 133 tests** (Passing) | Service logic, response mappers, pipes, plan assertions, auth flows, workflow mutations, duplicate-key race recovery, script backfills, public intake, QR generation |
| **Backend E2E Tests** | Jest + `mongodb-memory-server` + Supertest | **8 suites / 90 tests** (Passing) | Auth rotation, throttling limits, health probes, tickets, public portal lookup, superadmin org QR access, workflows lifecycle and tenant isolation |
| **Frontend Tests** | *None configured* | **0 tests** | Frontend test suite not yet implemented |

*Total automated test coverage: 221 passing backend tests across 27 suites.*

---

## 11. Known Limitations

The following items represent current technical constraints and architectural trade-offs:

1. **Single-User Organizations**: There is currently no staff invitation or multi-user member onboarding flow. Organizations are presently restricted to the initial admin user created during registration.
2. **No Frontend Test Coverage**: The Next.js web application currently lacks automated unit and component test suites (`npm run test --workspace=web` returns a placeholder).
3. **No CI/CD Pipeline**: Continuous integration and deployment pipelines are not yet configured; all validation has been performed via local test execution.
4. **In-Memory Rate Limiting**: The NestJS throttler uses the default in-memory storage adapter. Rate limiting counters do not synchronize across horizontally scaled API instances (requires a distributed Redis store before multi-instance deployment).
5. **No Billing Gateway Integration**: Plan tier upgrades and downgrades are managed directly by platform superadmins without an integrated payment gateway (e.g. Stripe).
6. **Legacy Ticket Workflow Migration**: Organizations created prior to custom workflows require the backfill script (`npm run backfill:workflows --workspace=api`) to link tickets to their default workflow and populate denormalized `statusCategory` values. Active-ticket queries retain backwards-compatible fallbacks.
