# AssetFlow — Administrator Guide

**System Administration & Operations Manual**

---

## Table of Contents

- [User Management](#user-management)
- [Department Management](#department-management)
- [Asset Categories](#asset-categories)
- [Asset Lifecycle Management](#asset-lifecycle-management)
- [Reports Overview](#reports-overview)
- [Audit Management](#audit-management)
- [Notification Management](#notification-management)
- [Security Best Practices](#security-best-practices)
- [Backup Recommendations](#backup-recommendations)
- [Operational Guidelines](#operational-guidelines)

---

## User Management

### Accessing User Management

Navigate to **Setup** → **Employee Directory** (Tab C). This is the only surface in the system for managing user roles and accounts.

### Role Assignment

AssetFlow has four roles. Signup always creates an **Employee** account. Role assignment is exclusively an Admin action.

| Role | Scope | Key Permissions |
|---|---|---|
| **Admin** | Organization-wide | User management, department/category setup, audit cycle management |
| **Asset Manager** | Organization-wide | Asset registration, allocation, transfer approval, maintenance decisions |
| **Dept Head** | Department-scoped | Allocation within own department, transfer approval, department reports |
| **Employee** | Personal scope | View own assets, book shared resources, raise maintenance for own assets |

**To change a user's role:**

1. Open **Setup** → **Employee Directory**.
2. Find the user in the list.
3. Select the new role from the dropdown.
4. Click **Save**.

The change takes effect immediately. The user's next API call will use the new role (JWT tokens are re-validated against the database on every request).

> [!IMPORTANT]
> Be deliberate when promoting users to Asset Manager or Admin. Each role adds significant write permissions across the system.

### Department Assignment

From the Employee Directory, you can assign users to departments. This affects:

- Department-scoped report visibility for Dept Heads
- The audit scope logic (assets allocated to users in a department)
- Organisational grouping in the directory

### Deactivating Users

Set a user's status to **Inactive** to:

- Prevent future login (returns 403)
- Block any in-flight JWT tokens from executing (checked per-request)
- Preserve their historical data (allocations, activity logs, etc.)

This is the correct workflow for offboarding — assets should be returned before deactivation.

### Adding New Users

New users self-register via the signup screen:

1. User goes to the login page and clicks **Create Account**.
2. Enters name, email, and password.
3. Account is created as `Employee` with no department.
4. Admin assigns their role and department from the Employee Directory.

---

## Department Management

### Accessing Department Management

Navigate to **Setup** → **Departments** (Tab A).

### Creating a Department

1. Click **Create Department**.
2. Enter:
   - **Name** (required, unique)
   - **Head** (optional — select a user as department head)
   - **Parent Department** (optional — creates hierarchy)
3. Click **Save**.

### Department Hierarchy

Departments support parent-child relationships:

```
Engineering (parent)
├── Platform Team (child)
└── QA (child)
```

When a parent department is set, the child appears nested under the parent in organizational views. The seed data includes:

| Department | Head | Parent | Status |
|---|---|---|---|
| Engineering | Kavita Sharma | — | Active |
| Platform Team | Vikram Desai | Engineering | Active |
| QA | Rohan Kulkarni | Engineering | Active |
| Operations | Sneha Patil | — | Active |
| Administration & Finance | Megha Joshi | — | Active |
| HR & Compliance | — | — | Active |
| Design & Surveying | — | — | **Inactive** (merged) |

### Deactivating Departments

Set a department's status to **Inactive** when it is merged or disbanded. Inactive departments:

- Remain in the database for historical reference
- No longer appear in active department pickers
- Users assigned to inactive departments should be reassigned

---

## Asset Categories

### Accessing Category Management

Navigate to **Setup** → **Asset Categories** (Tab B).

### Creating a Category

1. Click **Create Category**.
2. Enter:
   - **Name** (required, unique)
   - **Description** (optional)
   - **Custom Fields** — define category-specific attributes

### Custom Field Definitions

Each category can define custom fields that appear on the asset registration form. Fields are stored as a JSON array.

**Available field types:** `text`, `number`, `select`

**Example: Laptops & Notebooks**
```json
[
  { "name": "ram", "label": "RAM", "type": "text", "required": false },
  { "name": "storage", "label": "Storage", "type": "text", "required": false },
  { "name": "os", "label": "Operating System", "type": "text", "required": false }
]
```

**Example: Conference Rooms**
```json
[
  { "name": "capacity", "label": "Seating Capacity", "type": "number", "required": true },
  { "name": "hasProjector", "label": "Projector Available", "type": "text", "required": false },
  { "name": "hasVideoConf", "label": "Video Conferencing", "type": "text", "required": false }
]
```

### Seeded Categories

| Category | Custom Fields | Assets (Seed Data) |
|---|---|---|
| Laptops & Notebooks | RAM, Storage, OS | 10 |
| Monitors & Displays | Size, Resolution, Panel Type | 5 |
| Networking Equipment | Ports, Speed, Rack Mount | 5 |
| Conference Rooms & Meeting Pods | Capacity, Projector, Video Conf | 3 |
| Printers & Scanners | Type, Speed, Duplex | 3 |
| Vehicles | Make, Model, Fuel Type | 4 |
| Mobile Devices | OS, Storage, Cellular | 5 |

---

## Asset Lifecycle Management

### Lifecycle States

All assets move through a finite state machine. The Admin should understand the complete lifecycle to troubleshoot status issues and to close audit cycles correctly.

| State | Meaning |
|---|---|
| **Available** | Ready for allocation or booking |
| **Allocated** | Currently held by a user or department |
| **Reserved** | Reserved for future allocation |
| **Under Maintenance** | Currently being serviced |
| **Lost** | Could not be located during audit |
| **Retired** | No longer in active service |
| **Disposed** | Permanently removed (terminal state) |

### Admin-Relevant Transitions

| Action | From | To | Triggered By |
|---|---|---|---|
| Manual retirement | Available, Under Maintenance | Retired | Asset Manager via asset edit |
| Manual disposal | Available, Under Maintenance, Retired | Disposed | Asset Manager via asset edit |
| Audit close (missing) | Any (except Disposed) | Lost | Admin closes audit cycle |
| Recovery from Lost | Lost | Available | Asset Manager via asset edit |

### Monitoring Asset Health

As an Admin, regularly check:

1. **Dashboard** — overdue returns panel shows assets past expected return date
2. **Reports → Utilization** — identify idle assets (0 allocations) and over-utilized ones
3. **Reports → Maintenance Frequency** — categories with high maintenance may indicate quality issues
4. **Audit cycles** — run periodic audits to verify physical asset presence

---

## Reports Overview

### Accessing Reports

Navigate to **Reports** in the sidebar. Available to Admin, Asset Manager, and Dept Head.

### Report Descriptions

| Report | Question It Answers | Data Source |
|---|---|---|
| **Asset Utilization** | Which assets are most/least used? | COUNT of allocations per asset |
| **Maintenance Frequency** | Which categories need the most maintenance? | COUNT of maintenance requests per category |
| **Department Summary** | How are assets distributed across departments? | Active allocations per department |
| **Booking Heatmap** | When are shared resources most in demand? | Booking start times by day × hour |

### CSV Export

All reports support CSV download:

1. Navigate to the desired report.
2. Click **Export CSV**.
3. The browser downloads the report as a `.csv` file.

### Interpreting the Data

**Asset Utilization — What to look for:**

- Assets with high allocation counts and current `Available` status: good candidates for re-deployment
- Assets with zero allocations: may be redundant or improperly categorized
- Assets with the highest allocation counts in `Under Maintenance`: may need replacement

**Booking Heatmap — What to look for:**

- Peak hours indicate when more shared resources are needed
- Empty rows/columns indicate underutilized time slots
- Consistently full periods suggest adding more bookable assets

---

## Audit Management

### Audit Lifecycle

```
Create Cycle → Auditors Mark Items → Review Discrepancies → Close Cycle
```

### Creating an Audit

1. Navigate to **Audits** in the sidebar.
2. Click **Create Audit Cycle**.
3. Define scope:
   - **Department scope**: Limits to assets allocated to a specific department or its users
   - **Location scope**: Limits to assets in a specific location
   - Both scopes combine with AND logic
   - No scope = all assets
4. Assign at least one auditor.
5. Set optional start and end dates.
6. Click **Create**.

The system auto-populates audit items from matching assets.

### Managing the Audit Process

**As Admin, you should:**

1. Monitor the audit progress — check how many items remain in `pending` status
2. Review the discrepancy report as auditors mark findings
3. Communicate with auditors about unexpected findings before closing

### Closing an Audit

> [!CAUTION]
> Closing an audit cycle is irreversible. Review all findings carefully before closing.

**Close-cycle effects:**

| Finding | System Action |
|---|---|
| **Missing** | Asset status → **Lost** (via lifecycle transition) |
| **Damaged** | Maintenance request auto-raised (status: `pending`) |
| **Verified** | No action |
| **Pending** (unchecked) | No action — item remains as-is for records |

After closing:
- The cycle is **locked** — no further modifications to any audit items
- New maintenance requests raised for damaged assets appear in the Care screen

### Audit Strategy Recommendations

| Practice | Frequency |
|---|---|
| Full organizational audit | Annually |
| Location-based audit | Quarterly |
| Department-based audit | After major personnel changes |
| High-value asset audit | Monthly (networking equipment, vehicles) |

---

## Notification Management

### How Notifications Work

AssetFlow generates in-app notifications automatically. There is no notification configuration — the system dispatches notifications on predefined triggers.

### Notification Types

| Type | Trigger | Recipients |
|---|---|---|
| Asset Assigned | Allocation or transfer completion | New holder |
| Maintenance Approved | Asset Manager approves request | Requester |
| Maintenance Rejected | Asset Manager rejects request | Requester |
| Maintenance Resolved | Request marked as resolved | Requester |
| Booking Confirmed | Booking created | Booker |
| Booking Cancelled | Booking cancelled | Booker |
| Booking Reminder | 30 min before booking start | Booker |
| Transfer Approved | Transfer request approved | Requester + new holder |
| Transfer Rejected | Transfer request rejected | Requester |
| Transfer Requested | Transfer initiated | Current holder |
| Overdue Return | Allocation past return date | Holder + Asset Manager |
| Audit Discrepancy | Audit closed with discrepancies | Cycle creator (Admin) |
| Audit Assigned | User assigned as auditor | Assigned auditor |

### Deduplication

Overdue alerts and booking reminders use the `entity_ref` field as an idempotency key. The system checks for an existing notification with the same reference before inserting. This prevents duplicate notifications across repeated cron scans.

### Delivery Limitations

- **In-app only** — notifications are stored in the database and shown via the bell icon
- **No email or SMS** — this is an explicit scope boundary (PRD §7)
- **No push notifications** — the frontend polls for new notifications; there are no WebSocket or SSE connections

---

## Security Best Practices

### For the Demo Environment

| Practice | Current State | Notes |
|---|---|---|
| Use strong passwords | ✅ (seed passwords meet min length) | Recommended: 12+ chars with mixed case, numbers, special chars |
| Limit Admin accounts | ✅ (1 Admin in seed data) | Keep the number of Admins minimal |
| Review activity logs | ✅ (Ledger screen available) | Check periodically for unusual patterns |
| Re-seed before demos | Recommended | `npm run seed` ensures clean, known state |

### For Production Deployment

| Practice | Implementation |
|---|---|
| **Externalize JWT_SECRET** | Set via environment variable, never commit to source |
| **Enable HTTPS** | Use a reverse proxy (Nginx) with TLS certificates |
| **Add rate limiting** | Install `express-rate-limit` to prevent brute-force attacks |
| **Add security headers** | Install `helmet` middleware for X-Frame-Options, CSP, etc. |
| **Content-type validation** | Validate uploaded file MIME types beyond extension |
| **Rotate JWT secrets** | Periodically rotate and invalidate existing tokens |
| **Database encryption** | Use SQLCipher for encrypting the database at rest |

### Password Policy

| Rule | Current Implementation |
|---|---|
| Minimum length | 6 characters (enforced at signup and reset) |
| Hashing algorithm | bcrypt with 10 salt rounds |
| Reset token expiry | 1 hour |
| Reset token reuse | Single-use (flagged after first use) |

---

## Backup Recommendations

### Database Backup

The SQLite database is a single file (`server/assetflow.db`). Backup options:

**Cold backup (server stopped):**
```bash
cp server/assetflow.db backups/assetflow-$(date +%Y%m%d-%H%M%S).db
```

**Hot backup (server running):**
```bash
sqlite3 server/assetflow.db ".backup 'backups/assetflow-hot.db'"
```

### Recommended Backup Schedule

| Item | Frequency | Method |
|---|---|---|
| Database | Daily (production) | Hot backup to backup directory |
| Uploaded files | Weekly | Archive `server/uploads/` to backup location |
| Seed data JSON | Version controlled | Always in Git — no separate backup needed |
| Environment files | On change | Store `.env` files in a secure vault (not Git) |

### Recovery

**From backup:**
```bash
# Stop the server
# Replace the database
cp backups/assetflow-20260712.db server/assetflow.db
# Start the server
cd server && npm run dev
```

**From seed data (full reset):**
```bash
rm server/assetflow.db server/assetflow.db-wal server/assetflow.db-shm
cd server && npm run seed
```

---

## Operational Guidelines

### Day-to-Day Operations

| Task | Frequency | Owner |
|---|---|---|
| Review overdue returns | Daily | Asset Manager |
| Process pending transfer requests | Daily | Asset Manager / Dept Head |
| Act on pending maintenance requests | Daily | Asset Manager |
| Review activity logs for anomalies | Weekly | Admin |
| Run department-scoped audit | Quarterly | Admin |
| Review asset utilization report | Monthly | Admin / Asset Manager |
| Deactivate offboarded users | On departure | Admin |

### Onboarding a New Employee

1. Employee creates account via signup (gets Employee role).
2. Admin assigns department from Employee Directory.
3. Admin promotes to appropriate role if needed.
4. Asset Manager allocates required assets (laptop, phone, etc.).
5. Assets show in the employee's dashboard.

### Offboarding an Employee

1. Asset Manager initiates return for all assets held by the employee.
2. Employee's active bookings should be cancelled.
3. Any pending transfer requests involving the employee should be resolved.
4. Admin sets the user's status to **Inactive** from Employee Directory.

### Handling a Lost Asset

1. If discovered during audit, mark the audit item as **Missing**.
2. Closing the audit cycle transitions the asset to **Lost**.
3. If the asset is later found, an Asset Manager can transition it from Lost → Available.
4. Re-allocate as needed.

### Handling Equipment Failure

1. Current holder raises a maintenance request (priority: High).
2. Asset Manager approves — asset becomes **Under Maintenance**.
3. Technician is assigned and work begins.
4. If unrepairable, Asset Manager transitions from Under Maintenance → **Retired** or **Disposed**.
5. If repaired, resolve the request — asset returns to **Available**.

### Database Maintenance

For the demo environment:

```bash
# Reset to clean state (all seed data)
cd server && npm run seed

# Compact the database (reclaim unused space)
sqlite3 server/assetflow.db "VACUUM"

# Check integrity
sqlite3 server/assetflow.db "PRAGMA integrity_check"
```

---

### Design Notes

**DN-ADMIN-01:** The Employee Directory is the only surface for role assignment. This is a deliberate design decision from PRD §2.1 — there is no role selection during signup, and no other screen allows role changes.

**DN-ADMIN-02:** The audit close logic uses `canTransition()` to check if the lifecycle state machine allows the Missing → Lost transition. If the asset's current state doesn't allow this transition (e.g., it's already Disposed), the system falls back to a direct SQL update with a history record. This handles edge cases where an asset's status changed between audit marking and cycle close.

**DN-ADMIN-03:** The booking reminder cron runs as a `setInterval` loop inside the Express process (not as a separate worker). It checks every 60 seconds for bookings starting within 30 minutes and sends reminders using the notification's `entity_ref` as a deduplication key.
