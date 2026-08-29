# POS Backend SuperAdmin API & Platform Oversight Guide

Welcome! This guide provides dedicated, in-depth documentation for the **SuperAdmin (`SUPER_ADMIN`)** role within the Point of Sale (POS) backend platform. 

It covers system metrics, shop oversight, account suspension/reactivation, user management, security scope rules, and integration blueprints for building an Admin Dashboard UI.

---

## 1. Executive Summary & Architecture

### Role Description
The **SuperAdmin** (`SUPER_ADMIN`) is the platform-level administrator. Unlike Shop Owners, Admins, or Sales personnel who operate within the context of a single shop, the SuperAdmin has **global platform visibility** to manage system metrics, monitor registered shops, freeze/activate shop operations, and suspend/reactivate user accounts platform-wide.

### Base URLs & OpenAPI Documentation
- **Production API**: `https://pos-backend-0fzk.onrender.com`
- **Versioned API Prefix**: `https://pos-backend-0fzk.onrender.com/api/v1`
- **Local Development**: `http://localhost:3000` or `http://localhost:3000/api/v1`
- **Interactive Swagger UI**: [https://pos-backend-0fzk.onrender.com/api-docs](https://pos-backend-0fzk.onrender.com/api-docs) (or `/docs`)
- **Raw OpenAPI 3.0 JSON Spec**: [https://pos-backend-0fzk.onrender.com/api-docs/json](https://pos-backend-0fzk.onrender.com/api-docs/json)

### Standard Headers
All requests must include standard HTTP headers:
```http
Authorization: Bearer <SUPER_ADMIN_JWT_TOKEN>
Content-Type: application/json
```

---

## 2. Security Boundaries & Role Matrix

### Permissions & Scoping Rules
- **No Shop Assignment**: The SuperAdmin user object has `shopId = null`. SuperAdmins are not tied to any single shop.
- **Operational Route Boundary**: SuperAdmins are **strictly prohibited** from performing shop-level operational transactions (e.g., creating products, processing sales, modifying shop inventory, managing shop debts). Attempting to call shop operational endpoints (`/shops/:shopId/...`) will trigger a `403 Forbidden` error from the `resolveShopAccess` middleware:
  ```json
  {
    "success": false,
    "error": "SuperAdmin cannot access shop operational routes directly."
  }
  ```
- **Exclusive Admin Routes Access**: Only accounts with `role: "SUPER_ADMIN"` can access `/admin/*` routes. Requests from `OWNER`, `ADMIN`, or `SALES` users to `/admin/*` endpoints return `403 Forbidden`.

### Role Capability Comparison Matrix

| Feature / Action | `SUPER_ADMIN` | `OWNER` | `ADMIN` | `SALES` |
| :--- | :---: | :---: | :---: | :---: |
| **View System Metrics (`/admin/stats`)** | ✅ | ❌ | ❌ | ❌ |
| **List All Shops Platform-Wide (`/admin/shops`)** | ✅ | ❌ | ❌ | ❌ |
| **Suspend / Activate Shops (`/admin/shops/:id/*`)** | ✅ | ❌ | ❌ | ❌ |
| **List & Filter All Users Platform-Wide (`/admin/users`)** | ✅ | ❌ | ❌ | ❌ |
| **Suspend / Activate Users (`/admin/users/:id/*`)** | ✅ | ❌ | ❌ | ❌ |
| **Manage Own Shop(s)** | ❌ | ✅ | ❌ | ❌ |
| **Manage Staff Members** | ❌ | ✅ (Admin & Sales) | ✅ (Sales only) | ❌ |
| **Process POS Sales & Receipts** | ❌ | ✅ | ✅ | ✅ |

---

## 3. Account Suspension & System Enforcement

SuperAdmins possess administrative power to freeze shop operations or block user access across the platform.

### 1. Shop Suspension Impact (`isActive = false`)
When a shop is suspended via `PATCH /admin/shops/:id/suspend`:
- All operational API calls for that shop (by Owners, Admins, or Sales personnel) are immediately blocked with `403 Forbidden`:
  ```json
  {
    "success": false,
    "error": "This shop has been suspended."
  }
  ```
- Existing data (products, sales logs, customer records, debts) is preserved safely in the database.
- Reactivating the shop via `PATCH /admin/shops/:id/activate` immediately restores full operation for all staff.

### 2. User Account Suspension Impact (`isActive = false`)
When a user is suspended via `PATCH /admin/users/:id/suspend`:
- Any subsequent request using a JWT token belonging to that user is rejected by authentication middleware with `403 Forbidden`:
  ```json
  {
    "success": false,
    "error": "This account has been suspended."
  }
  ```
- **Safety Warning for Shop Owners**: If the user being suspended is an `OWNER` of active shops, the API returns a safety warning field in the response payload indicating that the target shop(s) currently have no active owner:
  ```json
  "warning": "Shop 'Apex Supermarket & Electronics' now has no active owner."
  ```

---

## 4. Demo Credentials & Database Seeding

To seed a default SuperAdmin account alongside sample shops and staff for testing, run:

```bash
npm run seed
```

### Seeded SuperAdmin Credentials
- **Email**: `superadmin@example.com`
- **Password**: `password123`
- **Role**: `SUPER_ADMIN`
- **Shop ID**: `null`

---

## 5. Detailed API Endpoint Reference

---

### 🔑 Authentication & Token Management

#### 1. SuperAdmin Login
Authenticates the SuperAdmin and returns a JWT access token.

- **HTTP Method**: `POST`
- **Endpoint**: `/api/v1/auth/login` (or `/auth/login`)
- **Auth Required**: None (Public)

**Request Body**:
```json
{
  "email": "superadmin@example.com",
  "password": "password123"
}
```

**Success Response (`200 OK`)**:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "a1b2c3d4-e5f6-7890-abcd-1234567890ab",
      "name": "Platform SuperAdmin",
      "email": "superadmin@example.com",
      "role": "SUPER_ADMIN",
      "shopId": null,
      "isActive": true
    }
  }
}
```

#### 2. Get Current SuperAdmin Profile
Retrieves full details of the authenticated SuperAdmin session.

- **HTTP Method**: `GET`
- **Endpoint**: `/api/v1/auth/me` (or `/auth/me`)
- **Auth Required**: `Bearer <SUPER_ADMIN_JWT_TOKEN>`

**Success Response (`200 OK`)**:
```json
{
  "success": true,
  "data": {
    "id": "a1b2c3d4-e5f6-7890-abcd-1234567890ab",
    "name": "Platform SuperAdmin",
    "email": "superadmin@example.com",
    "role": "SUPER_ADMIN",
    "shopId": null,
    "isActive": true,
    "createdAt": "2026-01-01T00:00:00.000Z"
  }
}
```

---

### 📊 Platform Analytics & Statistics

#### 3. Get System-Wide Statistics
Returns aggregate platform counts including total shops, active/suspended shops, suspended users, and user counts breakdown by role.

- **HTTP Method**: `GET`
- **Endpoint**: `/api/v1/admin/stats` (or `/admin/stats`)
- **Auth Required**: `Bearer <SUPER_ADMIN_JWT_TOKEN>` (`SUPER_ADMIN` only)

**cURL Example**:
```bash
curl -X GET https://pos-backend-0fzk.onrender.com/api/v1/admin/stats \
  -H "Authorization: Bearer <SUPER_ADMIN_JWT_TOKEN>"
