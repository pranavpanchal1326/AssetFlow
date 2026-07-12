# AssetFlow — API Documentation

**REST API Reference**

Base URL: `http://localhost:4000/api`

---

## Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [Response Format](#response-format)
- [Auth Module](#auth-module)
- [Assets Module](#assets-module)
- [Allocations Module](#allocations-module)
- [Transfers Module](#transfers-module)
- [Bookings Module](#bookings-module)
- [Maintenance Module](#maintenance-module)
- [Audits Module](#audits-module)
- [Dashboard Module](#dashboard-module)
- [Notifications Module](#notifications-module)
- [Activity Logs Module](#activity-logs-module)
- [Reports Module](#reports-module)
- [Users Module](#users-module)
- [Departments Module](#departments-module)
- [Categories Module](#categories-module)
- [Health Check](#health-check)

---

## Overview

The AssetFlow API is a RESTful JSON API served by Express.js on port 4000. All endpoints are mounted under `/api`. The Vite frontend dev server proxies `/api` requests to `http://localhost:4000`.

### Authentication

All endpoints except `/api/auth/login`, `/api/auth/signup`, `/api/auth/forgot`, `/api/auth/reset`, and `/api/health` require a valid JWT in the `Authorization` header:

```
Authorization: Bearer <jwt_token>
```

Tokens are obtained through the login or signup endpoints and expire after 7 days.

### Response Format

Every response follows a consistent contract:

**Success:**
```json
{ "ok": true, "data": <payload> }
```

**Error:**
```json
{ "ok": false, "error": "Human-readable error description" }
```

### Common HTTP Status Codes

| Code | Meaning |
|---|---|
| 200 | Success (read/update) |
| 201 | Resource created |
| 400 | Bad request / validation failure |
| 401 | Authentication required or invalid |
| 403 | Forbidden (role or ownership violation) |
| 404 | Resource not found |
| 409 | Conflict (double-allocation, booking overlap) |
| 500 | Internal server error |

---

## Auth Module

### POST /api/auth/signup

Create a new account. Always assigns `role: employee`.

**Authentication:** None

**Request Body:**
```json
{
  "name": "string (required)",
  "email": "string (required, valid email)",
  "password": "string (required, min 6 chars)"
}
```

**Success Response (201):**
```json
{
  "ok": true,
  "data": {
    "token": "eyJhbGci...",
    "user": {
      "id": 19,
      "name": "New User",
      "email": "new@example.com",
      "role": "employee",
      "departmentId": null,
      "status": "active",
      "createdAt": "2026-07-12T10:00:00.000Z"
    }
  }
}
```

**Error Responses:**

| Code | Condition | Error |
|---|---|---|
| 400 | Missing fields | `"Name, email and password are required"` |
| 400 | Invalid email | `"Please provide a valid email address"` |
| 400 | Short password | `"Password must be at least 6 characters"` |
| 409 | Email exists | `"An account with that email already exists"` |

---

### POST /api/auth/login

Authenticate with email and password.

**Authentication:** None

**Request Body:**
```json
{
  "email": "admin@assetflow.app",
  "password": "Admin@123"
}
```

**Success Response (200):**
```json
{
  "ok": true,
  "data": {
    "token": "eyJhbGci...",
    "user": {
      "id": 1,
      "name": "Arjun Mehta",
      "email": "admin@assetflow.app",
      "role": "admin",
      "departmentId": 1,
      "status": "active",
      "createdAt": "2025-06-01T09:00:00.000Z"
    }
  }
}
```

**Error Responses:**

| Code | Condition | Error |
|---|---|---|
| 400 | Missing fields | `"Email and password are required"` |
| 401 | Bad credentials | `"Invalid email or password"` |
| 403 | Inactive account | `"Account is inactive — contact an administrator"` |

---

### POST /api/auth/forgot

Request a password reset link. Always returns 200 to prevent email enumeration.

**Authentication:** None

**Request Body:**
```json
{ "email": "admin@assetflow.app" }
```

**Success Response (200):**
```json
{
  "ok": true,
  "data": { "resetLink": "/reset-password?token=abc123...def" }
}
```

If the email does not exist, `resetLink` is `null`.

---

### POST /api/auth/reset

Reset password using a token from the forgot flow.

**Authentication:** None

**Request Body:**
```json
{
  "token": "abc123...def",
  "password": "NewPassword@456"
}
```

**Success Response (200):**
```json
{ "ok": true, "data": { "reset": true } }
```

**Error Responses:**

| Code | Condition | Error |
|---|---|---|
| 400 | Missing fields | `"Token and new password are required"` |
| 400 | Short password | `"Password must be at least 6 characters"` |
| 400 | Invalid/expired token | `"This reset link is invalid or has expired"` |

---

### GET /api/auth/me

Return the currently authenticated user.

**Authentication:** Required

**Success Response (200):**
```json
{
  "ok": true,
  "data": {
    "user": {
      "id": 1, "name": "Arjun Mehta", "email": "admin@assetflow.app",
      "role": "admin", "departmentId": 1, "status": "active",
      "createdAt": "2025-06-01T09:00:00.000Z"
    }
  }
}
```

---

## Assets Module

### GET /api/assets

List all assets with optional filters.

**Authentication:** Required

**Query Parameters:**

| Param | Type | Description |
|---|---|---|
| `search` | string | Search by name, tag, or serial number (LIKE match) |
| `category` | integer | Filter by category ID |
| `status` | string | Filter by lifecycle status |
| `location` | string | Filter by location |
| `bookable` | boolean | Filter by bookable flag (`true`/`1`) |
| `department` | integer | Filter by department of active holder |

**Success Response (200):**
```json
{
  "ok": true,
  "data": [
    {
      "id": 1, "tag": "AF-0001", "name": "Dell Latitude 5540",
      "categoryId": 1, "serialNo": "DL5540-001-PUN",
      "acquisitionDate": "2025-06-15", "acquisitionCost": 89500,
      "condition": "Good", "location": "Pune HQ — Floor 2",
      "photoUrl": null, "isBookable": false, "status": "Allocated",
      "customValues": { "ram": "16GB", "storage": "512GB SSD" },
      "createdBy": 2, "createdAt": "2025-06-15T10:00:00.000Z"
    }
  ]
}
```

---

### GET /api/assets/:id

Get an asset with its allocation history, maintenance history, and lifecycle timeline.

**Authentication:** Required

**Success Response (200):**
```json
{
  "ok": true,
  "data": {
    "id": 14, "tag": "AF-0014", "name": "MacBook Pro 14\" M3",
    "status": "Allocated",
    "allocationHistory": [
      {
        "id": 15, "holderUserId": 14, "holderUserName": "Pooja Venkatesh",
        "allocatedAt": "2026-05-22T14:00:00.000Z", "status": "active"
      }
    ],
    "maintenanceHistory": [
      {
        "id": 4, "issue": "Keyboard unresponsive keys", "priority": "High",
        "status": "resolved", "technicianName": "Rahul Sawant"
      }
    ],
    "timeline": [
      { "fromState": null, "toState": "Available", "detail": "Registered" },
      { "fromState": "Available", "toState": "Allocated", "detail": "Allocated to user" }
    ]
  }
}
```

---

### GET /api/assets/:id/qr

Generate a QR code for the asset tag.

**Authentication:** Required

**Success Response (200):**
```json
{
  "ok": true,
  "data": {
    "tag": "AF-0014",
    "dataUrl": "data:image/png;base64,iVBOR..."
  }
}
```

---

### POST /api/assets

Register a new asset.

**Authentication:** Required — `asset_manager` only

**Request Body:**
```json
{
  "name": "MacBook Air M3 (required)",
  "categoryId": 1,
  "serialNo": "MBA-M3-001",
  "acquisitionDate": "2026-07-01",
  "acquisitionCost": 134900,
  "condition": "New",
  "location": "Pune HQ — Floor 3",
  "isBookable": false,
  "customValues": { "ram": "24GB", "storage": "512GB SSD" }
}
```

**Success Response (201):**
```json
{
  "ok": true,
  "data": {
    "id": 36, "tag": "AF-0036", "name": "MacBook Air M3",
    "status": "Available", "...": "..."
  }
}
```

---

### PUT /api/assets/:id

Update asset metadata. Optionally change lifecycle status.

**Authentication:** Required — `asset_manager` only

**Request Body:** (all fields optional)
```json
{
  "name": "Updated Name",
  "condition": "Fair",
  "location": "Mumbai Branch — Floor 1",
  "status": "Retired"
}
```

If `status` is provided and differs from current, `transitionAsset()` validates and executes the lifecycle transition.

---

### POST /api/assets/:id/photo

Upload a photo for the asset.

**Authentication:** Required — `asset_manager` only

**Request:** Multipart form data, field name `photo`

**Success Response (200):**
```json
{ "ok": true, "data": { "photoUrl": "/uploads/1720781234-123456789.jpg" } }
```

---

## Allocations Module

### GET /api/allocations

List allocations with optional filters.

**Authentication:** Required

**Query Parameters:**

| Param | Type | Description |
|---|---|---|
| `status` | string | `active` or `returned` |
| `assetId` | integer | Filter by asset |
| `overdue` | boolean | Filter to overdue only (active, past expectedReturnDate) |

**Success Response (200):**
```json
{
  "ok": true,
  "data": [
    {
      "id": 1, "assetId": 1, "holderUserId": 5,
      "holderUserName": "Priya Deshmukh",
      "holderDepartmentId": null,
      "allocatedBy": 2, "allocatedAt": "2025-07-01T10:00:00.000Z",
      "expectedReturnDate": "2026-07-01",
      "returnedAt": null, "returnConditionNotes": null,
      "status": "active"
    }
  ]
}
```

---

### POST /api/allocations

Allocate an asset to a user or department.

**Authentication:** Required — `asset_manager` or `dept_head`

**Request Body:**
```json
{
  "assetId": 5,
  "holderUserId": 7,
  "expectedReturnDate": "2026-09-01"
}
```

Or for department-level:
```json
{
  "assetId": 5,
  "holderDepartmentId": 3,
  "expectedReturnDate": "2026-09-01"
}
```

**Success Response (201):** Allocation record

**Conflict Response (409):**
```json
{
  "ok": false,
  "error": "Currently held by Priya Deshmukh",
  "holder": "Priya Deshmukh",
  "canRequestTransfer": true
}
```

---

### POST /api/allocations/:id/return

Return an allocated asset.

**Authentication:** Required — `asset_manager` or `dept_head`

**Request Body:**
```json
{ "conditionNotes": "Good condition, minor scratches on lid" }
```

**Success Response (200):** Updated allocation with `status: "returned"`, `returnedAt` set

**Error Responses:**

| Code | Condition |
|---|---|
| 404 | Allocation not found |
| 400 | Already returned |

---

## Transfers Module

### GET /api/transfers

List transfer requests with optional status filter.

**Authentication:** Required

**Query Parameters:** `status` (optional): `requested`, `approved`, `rejected`

---

### POST /api/transfers

Request a transfer of an allocated asset.

**Authentication:** Required (employees: own assets only; managers/heads: any)

**Request Body:**
```json
{
  "assetId": 13,
  "toUserId": 9
}
```

**Error Responses:**

| Code | Condition |
|---|---|
| 400 | Asset not currently allocated |
| 403 | Employee doesn't hold the asset |

---

### PUT /api/transfers/:id

Approve or reject a transfer request.

**Authentication:** Required — `asset_manager` or `dept_head`

**Request Body:**
```json
{ "action": "approve" }
```
or
```json
{ "action": "reject" }
```

**On approve:** Closes old allocation, creates new allocation, transitions `Allocated → Allocated` (inside a transaction).

---

## Bookings Module

### GET /api/bookings

List bookings with optional filters.

**Authentication:** Required

**Query Parameters:** `assetId`, `status` (`booked`/`cancelled`)

**Response includes derived status field:** `derivedStatus` = `Upcoming` | `Ongoing` | `Completed` | `Cancelled`

---

### POST /api/bookings

Create a booking for a bookable asset.

**Authentication:** Required

**Request Body:**
```json
{
  "assetId": 26,
  "startTime": "2026-07-15T09:00:00.000Z",
  "endTime": "2026-07-15T10:00:00.000Z",
  "purpose": "Sprint planning meeting"
}
```

**Success Response (201):** Booking record with `status: "booked"`

**Conflict Response (409):**
```json
{
  "ok": false,
  "error": "Overlaps with an existing booking (09:00 – 12:00)"
}
```

**Error Responses:**

| Code | Condition |
|---|---|
| 400 | Missing fields, invalid dates, endTime ≤ startTime |
| 400 | Asset not bookable |
| 404 | Asset not found |

---

### PUT /api/bookings/:id

Cancel or reschedule a booking.

**Authentication:** Required (owner or admin/manager)

**Cancel:**
```json
{ "action": "cancel" }
```

**Reschedule:**
```json
{
  "startTime": "2026-07-15T14:00:00.000Z",
  "endTime": "2026-07-15T15:00:00.000Z"
}
```

Rescheduling re-runs the overlap check excluding the booking's own ID.

---

## Maintenance Module

### GET /api/maintenance

List maintenance requests.

**Authentication:** Required

**Query Parameters:** `status`, `assetId`

---

### POST /api/maintenance

Raise a maintenance request.

**Authentication:** Required (employees: own assets only)

**Request Body (JSON):**
```json
{
  "assetId": 14,
  "issue": "Keyboard unresponsive keys — multiple keys stuck",
  "priority": "High"
}
```

**Request Body (multipart, with photo):** Form fields: `assetId`, `issue`, `priority`, `photo` (file)

**Success Response (201):** Maintenance record with `status: "pending"`

---

### PUT /api/maintenance/:id

Progress a maintenance request through its workflow.

**Authentication:** Required — `asset_manager` only

**Request Body (approve/reject/start/resolve):**
```json
{ "action": "approve" }
```

**Request Body (assign):**
```json
{
  "action": "assign",
  "technicianName": "Rahul Sawant",
  "technicianContact": "+91-9876543210"
}
```

**Valid action transitions:**

| Action | From Status | To Status | Asset Side-Effect |
|---|---|---|---|
| `approve` | pending | approved | → Under Maintenance |
| `reject` | pending | rejected | None |
| `assign` | approved, assigned | assigned | None |
| `start` | assigned | in_progress | None |
| `resolve` | in_progress, assigned, approved | resolved | → Available |

---

## Audits Module

### GET /api/audits

List all audit cycles.

**Authentication:** Required

---

### GET /api/audits/:id

Get a cycle with items and discrepancy report.

**Authentication:** Required

**Success Response (200):**
```json
{
  "ok": true,
  "data": {
    "id": 2, "name": "Q2 2026 Mumbai Branch Audit",
    "status": "open",
    "auditors": [
      { "id": 4, "name": "Kavita Sharma" }
    ],
    "items": [
      { "id": 1, "assetId": 25, "assetTag": "AF-0025", "result": "missing" }
    ],
    "discrepancies": [
      { "id": 1, "assetId": 25, "assetTag": "AF-0025", "result": "missing" }
    ]
  }
}
```

---

### POST /api/audits

Create an audit cycle.

**Authentication:** Required — `admin` only

**Request Body:**
```json
{
  "name": "Q3 2026 Pune HQ Audit",
  "scopeDepartmentId": 1,
  "scopeLocation": "Pune HQ",
  "startDate": "2026-07-01",
  "endDate": "2026-07-31",
  "auditorIds": [4, 6]
}
```

**Success Response (201):** Audit cycle with auto-populated items

---

### PUT /api/audits/:id/items/:itemId

Mark an audit item.

**Authentication:** Required (assigned auditor or admin)

**Request Body:**
```json
{
  "result": "missing",
  "note": "Asset not found at Rack B7"
}
```

Valid results: `verified`, `missing`, `damaged`

---

### PUT /api/audits/:id

Close an audit cycle.

**Authentication:** Required — `admin` only

**Request Body:**
```json
{ "action": "close" }
```

**Success Response (200):** Updated cycle with `status: "closed"` and `applied` counts:
```json
{
  "ok": true,
  "data": {
    "status": "closed",
    "applied": { "lost": 1, "maintenanceRaised": 1 }
  }
}
```

---

## Dashboard Module

### GET /api/dashboard/kpis

Get dashboard KPI counts and overdue return list.

**Authentication:** Required

**Success Response (200):**
```json
{
  "ok": true,
  "data": {
    "available": 12,
    "allocated": 15,
    "maintenanceToday": 2,
    "activeBookings": 1,
    "pendingTransfers": 1,
    "upcomingReturns": 5,
    "overdueReturns": [
      {
        "allocationId": 19,
        "assetId": 19,
        "assetTag": "AF-0019",
        "assetName": "iPad Pro 12.9\"",
        "holderName": "Farhan Sheikh",
        "expectedReturnDate": "2026-07-01"
      }
    ]
  }
}
```

---

## Notifications Module

### GET /api/notifications

List notifications for the current user.

**Authentication:** Required

**Query Parameters:** `unread` (`true`/`1`) — filter to unread only

**Success Response (200):**
```json
{
  "ok": true,
  "data": {
    "notifications": [
      {
        "id": 1, "type": "asset_assigned",
        "title": "Asset Assigned",
        "body": "AF-0001 Dell Latitude 5540 has been assigned to you",
        "entityRef": "asset:1", "isRead": false,
        "createdAt": "2025-07-01T10:05:00.000Z"
      }
    ],
    "unreadCount": 12
  }
}
```

---

### PUT /api/notifications/:id/read

Mark a single notification as read.

**Authentication:** Required (must own the notification)

---

### PUT /api/notifications/read-all

Mark all notifications as read for the current user.

**Authentication:** Required

**Success Response (200):**
```json
{ "ok": true, "data": { "marked": 5 } }
```

---

## Activity Logs Module

### GET /api/activity-logs

Query the system-wide activity log.

**Authentication:** Required — `admin`, `asset_manager`, or `dept_head`

**Query Parameters:**

| Param | Type | Description |
|---|---|---|
| `user` | integer | Filter by actor user ID |
| `entityType` | string | Filter by entity type (asset, user, booking, etc.) |
| `from` | datetime | Start of date range |
| `to` | datetime | End of date range |

**Success Response (200):**
```json
{
  "ok": true,
  "data": [
    {
      "id": 1, "userId": 2, "userName": "Deepak Nair",
      "action": "create", "entityType": "asset", "entityId": 1,
      "detail": "{\"tag\":\"AF-0001\",\"name\":\"Dell Latitude 5540\"}",
      "createdAt": "2025-06-15T10:00:00.000Z"
    }
  ]
}
```

Results are limited to 500 rows, ordered by `created_at DESC`.

---

## Reports Module

### GET /api/reports/utilization

Asset utilization report — allocation count per asset.

**Authentication:** Required — `admin`, `asset_manager`, or `dept_head`

**Success Response (200):**
```json
{
  "ok": true,
  "data": [
    { "assetId": 14, "tag": "AF-0014", "name": "MacBook Pro 14\" M3", "status": "Allocated", "allocationCount": 4 },
    { "assetId": 30, "tag": "AF-0030", "name": "iPad Mini 6th Gen", "status": "Available", "allocationCount": 0 }
  ]
}
```

---

### GET /api/reports/maintenance-frequency

Maintenance request count by asset category.

**Authentication:** Required — `admin`, `asset_manager`, or `dept_head`

**Success Response (200):**
```json
{
  "ok": true,
  "data": [
    { "category": "Laptops & Notebooks", "requestCount": 3 },
    { "category": "Vehicles", "requestCount": 1 }
  ]
}
```

---

### GET /api/reports/department-summary

Active allocations per department.

**Authentication:** Required — `admin`, `asset_manager`, or `dept_head`

---

### GET /api/reports/booking-heatmap

Booking counts by weekday × hour.

**Authentication:** Required — `admin`, `asset_manager`, or `dept_head`

**Success Response (200):**
```json
{
  "ok": true,
  "data": [
    { "day": 1, "hour": 9, "count": 3 },
    { "day": 3, "hour": 14, "count": 1 }
  ]
}
```

`day`: 0 = Sunday, 6 = Saturday. `hour`: 0–23.

---

### GET /api/reports/:name/export

Download a report as CSV.

**Authentication:** Required — `admin`, `asset_manager`, or `dept_head`

**Valid names:** `utilization`, `maintenance-frequency`, `department-summary`, `booking-heatmap`

**Response:** `Content-Type: text/csv`, `Content-Disposition: attachment; filename="<name>.csv"`

---

## Users Module

### GET /api/users

List users. Admin sees all fields; other roles see only `id`, `name`, `role`, `departmentId`.

**Authentication:** Required

---

### PUT /api/users/:id

Update user role, department, or status.

**Authentication:** Required — `admin` only

**Request Body:**
```json
{
  "role": "asset_manager",
  "departmentId": 2,
  "status": "active"
}
```

Valid roles: `admin`, `asset_manager`, `dept_head`, `employee`
Valid statuses: `active`, `inactive`

---

## Departments Module

### GET /api/departments

List all departments.

**Authentication:** Required

---

### POST /api/departments

Create a department.

**Authentication:** Required — `admin` only

**Request Body:**
```json
{
  "name": "New Department",
  "headUserId": 4,
  "parentId": 1
}
```

---

### PUT /api/departments/:id

Update a department.

**Authentication:** Required — `admin` only

---

## Categories Module

### GET /api/categories

List all asset categories.

**Authentication:** Required

---

### POST /api/categories

Create an asset category.

**Authentication:** Required — `admin` only

**Request Body:**
```json
{
  "name": "Servers",
  "description": "Rack-mounted and tower servers",
  "customFields": [
    { "name": "cpu", "label": "CPU Model", "type": "text", "required": false },
    { "name": "rackUnit", "label": "Rack Unit Size", "type": "number", "required": true }
  ]
}
```

---

### PUT /api/categories/:id

Update a category.

**Authentication:** Required — `admin` only

---

## Health Check

### GET /api/health

Check if the API server is running.

**Authentication:** None

**Success Response (200):**
```json
{
  "ok": true,
  "data": { "status": "up", "time": "2026-07-12T10:00:00.000Z" }
}
```

---

### Design Notes

**DN-API-01:** The API contract uses `camelCase` for JSON field names in request/response bodies, while the database uses `snake_case`. Each route module contains a `shape()` function that translates between the two conventions.

**DN-API-02:** The allocation conflict response (409) includes additional fields (`holder`, `canRequestTransfer`) beyond the standard error contract. The frontend API client checks `err.payload` for these extended fields.

**DN-API-03:** The CSV export endpoint currently allows `admin`, `asset_manager`, and `dept_head` roles. The frontend downloads CSV via a blob fetch (not a simple anchor link) because the export route requires a Bearer token in the Authorization header.
