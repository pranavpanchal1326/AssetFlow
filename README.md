<![CDATA[# AssetFlow

**Enterprise Asset & Resource Management System**

Track, allocate, maintain, and audit every physical asset in your organization — from laptops and conference rooms to vehicles and networking equipment — through one platform that enforces conflict-free allocation, approval-driven maintenance, overlap-proof resource booking, and auditable lifecycle tracking.

---

## Table of Contents

- [The Problem](#the-problem)
- [The Solution](#the-solution)
- [Key Features](#key-features)
- [Architecture Overview](#architecture-overview)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment & Configuration](#environment--configuration)
- [Seed Data](#seed-data)
- [Login Credentials](#login-credentials)
- [User Roles & Permissions](#user-roles--permissions)
- [Asset Lifecycle](#asset-lifecycle)
- [Core Workflows](#core-workflows)
- [Reports & Analytics](#reports--analytics)
- [Notifications & Activity Log](#notifications--activity-log)
- [Security](#security)
- [Performance](#performance)
- [Roadmap](#roadmap)
- [Contributors](#contributors)
- [Acknowledgements](#acknowledgements)

---

## The Problem

Organizations still track physical assets — laptops, monitors, servers, vehicles, conference rooms — across disconnected spreadsheets, email threads, and paper logs. This creates concrete, recurring failures:

- **Double-allocation:** Two people believe they hold the same laptop. Neither discovers the conflict until one of them needs it.
- **Booking collisions:** A conference room is double-booked for overlapping time slots. Both parties show up.
- **Invisible maintenance:** A printer is sent for repair, but the asset registry still shows it as Available. Someone allocates it to a new hire.
- **Audit blindness:** No one can answer "where is the Cisco switch that was in Rack B7?" without walking the floor.
- **No lifecycle trail:** When an asset breaks, there's no record of who held it, what condition it was in, or whether it was ever maintained.

These aren't hypothetical — they are the daily reality of asset management without structured lifecycle enforcement.

## The Solution

AssetFlow replaces those disconnected tools with a single system built around four enforced invariants:

1. **An asset can have exactly one active holder.** Attempting to allocate an already-held asset is blocked at the server level with a message naming the current holder, and a Transfer Request is offered instead.
2. **A bookable resource cannot have overlapping time slots.** The overlap check (`newStart < existingEnd && newEnd > existingStart`) runs server-side on every booking. Back-to-back bookings (where one ends at the exact time another begins) are correctly accepted.
3. **Maintenance requires approval before an asset leaves service.** A maintenance request must be approved by an Asset Manager before the asset's status changes to Under Maintenance, preventing premature unavailability.
4. **Audit cycles produce accountable, dispositive results.** An auditor marks each in-scope asset as Verified, Missing, or Damaged. Closing a cycle locks it, transitions confirmed-missing assets to Lost, and optionally auto-raises maintenance for damaged assets.

Every state change — allocation, transfer, return, booking, approval, audit finding — writes to both the asset's history and a global activity log, and generates a targeted notification.

---

## Key Features

| PRD Screen | Feature | What It Does |
|---|---|---|
| S1 | **Login / Signup** | Email + password authentication. Signup creates an Employee-only account — no role self-selection. Admin promotes roles from the Employee Directory. Forgot-password flow with in-app reset link (email delivery simulated). |
| S2 | **Dashboard** | Six KPI cards (Assets Available, Assets Allocated, Maintenance Today, Active Bookings, Pending Transfers, Upcoming Returns). Overdue returns highlighted in red, separate from upcoming. Quick actions filtered by role. Recent notifications panel. |
| S3 | **Organization Setup** | Admin-only, three tabs: Departments (with hierarchy), Asset Categories (with custom field definitions stored as JSON), Employee Directory (the sole surface for role assignment and department assignment). |
| S4 | **Asset Registration & Directory** | Register assets with auto-generated tags (`AF-0001`, `AF-0002`, …), serial numbers, category custom fields, condition, location, and a bookable flag. Directory with search, filters by category/status/department/location, and QR code per asset. Asset detail page with lifecycle timeline, allocation history, and maintenance history. |
| S5 | **Asset Allocation & Transfer** | Allocate to an employee or department with optional Expected Return Date. Conflict rule: allocation of an already-held asset returns HTTP 409 with the current holder's name and a `canRequestTransfer` flag. Transfer workflow: Requested → Approved/Rejected → Re-allocated. Return flow with condition check-in notes. Overdue allocations auto-flagged. |
| S6 | **Resource Booking** | Only assets flagged as bookable appear. Week-grid calendar view. Server-side overlap rejection. Booking statuses: Upcoming, Ongoing, Completed (derived from time comparison at read time), Cancelled (persisted). Cancel and reschedule own bookings. |
| S7 | **Maintenance Management** | Raise a request with issue description, priority (Low/Medium/High), and optional photo. Workflow: Pending → Approved/Rejected → Technician Assigned → In Progress → Resolved. Technician is free-text name + contact (no technician login). Asset status side-effects enforced: approval → Under Maintenance, resolution → Available. Kanban-style board by status. |
| S8 | **Asset Audit** | Admin creates Audit Cycles with scope (department and/or location), date range, and assigned auditors. Auditors see a checklist and mark each asset Verified / Missing / Damaged with notes. Auto-generated discrepancy report. Close cycle → locks it, applies status transitions (Missing → Lost; Damaged → optionally auto-raise maintenance). |
| S9 | **Reports & Analytics** | Asset utilization (most-allocated vs. idle), maintenance frequency by category, assets due for return / flagged for retirement, department-wise allocation summary, resource booking heatmap (day × hour grid). CSV export on every report. |
| S10 | **Activity Logs & Notifications** | Bell icon notification center: Asset Assigned, Maintenance Approved/Rejected, Booking Confirmed/Cancelled/Reminder, Transfer Approved/Rejected, Overdue Return Alert, Audit Discrepancy Flagged. Mark read/unread. Activity Log for admins and managers: filterable by user, entity type, and date. |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                     React + Vite                        │
│               (Tailwind CSS · Recharts)                 │
│                   localhost:5173                         │
└────────────────────────┬────────────────────────────────┘
                         │  Vite proxy: /api → :4000
                         ▼
┌─────────────────────────────────────────────────────────┐
│              Node.js + Express REST API                  │
│        JWT Auth · RBAC Middleware · multer uploads        │
│                   localhost:4000                          │
└────────────────────────┬────────────────────────────────┘
                         │  better-sqlite3 (file-based)
                         ▼
┌─────────────────────────────────────────────────────────┐
│                     SQLite Database                       │
│              server/assetflow.db (WAL mode)               │
│   14 tables · FK constraints · single-file portability    │
└─────────────────────────────────────────────────────────┘
```

For full entity-relationship diagrams, state machine diagrams, and architectural decision rationale, see [ARCHITECTURE.md](ARCHITECTURE.md).

---

## Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| Backend | Node.js + Express | REST API server |
| Database | SQLite via better-sqlite3 | Zero-install, file-based persistence. WAL mode for concurrent reads. |
| Authentication | JWT (jsonwebtoken + bcryptjs) | Stateless auth with role-based access control middleware |
| Frontend | React + Vite + Tailwind CSS | SPA with hot module replacement |
| Charts | Recharts | Dashboard KPIs and report visualizations |
| Calendar | Hand-rolled week grid (CSS Grid) | Resource booking display without external calendar library dependencies |
| QR Codes | qrcode (npm) | Per-asset QR code generation (scan input = typing/pasting the asset tag) |
| File Uploads | multer | Asset photos and maintenance attachments, served from `server/uploads/` |

**Ports:** API at `http://localhost:4000`, frontend at `http://localhost:5173` (Vite proxies `/api` → port 4000).

---

## Project Structure

```
assetflow/
├── README.md
├── TESTING.md
├── ARCHITECTURE.md
├── USER_GUIDE.md
├── .gitignore
│
├── server/                          # Backend (Node.js + Express)
│   ├── package.json
│   ├── src/
│   │   ├── index.js                 # Express app entry point
│   │   ├── db.js                    # SQLite schema + connection
│   │   ├── seed.js                  # Database seeder (loads data/*.json)
│   │   ├── middleware/              # JWT auth, RBAC guards
│   │   ├── routes/                  # Express route handlers
│   │   └── services/                # Business logic (lifecycle state machine, etc.)
│   └── uploads/                     # Uploaded photos/documents (gitignored)
│
├── client/                          # Frontend (React + Vite)
│   └── src/
│       ├── api/                     # API client + mock mode toggle
│       ├── components/              # Reusable UI components
│       ├── pages/                   # Screen-level components (S1–S10)
│       └── context/                 # Auth context, role state
│
├── data/                            # Seed data package
│   ├── departments.json             # 7 departments (1 inactive)
│   ├── categories.json              # 7 asset categories with custom fields
│   ├── employees.json               # 18 users across all 4 roles
│   ├── assets.json                  # 35 assets across all lifecycle states
│   ├── allocations.json             # 32 allocation records
│   ├── transfers.json               # 4 transfer requests (approved/rejected/pending)
│   ├── bookings.json                # 14 bookings (incl. back-to-back boundary case)
│   ├── maintenance.json             # 7 maintenance requests (all 6 workflow states)
│   ├── audit_cycles.json            # 2 audit cycles (1 closed, 1 open with discrepancies)
│   ├── audit_assignments.json       # 4 auditor assignments
│   ├── audit_items.json             # 21 audit items (verified/missing/damaged/pending)
│   ├── notifications.json           # 27 notifications (all PRD types represented)
│   ├── activity_logs.json           # 69 activity log entries
│   └── seed.js                      # Alternate seed entry point
│
├── shared/
│   └── API_CONTRACT.md              # Frozen API contract (routes, shapes, status codes)
│
└── docs/
    ├── SEED_DATA_PACKAGE.md         # Seed data narrative and validation
    ├── SEED_DATA_REVIEW.md          # Engineering review of seed data
    └── VALIDATION_REPORT.md         # Full enterprise audit report
```

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 18.x
- **npm** ≥ 9.x
- No external database installation required (SQLite is embedded via better-sqlite3)

### Installation

```bash
# Clone the repository
git clone https://github.com/<your-org>/assetflow.git
cd assetflow

# Install backend dependencies
cd server
npm install

# Seed the database (creates assetflow.db with all demo data)
npm run seed

# Start the backend (http://localhost:4000)
npm run dev
```

```bash
# In a separate terminal — install and start the frontend
cd client
npm install
npm run dev
# Frontend available at http://localhost:5173
```

### Quick Verification

After both servers are running:

1. Open `http://localhost:5173` in your browser.
2. Log in as Admin: `admin@assetflow.app` / `Admin@123`.
3. The Dashboard should show KPI cards with pre-seeded counts. Two overdue returns (AF-0019 and AF-0017) should appear highlighted in red.
4. Navigate to Asset Directory — 35 assets across 7 categories should be visible.

---

## Environment & Configuration

| Variable | Location | Default | Description |
|---|---|---|---|
| `PORT` | `server/src/index.js` | `4000` | Express server port |
| `JWT_SECRET` | `server/src/index.js` | Hardcoded default | Secret for signing JWT tokens |
| `DB_PATH` | `server/src/db.js` | `server/assetflow.db` | SQLite database file path |
| `UPLOAD_DIR` | `server/src/index.js` | `server/uploads/` | Directory for multer file uploads |

> [!NOTE]
> For the hackathon demo, all configuration uses hardcoded defaults. A production deployment would externalize `JWT_SECRET` and `DB_PATH` via `.env` file and a library like `dotenv`. This is an intentional hackathon-scope simplification, not an oversight.

---

## Seed Data

The seed data package represents the asset management history of **NexGen Infra Solutions Pvt. Ltd.**, a mid-size engineering consultancy with offices in Pune and Mumbai. The data spans June 2025 through July 2026 (14 months) and is designed to demonstrate every PRD success criterion through realistic operational history rather than synthetic test cases.

### What's Seeded

| Entity | Count | Coverage |
|---|---|---|
| Departments | 7 | Hierarchy (Engineering → Platform Team, QA). 1 inactive (Design & Surveying — merged). |
| Users | 18 | 1 admin, 2 asset managers, 5 dept heads, 10 employees. 1 inactive (offboarded). |
| Assets | 35 | Laptops, monitors, networking, rooms, vehicles, printers, mobile devices. All 7 lifecycle states represented. 6 bookable. |
| Allocations | 32 | Active, returned, and overdue records. Individual and department-level. |
| Transfers | 4 | Approved (2), rejected (1), pending (1). |
| Bookings | 14 | Completed, cancelled, ongoing, upcoming, plus the back-to-back boundary case. |
| Maintenance | 7 | All 6 workflow states (pending, approved, rejected, assigned, in_progress, resolved). |
| Audit Cycles | 2 | 1 closed (clean Q4 2025 Pune audit), 1 open (Q2 2026 Mumbai with missing + damaged). |
| Audit Items | 21 | Verified, missing, damaged, and pending results. |
| Notifications | 27 | All PRD notification types represented. Mix of read/unread. |
| Activity Logs | 69 | Full operational trail with causal chain. |

### Running the Seed Script

```bash
cd server
npm run seed
```

The script is idempotent — it clears all tables and re-inserts from `data/*.json` on each run. The admin account is created with the login email `admin@assetflow.app` (not the organizational email `arjun.mehta@nexgeninfra.com`).

### Hero Assets (Rich Lifecycle Narratives)

These six assets have multi-event histories suitable for demonstrating lifecycle tracking:

| Asset | Tag | Story |
|---|---|---|
| MacBook Pro 14" M3 | AF-0014 | Allocated → returned → re-allocated → keyboard maintenance → resolved → re-allocated to Pooja Venkatesh |
| Dell UltraSharp Monitor | AF-0003 | Allocated → screen flickering → panel replaced → re-allocated to Rajesh Iyer |
| HP LaserJet Pro | AF-0008 | Department allocation → returned → Retired → **Disposed** (terminal state) |
| iPad Pro 12.9" | AF-0019 | Allocated to Karthik Bhat → offboarding return → re-allocated to Farhan Sheikh → **overdue** (11 days past due) |
| Toyota Innova Crysta | AF-0022 | Bookable vehicle with AC compressor maintenance history and multiple completed bookings |
| Cisco Switch | AF-0025 | Allocated to Platform Team, Rack B7 → marked **Missing** in open audit → will become Lost on cycle close |

---

## Login Credentials

All seeded users share the password `Password@123` except the admin account.

| Role | Name | Email | Password |
|---|---|---|---|
| **Admin** | Arjun Mehta | `admin@assetflow.app` | `Admin@123` |
| **Asset Manager** | Deepak Nair | `deepak.nair@nexgeninfra.com` | `Password@123` |
| **Asset Manager** | Nandini Krishnan | `nandini.krishnan@nexgeninfra.com` | `Password@123` |
| **Dept Head** | Kavita Sharma | `kavita.sharma@nexgeninfra.com` | `Password@123` |
| **Dept Head** | Rohan Kulkarni | `rohan.kulkarni@nexgeninfra.com` | `Password@123` |
| **Dept Head** | Sneha Patil | `sneha.patil@nexgeninfra.com` | `Password@123` |
| **Dept Head** | Megha Joshi | `megha.joshi@nexgeninfra.com` | `Password@123` |
| **Dept Head** | Vikram Desai | `vikram.desai@nexgeninfra.com` | `Password@123` |
| **Employee** | Priya Deshmukh | `priya.deshmukh@nexgeninfra.com` | `Password@123` |
| **Employee** | Rajesh Iyer | `rajesh.iyer@nexgeninfra.com` | `Password@123` |

> [!TIP]
> To test the full RBAC surface, log in as one user per role: **Admin** (Arjun), **Asset Manager** (Deepak), **Dept Head** (Kavita), **Employee** (Rajesh). Each role sees a different set of sidebar navigation items and action buttons.

---

## User Roles & Permissions

Roles are assigned exclusively by an Admin through the Employee Directory (Organization Setup → Tab C). Signup always creates an Employee. There is no role self-selection.

| Capability | Admin | Asset Manager | Dept Head | Employee |
|---|---|---|---|---|
| Manage departments, categories, employee roles | ✅ | ❌ | ❌ | ❌ |
| Create/close audit cycles, assign auditors | ✅ | ❌ | ❌ | ❌ |
| Org-wide analytics | ✅ | ✅ | dept only | ❌ |
| Register assets | ❌ | ✅ | ❌ | ❌ |
| Allocate assets, approve transfers & returns | ❌ | ✅ | dept scope | ❌ |
| Approve maintenance requests | ❌ | ✅ | ❌ | ❌ |
| Approve allocation/transfer within own dept | ❌ | ✅ | ✅ | ❌ |
| Book shared resources | ✅ | ✅ | ✅ (for dept) | ✅ |
| Raise maintenance request | ✅ | ✅ | ✅ | ✅ (own assets) |
| Initiate return/transfer request | ❌ | ✅ | ✅ | ✅ (own assets) |
| View own allocated assets | ✅ | ✅ | ✅ | ✅ |
| Act as auditor (when assigned to a cycle) | ✅ | ✅ | ✅ | ✅ |

---

## Asset Lifecycle

Assets move through seven states. Every transition writes an entry to the asset's history and the global activity log.

**States:** `Available` · `Allocated` · `Reserved` · `Under Maintenance` · `Lost` · `Retired` · `Disposed`

**Allowed transitions:**

| From | To | Trigger |
|---|---|---|
| Available | Allocated | Allocation approved |
| Available | Reserved | Reservation created |
| Available | Under Maintenance | Maintenance request approved |
| Available | Retired | Admin/manager decision |
| Available | Disposed | Admin/manager decision |
| Available | Lost | Audit finding |
| Allocated | Available | Asset returned |
| Allocated | Allocated | Transfer (history updated, holder changes) |
| Allocated | Under Maintenance | Maintenance request approved |
| Allocated | Lost | Audit finding |
| Reserved | Allocated | Reservation fulfilled |
| Reserved | Available | Reservation cancelled |
| Under Maintenance | Available | Maintenance resolved |
| Under Maintenance | Retired | Beyond repair |
| Under Maintenance | Disposed | Beyond repair |
| Lost | Available | Found during later audit |
| Retired | Disposed | Final disposal |
| Disposed | *(terminal)* | No further transitions |

For the full state machine diagram, see [ARCHITECTURE.md](ARCHITECTURE.md).

---

## Core Workflows

### Allocation & Transfer

1. An Asset Manager selects an Available asset and allocates it to an employee or department, optionally setting an Expected Return Date.
2. If the asset is already held, the server returns HTTP 409 with the current holder's name (e.g., "Currently held by Priya Sharma") and offers a Transfer Request.
3. Transfer requests follow the workflow: **Requested → Approved/Rejected** (by Asset Manager or Dept Head) **→ Re-allocated** with automatic allocation history update.
4. Returns are processed with condition check-in notes and Asset Manager approval. The asset transitions back to Available.
5. Allocations past their Expected Return Date are auto-flagged as overdue on the Dashboard and in Notifications.

### Resource Booking

1. Only assets with `is_bookable: true` appear in the booking interface (conference rooms, vehicles, projectors).
2. A user selects a resource, views its week-grid calendar, and creates a booking with start/end time and purpose.
3. The server validates against all non-cancelled bookings for that asset: `newStart < existingEnd && newEnd > existingStart` → reject with HTTP 409. Touching boundaries (one booking ends at 10:00, the next starts at 10:00) are accepted.
4. Booking statuses `Upcoming`, `Ongoing`, and `Completed` are derived from time comparison at read time. Only `booked` and `cancelled` are persisted in the database.

### Maintenance

1. Any user raises a maintenance request on an asset they hold (employees: own assets only; Asset Managers and Dept Heads: broader scope), specifying issue description and priority.
2. An Asset Manager approves or rejects the request. **Approval immediately transitions the asset to Under Maintenance.**
3. A technician is assigned (free-text name and contact — technicians do not have system accounts).
4. Work progresses through In Progress to Resolved. **Resolution transitions the asset back to Available.**

### Audit

1. An Admin creates an Audit Cycle with a name, scope (department and/or location), date range, and assigned auditors.
2. The system auto-populates audit items from assets matching the scope.
3. Assigned auditors review each item and mark it **Verified**, **Missing**, or **Damaged** with notes.
4. A discrepancy report is auto-generated from all non-verified items.
5. Closing the cycle **locks it** and applies status updates: confirmed Missing → **Lost**; Damaged → optionally auto-raises a maintenance request.

---

## Reports & Analytics

| Report | Type | Description |
|---|---|---|
| Asset Utilization | Bar chart | Most-allocated vs. idle assets |
| Maintenance Frequency | Chart | Breakdown by asset category |
| Due for Return / Retirement | Table | Assets with upcoming or overdue return dates, and those flagged for retirement |
| Department Allocation Summary | Table + chart | Asset distribution across departments |
| Booking Heatmap | Day × hour grid | Booking density across time slots |

All reports support **CSV export**.

> [!NOTE]
> Analytics scope is role-dependent: Admins and Asset Managers see org-wide data. Dept Heads see their department only. Employees do not have access to Reports.

---

## Notifications & Activity Log

### Notification Types

| Type | Trigger |
|---|---|
| Asset Assigned | Asset allocated or re-allocated to a user |
| Maintenance Approved / Rejected | Asset Manager decides on a maintenance request |
| Booking Confirmed / Cancelled / Reminder | Booking created, cancelled, or approaching start time |
| Transfer Approved / Rejected | Asset Manager or Dept Head decides on a transfer |
| Transfer Requested | Current holder notified of incoming transfer request |
| Overdue Return Alert | Allocation past Expected Return Date (sent to holder and Asset Manager) |
| Audit Discrepancy Flagged | Audit item marked Missing or Damaged |
| Audit Assigned | User assigned as auditor for a cycle |

### Activity Log

Every create, update, and state transition writes to the global activity log with: actor, action, entity type, entity ID, detail JSON, and timestamp. Accessible to Admins and Asset Managers, filterable by user, entity type, and date range.

---

## Security

### Implemented

- **Authentication:** Email + password with bcrypt hashing (10 salt rounds). JWT-based stateless sessions.
- **Authorization:** Role-based access control enforced at the middleware layer. Every mutating API endpoint checks the caller's role against the permission table above before execution.
- **Password reset:** Token-based flow. For the hackathon demo, the reset link is displayed in-app rather than sent via email (real email delivery is an explicit non-goal per PRD §7).
- **Input validation:** Payload validation on all mutating endpoints with descriptive 400-level error messages.
- **Foreign key constraints:** Enforced at the SQLite level (`PRAGMA foreign_keys = ON`).

### Not Implemented (Intentional Scope Boundaries)

- Rate limiting, CSRF protection, and HTTP security headers are not implemented. These are standard hardening measures for a production deployment but were deprioritized for the hackathon build.
- JWT secrets are hardcoded, not externalized to environment variables.
- File upload validation is limited to multer's built-in handling. No virus scanning or content-type verification beyond file extension.
- No HTTPS — the demo runs over plain HTTP on localhost.

> [!IMPORTANT]
> These omissions are documented intentionally. They reflect the scope boundary between a 10-hour hackathon build and a production deployment, not gaps in awareness.

---

## Performance

No formal load testing has been performed. The following are architectural characteristics, not measured benchmarks:

- **SQLite with WAL mode** supports concurrent reads without blocking, which is appropriate for a single-server demo with low concurrent user counts.
- **better-sqlite3** uses synchronous operations, avoiding the callback overhead of asynchronous SQLite bindings. For the demo's data volume (35 assets, 18 users), query latency is negligible.
- **Vite's dev server** provides sub-second hot module replacement during development.
- The booking overlap check runs a single indexed query per booking creation. At the seeded data volume (14 bookings), this is effectively constant-time.

A production deployment would require benchmarking under realistic concurrency, adding database indexing beyond primary keys, and potentially migrating from SQLite to PostgreSQL for multi-process write support.

---

## Roadmap

The following are potential future enhancements, not current capabilities:

- **Real email/SMS notifications** — replace the in-app simulated delivery with actual SMTP/SMS integration
- **Mobile-responsive progressive web app** — optimize for tablet and phone usage during floor audits
- **Barcode/QR camera scanning** — replace the current type/paste QR input with device camera integration
- **Multi-tenancy** — isolate data by organization for SaaS deployment
- **Depreciation and accounting integration** — connect acquisition cost data to financial systems (explicitly out of scope per PRD §7)
- **Bulk import/export** — CSV-based mass asset registration and data migration
- **Custom approval chains** — configurable multi-level approval workflows beyond the current two-tier model
- **Predictive maintenance** — use maintenance frequency data to flag assets likely to need service

---

## Contributors

| Name | Role | Focus Area |
|---|---|---|
| Aditya | Backend Engineer | Node.js + Express API, SQLite schema, business logic, state machine |
| Pranav | Frontend Engineer | React + Vite UI, component kit, dashboard, booking calendar |
| Tanvi | Data & QA Lead | Seed data engineering, documentation, testing, merge coordination |

---

## Acknowledgements

Built for Hackathon Round 1 (10-hour build constraint). The seed data represents a fictional company, **NexGen Infra Solutions Pvt. Ltd.**, used to demonstrate realistic enterprise asset management workflows. All employee names, asset serial numbers, and organizational details are fabricated for demonstration purposes.

---

<!-- PLACEHOLDER: Screenshots and demo GIF -->
<!-- ⚠️ SCREENSHOTS NOT YET CAPTURED — The following placeholders should be replaced with actual application screenshots before final submission: -->
<!-- - [ ] Dashboard with KPI cards and overdue highlighting -->
<!-- - [ ] Asset Directory with search and filter controls -->
<!-- - [ ] Allocation conflict dialog showing "Currently held by..." message -->
<!-- - [ ] Booking calendar with back-to-back bookings displayed -->
<!-- - [ ] Maintenance kanban board -->
<!-- - [ ] Audit cycle with discrepancy report -->
<!-- - [ ] Reports page with utilization chart and booking heatmap -->
<!-- - [ ] Demo GIF walkthrough of the 3-minute demo script -->

---

### Design Notes

**DN-README-01:** The admin login email is `admin@assetflow.app`, not `arjun.mehta@nexgeninfra.com`. This follows IMPLEMENTATION.md §4 Phase A1, which specifies that `seed.js` creates the admin with `admin@assetflow.app`. The organizational email exists in `employees.json` but is not the login credential.

**DN-README-02:** Notification and activity log record counts (27 notifications, 69 activity logs) reflect the post-engineering-review totals after 5 notifications and 3 activity logs were added to close coverage gaps identified during the seed data validation. See `docs/SEED_DATA_REVIEW.md` for the detailed audit trail.

**DN-README-03:** The PRD defines booking statuses as `booked | cancelled` in the database, with `Upcoming`, `Ongoing`, and `Completed` derived at read time from time comparison. The seed data correctly stores only the two persisted statuses.
]]>
