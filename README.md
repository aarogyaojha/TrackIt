# TrackIt

> Multi-tenant ticketing and public status-tracking SaaS for service businesses.

TrackIt is a modern, full-stack multi-tenant platform built for service businesses—such as repair shops, mechanics, tailors, and electronics centers. Staff can quickly log customer items as tickets and generate a unique QR code and link. Customers can check the live progress of their service anytime via a lightweight, no-login public tracking page.

---

## Key Features

- **Multi-Tenant Architecture**: Logical data isolation per organization with custom subpaths, unique slugs, and reserved-slug protection.
- **Organization Onboarding & Approval**: Self-service organization registration with superadmin-gated approval workflows (toggleable platform setting).
- **Tiered Subscription Plans**: Built-in plan definitions (`FREE`, `BASIC`, `PRO`) with automatic active-ticket, staff, and monthly usage limits enforcement.
- **Real-Time Ticket Management**: Full lifecycle state machine (`RECEIVED` $\rightarrow$ `IN_PROGRESS` $\rightarrow$ `READY` $\rightarrow$ `DELIVERED`, with cancellations), item logging, and customer details.
- **Instant Public Tracking**: Anonymous, privacy-preserving tracking page (`/:orgSlug/t/:code`) with dynamically generated QR codes for customers.
- **Superadmin Control Plane**: Dedicated superadmin portal to inspect organizations, approve/reject/suspend tenants, adjust plan tiers, and manage platform settings.
- **Robust Authentication & Security**: Short-lived JWT access tokens stored in memory, rotating httpOnly refresh cookies, `has_session` presence cookie heuristic, and role-based access control (`SUPERADMIN`, `ORG_ADMIN`, `ORG_STAFF`).
- **Multi-Tier Rate Limiting**: Intelligent endpoint throttling for general requests, auth endpoints, and public status lookups.

---

## Screenshots

<!--
Place real application screenshots in the assets directory and uncomment the tags below:

### Customer Public Status Page
![Customer Public Tracking Page](./docs/screenshots/public-tracking.png)

### Organization Dashboard & Ticket Management
![Organization Dashboard](./docs/screenshots/org-dashboard.png)

### Ticket Detail & QR Code
![Ticket Detail View](./docs/screenshots/ticket-detail.png)

### Superadmin Organization Queue
![Superadmin Portal](./docs/screenshots/superadmin-queue.png)

### Minimalist Authentication
![Login Page](./docs/screenshots/login.png)
-->

*Screenshots will be added as visual assets are captured.*

---

## Tech Stack

| Layer | Technologies & Libraries |
| :--- | :--- |
| **Backend (`apps/api`)** | NestJS 12, TypeScript, MongoDB 7 (Mongoose 9), `@nestjs/swagger`, `@nestjs/jwt`, Passport JWT, `@nestjs/throttler`, `@nestjs/schedule`, `@nestjs/terminus`, `class-validator`, `class-transformer`, `qrcode`, `bcrypt`, `joi` |
| **Frontend (`apps/web`)** | Next.js 16 (App Router), React 19, Tailwind CSS v4, shadcn/ui primitives, TanStack Query v5, Redux Toolkit v2, `react-hook-form`, `zod`, `axios`, `lucide-react`, `next-themes`, `sonner` |
| **Monorepo & Tooling** | Turborepo 2.10, npm Workspaces (npm 11.17), Docker & Docker Compose, ESLint 9, Prettier 3 |
| **Testing** | Jest 30, `mongodb-memory-server` 11, Supertest 7, `@swc/jest` |

---

## Prerequisites

Ensure you have the following installed on your machine:

- **Node.js**: `v20.x` or higher (tested on `v24.19.0`)
- **npm**: `v10.x` or `v11.x` (package manager specifies `npm@11.17.0`)
- **Docker & Docker Compose**: For running the local MongoDB replica set

---

## Getting Started

Follow these steps to get a local instance of TrackIt up and running:

1. **Clone the repository**:

   ```bash
   git clone <repository-url>
   cd TrackIt
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Configure environment variables**:
   Create the environment configuration files from the provided examples:

   ```bash
   cp apps/api/.env.example apps/api/.env
   cp apps/web/.env.example apps/web/.env.local
   ```

4. **Start the MongoDB replica set**:
   TrackIt requires a MongoDB replica set for multi-document transaction support:

   ```bash
   docker compose up -d
   ```

5. **Seed the initial Superadmin user**:

   ```bash
   npm run seed:superadmin --workspace=api
   ```

   Requires `SUPERADMIN_EMAIL` and `SUPERADMIN_PASSWORD` to be uncommented and set in `apps/api/.env` — the script exits with an error if either is missing.

6. **Start development servers**:

   ```bash
   npm run dev
   ```

7. **Access the application**:
   - **Frontend Web Portal**: [http://localhost:3000](http://localhost:3000)
   - **REST API Backend**: [http://localhost:4000/api/v1](http://localhost:4000/api/v1)
   - **Interactive API Documentation (Swagger)**: [http://localhost:4000/api/docs](http://localhost:4000/api/docs)
   - **API Health Check**: [http://localhost:4000/health](http://localhost:4000/health)

---

## Available Scripts

### Root Workspace (Turborepo)

| Command | Description |
| :--- | :--- |
| `npm run dev` | Concurrently start all applications in development mode |
| `npm run build` | Build all applications and packages |
| `npm run lint` | Lint all workspaces across the repository |
| `npm run test` | Run test suites across all workspaces |

### Backend (`apps/api`)

| Command | Description |
| :--- | :--- |
| `npm run start:dev --workspace=api` | Start NestJS in watch mode |
| `npm run build --workspace=api` | Compile NestJS application to `dist/` |
| `npm run lint --workspace=api` | Lint backend TypeScript source and tests |
| `npm run test --workspace=api` | Run backend Jest unit tests |
| `npm run test:e2e --workspace=api` | Run backend end-to-end test suite |
| `npm run seed:superadmin --workspace=api` | Seed initial superadmin user in the database |

### Frontend (`apps/web`)

| Command | Description |
| :--- | :--- |
| `npm run dev --workspace=web` | Start Next.js development server |
| `npm run build --workspace=web` | Build Next.js production bundle |
| `npm run start --workspace=web` | Start Next.js production server |
| `npm run lint --workspace=web` | Lint frontend codebase |
| `npm run test --workspace=web` | Run frontend test suite |

---

## Documentation Links

- **[System Architecture](ARCHITECTURE.md)**: Deep dive into multi-tenancy design, request lifecycle, data flow, auth patterns, and limitations.
- **[Engineering Conventions (AGENTS.md)](AGENTS.md)**: Strict standards for CSR layering, centralized constants, response envelopes, and code guidelines.
- **[Contributing Guide](CONTRIBUTING.md)**: Contribution workflow, test requirements, and issue reporting.
- **[License](LICENSE)**: Proprietary viewing and evaluation license.
- **Swagger UI**: Live interactive API specifications available at `/api/docs` when the API is running.

---

## License

Copyright (c) 2026 Aarogya Ojha. All Rights Reserved. See [LICENSE](LICENSE) for details.
