# Contributing to TrackIt

Thank you for your interest in contributing to TrackIt! While this project is primarily maintained as a focused solo project, contributions, feedback, and issue reports are welcome.

---

## Development Environment Setup

To set up a local development environment:

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
   Copy `.env.example` to `.env` in both workspaces:

   ```bash
   cp apps/api/.env.example apps/api/.env
   cp apps/web/.env.example apps/web/.env.local
   ```

   *(Adjust database credentials or JWT secrets in `apps/api/.env` if necessary).*

4. **Start the local MongoDB replica set**:

   ```bash
   docker compose up -d
   ```

5. **Seed the Superadmin user**:

   ```bash
   npm run seed:superadmin --workspace=api
   ```

6. **Start development servers**:

   ```bash
   npm run dev
   ```

   This runs both `apps/web` (Next.js at `http://localhost:3000`) and `apps/api` (NestJS at `http://localhost:4000`) concurrently via Turborepo.

---

## Engineering Conventions

All architectural standards, module layering patterns, and repository rules are strictly defined in [AGENTS.md](AGENTS.md). Please review [AGENTS.md](AGENTS.md) thoroughly before making any changes.

Key engineering standards documented in [AGENTS.md](AGENTS.md) include:

- **Backend Layering**: Strict Controller -> Service -> Repository (CSR) architecture.
- **Tenant Scoping**: All tenant data operations must be scoped by `organizationId` via guards and decorators.
- **Centralized Constants**: No magic strings for errors, messages, routes, or Swagger definitions.
- **Testing Requirements**: Comprehensive unit and e2e test requirements for all new endpoints.

---

## Commit Message Format

This repository strictly follows Conventional Commits (`feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`) with small, focused scopes per module. See the **Commits** section in [AGENTS.md](AGENTS.md) for details.

---

## Before Submitting Changes

Before opening a pull request or submitting code changes, ensure all of the following commands pass locally:

- [ ] `npm run lint` — Lint all workspaces (Turborepo)
- [ ] `npm run build` — Build all workspaces (Turborepo)
- [ ] `npm run test` — Run unit test suites across all workspaces
- [ ] `npm run test:e2e --workspace=api` — Run backend end-to-end test suite

All checks must pass with zero errors.

---

## Reporting Bugs & Suggesting Features

If you encounter a bug or have a suggestion:

- **Bug Reports**: Open an issue describing the expected vs. actual behavior, steps to reproduce, and any relevant logs or screenshots.
- **Feature Requests**: Open an issue detailing the use case, proposed workflow, and rationale.

Please check existing issues first to avoid duplicate submissions.