```

**Success Response (`200 OK`)**:
```json
{
  "success": true,
  "data": {
    "totalShops": 15,
    "totalActiveShops": 13,
    "suspendedShops": 2,
    "suspendedUsers": 3,
    "totalSuspendedAccounts": 5,
    "totalUsersByRole": {
      "SUPER_ADMIN": 1,
      "OWNER": 8,
      "ADMIN": 12,
      "SALES": 24
    }
  }
}
```

---

### 🏬 Shop Oversight & Management

#### 4. List All Shops Platform-Wide
Fetches a list of all shops registered on the platform, ordered by creation date (newest first). Each shop record includes owner name, owner email, active status, and total member count.

- **HTTP Method**: `GET`
- **Endpoint**: `/api/v1/admin/shops` (or `/admin/shops`)
- **Auth Required**: `Bearer <SUPER_ADMIN_JWT_TOKEN>` (`SUPER_ADMIN` only)

**cURL Example**:
```bash
curl -X GET https://pos-backend-0fzk.onrender.com/api/v1/admin/shops \
  -H "Authorization: Bearer <SUPER_ADMIN_JWT_TOKEN>"
```

**Success Response (`200 OK`)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "ba8c5423-cc8e-4cd4-9ea9-0a9f327e302e",
      "name": "Apex Supermarket & Electronics",
      "businessType": "RETAIL",
      "ownerId": "f47ac10b-58cc-4372-a567-0e02b2c3d4e5",
      "ownerName": "Jane Doe",
      "ownerEmail": "owner@example.com",
      "isActive": true,
      "createdAt": "2026-02-10T14:22:00.000Z",
      "memberCount": 5
    },
    {
      "id": "e9876543-210a-4bcd-89ef-0123456789ab",
      "name": "Boutique Fashion Hub",
      "businessType": "CLOTHING",
      "ownerId": "c1234567-89ab-4def-0123-456789abcdef",
      "ownerName": "John Smith",
      "ownerEmail": "john@example.com",
      "isActive": false,
      "createdAt": "2026-01-15T09:10:00.000Z",
      "memberCount": 2
    }
  ]
}
```

