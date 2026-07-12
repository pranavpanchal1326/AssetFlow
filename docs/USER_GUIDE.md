# AssetFlow — User Guide

**Enterprise Asset & Resource Management System**

---

## Table of Contents

- [Introduction](#introduction)
- [Getting Started](#getting-started)
- [Login](#login)
- [Dashboard (Now)](#dashboard-now)
- [Asset Registration](#asset-registration)
- [Asset Directory (Objects)](#asset-directory-objects)
- [Asset Allocation (Handoffs)](#asset-allocation-handoffs)
- [Transfers](#transfers)
- [Returns](#returns)
- [Resource Booking (Bookings)](#resource-booking-bookings)
- [Maintenance (Care)](#maintenance-care)
- [Audit Cycles (Audits)](#audit-cycles-audits)
- [Reports](#reports)
- [Notifications](#notifications)
- [Activity Logs (Ledger)](#activity-logs-ledger)
- [Organization Setup (Setup)](#organization-setup-setup)
- [FAQs](#faqs)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)

---

## Introduction

AssetFlow is an enterprise platform for managing the lifecycle of physical assets — laptops, conference rooms, vehicles, networking equipment, printers, and mobile devices. It provides:

- **Conflict-free allocation** — one holder per asset, enforced at the server level
- **Overlap-safe booking** — bookable resources like conference rooms and vehicles with time-slot collision prevention
- **Approval-driven maintenance** — structured workflow from request to resolution
- **Auditable lifecycle tracking** — every state change recorded with actor, timestamp, and context
- **Role-based access** — four roles (Admin, Asset Manager, Dept Head, Employee) with scoped permissions

This guide walks through every feature of the application, organized by the screens you'll see in the sidebar.

### Who This Guide Is For

| Role | Primary Tasks |
|---|---|
| **Admin** | Organization setup, user management, audit cycles, system configuration |
| **Asset Manager** | Asset registration, allocation, maintenance approval, transfers |
| **Dept Head** | Department-scoped allocation, transfer requests, reports |
| **Employee** | View own assets, book shared resources, raise maintenance requests |

---

## Getting Started

### Prerequisites

- Modern web browser (Chrome 120+, Firefox 120+, or Edge 120+)
- Both backend and frontend servers running (see setup below)

### Starting the Application

**Terminal 1 — Backend:**
```bash
cd server
npm install
npm run seed    # Only needed on first run or to reset demo data
npm run dev     # Starts API at http://localhost:4000
```

**Terminal 2 — Frontend:**
```bash
npm install
npm run dev     # Starts UI at http://localhost:5173
```

Open `http://localhost:5173` in your browser. You'll see a landing page — click **Enter App** to proceed to the login screen.

---

## Login

### Signing In

1. Click **Enter App** on the landing page.
2. Click **Sign In** on the login screen.
3. Enter your email and password.
4. Click **Sign In**.

<!-- SCREENSHOT: Login screen with email/password fields -->

### Demo Credentials

| Role | Email | Password |
|---|---|---|
| Admin | `admin@assetflow.app` | `Admin@123` |
| Asset Manager | `deepak.nair@nexgeninfra.com` | `Password@123` |
| Dept Head | `kavita.sharma@nexgeninfra.com` | `Password@123` |
| Employee | `rajesh.iyer@nexgeninfra.com` | `Password@123` |

> [!TIP]
> The **Switch User (Demo)** dropdown in the top bar is a demo convenience that performs a real login as the selected seeded user. It is not an impersonation feature.

### Creating a New Account

1. On the login screen, click **Create Account**.
2. Enter your name, email, and password (minimum 6 characters).
3. Click **Sign Up**.
4. You are logged in as an **Employee** — this is the only role available through self-signup.
5. An Admin can promote your role from the Organization Setup screen.

### Forgot Password

1. On the login screen, click **Forgot Password**.
2. Enter your email address.
3. The system displays a reset link in the browser (email delivery is simulated for the demo).
4. Click the reset link, enter your new password, and submit.

---

## Dashboard (Now)

The Dashboard is the first screen after login. It provides an operational overview of the asset management system.

<!-- SCREENSHOT: Dashboard with KPI cards -->

### KPI Cards

Six metrics are displayed at the top:

| Card | Meaning |
|---|---|
| **Assets Available** | Total assets in `Available` status |
| **Assets Allocated** | Total assets currently held by a user or department |
| **Maintenance Today** | Assets currently in `Under Maintenance` status |
| **Active Bookings** | Bookings happening right now (startTime ≤ now ≤ endTime) |
| **Pending Transfers** | Transfer requests awaiting approval |
| **Upcoming Returns** | Active allocations with a future expected return date |

### Overdue Returns

Below the KPI cards, **overdue returns** are highlighted in red. These are allocations where the expected return date has passed and the asset has not been returned. The seeded demo data includes:

- **AF-0019** (iPad Pro 12.9") — held by Farhan Sheikh, 11 days overdue
- **AF-0017** (HP Spectre x360) — held by Ananya Gupta, overdue

### Quick Actions

Role-filtered action buttons appear below the KPI section:

| Role | Available Actions |
|---|---|
| Admin | Create Audit, Organization Setup |
| Asset Manager | Register Asset, Allocate Asset |
| Dept Head | Request Transfer, View Reports |
| Employee | My Assets, Book Resource |

---

## Asset Registration

*Available to: Asset Manager*

### Registering a New Asset

1. Navigate to **Objects** in the sidebar.
2. Click the **Register Asset** button (visible only to Asset Managers).
3. Fill in the registration form:

| Field | Required | Description |
|---|---|---|
| Name | Yes | Display name (e.g., "MacBook Pro 14\" M3") |
| Category | No | Select from predefined categories (Laptops, Monitors, etc.) |
| Serial Number | No | Manufacturer serial number |
| Acquisition Date | No | Date of purchase |
| Acquisition Cost | No | Purchase price |
| Condition | No | New, Good, Fair, or Poor |
| Location | No | Physical location (e.g., "Pune HQ — Floor 3") |
| Bookable | No | Check if this is a shared resource (conference room, vehicle) |
| Custom Fields | No | Category-specific fields (e.g., RAM, Storage for laptops) |

4. Click **Register**.
5. The system assigns an auto-generated tag (e.g., `AF-0036`) and sets status to `Available`.

<!-- SCREENSHOT: Asset registration form -->

> [!NOTE]
> Asset tags follow the format `AF-NNNN` and auto-increment. You cannot assign a custom tag.

---

## Asset Directory (Objects)

*Available to: All authenticated users*

The Objects screen is the main asset directory.

<!-- SCREENSHOT: Asset directory with filters -->

### Searching Assets

Use the search bar at the top to search by:
- Asset name
- Asset tag (e.g., "AF-0014")
- Serial number

### Filtering

Use the filter controls to narrow results:

| Filter | Options |
|---|---|
| Category | Laptops & Notebooks, Monitors & Displays, Networking Equipment, etc. |
| Status | Available, Allocated, Reserved, Under Maintenance, Lost, Retired, Disposed |
| Location | All seeded locations |
| Bookable | Yes / No |

### Asset Detail View

Click any asset row to open the detail view:

- **Summary**: Tag, name, category, serial number, condition, location, status
- **Lifecycle Timeline**: Chronological history of every state change
- **Allocation History**: All past and current holders with dates
- **Maintenance History**: All maintenance requests with status
- **QR Code**: Printable QR code encoding the asset tag

<!-- SCREENSHOT: Asset detail page with lifecycle timeline -->

---

## Asset Allocation (Handoffs)

*Available to: Asset Manager, Dept Head*

### Allocating an Asset

1. Navigate to **Handoffs** in the sidebar.
2. Click **Allocate Asset**.
3. Select the asset from the dropdown (only Available assets shown).
4. Select the holder:
   - **To User**: Choose an employee
   - **To Department**: Choose a department
5. Optionally set an **Expected Return Date**.
6. Click **Allocate**.

<!-- SCREENSHOT: Allocation form -->

### Dealing with Conflicts

If the selected asset is already held by someone, the system returns a **conflict message**:

> "Currently held by Priya Deshmukh"

Two options are presented:
- **Request Transfer**: Creates a transfer request to move the asset from the current holder
- **Cancel**: Return to the allocation form

<!-- SCREENSHOT: Conflict dialog with "Currently held by..." -->

This is the **single-holder invariant** — the core rule that prevents double-allocation.

---

## Transfers

*Request: All users for assets they hold. Approve/Reject: Asset Manager, Dept Head*

### Requesting a Transfer

1. In **Handoffs**, find the asset currently allocated.
2. Click **Request Transfer**.
3. Select the new target holder (user or department).
4. Submit the request.

### Approving or Rejecting a Transfer

1. Filter transfers by status: **Requested**.
2. Review the transfer details (current holder, requested target).
3. Click **Approve** or **Reject**.

**When approved:**
- The old allocation is closed (status → returned)
- A new allocation is created for the target holder
- The asset remains in `Allocated` status (Allocated → Allocated transition)
- Both the requester and new holder receive notifications

**When rejected:**
- The transfer request is marked as rejected
- No allocation changes occur
- The requester receives a notification

---

## Returns

*Available to: Asset Manager, Dept Head*

### Processing a Return

1. In **Handoffs**, find the active allocation.
2. Click **Return**.
3. Enter **condition notes** describing the state of the asset upon return (e.g., "Minor scratches on lid, fully functional").
4. Click **Confirm Return**.

The asset transitions from `Allocated` → `Available` and is ready for re-allocation.

<!-- SCREENSHOT: Return dialog with condition notes -->

### Overdue Returns

Allocations past their expected return date are:
- Listed in the Dashboard's overdue panel (highlighted in red)
- Flagged with overdue return notifications to both the holder and the Asset Manager

---

## Resource Booking (Bookings)

*Available to: All authenticated users*

Resource booking is for shared assets — conference rooms, vehicles, projectors — that are flagged as `bookable`.

### Creating a Booking

1. Navigate to **Bookings** in the sidebar.
2. Select a bookable resource from the asset picker.
3. View the **week-grid calendar** to see existing bookings.
4. Select a time slot:
   - **Start Time**: Date and time the booking begins
   - **End Time**: Date and time the booking ends
   - **Purpose**: Why you need the resource
5. Click **Book**.

<!-- SCREENSHOT: Booking calendar with time slots -->

### Overlap Rules

- **Overlapping bookings are rejected** (HTTP 409). The system checks: `newStart < existingEnd && newEnd > existingStart`.
- **Back-to-back bookings are accepted**. If one booking ends at 10:00 and another starts at 10:00, both are valid.
- Only `booked` (non-cancelled) bookings are checked for conflicts.

### Booking Statuses

| Status | Definition | How Determined |
|---|---|---|
| **Upcoming** | Start time is in the future | Derived at read time |
| **Ongoing** | Start time ≤ now ≤ end time | Derived at read time |
| **Completed** | End time is in the past | Derived at read time |
| **Cancelled** | Booking was cancelled | Persisted in database |

### Cancelling a Booking

1. Find your booking in the list.
2. Click **Cancel**.
3. The booking status changes to `Cancelled` and the time slot becomes available for others.

### Rescheduling

1. Find your booking in the list.
2. Click **Reschedule**.
3. Enter new start and end times.
4. The system re-validates against existing bookings (excluding this booking to avoid self-conflict).
5. Click **Confirm**.

---

## Maintenance (Care)

*Raise: All users. Approve/manage: Asset Manager*

### Raising a Maintenance Request

1. Navigate to **Care** in the sidebar.
2. Click **Raise Request**.
3. Fill in the form:

| Field | Required | Description |
|---|---|---|
| Asset | Yes | Select the asset needing maintenance |
| Issue Description | Yes | Describe the problem |
| Priority | No | Low, Medium (default), or High |
| Photo | No | Upload a photo of the issue |

4. Click **Submit**.

> [!IMPORTANT]
> Employees can only raise maintenance for assets currently allocated to them. Asset Managers and Dept Heads can raise requests for any asset.

### Maintenance Workflow

The maintenance request progresses through these stages:

```
Pending → Approved → Assigned → In Progress → Resolved
              ↓
          Rejected (terminal)
```

### Approving/Rejecting (Asset Manager)

1. In **Care**, view requests in `Pending` status.
2. Click **Approve** or **Reject**.

**When approved:** The asset's status immediately changes to **Under Maintenance**. This prevents anyone from allocating or booking the asset while it's being serviced.

### Assigning a Technician

1. View an approved request.
2. Click **Assign Technician**.
3. Enter the technician's name and contact information.
4. Click **Assign**.

> [!NOTE]
> Technicians are entered as free-text. They do not have system accounts — this is a deliberate design choice per the PRD.

### Resolving Maintenance

1. View a request in `In Progress` or `Assigned` status.
2. Click **Resolve**.

**When resolved:** The asset's status changes back to **Available**, making it eligible for allocation and booking again.

<!-- SCREENSHOT: Maintenance kanban board by status -->

---

## Audit Cycles (Audits)

*Create/Close: Admin. Mark items: Assigned auditors*

### Creating an Audit Cycle

1. Navigate to **Audits** in the sidebar (Admin only).
2. Click **Create Audit Cycle**.
3. Fill in the form:

| Field | Required | Description |
|---|---|---|
| Name | Yes | Descriptive name (e.g., "Q2 2026 Mumbai Branch Audit") |
| Scope — Department | No | Limit to assets associated with a specific department |
| Scope — Location | No | Limit to assets at a specific location |
| Start Date | No | Audit period start |
| End Date | No | Audit period end |
| Assigned Auditors | Yes | Select one or more users as auditors |

4. Click **Create**.

The system automatically populates audit items from assets matching the selected scope.

<!-- SCREENSHOT: Audit cycle creation form -->

### Performing the Audit

1. Log in as an assigned auditor.
2. Navigate to **Audits** and select the open cycle.
3. The checklist shows all in-scope assets with their current details.
4. For each item, select a result:

| Result | Meaning |
|---|---|
| **Verified** | Asset is present and accounted for |
| **Missing** | Asset cannot be located |
| **Damaged** | Asset is present but damaged |

5. Add optional notes for each item.
6. Click **Save** after marking each item.

### Discrepancy Report

As items are marked, a discrepancy report is automatically generated showing all items with `missing` or `damaged` results. This report is visible on the cycle detail view.

### Closing an Audit Cycle

1. Log in as Admin.
2. Navigate to the open audit cycle.
3. Review the discrepancy report.
4. Click **Close Cycle**.

**Close-cycle effects:**

| Audit Result | System Action |
|---|---|
| Missing | Asset status transitions to **Lost** |
| Damaged | A maintenance request is automatically raised with `pending` status |
| Verified | No action |

Once closed, the cycle is **locked** — no further changes can be made to audit items.

---

## Reports

*Available to: Admin, Asset Manager, Dept Head (department-scoped)*

Navigate to **Reports** in the sidebar.

### Available Reports

| Report | Description | Visualization |
|---|---|---|
| **Asset Utilization** | Number of allocations per asset (most-used vs. idle) | Bar chart |
| **Maintenance Frequency** | Number of maintenance requests by asset category | Chart |
| **Department Summary** | Active allocations per department | Table + chart |
| **Booking Heatmap** | Booking density by weekday × hour | Grid |

### CSV Export

Every report supports CSV download. Click the **Export CSV** button on any report to download the data as a CSV file.

> [!NOTE]
> Dept Heads see data scoped to their own department. Employees do not have access to Reports.

<!-- SCREENSHOT: Reports page with utilization chart -->

---

## Notifications

*Available to: All authenticated users*

### Notification Center

Click the **bell icon** in the top navigation bar to view your notifications. An unread count badge shows on the bell when you have unread notifications.

### Notification Types

| Type | When You Receive It |
|---|---|
| **Asset Assigned** | An asset is allocated or transferred to you |
| **Maintenance Approved** | Your maintenance request is approved |
| **Maintenance Rejected** | Your maintenance request is rejected |
| **Maintenance Resolved** | Your maintenance request is resolved |
| **Booking Confirmed** | Your booking is created |
| **Booking Cancelled** | Your booking is cancelled |
| **Booking Reminder** | Your booking starts within 30 minutes |
| **Transfer Approved** | Your transfer request is approved |
| **Transfer Rejected** | Your transfer request is rejected |
| **Transfer Requested** | Someone requests transfer of an asset you hold |
| **Overdue Return Alert** | Your held asset is past the expected return date |
| **Audit Discrepancy** | An audit finds missing or damaged assets (Admin) |
| **Audit Assigned** | You are assigned as an auditor |

### Managing Notifications

- Click a notification to expand it
- Click **Mark as Read** on individual notifications
- Use **Mark All Read** to clear all unread notifications

---

## Activity Logs (Ledger)

*Available to: Admin, Asset Manager, Dept Head*

The Ledger screen shows a chronological record of every significant action in the system.

### Filtering

| Filter | Description |
|---|---|
| User | Show actions by a specific user |
| Entity Type | Filter by entity type (asset, user, booking, etc.) |
| Date Range | Show actions within a date range |

### Log Entry Fields

Each log entry contains:

| Field | Description |
|---|---|
| Timestamp | When the action occurred |
| User | Who performed the action |
| Action | What was done (create, update, transition, allocate, etc.) |
| Entity Type | What kind of entity was affected |
| Entity ID | The ID of the affected entity |
| Detail | Additional context (JSON) |

---

## Organization Setup (Setup)

*Available to: Admin only*

The Setup screen has three tabs for managing the organization's structure.

### Tab A: Departments

- **Create Department**: Name, optional parent department (for hierarchy), optional head user
- **Edit Department**: Update name, head, parent, or set status to inactive
- **Department Hierarchy**: Engineering → Platform Team, QA (parent-child relationships)

### Tab B: Asset Categories

- **Create Category**: Name, description, and custom field definitions
- **Custom Fields**: Define category-specific fields (e.g., RAM/Storage for Laptops, Room Capacity for Conference Rooms). Fields are stored as a JSON array and rendered dynamically on the asset registration form.

### Tab C: Employee Directory

This is the **sole surface for role assignment** in the system.

- **View all users**: Name, email, role, department, status
- **Change role**: Promote or demote users between Employee, Dept Head, Asset Manager, and Admin
- **Assign department**: Move users between departments
- **Deactivate account**: Set user status to inactive (prevents login)

> [!IMPORTANT]
> Role assignment is only available through this screen. Signup always creates an Employee account. There is no role self-selection anywhere in the system.

<!-- SCREENSHOT: Employee directory with role assignment -->

---

## FAQs

**Q: I can't see the "Register Asset" button.**
A: Only Asset Managers can register assets. Check your role in the user profile. An Admin can change your role from Organization Setup → Employee Directory.

**Q: I got a "Currently held by..." error when allocating.**
A: This asset is already allocated to someone. You can either wait for them to return it, or click "Request Transfer" to initiate a transfer workflow.

**Q: My booking was rejected as "overlapping."**
A: Another booking exists for that asset in the same time range. Check the calendar view for available slots. Note that back-to-back bookings (one ends when the next begins) are allowed.

**Q: How do I reset the demo data?**
A: Run `cd server && npm run seed` in the terminal. This clears all data and re-inserts the seed dataset. The "Reset Database" button in the UI only re-fetches from the server — it does not reset the data.

**Q: Can technicians log in?**
A: No. Technician information is entered as free text (name and contact). Technicians do not have system accounts.

**Q: What happens when an audit cycle is closed?**
A: Missing items transition to Lost. Damaged items get an automatic maintenance request. The cycle is locked and no further changes can be made.

**Q: Why do I see "403" errors?**
A: Your role does not have permission for the action you attempted. Check the role-permission table in the README. The frontend surfaces 403 errors as an in-app error banner.

**Q: What's the difference between "Retired" and "Disposed"?**
A: Retired means the asset is no longer in active service but still exists. Disposed is the terminal state — the asset has been physically removed or destroyed. Retired assets can be disposed; Disposed assets cannot transition to any other state.

---

## Troubleshooting

| Problem | Cause | Solution |
|---|---|---|
| "Cannot reach the AssetFlow server" | Backend not running | Start the backend: `cd server && npm run dev` |
| Login fails for seeded user | Database not seeded, or was reset | Run `cd server && npm run seed` |
| Dashboard shows empty KPI cards | Backend running but no data | Run seed script, then refresh page |
| Frontend shows "Restoring session..." endlessly | Stale JWT token | Clear browser localStorage and refresh |
| File upload fails | File larger than 8MB | Reduce file size; limit is 8MB per file |
| Asset status won't change | Invalid lifecycle transition | Check the allowed transitions in ARCHITECTURE.md |
| "Not an assigned auditor" error | Wrong user logged in for audit | Log in as one of the assigned auditors for that cycle |
| CSV export button downloads empty file | No data matches report criteria | Verify data exists through the API: `GET /api/reports/<name>` |
| Port 4000 already in use | Previous server instance running | Kill the process on port 4000, or change PORT in env |

---

## Best Practices

### For Admins

1. **Set up departments first** — Assets and users depend on department structure.
2. **Assign roles deliberately** — Promote users to Asset Manager or Dept Head only when needed. Every role adds write permissions.
3. **Create audit cycles regularly** — Quarterly audits with location scope help track asset movement.
4. **Review the activity log** — Check the Ledger periodically for unusual patterns.
5. **Close audit cycles promptly** — The close-cycle logic (Missing → Lost, Damaged → auto-maintenance) only fires when you close.

### For Asset Managers

1. **Register assets with complete information** — Serial number, condition, and location make audits easier.
2. **Set expected return dates** — This enables the overdue detection system.
3. **Act on maintenance requests promptly** — Approval changes asset status, which prevents conflicting operations.
4. **Use the transfer workflow** — Don't manually return-then-reallocate; transfers maintain the audit trail.

### For Dept Heads

1. **Review department allocations** — Use Reports to check your department's asset utilization.
2. **Approve transfers within your scope** — Process pending transfer requests to keep assets moving.
3. **Coordinate with Asset Managers** — For cross-department transfers, the Asset Manager has broader permissions.

### For Employees

1. **Return assets before the expected date** — Overdue returns trigger notifications to you and your manager.
2. **Book resources in advance** — Shared resources are first-come, first-served based on booking time.
3. **Raise maintenance early** — Report issues as soon as they appear; attach photos when possible.
4. **Check your notifications** — The bell icon shows pending actions and confirmations relevant to you.

---

### Design Notes

**DN-UG-01:** The frontend uses internal screen names ("Now" for Dashboard, "Objects" for Assets, "Handoffs" for Allocations, "Care" for Maintenance, "Ledger" for Activity Logs). This guide references both the internal names (as seen in the sidebar) and the functional names (as defined in the PRD).

**DN-UG-02:** The "Switch User (Demo)" dropdown performs a real `POST /api/auth/login` with the known seed credentials. It is not an impersonation endpoint; it fully logs out the current user and logs in as the selected user.

**DN-UG-03:** The landing page flow is Landing → Login → Dashboard. There is no direct entry via URL routing — the application uses in-app state management (React state) rather than URL-based routing.
