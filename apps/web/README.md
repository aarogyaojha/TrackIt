# TrackIt Web (`apps/web`)

The frontend web application for **TrackIt**, built with Next.js 16 (App Router), React 19, Tailwind CSS v4, and shadcn/ui.

---

## Features & Portals

- **Marketing Landing Page (`/`)**: Product showcase, features summary, and quick navigation.
- **Authentication (`/login`, `/register`)**: Token-in-memory auth flow with Redux Toolkit, httpOnly session refresh, and automatic redirection.
- **Tenant Dashboard (`/dashboard`)**:
  - **Overview**: Live status metrics, recent tickets, counter tracking QR card, and quick links.
  - **Tickets (`/dashboard/tickets`, `/dashboard/tickets/[id]`)**: Filterable, paginated ticket list, creation modal with workflow selector, detail view with live status progress stepper.
  - **Workflows (`/dashboard/workflows`)**: Custom stage sequence builder, stage ordering, status categories, and default workflow management.
  - **Settings (`/dashboard/settings`)**: Organization profile, subscription usage summary, and printable counter stand signage poster.
- **Superadmin Control Plane (`/superadmin`)**:
  - **Organizations (`/superadmin/organizations`, `.../[id]`)**: Approval queue, status management, plan tier adjustment, and multi-tenant QR code inspection/download.
  - **Plans (`/superadmin/plans`)**: Platform-wide limit controls (`maxActiveTickets`, `maxStaffUsers`, `maxTicketsPerMonth`, `maxWorkflows`).
  - **Settings (`/superadmin/settings`)**: Toggle organization registration approval requirement.
- **Public Customer Tracking Surface**:
  - **Live Tracking Portal (`/[orgSlug]`)**: Branded public page where customers look up tickets by code or phone number.
  - **Direct Ticket Status (`/[orgSlug]/t/[code]`)**: Anonymous, live status tracker with responsive stage stepper, item description, and service history.

---

## Mobile Responsiveness & Navigation

- **Mobile Hamburger Drawer**: Responsive slide-over navigation drawer in `DashboardShell` with backdrop, touch gestures, auto-closing on route changes, and keyboard `Escape` handling.
- **Marketing Navbar**: Collapsible mobile menu panel on small screens.
- **Responsive Organizations View**: Mobile cards layout on small screens and full table with dedicated QR column on desktop.

---

## Development Scripts

```bash
# Start Next.js development server
npm run dev

# Compile production bundle
npm run build

# Start Next.js production server
npm run start

# Run ESLint
npm run lint

# Run tests
npm run test
```
