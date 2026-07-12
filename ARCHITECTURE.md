# AssetFlow — Architecture Document

**Enterprise Asset & Resource Management System**

---

## Table of Contents

- [Executive Overview](#executive-overview)
- [Design Philosophy](#design-philosophy)
- [High-Level Architecture](#high-level-architecture)
- [Component Architecture](#component-architecture)
- [Folder Architecture](#folder-architecture)
- [Backend Architecture](#backend-architecture)
- [Frontend Architecture](#frontend-architecture)
- [Database Architecture](#database-architecture)
- [Authentication Architecture](#authentication-architecture)
- [Authorization Architecture](#authorization-architecture)
- [Asset Lifecycle Architecture](#asset-lifecycle-architecture)
- [Allocation & Transfer Architecture](#allocation--transfer-architecture)
- [Booking Workflow Architecture](#booking-workflow-architecture)
- [Maintenance Workflow Architecture](#maintenance-workflow-architecture)
- [Audit Workflow Architecture](#audit-workflow-architecture)
- [Notification Architecture](#notification-architecture)
- [Activity Logging Architecture](#activity-logging-architecture)
- [Data Flow](#data-flow)
- [Security Architecture](#security-architecture)
- [Error Handling Strategy](#error-handling-strategy)
- [Deployment Architecture](#deployment-architecture)
- [Scalability Considerations](#scalability-considerations)
- [Architectural Trade-offs](#architectural-trade-offs)

---

## Executive Overview

AssetFlow is a full-stack enterprise asset and resource management system. It provides structured lifecycle tracking for physical assets, conflict-free resource booking, approval-driven maintenance workflows, and auditable inventory cycles — through a role-based web application backed by a relational data store.

The system is organized as a two-tier web application: a React single-page application communicates with a Node.js/Express REST API over HTTP, which persists state in a SQLite database. This architecture was chosen to minimize operational dependencies (no external database server, no message broker, no cache layer) while retaining the relational integrity needed for asset lifecycle enforcement.

---

## Design Philosophy

Four design principles governed every architectural decision:

1. **Invariants are enforced at the data layer, not the UI.** The double-allocation block, booking overlap rejection, and lifecycle state machine run server-side. The frontend renders the outcomes; it does not enforce them.

2. **Every state change is auditable.** The `asset_history` table records every lifecycle transition with actor, timestamp, and context. The `activity_logs` table captures every significant action across all entity types. This dual-write pattern ensures that both per-asset timelines and system-wide audit trails are available.

3. **The schema is the specification.** SQLite CHECK constraints encode valid enum values. Foreign key constraints encode valid relationships. The lifecycle state machine's transition map is a constant in application code (`services/lifecycle.js`), not a configuration file that might drift.

4. **Zero-infrastructure portability.** The entire application runs from `npm install && npm run seed && npm run dev`. No Docker, no Redis, no PostgreSQL installation. The database is a single file (`assetflow.db`) that can be copied between machines.

---

## High-Level Architecture

```mermaid
graph TB
    subgraph Client["Client Layer (localhost:5173)"]
        React["React SPA"]
        Vite["Vite Dev Server"]
        TW["Tailwind CSS"]
        RC["Recharts"]
    end

    subgraph Server["Server Layer (localhost:4000)"]
        Express["Express.js"]
        MW["Middleware<br/>JWT Auth · RBAC · multer"]
        Routes["Route Handlers<br/>9 route modules"]
        Services["Services<br/>Lifecycle · Activity · Reminders"]
    end

    subgraph Data["Data Layer"]
        SQLite["SQLite (WAL mode)<br/>assetflow.db"]
        Uploads["File Storage<br/>server/uploads/"]
    end

    React -->|"HTTP /api/*<br/>Bearer JWT"| Express
    Vite -->|"Proxy /api → :4000"| Express
    Express --> MW
    MW --> Routes
    Routes --> Services
    Routes --> SQLite
    Services --> SQLite
    Routes -->|"multer"| Uploads
```

The architecture is a standard three-tier web application. The Vite development server proxies `/api` requests to the Express backend, eliminating CORS during development. In a production build, the React app would be served as static files from Express or a reverse proxy.

---

## Component Architecture

```mermaid
graph LR
    subgraph Frontend
        AuthCtx["Auth Context<br/>(JWT + Role State)"]
        Shell["App Shell<br/>(Sidebar · Topbar · Bell)"]
        Pages["Page Components<br/>(S1–S10)"]
        Kit["Component Kit<br/>(Button · Input · Table<br/>Modal · Badge · Toast)"]
        API["API Client<br/>(fetch + mock toggle)"]
    end

    subgraph Backend
        AuthR["routes/auth.js<br/>signup · login · forgot · reset · me"]
        OrgR["routes/departments.js<br/>routes/categories.js<br/>routes/users.js"]
        AssetR["routes/assets.js<br/>CRUD · search · QR · photo"]
        AllocR["routes/allocations.js<br/>allocate · return · overdue"]
        TransR["routes/transfers.js<br/>request · approve · reject"]
        BookR["routes/bookings.js<br/>create · cancel · reschedule"]
        MaintR["routes/maintenance.js<br/>raise · approve · assign · resolve"]
    end

    subgraph Services
        Lifecycle["services/lifecycle.js<br/>State Machine"]
        Activity["services/activity.js<br/>logActivity · notify"]
        Remind["services/reminders.js<br/>Cron-lite booking alerts"]
    end

    Pages --> API
    API -->|"REST"| AuthR
    API -->|"REST"| OrgR
    API -->|"REST"| AssetR
    API -->|"REST"| AllocR
    API -->|"REST"| TransR
    API -->|"REST"| BookR
    API -->|"REST"| MaintR
    AllocR --> Lifecycle
    TransR --> Lifecycle
    MaintR --> Lifecycle
    AssetR --> Lifecycle
    AllocR --> Activity
    TransR --> Activity
    BookR --> Activity
    MaintR --> Activity
    AssetR --> Activity
```

The backend is organized around **route modules** (one per domain entity) and **service modules** (cross-cutting concerns). Route modules handle HTTP-level concerns: request validation, response shaping, status codes. Services handle domain logic: the lifecycle state machine validates transitions, the activity service writes audit trails and notifications, and the reminder service polls for upcoming bookings.

---

## Folder Architecture

```mermaid
graph TD
    Root["assetflow/"]
    Root --> ServerDir["server/"]
    Root --> ClientDir["client/"]
    Root --> DataDir["data/"]
    Root --> SharedDir["shared/"]
    Root --> DocsDir["docs/"]
    Root --> RootDocs["README.md · ARCHITECTURE.md<br/>TESTING.md · USER_GUIDE.md"]

    ServerDir --> Pkg["package.json"]
    ServerDir --> Src["src/"]
    ServerDir --> UploadsDir["uploads/"]
    Src --> Entry["index.js — Express entry point"]
    Src --> DB["db.js — Schema + connection"]
    Src --> Seed["seed.js — Database seeder"]
    Src --> MWDir["middleware/"]
    Src --> RoutesDir["routes/"]
    Src --> SvcDir["services/"]
    MWDir --> AuthMW["auth.js — JWT + requireRole"]
    MWDir --> UploadMW["upload.js — multer config"]
    RoutesDir --> R1["auth.js · departments.js<br/>categories.js · users.js"]
    RoutesDir --> R2["assets.js · allocations.js<br/>transfers.js · bookings.js<br/>maintenance.js"]
    SvcDir --> S1["lifecycle.js — State machine"]
    SvcDir --> S2["activity.js — Log + notify"]
    SvcDir --> S3["reminders.js — Cron-lite"]

    ClientDir --> CSrc["src/"]
    CSrc --> APIDir["api/ — Client + mock toggle"]
    CSrc --> CompDir["components/ — Reusable kit"]
    CSrc --> PagesDir["pages/ — S1–S10 screens"]
    CSrc --> CtxDir["context/ — Auth state"]

    DataDir --> JSONFiles["13 seed JSON files<br/>+ seed.js"]
```

| Directory | Ownership | Purpose |
|---|---|---|
| `server/` | Backend engineer | Express app, SQLite schema, all business logic |
| `client/` | Frontend engineer | React SPA, page components, API client |
| `data/` | Data & QA lead | Seed data JSON files consumed by `seed.js` |
| `shared/` | Shared | Frozen API contract document |
| `docs/` | Data & QA lead | Validation reports, seed data documentation |

This folder ownership model was chosen to minimize merge conflicts: each team member works in their own directory, and merges to `main` happen at defined checkpoints.

---

## Backend Architecture

The Express server (`server/src/index.js`) follows a modular pattern:

```
index.js
├── Middleware stack: cors, express.json, static uploads
├── Health check: GET /api/health
├── Route mounts: 9 route modules under /api/*
├── 404 handler: unknown API routes
├── Central error handler: contract-shaped errors
└── Startup: listen on PORT, start reminders
```

**Request lifecycle:**

1. Express parses the request body (JSON) and serves static uploads.
2. The `requireAuth` middleware extracts and verifies the JWT from the `Authorization: Bearer <token>` header, loads the fresh user record from the database, and attaches it to `req.user`. Inactive accounts are rejected with HTTP 403.
3. Route-specific `requireRole(...)` guards check `req.user.role` against a whitelist.
4. The route handler validates the payload, executes business logic (calling services as needed), and returns a contract-shaped response: `{ ok: true, data }` on success, `{ ok: false, error: "..." }` on failure.
5. Any uncaught error falls through to the central error handler, which returns a contract-shaped error response with the appropriate HTTP status.

**Contract shape:** Every API response follows `{ ok: boolean, data?: any, error?: string }`. This gives the frontend a single, predictable response structure regardless of the endpoint.

---

## Frontend Architecture

The React SPA uses a standard pattern for role-based applications:

| Layer | Responsibility |
|---|---|
| **Auth Context** | Stores JWT in `localStorage`, tracks the current user's role, provides login/logout methods to the component tree |
| **App Shell** | Sidebar with role-filtered navigation links, topbar with notification bell, protected route wrapper that redirects unauthenticated users to login |
| **Pages** | One page component per PRD screen (S1–S10), each consuming the API client |
| **Component Kit** | Shared UI primitives: Button, Input, Select, Modal, Table, Badge (status-colored), Toast |
| **API Client** | Centralized `fetch` wrapper that attaches the JWT, handles errors, and supports a `USE_MOCK` flag for frontend-first development |

The `USE_MOCK` toggle in `api/index.js` allowed the frontend to develop against mock data shaped to the API contract before the backend was available. At merge checkpoints, `USE_MOCK` was set to `false` and the frontend connected to the live API.

---

## Database Architecture

The database is a single SQLite file (`server/assetflow.db`) initialized with WAL mode and foreign key enforcement:

```sql
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;
```

### Entity-Relationship Diagram

```mermaid
erDiagram
    users ||--o{ allocations : "allocated_by"
    users ||--o{ allocations : "holder_user_id"
    users ||--o{ assets : "created_by"
    users ||--o{ transfer_requests : "requested_by"
    users ||--o{ transfer_requests : "decided_by"
    users ||--o{ bookings : "booked_by"
    users ||--o{ maintenance_requests : "raised_by"
    users ||--o{ maintenance_requests : "decided_by"
    users ||--o{ audit_cycles : "created_by"
    users ||--o{ audit_assignments : "auditor_user_id"
    users ||--o{ audit_items : "checked_by"
    users ||--o{ notifications : "user_id"
    users ||--o{ activity_logs : "user_id"
    users ||--o{ password_resets : "user_id"
    users }o--|| departments : "department_id"

    departments ||--o{ departments : "parent_id"
    departments ||--o| users : "head_user_id"
    departments ||--o{ allocations : "holder_department_id"
    departments ||--o{ transfer_requests : "to_department_id"
    departments ||--o{ audit_cycles : "scope_department_id"

    categories ||--o{ assets : "category_id"

    assets ||--o{ allocations : "asset_id"
    assets ||--o{ transfer_requests : "asset_id"
    assets ||--o{ bookings : "asset_id"
    assets ||--o{ maintenance_requests : "asset_id"
    assets ||--o{ audit_items : "asset_id"
    assets ||--o{ asset_history : "asset_id"

    allocations ||--o{ transfer_requests : "from_allocation_id"

    audit_cycles ||--o{ audit_assignments : "cycle_id"
    audit_cycles ||--o{ audit_items : "cycle_id"

    users {
        INTEGER id PK
        TEXT name
        TEXT email UK
        TEXT password_hash
        TEXT role "admin|asset_manager|dept_head|employee"
        INTEGER department_id FK
        TEXT status "active|inactive"
        TEXT created_at
    }

    departments {
        INTEGER id PK
        TEXT name
        INTEGER head_user_id FK
        INTEGER parent_id FK
        TEXT status "active|inactive"
    }

    categories {
        INTEGER id PK
        TEXT name
        TEXT description
        TEXT custom_fields "JSON array"
    }

    assets {
        INTEGER id PK
        TEXT tag UK "AF-NNNN"
        TEXT name
        INTEGER category_id FK
        TEXT serial_no
        TEXT acquisition_date
        REAL acquisition_cost
        TEXT condition "New|Good|Fair|Poor"
        TEXT location
        TEXT photo_url
        INTEGER is_bookable
        TEXT status "7 lifecycle states"
        TEXT custom_values "JSON object"
        INTEGER created_by FK
    }

    asset_history {
        INTEGER id PK
        INTEGER asset_id FK
        TEXT from_state
        TEXT to_state
        INTEGER actor_id FK
        TEXT detail
        TEXT created_at
    }

    allocations {
        INTEGER id PK
        INTEGER asset_id FK
        INTEGER holder_user_id FK
        INTEGER holder_department_id FK
        INTEGER allocated_by FK
        TEXT allocated_at
        TEXT expected_return_date
        TEXT returned_at
        TEXT return_condition_notes
        TEXT status "active|returned"
    }

    transfer_requests {
        INTEGER id PK
        INTEGER asset_id FK
        INTEGER from_allocation_id FK
        INTEGER requested_by FK
        INTEGER to_user_id FK
        INTEGER to_department_id FK
        TEXT status "requested|approved|rejected"
        INTEGER decided_by FK
        TEXT decided_at
        TEXT created_at
    }

    bookings {
        INTEGER id PK
        INTEGER asset_id FK
        INTEGER booked_by FK
        TEXT start_time
        TEXT end_time
        TEXT purpose
        TEXT status "booked|cancelled"
        TEXT created_at
    }

    maintenance_requests {
        INTEGER id PK
        INTEGER asset_id FK
        INTEGER raised_by FK
        TEXT issue
        TEXT priority "Low|Medium|High"
        TEXT photo_url
        TEXT status "pending|approved|rejected|assigned|in_progress|resolved"
        TEXT technician_name
        TEXT technician_contact
        INTEGER decided_by FK
        TEXT resolved_at
        TEXT created_at
    }

    audit_cycles {
        INTEGER id PK
        TEXT name
        INTEGER scope_department_id FK
        TEXT scope_location
        TEXT start_date
        TEXT end_date
        TEXT status "open|closed"
        INTEGER created_by FK
    }

    audit_assignments {
        INTEGER id PK
        INTEGER cycle_id FK
        INTEGER auditor_user_id FK
    }

    audit_items {
        INTEGER id PK
        INTEGER cycle_id FK
        INTEGER asset_id FK
        TEXT result "pending|verified|missing|damaged"
        TEXT note
        INTEGER checked_by FK
        TEXT checked_at
    }

    notifications {
        INTEGER id PK
        INTEGER user_id FK
        TEXT type
        TEXT title
        TEXT body
        TEXT entity_ref
        INTEGER is_read
        TEXT created_at
    }

    activity_logs {
        INTEGER id PK
        INTEGER user_id FK
        TEXT action
        TEXT entity_type
        INTEGER entity_id
        TEXT detail "JSON"
        TEXT created_at
    }

    password_resets {
        INTEGER id PK
        INTEGER user_id FK
        TEXT token
        TEXT expires_at
        INTEGER used
    }
```

### Schema Design Decisions

| Decision | Rationale |
|---|---|
| **15 tables** (14 from PRD §6 + `asset_history`) | `asset_history` was added beyond the PRD spec to support the lifecycle timeline view on the asset detail page. Every transition recorded by `transitionAsset()` writes here. |
| **CHECK constraints on enums** | Role, status, condition, priority, and result values are enforced at the database level, preventing invalid state from ever being persisted regardless of application-level bugs. |
| **Allocations hold both `holder_user_id` and `holder_department_id`** | Supports both individual and department-level allocation in a single table. Exactly one is non-null per record. |
| **Booking statuses: `booked` and `cancelled` only** | `Upcoming`, `Ongoing`, and `Completed` are derived from time comparison at read time in `routes/bookings.js`. This avoids stale status data and eliminates the need for scheduled status-update jobs. |
| **`custom_fields` (JSON) on categories, `custom_values` (JSON) on assets** | Category definitions store field schemas (name, type, label, required). Asset records store the actual values. This provides flexible per-category fields without schema migration. |
| **WAL mode** | Write-Ahead Logging allows concurrent reads during writes, which is necessary when the booking reminder interval fires while a user request is being processed. |

---

## Authentication Architecture

```mermaid
sequenceDiagram
    participant Client
    participant Express as Express API
    participant DB as SQLite

    Note over Client,DB: Signup Flow
    Client->>Express: POST /api/auth/signup {name, email, password}
    Express->>Express: Validate input, check email uniqueness
    Express->>Express: bcrypt.hashSync(password, 10)
    Express->>DB: INSERT INTO users (..., role='employee')
    Express->>Express: signToken({id, role})
    Express-->>Client: 201 {token, user} — role is always 'employee'

    Note over Client,DB: Login Flow
    Client->>Express: POST /api/auth/login {email, password}
    Express->>DB: SELECT * FROM users WHERE email = ?
    Express->>Express: bcrypt.compareSync(password, hash)
    alt Invalid credentials
        Express-->>Client: 401 {error: "Invalid email or password"}
    else Inactive account
        Express-->>Client: 403 {error: "Account is inactive"}
    else Success
        Express->>Express: signToken({id, role})
        Express-->>Client: 200 {token, user}
    end

    Note over Client,DB: Authenticated Request
    Client->>Express: GET /api/assets (Authorization: Bearer <JWT>)
    Express->>Express: jwt.verify(token, JWT_SECRET)
    Express->>DB: SELECT * FROM users WHERE id = payload.id
    alt User not found or inactive
        Express-->>Client: 401/403
    else Valid
        Express->>Express: req.user = user
        Express->>Express: Route handler executes
        Express-->>Client: 200 {ok: true, data: [...]}
    end

    Note over Client,DB: Password Reset (simulated email)
    Client->>Express: POST /api/auth/forgot {email}
    Express->>DB: SELECT user, generate token, INSERT password_resets
    Express-->>Client: 200 {resetLink: "/reset-password?token=..."}
    Note right of Client: Link shown in-app<br/>(email delivery simulated)
    Client->>Express: POST /api/auth/reset {token, newPassword}
    Express->>DB: Verify token, UPDATE password_hash, mark token used
    Express-->>Client: 200 {reset: true}
```

**Key decisions:**

- **JWT payload** contains `{ id, role }` only. The `requireAuth` middleware re-fetches the full user record from the database on every request, ensuring that role changes and account deactivations take immediate effect.
- **JWT expiry** is set to 7 days (`JWT_EXPIRES = '7d'`). Token refresh is not implemented — for a hackathon demo, session length is not a concern.
- **Signup always assigns `role: 'employee'`.** There is no role field in the signup payload. Role promotion happens exclusively through `PUT /api/users/:id` by an Admin.
- **Password reset** generates a `crypto.randomBytes(24)` token stored in `password_resets` with a 1-hour expiry. The reset link is returned in the API response and displayed in the UI. Real email delivery is an explicit non-goal (PRD §7).

---

## Authorization Architecture

Authorization is enforced at two levels: middleware-level role checks and route-level business logic.

```mermaid
flowchart TD
    Req["Incoming Request"]
    Req --> Auth{"requireAuth<br/>JWT valid?"}
    Auth -->|No| R401["401 Unauthorized"]
    Auth -->|Yes| Active{"User active?"}
    Active -->|No| R403a["403 Account inactive"]
    Active -->|Yes| Role{"requireRole(...)<br/>Role in whitelist?"}
    Role -->|No| R403b["403 Not permitted"]
    Role -->|Yes| BizLogic{"Route-level<br/>business logic"}
    BizLogic -->|"Employee trying to<br/>maintain non-own asset"| R403c["403 Own assets only"]
    BizLogic -->|"Dept Head outside<br/>own department scope"| R403d["403 Dept scope"]
    BizLogic -->|Pass| Handler["Execute + respond"]
```

### Permission Enforcement by Route

| Route | Middleware Guard | Business Logic Guard |
|---|---|---|
| `POST /assets` | `requireRole('asset_manager')` | — |
| `POST /allocations` | `requireRole('asset_manager', 'dept_head')` | — |
| `POST /allocations/:id/return` | `requireRole('asset_manager', 'dept_head')` | — |
| `PUT /transfers/:id` | `requireRole('asset_manager', 'dept_head')` | — |
| `POST /maintenance` | `requireAuth` (all roles) | Employee: must hold the asset |
| `PUT /maintenance/:id` | `requireRole('asset_manager')` | — |
| `POST /bookings` | `requireAuth` (all roles) | Asset must be bookable |
| `PUT /bookings/:id` | `requireAuth` (all roles) | Must own the booking (or be admin/manager) |
| `PUT /users/:id` | `requireRole('admin')` | — |
| `POST/PUT /departments` | `requireRole('admin')` | — |
| `POST/PUT /categories` | `requireRole('admin')` | — |

---

## Asset Lifecycle Architecture

The lifecycle state machine is the central invariant of the system. It is implemented as a single function `transitionAsset(assetId, toState, actorId, detail)` in `services/lifecycle.js`.

### State Machine

```mermaid
stateDiagram-v2
    [*] --> Available : Registered

    Available --> Allocated : Allocation approved
    Available --> Reserved : Reservation created
    Available --> UnderMaintenance : Maintenance approved
    Available --> Retired : Admin/manager decision
    Available --> Disposed : Admin/manager decision
    Available --> Lost : Audit finding

    Allocated --> Available : Returned
    Allocated --> Allocated : Transfer (re-allocation)
    Allocated --> UnderMaintenance : Maintenance approved
    Allocated --> Lost : Audit finding

    Reserved --> Allocated : Reservation fulfilled
    Reserved --> Available : Reservation cancelled

    UnderMaintenance --> Available : Resolved
    UnderMaintenance --> Retired : Beyond repair
    UnderMaintenance --> Disposed : Beyond repair

    Lost --> Available : Found in subsequent audit

    Retired --> Disposed : Final disposal

    Disposed --> [*] : Terminal

    state "Under Maintenance" as UnderMaintenance
```

### Transition Map (from code)

The transition map is defined as a constant in `services/lifecycle.js`:

```javascript
const TRANSITIONS = {
  'Available':         ['Allocated', 'Reserved', 'Under Maintenance', 'Retired', 'Disposed', 'Lost'],
  'Allocated':         ['Available', 'Allocated', 'Under Maintenance', 'Lost'],
  'Reserved':          ['Allocated', 'Available'],
  'Under Maintenance': ['Available', 'Retired', 'Disposed'],
  'Lost':              ['Available'],
  'Retired':           ['Disposed'],
  'Disposed':          [], // terminal
};
```

Every call to `transitionAsset()`:

1. Validates the requested transition against the map. Illegal transitions throw a `TransitionError` (HTTP 400).
2. Updates the asset's `status` column.
3. Inserts a record into `asset_history` with `from_state`, `to_state`, `actor_id`, and `detail`.
4. Calls `logActivity()` to write to the global activity log.

The `Allocated → Allocated` self-transition is a special case: it represents a transfer where the asset remains allocated but the holder changes. The lifecycle service permits this explicitly.

---

## Allocation & Transfer Architecture

### Allocation Workflow

```mermaid
flowchart TD
    Start["POST /allocations<br/>{assetId, holderUserId|holderDepartmentId}"]
    Start --> CheckActive{"Active allocation<br/>exists for asset?"}
    CheckActive -->|Yes| Conflict["409 Conflict<br/>'Currently held by [name]'<br/>canRequestTransfer: true"]
    CheckActive -->|No| CheckState{"Asset state<br/>allows allocation?"}
    CheckState -->|No| Err400["400 Bad Request"]
    CheckState -->|Yes| Transition["transitionAsset → Allocated"]
    Transition --> Insert["INSERT allocation<br/>status: 'active'"]
    Insert --> Log["logActivity + notify holder"]
    Log --> Resp["201 Created"]
```

### Transfer Workflow

```mermaid
flowchart TD
    Start["POST /transfers<br/>{assetId, toUserId|toDepartmentId}"]
    Start --> CheckAlloc{"Asset currently<br/>allocated?"}
    CheckAlloc -->|No| Err["400: Not allocated,<br/>allocate directly"]
    CheckAlloc -->|Yes| PermCheck{"Employee owns asset<br/>OR privileged role?"}
    PermCheck -->|No| Err403["403 Forbidden"]
    PermCheck -->|Yes| Insert["INSERT transfer_request<br/>status: 'requested'"]
    Insert --> Pending["Transfer pending<br/>approval"]

    Pending --> Decision{"Asset Manager / Dept Head<br/>PUT /transfers/:id"}
    Decision -->|"action: reject"| Reject["UPDATE status → 'rejected'<br/>Notify requester"]
    Decision -->|"action: approve"| Approve

    subgraph Approve["Approve (transaction)"]
        CloseOld["UPDATE old allocation<br/>status → 'returned'"]
        CloseOld --> TransitionAA["transitionAsset<br/>Allocated → Allocated"]
        TransitionAA --> NewAlloc["INSERT new allocation<br/>status: 'active'"]
        NewAlloc --> UpdateTR["UPDATE transfer_request<br/>status → 'approved'"]
    end

    Approve --> Notify["Notify requester + new holder"]
```

The transfer approval runs inside a SQLite transaction (`db.transaction()`). If any step fails — including the lifecycle transition — the entire operation rolls back.

---

## Booking Workflow Architecture

```mermaid
flowchart TD
    Start["POST /bookings<br/>{assetId, startTime, endTime, purpose}"]
    Start --> Validate["Validate: asset exists,<br/>is_bookable, valid time range"]
    Validate -->|Fail| Err400["400 Bad Request"]
    Validate -->|Pass| OverlapCheck

    subgraph OverlapCheck["Overlap Check (SQL)"]
        Query["SELECT * FROM bookings<br/>WHERE asset_id = :id<br/>AND status = 'booked'<br/>AND start_time < :endTime<br/>AND end_time > :startTime"]
    end

    OverlapCheck -->|"Match found"| Conflict["409 Conflict<br/>'Overlaps existing booking<br/>(HH:MM – HH:MM)'"]
    OverlapCheck -->|"No match"| Insert["INSERT booking<br/>status: 'booked'"]
    Insert --> Log["logActivity + notify booker"]
    Log --> Resp["201 Created"]

    Note1["Back-to-back case:<br/>Booking A: 09:00–10:00<br/>Booking B: 10:00–11:00<br/><br/>10:00 < 10:00 = false → No overlap ✅"]

    Note2["Overlap case:<br/>Booking A: 08:30–12:30<br/>Booking B: 09:00–10:30<br/><br/>09:00 < 12:30 = true AND<br/>10:30 > 08:30 = true → Overlap ❌"]
```

### Derived Booking Statuses

The database stores only two booking statuses: `booked` and `cancelled`. Display statuses are computed at read time in `routes/bookings.js`:

```javascript
function derivedStatus(b, now = new Date()) {
  if (b.status === 'cancelled') return 'Cancelled';
  const start = new Date(b.start_time);
  const end   = new Date(b.end_time);
  if (now < start) return 'Upcoming';
  if (now >= start && now <= end) return 'Ongoing';
  return 'Completed';
}
```

This eliminates the need for scheduled jobs to transition booking statuses over time.

### Rescheduling

`PUT /bookings/:id` with new `startTime` and `endTime` re-runs the overlap check (excluding the booking's own ID to avoid self-conflict) before updating the record.

### Booking Reminders

A `setInterval` loop in `services/reminders.js` runs every 60 seconds, scanning for bookings starting within the next 30 minutes. It generates a `booking_reminder` notification for each, using the notification's `entity_ref` field (`reminder:booking:<id>`) as an idempotency key to prevent duplicate reminders.

---

## Maintenance Workflow Architecture

```mermaid
flowchart TD
    Start["POST /maintenance<br/>{assetId, issue, priority, photo?}"]
    Start --> PermCheck{"Employee?"}
    PermCheck -->|"Yes: must hold asset"| HoldCheck{"Asset allocated<br/>to this user?"}
    HoldCheck -->|No| Err403["403: Own assets only"]
    HoldCheck -->|Yes| Create
    PermCheck -->|"No (manager/head)"| Create

    Create["INSERT maintenance_request<br/>status: 'pending'"]
    Create --> Pending["⏳ Pending"]

    Pending --> Decision{"Asset Manager<br/>PUT /maintenance/:id"}
    Decision -->|"action: approve"| Approve
    Decision -->|"action: reject"| Reject["status → 'rejected'<br/>No asset status change"]

    Approve["status → 'approved'<br/>transitionAsset → Under Maintenance"]
    Approve --> Assign

    Assign["action: assign<br/>status → 'assigned'<br/>technicianName + technicianContact"]
    Assign --> InProgress

    InProgress["action: start<br/>status → 'in_progress'"]
    InProgress --> Resolve

    Resolve["action: resolve<br/>status → 'resolved'<br/>transitionAsset → Available"]
```

**Asset status side-effects** are enforced in the route handler:

| Action | Asset Status Change |
|---|---|
| `approve` | Current status → **Under Maintenance** |
| `reject` | No change |
| `assign` | No change |
| `start` | No change |
| `resolve` | Under Maintenance → **Available** |

The maintenance workflow has a linear progression: `pending → approved → assigned → in_progress → resolved`. The `reject` action is a branch from `pending` that terminates the request. Technician information is free-text (name + contact); technicians do not have system accounts (PRD §7).

### Valid Status Transitions

```javascript
const ACTIONS = {
  approve: { from: ['pending'],                      to: 'approved' },
  reject:  { from: ['pending'],                      to: 'rejected' },
  assign:  { from: ['approved', 'assigned'],         to: 'assigned' },
  start:   { from: ['assigned'],                     to: 'in_progress' },
  resolve: { from: ['in_progress', 'assigned', 'approved'], to: 'resolved' },
};
```

---

## Audit Workflow Architecture

```mermaid
flowchart TD
    Start["Admin: POST /audits<br/>{name, scope, dates, auditorIds}"]
    Start --> Create["INSERT audit_cycle<br/>status: 'open'"]
    Create --> AssignAuditors["INSERT audit_assignments"]
    AssignAuditors --> PopulateItems["INSERT audit_items<br/>from assets matching scope<br/>result: 'pending'"]
    PopulateItems --> NotifyAuditors["Notify assigned auditors"]

    NotifyAuditors --> AuditPhase["Auditors verify assets"]

    AuditPhase --> MarkItem["PUT /audits/:id/items/:itemId<br/>{result: verified|missing|damaged, note}"]
    MarkItem --> Discrepancy{"result != 'verified'?"}
    Discrepancy -->|Yes| FlagNotif["Notify admin:<br/>Audit Discrepancy"]
    Discrepancy -->|No| Continue["Continue"]
    FlagNotif --> Continue
    Continue --> MoreItems{"More items?"}
    MoreItems -->|Yes| MarkItem
    MoreItems -->|No| Report["Auto-generated<br/>discrepancy report"]

    Report --> CloseCycle["Admin: PUT /audits/:id<br/>{action: 'close'}"]

    subgraph CloseCycle["Close Cycle Effects"]
        Lock["Lock cycle<br/>status → 'closed'"]
        Lock --> MissingToLost["Missing items →<br/>transitionAsset → Lost"]
        MissingToLost --> DamagedToMaint["Damaged items →<br/>auto-raise maintenance"]
    end
```

**Scope resolution:** When an audit cycle is created with `scope_location` and/or `scope_department_id`, the system queries assets matching those criteria and auto-populates `audit_items` with `result: 'pending'` for each.

**Close-cycle consequences:**

| Audit Result | Asset Status Change | Additional Effect |
|---|---|---|
| `verified` | None | — |
| `missing` | → **Lost** | — |
| `damaged` | None (asset stays current status) | Optionally auto-raises a maintenance request |
| `pending` | None | Unresolved items remain for record |

> [!NOTE]
> The PRD specifies "Damaged → optionally auto-raise maintenance request." The implementation treats this as an automatic system behavior (not a per-item user choice), consistent with Design Note DN-01 in the Validation Report.

---

## Notification Architecture

```mermaid
flowchart LR
    subgraph Triggers["Event Triggers"]
        T1["Asset allocated"]
        T2["Maintenance approved/rejected"]
        T3["Booking confirmed/cancelled"]
        T4["Transfer approved/rejected/requested"]
        T5["Overdue return detected"]
        T6["Audit discrepancy flagged"]
        T7["Audit assignment"]
        T8["Booking reminder (cron)"]
    end

    subgraph NotifService["services/activity.js"]
        Notify["notify(userId, type, title, body, entityRef)"]
    end

    subgraph DB["notifications table"]
        Record["id · user_id · type · title · body<br/>entity_ref · is_read · created_at"]
    end

    subgraph Delivery["Delivery"]
        Bell["Bell icon (topbar)"]
        Page["Notification center page"]
    end

    T1 --> Notify
    T2 --> Notify
    T3 --> Notify
    T4 --> Notify
    T5 --> Notify
    T6 --> Notify
    T7 --> Notify
    T8 --> Notify
    Notify --> Record
    Record --> Bell
    Record --> Page
```

### Notification Type Mapping

| Event | Notification Type | Recipient |
|---|---|---|
| Asset allocated/re-allocated | `asset_assigned` | Holder |
| Maintenance approved | `maintenance_approved` | Requester |
| Maintenance rejected | `maintenance_rejected` | Requester |
| Maintenance resolved | `maintenance_resolved` | Requester |
| Booking confirmed | `booking_confirmed` | Booker |
| Booking cancelled | `booking_cancelled` | Booker |
| Booking starting soon | `booking_reminder` | Booker |
| Transfer approved | `transfer_approved` | Requester + previous holder |
| Transfer rejected | `transfer_rejected` | Requester |
| Transfer requested | `transfer_requested` | Current holder |
| Overdue return | `overdue_return` | Holder + Asset Manager |
| Audit discrepancy | `audit_discrepancy` | Admin |
| Audit assignment | `audit_assigned` | Assigned auditor |

**Idempotency:** Overdue alerts and booking reminders use `entity_ref` as a deduplication key. Before inserting, the system checks for an existing notification with the same `entity_ref`. This prevents duplicate notifications on repeated cron scans or API calls.

**Delivery:** All notifications are delivered in-app (stored in the database, retrieved via `GET /api/notifications`). Real email/SMS delivery is an explicit non-goal (PRD §7). The bell icon shows unread count; the notification center page shows all notifications with read/unread toggling.

---

## Activity Logging Architecture

```mermaid
flowchart TD
    subgraph Sources["Every Mutating Route"]
        S1["auth: signup, forgot, reset"]
        S2["assets: create, update, upload_photo"]
        S3["allocations: allocate, return"]
        S4["transfers: request, approve, reject"]
        S5["bookings: book, cancel, reschedule"]
        S6["maintenance: raise, approve, reject, assign, start, resolve"]
        S7["lifecycle: transition (via transitionAsset)"]
    end

    LogFn["logActivity(userId, action, entityType, entityId, detail)"]

    subgraph Storage["activity_logs table"]
        Record["id · user_id · action · entity_type<br/>entity_id · detail (JSON) · created_at"]
    end

    subgraph Query["Query Interface"]
        API["GET /api/activity-logs<br/>?user=&entityType=&from=&to="]
        Access["Admin + Asset Manager only"]
    end

    S1 --> LogFn
    S2 --> LogFn
    S3 --> LogFn
    S4 --> LogFn
    S5 --> LogFn
    S6 --> LogFn
    S7 --> LogFn
    LogFn --> Record
    Record --> API
    API --> Access
```

The `logActivity()` function accepts a free-form `detail` parameter (string or object). Objects are serialized as JSON. This provides structured context for each action without imposing a fixed schema on the detail field.

**Query ordering:** Activity logs are queried with `ORDER BY created_at`, not `ORDER BY id`. The append-only nature of the log means IDs are monotonically increasing during normal operation, but the seed data contains appended entries (IDs 67–69) with earlier timestamps. `ORDER BY created_at` ensures correct chronological display.

---

## Data Flow

A representative data flow for the allocation-with-conflict-and-transfer scenario:

```mermaid
sequenceDiagram
    participant UI as React App
    participant API as Express API
    participant LC as Lifecycle Service
    participant Act as Activity Service
    participant DB as SQLite

    UI->>API: POST /allocations {assetId: 13, holderUserId: 9}
    API->>DB: SELECT * FROM allocations WHERE asset_id=13 AND status='active'
    DB-->>API: Active allocation found (holder: Amit Khanna)
    API-->>UI: 409 {error: "Currently held by Amit Khanna", canRequestTransfer: true}

    UI->>API: POST /transfers {assetId: 13, toUserId: 9}
    API->>DB: INSERT transfer_request (status: 'requested')
    API->>Act: logActivity('request_transfer', ...)
    API-->>UI: 201 Created

    Note over UI,DB: Asset Manager reviews pending transfers

    UI->>API: PUT /transfers/1 {action: "approve"}
    API->>DB: BEGIN TRANSACTION
    API->>DB: UPDATE allocations SET status='returned' (old allocation)
    API->>LC: transitionAsset(13, 'Allocated', ..., 'Transferred')
    LC->>DB: UPDATE assets SET status='Allocated'
    LC->>DB: INSERT asset_history
    LC->>Act: logActivity('transition', ...)
    API->>DB: INSERT allocations (new, to Rajesh Iyer, status: 'active')
    API->>DB: UPDATE transfer_requests SET status='approved'
    API->>DB: COMMIT
    API->>Act: logActivity('approve_transfer', ...)
    API->>Act: notify(requester, 'transfer_approved', ...)
    API->>Act: notify(holder, 'asset_assigned', ...)
    API-->>UI: 200 OK
```

---

## Security Architecture

### Implemented Security Controls

| Layer | Control | Implementation |
|---|---|---|
| **Authentication** | Password hashing | bcrypt with 10 salt rounds |
| **Authentication** | Stateless sessions | JWT with 7-day expiry |
| **Authentication** | Password reset | Cryptographic token, 1-hour expiry, single-use |
| **Authorization** | Role-based access | `requireRole(...)` middleware on every protected route |
| **Authorization** | Ownership checks | Business logic in routes (e.g., employee can only maintain own assets) |
| **Data integrity** | Foreign key constraints | `PRAGMA foreign_keys = ON` |
| **Data integrity** | Enum constraints | `CHECK` constraints on all status/role/condition columns |
| **Data integrity** | Lifecycle enforcement | `transitionAsset()` validates against transition map |
| **Input validation** | Payload validation | Every mutating route validates required fields, types, and ranges |
| **Upload security** | File size limit | multer `limits.fileSize = 8MB` |
| **Error handling** | Information leakage prevention | Central error handler returns contract-shaped errors; password reset does not reveal email existence |

### Intentional Scope Boundaries

| Control | Status | Rationale |
|---|---|---|
| Rate limiting | Not implemented | Low risk for single-server demo |
| CSRF protection | Not implemented | JWT-based auth (no cookies) mitigates CSRF for API calls |
| HTTP security headers | Not implemented | Would add Helmet.js in production |
| HTTPS | Not implemented | Demo runs on localhost |
| JWT secret externalization | Hardcoded default | Would use `dotenv` in production |
| Content-type validation on uploads | Not implemented | multer handles basic file filtering |

---

## Error Handling Strategy

All errors follow a consistent contract-shaped response:

```json
{ "ok": false, "error": "Human-readable error message" }
```

| HTTP Status | Meaning | Example Trigger |
|---|---|---|
| 400 | Bad request / validation failure | Missing required field, invalid transition, invalid enum value |
| 401 | Authentication required | Missing or invalid JWT |
| 403 | Forbidden | Role not authorized, account inactive, ownership violation |
| 404 | Not found | Asset/allocation/booking ID does not exist |
| 409 | Conflict | Double-allocation attempt, booking overlap |
| 500 | Internal server error | Unhandled exception (caught by central error handler) |

The central error handler in `index.js` catches any error that propagates past route handlers:

```javascript
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ ok: false, error: err.message || 'Internal server error' });
});
```

The `TransitionError` class in `services/lifecycle.js` carries a `status: 400` property, so invalid lifecycle transitions produce 400 responses through this mechanism.

---

## Deployment Architecture

```mermaid
graph TB

subgraph Local["Development / Demo (Current)"]
    Vite["Vite Dev Server (:5173)"]
    Express["Express API (:4000)"]
    DB["SQLite Database (assetflow.db)"]

    Vite -->|API Requests| Express
    Express --> DB
end

subgraph Production["Production Deployment (Future)"]
    Nginx["Nginx Reverse Proxy"]
    Frontend["React Static Build"]
    Backend["Express API (PM2)"]
    Postgres["PostgreSQL"]

    Nginx --> Frontend
    Nginx -->|API| Backend
    Backend --> Postgres
end
```

**Current state:** The application runs as two development processes — Vite dev server for the frontend and Node.js for the backend. The database is a single SQLite file. This is appropriate for the hackathon demo and local development.

**Production path:** A production deployment would replace Vite with the built static output (`npm run build`), add a reverse proxy (Nginx) for TLS termination and static serving, run the Express app under a process manager (PM2), and migrate from SQLite to PostgreSQL for multi-process write support and proper backup tooling.

---

## Scalability Considerations

AssetFlow is designed for single-server, low-concurrency deployment. The following documents the known scaling boundaries and the architectural changes needed to address them.

| Concern | Current State | Production Mitigation |
|---|---|---|
| **Database writes** | SQLite single-writer lock | Migrate to PostgreSQL |
| **Concurrent reads** | WAL mode supports parallel reads | PostgreSQL connection pooling |
| **Booking overlap check** | Single query per booking creation | Add index on `bookings(asset_id, status, start_time, end_time)` |
| **File uploads** | Local filesystem (`server/uploads/`) | Object storage (S3, GCS) |
| **Booking reminders** | `setInterval` in-process | Dedicated worker process or scheduled job system |
| **Notification delivery** | Database polling | WebSocket push or server-sent events |
| **Session validation** | Full user re-fetch per request | Redis-cached user records with TTL |
| **Multi-process** | Single Node.js process | PM2 cluster mode + shared database |

These are documented constraints, not defects. For the target deployment (hackathon demo with <10 concurrent users), the current architecture is appropriate.

---

## Architectural Trade-offs

| Decision | Benefit | Cost | Why It Was Chosen |
|---|---|---|---|
| SQLite over PostgreSQL | Zero-install, file-portable, survives machine swap | Single-writer, no multi-process writes, limited tooling | 10-hour hackathon: eliminating database setup time was worth the scaling limitation |
| Synchronous better-sqlite3 over async alternatives | Simpler control flow, no callback/promise complexity in route handlers | Blocks the event loop during queries | Query execution time is negligible at demo data volume (35 assets, 18 users) |
| `setInterval` reminders over a real job queue | No additional infrastructure (Redis, Bull, etc.) | Runs in the same process, no persistence across restarts | Adequate for demonstrating the booking reminder feature |
| Hardcoded JWT secret | No `.env` setup needed for demo | Security risk in production | Explicitly documented as a scope boundary, not an oversight |
| Derived booking statuses over persisted | No stale status data, no scheduled update jobs | Slight compute overhead on every read | The overlap check query already runs per booking; deriving status adds negligible cost |
| JSON columns for custom fields | Flexible per-category field definitions without schema migration | No SQL-level querying of custom field values | Custom fields are rendered in the UI; they are not used in business logic queries |

---

### Design Notes

**DN-ARCH-01:** The ER diagram shows 15 tables. The PRD §6 defines 14 entities. The additional table is `asset_history`, which was introduced to support the lifecycle timeline view on the asset detail page. Every call to `transitionAsset()` writes a record here.

**DN-ARCH-02:** The `password_resets` table includes a `used` column not specified in the PRD §6 entity definition. This was added to prevent token reuse — a standard security practice for password reset flows.

**DN-ARCH-03:** The booking overlap SQL uses `datetime()` SQLite functions for comparison. This works correctly with ISO 8601 timestamp strings because SQLite's `datetime()` function parses them consistently. The seed data stores all timestamps in `YYYY-MM-DDTHH:mm:ss.000Z` format to ensure compatibility.