#### 5. Suspend a Shop
Freezes shop operations by setting `isActive` to `false`. Operational endpoints for this shop will reject requests with `403 Forbidden`.

- **HTTP Method**: `PATCH`
- **Endpoint**: `/api/v1/admin/shops/:id/suspend` (or `/admin/shops/:id/suspend`)
- **Auth Required**: `Bearer <SUPER_ADMIN_JWT_TOKEN>` (`SUPER_ADMIN` only)
- **Path Parameter**: `id` (UUID of the shop)

**cURL Example**:
```bash
curl -X PATCH https://pos-backend-0fzk.onrender.com/api/v1/admin/shops/ba8c5423-cc8e-4cd4-9ea9-0a9f327e302e/suspend \
  -H "Authorization: Bearer <SUPER_ADMIN_JWT_TOKEN>"
```

**Success Response (`200 OK`)**:
```json
{
  "success": true,
  "data": {
    "id": "ba8c5423-cc8e-4cd4-9ea9-0a9f327e302e",
    "name": "Apex Supermarket & Electronics",
    "businessType": "RETAIL",
    "ownerId": "f47ac10b-58cc-4372-a567-0e02b2c3d4e5",
    "isActive": false,
    "createdAt": "2026-02-10T14:22:00.000Z",
    "updatedAt": "2026-08-24T15:30:00.000Z"
  }
}
```

**Error Response (`404 Not Found`)**:
```json
{
  "success": false,
  "error": "Shop not found"
}
```

#### 6. Reactivate a Shop
Unfreezes a shop by setting `isActive` to `true`, restoring operational access.

- **HTTP Method**: `PATCH`
- **Endpoint**: `/api/v1/admin/shops/:id/activate` (or `/admin/shops/:id/activate`)
- **Auth Required**: `Bearer <SUPER_ADMIN_JWT_TOKEN>` (`SUPER_ADMIN` only)
- **Path Parameter**: `id` (UUID of the shop)

**cURL Example**:
```bash
curl -X PATCH https://pos-backend-0fzk.onrender.com/api/v1/admin/shops/ba8c5423-cc8e-4cd4-9ea9-0a9f327e302e/activate \
  -H "Authorization: Bearer <SUPER_ADMIN_JWT_TOKEN>"
```

