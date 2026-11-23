# TrackIt API (`apps/api`)

The backend REST API for **TrackIt**, built with NestJS 12, TypeScript, MongoDB 7, and Mongoose 9.

---

## Architecture & Layering

Strict CSR (Controller-Service-Repository) architecture:

- `*.repository.ts`: Sole boundary touching Mongoose models. Enforces tenant data isolation via `organizationId` scoping.
- `*.service.ts`: Business logic, authorization, plan limits enforcement, and tenant scoping.
- `*.controller.ts`: DTO parsing, validation pipes, route protection guards, standard response envelope.
- `*.response.ts`: Dedicated explicit response mappers whitelisting all fields exposed over the API.

---

## Key Modules

- **`organizations`**: Tenant registration, slug management, approval workflows, tracking QR endpoints.
- **`workflows`**: Custom tenant workflows with 2-12 ordered stages across 5 status categories (`INITIAL`, `IN_PROGRESS`, `READY`, `COMPLETED`, `CANCELLED`), lifecycle jump validation, and deletion guards.
- **`tickets`**: Ticket creation, status updates, code normalization (`TK-XXXXXX`), public tracking lookup, and per-ticket QR generation.
- **`subscriptions` & `plans`**: Tier definitions (`FREE`, `BASIC`, `PRO`), resource limit enforcement (`maxActiveTickets`, `maxStaffUsers`, `maxTicketsPerMonth`, `maxWorkflows`), and monthly counter reset.
- **`roles`**: Database-backed role management with system defaults (`SUPERADMIN`, `ORG_ADMIN`, `ORG_STAFF`) and arbitrary custom roles, fine-grained permission assignment, and `@RequirePermissions` / `PermissionsGuard` protection.
- **`auth` & `users`**: JWT access tokens (15m in-memory), rotating SHA-256 hashed refresh cookies (7d), tenant team management (`/api/v1/users`), plan staff limit enforcement, self-deletion prevention, and last-admin protection.
- **`platform-settings`**: Global platform controls (e.g. `requireOrgApproval`).

---

## API Endpoints & Versioning

- **API Base Path**: `/api/v1` (configured via `API_PREFIX`)
- **Health Check**: `/health` (unversioned, exempt from throttling)
- **Interactive Swagger Documentation**: `/api/docs` (served unversioned)

---

## Development Scripts

```bash
# Start development server with watch mode
npm run start:dev

# Compile TypeScript production build
npm run build

# Run ESLint across source and tests
npm run lint

# Run Jest unit tests (with in-memory repository mocks)
npm run test

# Run Jest end-to-end test suite (with mongodb-memory-server)
npm run test:e2e

# Seed the initial platform Superadmin account
npm run seed:superadmin

# Idempotently provision default workflows and migrate legacy tickets
npm run backfill:workflows
```
