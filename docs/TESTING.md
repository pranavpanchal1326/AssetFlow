# AssetFlow — Testing Strategy

**QA & Validation Documentation**

---

## Table of Contents

- [Testing Strategy](#testing-strategy)
- [Scope](#scope)
- [Test Environment](#test-environment)
- [Functional Testing](#functional-testing)
- [Integration Testing](#integration-testing)
- [API Testing](#api-testing)
- [UI Testing](#ui-testing)
- [Authorization Testing](#authorization-testing)
- [Security Testing](#security-testing)
- [Boundary Testing](#boundary-testing)
- [Negative Testing](#negative-testing)
- [Validation Testing](#validation-testing)
- [Edge Cases](#edge-cases)
- [Acceptance Criteria](#acceptance-criteria)
- [Regression Checklist](#regression-checklist)
- [Browser Compatibility](#browser-compatibility)
- [Risk Matrix](#risk-matrix)
- [Severity & Priority Matrices](#severity--priority-matrices)
- [Test Data Strategy](#test-data-strategy)
- [Production Readiness Checklist](#production-readiness-checklist)

---

## Testing Strategy

AssetFlow uses a **manual testing approach** with structured, reproducible test cases designed to validate every PRD success criterion against the live API and seeded database. The strategy is organized around three tiers:

| Tier | Focus | Method |
|---|---|---|
| **API-level** | Business logic, state machine, conflict rules | `curl` / Postman against `localhost:4000` |
| **UI-level** | Screen rendering, role-based navigation, workflow UX | Browser testing against `localhost:5173` |
| **Data-level** | Seed data integrity, schema constraints, FK enforcement | SQLite queries against `assetflow.db` |

All testing uses the pre-seeded database (NexGen Infra Solutions, 14 months of operational history). The seed script is idempotent — run `cd server && npm run seed` to reset to baseline before each test session.

---

## Scope

### In Scope

| Area | Coverage |
|---|---|
| Authentication | Signup, login, forgot/reset password, JWT validation, session lifecycle |
| Authorization | RBAC enforcement across all 4 roles, route-level and business-logic guards |
| Asset lifecycle | All 7 states, all valid transitions, rejection of invalid transitions |
| Allocation | Single-holder invariant, 409 conflict, transfer offer, overdue detection |
| Transfer | Request → approve/reject → re-allocation transaction |
| Booking | Overlap rejection, back-to-back acceptance, derived statuses, cancel/reschedule |
| Maintenance | 6-status workflow, asset status side-effects, technician assignment |
| Audit | Cycle creation, scope-based item population, marking, close-cycle effects |
| Dashboard | KPI accuracy, overdue return list |
| Reports | 4 report types, CSV export |
| Notifications | All 13 notification types, idempotent delivery, read/unread toggling |
| Activity logs | Append-only trail, query filtering |
| Seed data | Validated record counts, FK integrity, lifecycle consistency |

### Out of Scope

| Area | Reason |
|---|---|
| Load/performance testing | No benchmarking tools configured; demo-scale data makes this unnecessary |
| Automated test suite (unit/E2E) | Not implemented in the hackathon build; test cases are manual |
| Email/SMS delivery | Explicitly simulated per PRD §7 |
| Mobile responsiveness | Not a hackathon-round requirement |

---

## Test Environment

| Component | Configuration |
|---|---|
| Backend | Node.js 18+, Express 4.19, better-sqlite3 12.x |
| Frontend | React 19, Vite 8, localhost:5173 |
| Database | SQLite with WAL mode, `server/assetflow.db` |
| Seed data | 18 users, 35 assets, 32 allocations, 14 bookings, 7 maintenance, 2 audit cycles |
| OS | Windows / macOS / Linux (cross-platform via Node.js) |
| Browser | Chrome 120+, Firefox 120+, Edge 120+ |

**Reset procedure:** `cd server && npm run seed` — clears all tables and re-inserts from `data/*.json`.

---

## Functional Testing

### FT-01: Authentication

| ID | Test Case | Steps | Expected Result | Priority |
|---|---|---|---|---|
| FT-01-01 | Valid login | POST `/api/auth/login` with `admin@assetflow.app` / `Admin@123` | 200 with `{token, user}`, role = `admin` | P0 |
| FT-01-02 | Invalid password | POST `/api/auth/login` with correct email, wrong password | 401 `"Invalid email or password"` | P0 |
| FT-01-03 | Nonexistent email | POST `/api/auth/login` with `nobody@test.com` | 401 `"Invalid email or password"` | P1 |
| FT-01-04 | Inactive account login | POST `/api/auth/login` as Karthik Bhat (id 16, inactive) | 403 `"Account is inactive"` | P1 |
| FT-01-05 | Signup creates employee | POST `/api/auth/signup` with new credentials | 201, role = `employee`, no department assigned | P0 |
| FT-01-06 | Duplicate email signup | POST `/api/auth/signup` with `admin@assetflow.app` | 409 `"An account with that email already exists"` | P1 |
| FT-01-07 | Forgot password | POST `/api/auth/forgot` with valid email | 200 with `resetLink` containing token | P1 |
| FT-01-08 | Forgot unknown email | POST `/api/auth/forgot` with unknown email | 200 with `resetLink: null` (no email leak) | P2 |
| FT-01-09 | Password reset | POST `/api/auth/reset` with valid token + new password | 200 `{reset: true}`, login works with new password | P1 |
| FT-01-10 | Expired reset token | POST `/api/auth/reset` with expired/used token | 400 `"invalid or has expired"` | P2 |

### FT-02: Asset Registration & Directory

| ID | Test Case | Steps | Expected Result | Priority |
|---|---|---|---|---|
| FT-02-01 | Register asset | POST `/api/assets` as Asset Manager with name, category, condition | 201, auto-generated tag `AF-0036` | P0 |
| FT-02-02 | Tag auto-increment | Register two assets sequentially | Tags are `AF-0036`, `AF-0037` (no gaps) | P1 |
| FT-02-03 | Directory search | GET `/api/assets?search=MacBook` | Returns assets matching name/tag/serial | P0 |
| FT-02-04 | Filter by status | GET `/api/assets?status=Available` | Returns only Available assets | P1 |
| FT-02-05 | Filter by category | GET `/api/assets?category=1` | Returns only Laptops & Notebooks | P1 |
| FT-02-06 | Asset detail | GET `/api/assets/14` (MacBook Pro AF-0014) | Returns asset with allocationHistory, maintenanceHistory, timeline | P0 |
| FT-02-07 | QR code generation | GET `/api/assets/14/qr` | Returns `{tag, dataUrl}` with valid data URI | P2 |
| FT-02-08 | Photo upload | POST `/api/assets/1/photo` with multipart form | 200, photoUrl populated | P2 |

### FT-03: Allocation & Transfer

| ID | Test Case | Steps | Expected Result | Priority |
|---|---|---|---|---|
| FT-03-01 | Allocate available asset | POST `/api/allocations` for an Available asset | 201, asset status → Allocated, notification to holder | P0 |
| FT-03-02 | **Double-allocation block** | POST `/api/allocations` for asset already held | 409 `"Currently held by [name]"`, `canRequestTransfer: true` | **P0** |
| FT-03-03 | Transfer request | POST `/api/transfers` for an allocated asset | 201, status = `requested` | P0 |
| FT-03-04 | Transfer approve | PUT `/api/transfers/:id` with `action: "approve"` | Old allocation → returned, new allocation created, asset stays Allocated | P0 |
| FT-03-05 | Transfer reject | PUT `/api/transfers/:id` with `action: "reject"` | Transfer status → rejected, no allocation change | P1 |
| FT-03-06 | Return asset | POST `/api/allocations/:id/return` with conditionNotes | Allocation → returned, asset → Available | P0 |
| FT-03-07 | Overdue detection | GET `/api/allocations?overdue=true` | Returns allocations past expectedReturnDate | P1 |

### FT-04: Booking

| ID | Test Case | Steps | Expected Result | Priority |
|---|---|---|---|---|
| FT-04-01 | Book available slot | POST `/api/bookings` for bookable asset with valid time range | 201, status = `booked` | P0 |
| FT-04-02 | **Overlap rejection** | POST `/api/bookings` with time overlapping existing booking | 409 with conflict details | **P0** |
| FT-04-03 | **Back-to-back acceptance** | Book 10:00–11:00, then 11:00–12:00 for same asset | Both succeed (touching boundaries allowed) | **P0** |
| FT-04-04 | Non-bookable asset | POST `/api/bookings` for asset with `is_bookable: false` | 400 `"not marked as shared/bookable"` | P1 |
| FT-04-05 | Cancel booking | PUT `/api/bookings/:id` with `action: "cancel"` | Status → cancelled | P1 |
| FT-04-06 | Reschedule booking | PUT `/api/bookings/:id` with new startTime/endTime | Times updated, overlap re-validated | P1 |
| FT-04-07 | Derived statuses | GET `/api/bookings` for past/current/future bookings | Statuses show Completed/Ongoing/Upcoming correctly | P1 |

### FT-05: Maintenance

| ID | Test Case | Steps | Expected Result | Priority |
|---|---|---|---|---|
| FT-05-01 | Raise request | POST `/api/maintenance` with assetId, issue, priority | 201, status = `pending` | P0 |
| FT-05-02 | Approve → Under Maintenance | PUT `/api/maintenance/:id` with `action: "approve"` | Status → approved, **asset status → Under Maintenance** | P0 |
| FT-05-03 | Assign technician | PUT `/api/maintenance/:id` with `action: "assign"`, technicianName | Status → assigned, technician fields populated | P1 |
| FT-05-04 | Resolve → Available | PUT `/api/maintenance/:id` with `action: "resolve"` | Status → resolved, **asset status → Available** | P0 |
| FT-05-05 | Reject request | PUT `/api/maintenance/:id` with `action: "reject"` | Status → rejected, asset status unchanged | P1 |
| FT-05-06 | Employee scope | POST `/api/maintenance` as Employee for non-held asset | 403 `"only raise maintenance for assets allocated to you"` | P1 |

### FT-06: Audit

| ID | Test Case | Steps | Expected Result | Priority |
|---|---|---|---|---|
| FT-06-01 | Create audit cycle | POST `/api/audits` with name, scope, auditorIds | 201, audit items auto-populated from matching assets | P0 |
| FT-06-02 | Mark item verified | PUT `/api/audits/:id/items/:itemId` with `result: "verified"` | Result updated, checked_by and checked_at set | P0 |
| FT-06-03 | Mark item missing | PUT `/api/audits/:id/items/:itemId` with `result: "missing"` | Result updated, discrepancy notification to admin | P1 |
| FT-06-04 | **Close cycle → Lost** | PUT `/api/audits/:id` with `action: "close"` (items with missing) | Cycle → closed, missing assets → Lost | **P0** |
| FT-06-05 | **Close cycle → auto-maintenance** | PUT `/api/audits/:id` with `action: "close"` (items with damaged) | Maintenance request auto-raised for damaged assets | P1 |
| FT-06-06 | Closed cycle is locked | PUT to items on a closed cycle | 400 `"This audit cycle is closed"` | P1 |

### FT-07: Dashboard & Reports

| ID | Test Case | Steps | Expected Result | Priority |
|---|---|---|---|---|
| FT-07-01 | Dashboard KPIs | GET `/api/dashboard/kpis` | Returns available, allocated, maintenanceToday counts matching seed data | P0 |
| FT-07-02 | Overdue returns list | GET `/api/dashboard/kpis` | `overdueReturns` contains AF-0019 and AF-0017 | P0 |
| FT-07-03 | Utilization report | GET `/api/reports/utilization` | Returns all assets with allocation counts | P1 |
| FT-07-04 | CSV export | GET `/api/reports/utilization/export` | Returns CSV file with correct headers | P1 |
| FT-07-05 | Booking heatmap | GET `/api/reports/booking-heatmap` | Returns day × hour grid data | P2 |

---

## Integration Testing

Integration tests validate cross-module interactions where a single action triggers effects across multiple database tables.

| ID | Scenario | Modules Involved | Verification |
|---|---|---|---|
| IT-01 | Allocation creates lifecycle entry | allocations → lifecycle → asset_history → activity_logs | `asset_history` record exists with `from: Available, to: Allocated` |
| IT-02 | Transfer approval re-allocates atomically | transfers → allocations → lifecycle | Old allocation closed, new allocation active, asset_history has `Allocated→Allocated` |
| IT-03 | Maintenance approval changes asset status | maintenance → lifecycle → assets | Asset status = `Under Maintenance` after approval |
| IT-04 | Maintenance resolution restores availability | maintenance → lifecycle → assets → notifications | Asset status = `Available`, notification to requester |
| IT-05 | Audit close transitions missing to Lost | audits → lifecycle → assets → asset_history | Asset status = `Lost`, history entry recorded |
| IT-06 | Audit close auto-raises maintenance for damaged | audits → maintenance_requests | New maintenance record with `pending` status |
| IT-07 | Booking creates notification | bookings → notifications | `booking_confirmed` notification for the booker |
| IT-08 | Overdue detection triggers alerts | allocations → notifications | `overdue_return` notification with idempotent entity_ref |

---

## API Testing

### Contract Verification

Every API response must conform to the contract shape:

```json
// Success
{ "ok": true, "data": ... }

// Error
{ "ok": false, "error": "Human-readable message" }
```

### HTTP Status Code Verification

| Status | Condition | Test Approach |
|---|---|---|
| 200 | Successful read/update | Verify on all GET/PUT success paths |
| 201 | Successful creation | Verify on all POST success paths |
| 400 | Validation failure | Send missing/invalid fields |
| 401 | Missing or invalid JWT | Omit Authorization header, or send expired token |
| 403 | Insufficient role or ownership violation | Call restricted endpoint with wrong role |
| 404 | Resource not found | Use nonexistent IDs |
| 409 | Conflict (double-allocation, booking overlap) | Trigger both conflict scenarios |
| 500 | Unhandled server error | Verify central error handler catches and shapes |

### Endpoint Coverage Matrix

| Module | Route | GET | POST | PUT |
|---|---|---|---|---|
| Auth | `/api/auth/*` | me | login, signup, forgot, reset | — |
| Assets | `/api/assets` | list, detail, qr | create, photo | update |
| Allocations | `/api/allocations` | list | create, return | — |
| Transfers | `/api/transfers` | list | create | decide |
| Bookings | `/api/bookings` | list | create | cancel/reschedule |
| Maintenance | `/api/maintenance` | list | create | action workflow |
| Audits | `/api/audits` | list, detail | create | mark item, close |
| Dashboard | `/api/dashboard/kpis` | kpis | — | — |
| Notifications | `/api/notifications` | list | — | markRead, markAllRead |
| Activity Logs | `/api/activity-logs` | list | — | — |
| Reports | `/api/reports/*` | 4 reports, export | — | — |
| Users | `/api/users` | list | — | update (admin) |
| Departments | `/api/departments` | list | create | update |
| Categories | `/api/categories` | list | create | update |

---

## UI Testing

| ID | Screen | Test Case | Expected Behavior |
|---|---|---|---|
| UI-01 | Landing | Click "Enter App" | Navigates to Login screen |
| UI-02 | Login | Login as Admin | Dashboard renders with KPI cards |
| UI-03 | Login | Login with wrong password | Error message displayed |
| UI-04 | Dashboard (Now) | Load after login | 6 KPI cards visible, overdue returns highlighted |
| UI-05 | Objects | Search for "MacBook" | Filtered asset list displayed |
| UI-06 | Objects | Click asset row | Asset detail panel with lifecycle timeline |
| UI-07 | Handoffs | Allocate an Available asset | Allocation created, toast confirmation |
| UI-08 | Handoffs | Attempt double allocation | Conflict dialog with "Currently held by..." |
| UI-09 | Bookings | Book a conference room | Booking confirmed, calendar updated |
| UI-10 | Care | Raise maintenance request | Request appears in pending column |
| UI-11 | Audits | View open audit cycle | Checklist with asset items |
| UI-12 | Reports | View utilization report | Bar chart renders with data |
| UI-13 | Setup | Change user role (as Admin) | Role updated, reflected in user list |
| UI-14 | Notifications | Click bell icon | Notification panel opens with unread count |

---

## Authorization Testing

### Role × Endpoint Matrix

| Endpoint | Admin | Asset Manager | Dept Head | Employee | Expected |
|---|---|---|---|---|---|
| POST `/api/assets` | 403 | ✅ 201 | 403 | 403 | Only Asset Manager registers |
| POST `/api/allocations` | 403 | ✅ 201 | ✅ 201 | 403 | Manager + Dept Head |
| PUT `/api/maintenance/:id` | 403 | ✅ 200 | 403 | 403 | Only Asset Manager decides |
| POST `/api/audits` | ✅ 201 | 403 | 403 | 403 | Only Admin creates audits |
| PUT `/api/users/:id` | ✅ 200 | 403 | 403 | 403 | Only Admin manages users |
| GET `/api/reports/*` | ✅ 200 | ✅ 200 | ✅ 200 | 403 | Manager and above |
| GET `/api/activity-logs` | ✅ 200 | ✅ 200 | ✅ 200 | 403 | Manager and above |
| POST `/api/bookings` | ✅ 201 | ✅ 201 | ✅ 201 | ✅ 201 | All authenticated users |

### Business Logic Authorization

| ID | Scenario | Expected |
|---|---|---|
| AUTH-BL-01 | Employee raises maintenance for asset they don't hold | 403 |
| AUTH-BL-02 | Employee modifies booking they don't own | 403 |
| AUTH-BL-03 | Non-assigned auditor marks audit item | 403 |
| AUTH-BL-04 | Employee requests transfer for asset they don't hold | 403 |

---

## Security Testing

| ID | Test Case | Steps | Expected Result |
|---|---|---|---|
| SEC-01 | Missing JWT | Call any protected endpoint without Authorization header | 401 |
| SEC-02 | Malformed JWT | Send `Authorization: Bearer invalid_token` | 401 |
| SEC-03 | Expired JWT | Use a token signed with past expiry | 401 `"Invalid or expired token"` |
| SEC-04 | Inactive user session | Deactivate user, then use their existing token | 403 `"Account is inactive"` |
| SEC-05 | Password hash storage | Query `users` table directly | `password_hash` is bcrypt hash, never plaintext |
| SEC-06 | Password reset token | Check `password_resets` table | Token is 48-char hex, expires in 1 hour, `used` flag |
| SEC-07 | Email enumeration | POST `/api/auth/forgot` with unknown email | Returns 200 (same response) — no information leak |
| SEC-08 | Response shape on error | Trigger server error | Response is `{ok: false, error: "..."}`, no stack trace |
| SEC-09 | Malformed JSON body | POST with invalid JSON | 400 `"Request body is not valid JSON"` |
| SEC-10 | File size limit | Upload file > 8MB | 400 `"File too large (max 8 MB)"` |

---

## Boundary Testing

| ID | Boundary | Test Value | Expected Result |
|---|---|---|---|
| BND-01 | Booking back-to-back | Booking A: 09:00–10:00, Booking B: 10:00–11:00 | Both accepted (touching, not overlapping) |
| BND-02 | Booking 1-minute overlap | Booking A: 09:00–10:00, Booking B: 09:59–11:00 | 409 overlap |
| BND-03 | Expected return = today | Allocation with expectedReturnDate = now | Not flagged as overdue (overdue = strictly past) |
| BND-04 | Empty asset name | POST `/api/assets` with `name: ""` | 400 validation error |
| BND-05 | Password length = 5 | Signup with 5-char password | 400 `"at least 6 characters"` |
| BND-06 | Password length = 6 | Signup with 6-char password | 201 accepted |
| BND-07 | Disposed asset allocation | POST allocation for Disposed asset | 400 `"Cannot allocate"` (terminal state) |
| BND-08 | Tag collision gap-fill | Delete asset AF-0035, register new | Gets AF-0036 (not AF-0035; walks forward) |

---

## Negative Testing

| ID | Scenario | Input | Expected |
|---|---|---|---|
| NEG-01 | Login with empty fields | `{email: "", password: ""}` | 400 |
| NEG-02 | Register asset without name | `{categoryId: 1}` | 400 `"Asset name is required"` |
| NEG-03 | Invalid condition enum | `{condition: "Excellent"}` | 400 `"must be one of New, Good, Fair, Poor"` |
| NEG-04 | Invalid priority enum | `{priority: "Critical"}` | 400 `"must be Low, Medium or High"` |
| NEG-05 | Invalid maintenance action | `{action: "complete"}` | 400 `"must be approve, reject, assign, start or resolve"` |
| NEG-06 | Approve already-rejected maintenance | Action on rejected request | 400 `"Cannot approve a request that is rejected"` |
| NEG-07 | Cancel already-cancelled booking | Action on cancelled booking | 400 `"already cancelled"` |
| NEG-08 | Close already-closed audit | PUT `/api/audits/:id` `{action: "close"}` | 400 `"already closed"` |
| NEG-09 | Allocate non-existent asset | POST allocation with assetId: 999 | 404 `"Asset not found"` |
| NEG-10 | Invalid lifecycle transition | Retire a Lost asset | 400 `"Cannot move asset from Lost to Retired"` |

---

## Validation Testing

| ID | Field | Rule | Test Value | Expected |
|---|---|---|---|---|
| VAL-01 | Email format | Must match `^[^\s@]+@[^\s@]+\.[^\s@]+$` | `"not-an-email"` | 400 |
| VAL-02 | Booking endTime > startTime | End must be after start | `{startTime: "2026-07-15T10:00", endTime: "2026-07-15T09:00"}` | 400 |
| VAL-03 | Asset tag uniqueness | UNIQUE constraint on `assets.tag` | Try inserting duplicate via SQL | Constraint violation |
| VAL-04 | User email uniqueness | UNIQUE constraint on `users.email` | Signup with existing email | 409 |
| VAL-05 | Role enum | CHECK constraint: 4 valid values | `{role: "superadmin"}` | 400 `"Invalid role"` |
| VAL-06 | Asset status enum | CHECK constraint: 7 valid values | Direct SQL with `"Broken"` | Constraint violation |
| VAL-07 | Audit result enum | CHECK constraint: 4 valid values | `{result: "lost"}` | 400 (must be `missing`) |
| VAL-08 | Booking start/end format | Must be parseable date | `{startTime: "yesterday"}` | 400 `"must be valid dates"` |

---

## Edge Cases

| ID | Scenario | Details | Expected Behavior |
|---|---|---|---|
| EDGE-01 | Simultaneous allocation attempts | Two requests to allocate same Available asset | One succeeds (201), other gets 409 — SQLite single-writer serializes |
| EDGE-02 | Transfer approval for non-allocated asset | Asset returned between request time and approval time | Transaction handles gracefully (old allocation may already be closed) |
| EDGE-03 | Maintenance on Under Maintenance asset | Approve maintenance for asset already Under Maintenance | Lifecycle allows it (no-op on same state) |
| EDGE-04 | Audit scope with no matching assets | Create cycle with scope_location = "Nonexistent Branch" | 201, but items array is empty |
| EDGE-05 | Booking reminder deduplication | Cron fires twice for same upcoming booking | Only one `booking_reminder` notification (entity_ref guard) |
| EDGE-06 | Overdue alert deduplication | Multiple requests to overdue allocations list | Only one `overdue_return` notification per allocation |
| EDGE-07 | Return of non-allocated asset | POST return for already-returned allocation | 400 `"already been returned"` |
| EDGE-08 | Reschedule to self-conflicting time | Reschedule booking to overlap with itself | Handled by excludeId on overlap check — no self-conflict |

---

## Acceptance Criteria

Mapped directly to PRD success criteria:

| PRD Criterion | Test | Pass Condition |
|---|---|---|
| Asset lifecycle management | FT-02, FT-03, FT-05 | Assets transition through all 7 states correctly |
| Conflict-free allocation | FT-03-02 | HTTP 409 with holder name on double-allocation |
| Transfer workflow | FT-03-03, FT-03-04, FT-03-05 | Request → approve/reject → re-allocation works end-to-end |
| Overlap-safe booking | FT-04-02, FT-04-03 | Overlaps rejected, back-to-back accepted |
| Approval-driven maintenance | FT-05-02, FT-05-04 | Approval → Under Maintenance, resolution → Available |
| Accountable audits | FT-06-04, FT-06-05 | Close cycle → Missing→Lost, Damaged→auto-maintenance |
| Role-based access | AUTH matrix | Each role sees and accesses only permitted features |
| Notification system | IT-07, IT-08 | All 13 notification types fire on correct triggers |
| Activity logging | IT-01 through IT-06 | Every mutation writes to activity_logs |
| Dashboard KPIs | FT-07-01, FT-07-02 | Counts and overdue list match seed data |
| CSV export | FT-07-04 | Valid CSV file downloaded with correct headers |

---

## Regression Checklist

Run after any code change:

- [ ] Admin can log in with `admin@assetflow.app` / `Admin@123`
- [ ] Seed script completes without errors (`npm run seed`)
- [ ] Health endpoint returns 200 (`GET /api/health`)
- [ ] Asset Directory shows 35 assets
- [ ] Dashboard shows 2 overdue returns (AF-0019, AF-0017)
- [ ] Double-allocation returns 409 with holder name
- [ ] Booking overlap returns 409; back-to-back succeeds
- [ ] Maintenance approval transitions asset to Under Maintenance
- [ ] Maintenance resolution transitions asset to Available
- [ ] Transfer approval creates new allocation atomically
- [ ] Audit close transitions missing items to Lost
- [ ] CSV export downloads valid file
- [ ] Notifications bell shows correct unread count
- [ ] All 4 roles see correct navigation items

---

## Browser Compatibility

| Browser | Version | Status | Notes |
|---|---|---|---|
| Chrome | 120+ | Primary | Development and testing browser |
| Firefox | 120+ | Supported | Tested for layout and functionality |
| Edge | 120+ | Supported | Chromium-based, expected to match Chrome |
| Safari | 17+ | Untested | May require testing for demo day |
| Mobile browsers | — | Out of scope | Desktop-only for hackathon demo |

---

## Risk Matrix

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| SQLite single-writer blocks concurrent writes | Low (demo scale) | Medium | Document as known constraint; acceptable for <10 users |
| JWT secret exposure in source | Medium | High | Document as intentional scope boundary; `.env` in production |
| Seed data gets corrupted during demo | Low | High | `npm run seed` resets to baseline in <2 seconds |
| Booking overlap check fails on timezone edge | Low | High | All timestamps stored as UTC ISO 8601; SQLite `datetime()` handles consistently |
| Lifecycle state machine allows invalid transition | Very Low | Critical | CHECK constraint + `transitionAsset()` double-validates |
| File upload fills disk | Very Low | Medium | 8MB limit per file; demo data volume is negligible |

---

## Severity & Priority Matrices

### Severity Classification

| Level | Definition | Example |
|---|---|---|
| **S1 — Critical** | System unusable, data corruption, security breach | Double-allocation permitted, lifecycle constraint violated |
| **S2 — Major** | Feature non-functional, workaround not available | Booking overlap accepted, maintenance doesn't change asset status |
| **S3 — Moderate** | Feature impaired, workaround exists | CSV export missing header row, notification not sent |
| **S4 — Minor** | Cosmetic or UX issue, no functional impact | Misaligned table column, tooltip text incorrect |

### Priority Classification

| Level | Definition | Response |
|---|---|---|
| **P0** | Must fix before demo | Block other work, fix immediately |
| **P1** | Should fix before demo | Address in current sprint |
| **P2** | Fix if time allows | Defer to post-hackathon |
| **P3** | Enhancement | Log for future consideration |

### Severity × Priority Decision Matrix

| | P0 | P1 | P2 | P3 |
|---|---|---|---|---|
| **S1** | Fix now | Fix now | Fix today | — |
| **S2** | Fix now | Fix today | Schedule | Defer |
| **S3** | Fix today | Schedule | Defer | Defer |
| **S4** | Schedule | Defer | Defer | Defer |

---

## Test Data Strategy

### Primary Dataset

The seed data package (`data/*.json`) serves as the primary test dataset. It was engineered through a multi-pass validation process documented in `docs/VALIDATION_REPORT.md` and `docs/SEED_DATA_REVIEW.md`.

| Aspect | Strategy |
|---|---|
| **Organization** | NexGen Infra Solutions — 7 departments, 2 offices (Pune HQ, Mumbai Branch) |
| **User coverage** | All 4 roles represented with multiple users per role |
| **Asset coverage** | All 7 lifecycle states, all 7 categories, 6 bookable assets |
| **Workflow coverage** | All maintenance statuses, all transfer statuses, all booking derived statuses |
| **Temporal range** | June 2025 – July 2026 (14 months of operational history) |
| **Hero assets** | 6 assets with multi-event lifecycle narratives for demo walkthroughs |

### Test Credentials

| Role | Email | Password |
|---|---|---|
| Admin | `admin@assetflow.app` | `Admin@123` |
| Asset Manager | `deepak.nair@nexgeninfra.com` | `Password@123` |
| Dept Head | `kavita.sharma@nexgeninfra.com` | `Password@123` |
| Employee | `rajesh.iyer@nexgeninfra.com` | `Password@123` |

### Database Reset

```bash
cd server
npm run seed    # Idempotent — clears and re-inserts all data
```

---

## Production Readiness Checklist

| Category | Item | Status | Notes |
|---|---|---|---|
| **Core** | All PRD screens implemented (S1–S10) | ✅ | Verified against PRD §5 |
| **Core** | Lifecycle state machine enforced | ✅ | `services/lifecycle.js` with TRANSITIONS map |
| **Core** | Double-allocation block (409) | ✅ | `routes/allocations.js` with holder name |
| **Core** | Booking overlap rejection (409) | ✅ | `routes/bookings.js` with SQL overlap check |
| **Core** | Maintenance status side-effects | ✅ | Approval → Under Maintenance, resolution → Available |
| **Core** | Audit close-cycle effects | ✅ | Missing → Lost, Damaged → auto-maintenance |
| **Data** | Seed script runs cleanly | ✅ | Idempotent, all constraints satisfied |
| **Data** | All 15 tables populated | ✅ | Verified via `SELECT COUNT(*) FROM each table` |
| **Data** | FK constraints enforced | ✅ | `PRAGMA foreign_keys = ON` |
| **Auth** | JWT authentication working | ✅ | Login, signup, forgot, reset flows |
| **Auth** | RBAC enforced on all routes | ✅ | `requireRole()` middleware on mutating endpoints |
| **API** | All endpoints return contract shape | ✅ | `{ok, data}` / `{ok, error}` |
| **API** | Error handler catches unhandled exceptions | ✅ | Central error handler in `index.js` |
| **Frontend** | All screens render | ✅ | 11 screen components load without error |
| **Frontend** | API adapter maps backend → screen shapes | ✅ | `AppContext.jsx` handles shape translation |
| **Docs** | README.md complete | ✅ | Credentials, setup, features, architecture |
| **Docs** | ARCHITECTURE.md complete | ✅ | 13 Mermaid diagrams, full schema documentation |
| **Docs** | Seed data validated | ✅ | `docs/VALIDATION_REPORT.md` with engineering audit |
| **Security** | Passwords hashed (bcrypt 10 rounds) | ✅ | — |
| **Security** | No sensitive data in API responses | ✅ | `password_hash` never included in response shape |
| **Security** | Scope boundaries documented | ✅ | README §Security, ARCHITECTURE §Security |

---

### Design Notes

**DN-TEST-01:** The test cases reference the actual HTTP status codes returned by the implemented routes, verified against the source code in `server/src/routes/`. The 409 conflict response shapes for both double-allocation and booking overlap include additional fields (`holder`/`canRequestTransfer` for allocation, `conflict` for booking) beyond the standard `{ok, error}` contract.

**DN-TEST-02:** Authorization testing covers the 14 route modules registered in `server/src/index.js`. The activity-logs endpoint grants access to `admin`, `asset_manager`, and `dept_head` roles per the `requireRole()` call in `routes/activityLogs.js`. The README states "Admins and Asset Managers" — the implementation is slightly broader.

**DN-TEST-03:** The booking boundary test case (FT-04-03) uses the same asset and time pattern as seed data bookings 4 and 5 (Agile Den AF-0026: 09:00–10:00 by Rohan, 10:00–11:00 by Sneha), confirming this scenario works in the seeded dataset.