**Success Response (`200 OK`)**:
```json
{
  "success": true,
  "data": {
    "id": "ba8c5423-cc8e-4cd4-9ea9-0a9f327e302e",
    "name": "Apex Supermarket & Electronics",
    "businessType": "RETAIL",
    "ownerId": "f47ac10b-58cc-4372-a567-0e02b2c3d4e5",
    "isActive": true,
    "createdAt": "2026-02-10T14:22:00.000Z",
    "updatedAt": "2026-08-24T15:35:00.000Z"
  }
}
```

---

### 👤 User Oversight & Management

#### 7. List All Users Platform-Wide (Paginated & Filtered)
Retrieves a paginated list of all users across the system. Supports optional filtering by user role (`SUPER_ADMIN`, `OWNER`, `ADMIN`, `SALES`).

- **HTTP Method**: `GET`
- **Endpoint**: `/api/v1/admin/users` (or `/admin/users`)
- **Auth Required**: `Bearer <SUPER_ADMIN_JWT_TOKEN>` (`SUPER_ADMIN` only)

**Query Parameters**:
| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `page` | integer | `1` | Page number |
| `limit` | integer | `10` | Records per page |
| `role` | string | *None* | Optional role filter (`SUPER_ADMIN`, `OWNER`, `ADMIN`, `SALES`) |

**cURL Example**:
```bash
curl -X GET "https://pos-backend-0fzk.onrender.com/api/v1/admin/users?page=1&limit=10&role=OWNER" \
  -H "Authorization: Bearer <SUPER_ADMIN_JWT_TOKEN>"
```

**Success Response (`200 OK`)**:
```json
{
  "success": true,
  "data": {
    "total": 8,
    "page": 1,
    "limit": 10,
    "totalPages": 1,
    "users": [
      {
        "id": "f47ac10b-58cc-4372-a567-0e02b2c3d4e5",
        "name": "Jane Doe",
        "email": "owner@example.com",
        "role": "OWNER",
        "shopId": null,
        "isActive": true,
        "createdAt": "2026-02-10T14:20:00.000Z"
      },
      {
        "id": "d1234567-89ab-4def-0123-456789abcdef",
        "name": "Robert Johnson",
        "email": "robert@example.com",
        "role": "OWNER",
        "shopId": null,
        "isActive": false,
        "createdAt": "2026-01-20T11:05:00.000Z"
      }
    ]
  }
}
```

#### 8. Suspend a User
Suspends a user account platform-wide (`isActive = false`). If the user is an `OWNER` of active shops, the response includes a `warning` message.

- **HTTP Method**: `PATCH`
- **Endpoint**: `/api/v1/admin/users/:id/suspend` (or `/admin/users/:id/suspend`)
- **Auth Required**: `Bearer <SUPER_ADMIN_JWT_TOKEN>` (`SUPER_ADMIN` only)
- **Path Parameter**: `id` (UUID of the user)

**cURL Example**:
```bash
curl -X PATCH https://pos-backend-0fzk.onrender.com/api/v1/admin/users/f47ac10b-58cc-4372-a567-0e02b2c3d4e5/suspend \
  -H "Authorization: Bearer <SUPER_ADMIN_JWT_TOKEN>"
```

**Success Response with Warning (`200 OK`)**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "f47ac10b-58cc-4372-a567-0e02b2c3d4e5",
      "name": "Jane Doe",
      "email": "owner@example.com",
      "role": "OWNER",
      "shopId": null,
      "isActive": false,
      "createdAt": "2026-02-10T14:20:00.000Z",
      "updatedAt": "2026-08-24T15:40:00.000Z"
    },
    "warning": "Shop 'Apex Supermarket & Electronics' now has no active owner."
  }
}
```

**Standard Success Response without Warning (`200 OK`)**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "b7890123-4567-89ab-cdef-0123456789ab",
      "name": "Alex Staff",
      "email": "sales@example.com",
      "role": "SALES",
      "shopId": "ba8c5423-cc8e-4cd4-9ea9-0a9f327e302e",
      "isActive": false,
      "createdAt": "2026-02-11T08:00:00.000Z",
      "updatedAt": "2026-08-24T15:42:00.000Z"
    }
  }
}
```

#### 9. Reactivate a User
Reactivates a suspended user account (`isActive = true`), restoring login privileges.

- **HTTP Method**: `PATCH`
- **Endpoint**: `/api/v1/admin/users/:id/activate` (or `/admin/users/:id/activate`)
- **Auth Required**: `Bearer <SUPER_ADMIN_JWT_TOKEN>` (`SUPER_ADMIN` only)
- **Path Parameter**: `id` (UUID of the user)

**cURL Example**:
```bash
curl -X PATCH https://pos-backend-0fzk.onrender.com/api/v1/admin/users/f47ac10b-58cc-4372-a567-0e02b2c3d4e5/activate \
  -H "Authorization: Bearer <SUPER_ADMIN_JWT_TOKEN>"
```

**Success Response (`200 OK`)**:
```json
{
  "success": true,
  "data": {
    "id": "f47ac10b-58cc-4372-a567-0e02b2c3d4e5",
    "name": "Jane Doe",
    "email": "owner@example.com",
    "role": "OWNER",
    "shopId": null,
    "isActive": true,
    "createdAt": "2026-02-10T14:20:00.000Z",
    "updatedAt": "2026-08-24T15:45:00.000Z"
  }
}
```

---

## 6. HTTP Error Handling & Status Codes Reference

The SuperAdmin API uses standard HTTP response codes and error objects:

```json
{
  "success": false,
  "error": "Descriptive error message"
}
```

### Status Codes Quick Reference

| Status Code | Description | SuperAdmin Common Scenarios |
| :--- | :--- | :--- |
| `200 OK` | Request succeeded | Stats retrieved, list returned, status toggled |
| `401 Unauthorized` | Authentication failed | Missing/expired Bearer token |
| `403 Forbidden` | Access denied | Non-SuperAdmin calling `/admin/*`, or SuperAdmin calling shop operational routes (`/shops/*`) |
| `404 Not Found` | Resource missing | Shop or User ID does not exist |
| `500 Internal Error` | Server error | Database connection failure or unhandled exception |

---

## 7. Frontend / Admin Dashboard Integration Blueprint

When building a Web-based SuperAdmin Portal, follow this architecture pattern:

### 1. Authentication & Route Guard
- After login (`POST /auth/login`), check `response.data.user.role === 'SUPER_ADMIN'`. If false, redirect away from the Admin Portal.
- Store the token securely (`localStorage`, `sessionStorage`, or `HttpOnly` cookie).

### 2. Overview Dashboard (`/admin/stats`)
- Display summary metric cards:
  - Total Shops vs Active Shops
  - Total Suspended Accounts (Shops + Users)
  - Users Breakdown by Role (Doughnut / Bar chart for `OWNER`, `ADMIN`, `SALES`, `SUPER_ADMIN`)

### 3. Shops Oversight View (`/admin/shops`)
- Render a table showing `Name`, `Business Type`, `Owner Email`, `Member Count`, `Status (Active/Suspended)`, and `Actions`.
- Action buttons trigger `PATCH /admin/shops/:id/suspend` or `PATCH /admin/shops/:id/activate`.
- Use confirmation modal dialogs before executing suspensions.

### 4. Users Oversight View (`/admin/users`)
- Tabbed interface or dropdown filter by Role (`All`, `OWNER`, `ADMIN`, `SALES`, `SUPER_ADMIN`).
- Paginated table with `page` and `limit` controls.
- When suspending an `OWNER`, capture the API response `warning` field and display a high-visibility warning banner in the UI:
  > ⚠️ **Warning**: *Shop 'Apex Supermarket' now has no active owner.*

---

## 8. Verification & Test Suite

To verify SuperAdmin routes and security rules locally, run the integration test suite:

```bash
# Run SuperAdmin oversight tests
node tests/admin.test.js

# Run Swagger OpenAPI coverage verification
node tests/swagger.test.js
```

All endpoints listed in this guide are covered by unit/integration tests and verified in Swagger OpenAPI specs.
