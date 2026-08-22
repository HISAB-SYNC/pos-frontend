# POS Backend API Developer Guide (Frontend & Mobile)

Welcome! This guide provides full technical documentation for integrating Web and Mobile applications with the Point of Sale (POS) backend API.

---

## 1. General Architecture & Conventions

### Base URLs
- **Production / Deployed API**: `https://pos-backend-0fzk.onrender.com`
- **Production Versioned Prefix**: `https://pos-backend-0fzk.onrender.com/api/v1`
- **Local Development**: `http://localhost:3000` or `http://localhost:3000/api/v1`
*(Note: Both root `/` and `/api/v1` route prefixes are fully supported)*

### Live Interactive Swagger Documentation
- **Interactive Web UI**: [https://pos-backend-0fzk.onrender.com/api-docs](https://pos-backend-0fzk.onrender.com/api-docs) (or `/docs`)
- **Raw OpenAPI 3.0 Spec JSON**: [https://pos-backend-0fzk.onrender.com/api-docs/json](https://pos-backend-0fzk.onrender.com/api-docs/json)

### Standard Headers
- `Content-Type: application/json`
- `Authorization: Bearer <JWT_TOKEN>` *(Required for all protected endpoints)*

### CORS & Security Configuration
- **CORS**: Enabled by default for all clients (web, native iOS/Android apps, cURL, Postman). Domain restriction is configurable via the `ALLOWED_ORIGINS` environment variable.
- **Security Headers**: Hardened with `helmet` HTTP protection headers.

### Standard JSON Response Format

All responses follow a predictable JSON wrapper format:

#### Success Response Example (`HTTP 200 OK` / `HTTP 201 Created`)
```json
{
  "success": true,
  "data": {
    "id": "648408bb-c857-43eb-92fe-018cb8a1eb47",
    "name": "SuperMart Boutique"
  }
}
```

#### Error Response Example (`HTTP 400` / `HTTP 401` / `HTTP 403` / `HTTP 409` / `HTTP 500`)
```json
{
  "success": false,
  "error": "A product with SKU 'MILK-1L' already exists in this shop"
}
```

### HTTP Status Code Summary
| Status Code | Meaning | Common Cause |
| :--- | :--- | :--- |
| `200 OK` | Request succeeded | Successful GET, PATCH, DELETE, Login, Logout |
| `201 Created` | Resource created | Successful POST creation |
| `400 Bad Request` | Invalid input data | Missing required fields, invalid format, expired OTP |
| `401 Unauthorized` | Authentication failed | Missing/invalid JWT token or wrong credentials |
| `403 Forbidden` | Authorization denied | Role not allowed or trying to access another shop |
| `404 Not Found` | Resource not found | Invalid endpoint or entity ID |
| `409 Conflict` | Unique constraint conflict | Duplicate Product SKU or Category Name in shop |
| `500 Internal Error` | Server error | Unexpected internal server failure |

---

## 2. Authentication & User Roles Matrix

### User Roles Overview

| Role | `shopId` in User | Shop Scope | Capabilities & Permissions |
| :--- | :--- | :--- | :--- |
| **`OWNER`** | `null` | Multi-shop owner | - Register via `POST /auth/register/owner`<br>- Create shops (`POST /shops`) & update settings<br>- Register `ADMIN` and `SALES` staff for owned shops<br>- Manage all categories, suppliers, products, customers, debts, and view dashboard |
| **`ADMIN`** | Required (`UUID`) | Single shop | - Register `SALES` staff for assigned shop only<br>- Manage categories, suppliers, products, customers, debts, and view dashboard<br>- *Cannot register ADMIN/OWNER users or access other shops* |
| **`SALES`** | Required (`UUID`) | Single shop | - Read categories & products<br>- Process sales, manage customers & record debt payments<br>- *Cannot manage staff, categories, suppliers, delete products, or view full dashboard (`403 Forbidden`)* |

---

## 3. Database Seeding & Quick-Start Demo Credentials

To enable rapid frontend and mobile UI development, run the database seeder:

```bash
npm run seed
# or
npx prisma db seed
```

### Seeded Demo Accounts (Password for all: `password123`)
* 🔑 **OWNER Account**: `owner@example.com`
* 🔑 **ADMIN Account**: `admin@example.com`
* 🔑 **SALES Account**: `sales@example.com`
* 🏬 **Sample Shop**: `"Apex Supermarket & Electronics"` (ID: `ba8c5423-cc8e-4cd4-9ea9-0a9f327e302e`)

---

## 4. Endpoints Documentation

---

### 🔑 Authentication Endpoints

#### 1. Register Owner
- **Endpoint**: `POST /auth/register/owner`
- **Auth**: Public
- **Description**: Registers a new shop Owner. `role` is automatically set to `OWNER` and `shopId` is `null`.

**Request Body**:
```json
{
  "email": "owner@example.com",
  "password": "securepassword123",
  "name": "Alex Owner"
}
```

**Success Response (`201 Created`)**:
```json
{
  "success": true,
  "data": {
    "id": "8cf48530-64b4-4b3d-b7ce-ebe54893bbdf",
    "email": "owner@example.com",
    "name": "Alex Owner",
    "role": "OWNER",
    "shopId": null,
    "createdAt": "2026-08-12T08:50:41.994Z",
    "updatedAt": "2026-08-12T08:50:41.994Z"
  }
}
```

---

#### 2. Register Staff Member
- **Endpoint**: `POST /auth/register/staff`
- **Auth**: Protected (`OWNER` or `ADMIN`)
- **Description**: Creates an `ADMIN` or `SALES` staff member for a specific shop.
  - `OWNER` can create `ADMIN` or `SALES` for an owned shop.
  - `ADMIN` can create `SALES` for their shop only.

**Request Body**:
```json
{
  "email": "sales.staff@example.com",
  "password": "staffpassword123",
  "name": "Sam Sales",
  "role": "SALES",
  "shopId": "648408bb-c857-43eb-92fe-018cb8a1eb47"
}
```

**Success Response (`201 Created`)**:
```json
{
  "success": true,
  "data": {
    "id": "b26c9427-0829-4875-96e9-29a8ecc8e1c6",
    "email": "sales.staff@example.com",
    "name": "Sam Sales",
    "role": "SALES",
    "shopId": "648408bb-c857-43eb-92fe-018cb8a1eb47",
    "createdAt": "2026-08-12T08:50:42.272Z",
    "updatedAt": "2026-08-12T08:50:42.272Z"
  }
}
```

---

#### 3. Login
- **Endpoint**: `POST /auth/login`
- **Auth**: Public
- **Description**: Validates email & password, returns user object and JWT bearer token.

**Request Body**:
```json
{
  "email": "owner@example.com",
  "password": "securepassword123"
}
```

**Success Response (`200 OK`)**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "8cf48530-64b4-4b3d-b7ce-ebe54893bbdf",
      "email": "owner@example.com",
      "name": "Alex Owner",
      "role": "OWNER",
      "shopId": null,
      "createdAt": "2026-08-12T08:50:41.994Z",
      "updatedAt": "2026-08-12T08:50:41.994Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

#### 4. Logout
- **Endpoint**: `POST /auth/logout`
- **Auth**: Public / Client-side token discard
- **Description**: Stateless logout endpoint.

**Success Response (`200 OK`)**:
```json
{
  "success": true,
  "data": {
    "message": "Logged out successfully"
  }
}
```

---

#### 5. Request Password Reset OTP
- **Endpoint**: `POST /auth/reset-password/request` *(Alias: `POST /auth/request-reset-password`)*
- **Auth**: Public
- **Description**: Generates a random 6-digit OTP sent via email. Always returns a generic success message.

**Request Body**:
```json
{
  "email": "owner@example.com"
}
```

**Success Response (`200 OK`)**:
```json
{
  "success": true,
  "data": {
    "message": "If that email exists, a password reset OTP has been sent."
  }
}
```

---

#### 6. Verify Password Reset OTP
- **Endpoint**: `POST /auth/reset-password/verify`
- **Auth**: Public
- **Description**: Checks 6-digit OTP. On success, returns short-lived reset token.

**Request Body**:
```json
{
  "email": "owner@example.com",
  "otp": "564817"
}
```

**Success Response (`200 OK`)**:
```json
{
  "success": true,
  "data": {
    "resetToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "message": "OTP verified successfully. Use this token to confirm password reset."
  }
}
```

---

#### 7. Confirm Password Reset
- **Endpoint**: `POST /auth/reset-password/confirm`
- **Auth**: Public
- **Description**: Resets password using validated reset token.

**Request Body**:
```json
{
  "resetToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "newPassword": "newsecurepassword456"
}
```

**Success Response (`200 OK`)**:
```json
{
  "success": true,
  "data": {
    "message": "Password has been reset successfully"
  }
}
```

---

### 🏪 Shop Endpoints (`OWNER` Only)

#### 1. Create Shop
- **Endpoint**: `POST /shops`
- **Auth**: Protected (`OWNER` only)

**Request Body**:
```json
{
  "name": "SuperMart Boutique",
  "businessType": "boutique",
  "address": "123 Commercial Ave, Addis Ababa",
  "taxRate": 15.0,
  "currency": "ETB",
  "language": "en"
}
```

**Success Response (`201 Created`)**:
```json
{
  "success": true,
  "data": {
    "id": "648408bb-c857-43eb-92fe-018cb8a1eb47",
    "name": "SuperMart Boutique",
    "address": "123 Commercial Ave, Addis Ababa",
    "businessType": "boutique",
    "taxRate": "15",
    "currency": "ETB",
    "language": "en",
    "ownerId": "8cf48530-64b4-4b3d-b7ce-ebe54893bbdf",
    "createdAt": "2026-08-12T09:11:45.100Z"
  }
}
```

---

#### 2. Get Owner Shops
- **Endpoint**: `GET /shops`
- **Auth**: Protected (`OWNER` only)

**Success Response (`200 OK`)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "648408bb-c857-43eb-92fe-018cb8a1eb47",
      "name": "SuperMart Boutique",
      "businessType": "boutique",
      "currency": "ETB"
    }
  ]
}
```

---

#### 3. Update Shop Settings
- **Endpoint**: `PATCH /shops/:id`
- **Auth**: Protected (`OWNER` only)

**Request Body**:
```json
{
  "taxRate": 15.5,
  "address": "456 Market St"
}
```

**Success Response (`200 OK`)**:
```json
{
  "success": true,
  "data": {
    "id": "648408bb-c857-43eb-92fe-018cb8a1eb47",
    "name": "SuperMart Boutique",
    "address": "456 Market St",
    "taxRate": "15.5"
  }
}
```

---

### 📁 Category Endpoints

#### 1. Get Categories
- **Endpoint**: `GET /shops/:shopId/categories`
- **Auth**: Protected (`OWNER`, `ADMIN`, `SALES`)

**Success Response (`200 OK`)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "cddbee02-a5bb-421a-9137-6386671add10",
      "shopId": "648408bb-c857-43eb-92fe-018cb8a1eb47",
      "name": "Beverages"
    }
  ]
}
```

---

#### 2. Create Category
- **Endpoint**: `POST /shops/:shopId/categories`
- **Auth**: Protected (`OWNER`, `ADMIN` only; `SALES` forbidden)

**Request Body**:
```json
{
  "name": "Beverages"
}
```

**Success Response (`201 Created`)**:
```json
{
  "success": true,
  "data": {
    "id": "cddbee02-a5bb-421a-9137-6386671add10",
    "name": "Beverages"
  }
}
```

---

### 🚚 Supplier Endpoints

#### 1. Get Suppliers
- **Endpoint**: `GET /shops/:shopId/suppliers`
- **Auth**: Protected (`OWNER`, `ADMIN` only)

**Success Response (`200 OK`)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "f891a2bc-3d4e-567f-8901-abcdef234567",
      "name": "Fresh Farms Distributors",
      "contactInfo": "+251911000000"
    }
  ]
}
```

---

#### 2. Create Supplier
- **Endpoint**: `POST /shops/:shopId/suppliers`
- **Auth**: Protected (`OWNER`, `ADMIN` only)

**Request Body**:
```json
{
  "name": "Fresh Farms Distributors",
  "contactInfo": "contact@freshfarms.com"
}
```

**Success Response (`201 Created`)**:
```json
{
  "success": true,
  "data": {
    "id": "f891a2bc-3d4e-567f-8901-abcdef234567",
    "name": "Fresh Farms Distributors",
    "contactInfo": "contact@freshfarms.com"
  }
}
```

---

### 📦 Product & Inventory Endpoints

#### 1. List Products (Search & Filter)
- **Endpoint**: `GET /shops/:shopId/products`
- **Auth**: Protected (`OWNER`, `ADMIN`, `SALES`)
- **Query Parameters**: `search` / `name` / `sku` *(Optional)*, `categoryId` *(Optional)*.

**Success Response (`200 OK`)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-1234567890ab",
      "sku": "MILK-1L",
      "name": "Whole Milk 1L",
      "price": "90.00",
      "stockQuantity": 20
    }
  ]
}
```

---

#### 2. Get Low Stock Products
- **Endpoint**: `GET /shops/:shopId/products/low-stock`
- **Auth**: Protected (`OWNER`, `ADMIN`, `SALES`)

**Success Response (`200 OK`)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-1234567890ab",
      "name": "Whole Milk 1L",
      "stockQuantity": 2,
      "lowStockThreshold": 5
    }
  ]
}
```

---

#### 3. Create Product
- **Endpoint**: `POST /shops/:shopId/products`
- **Auth**: Protected (`OWNER`, `ADMIN`, `SALES`)

**Request Body**:
```json
{
  "sku": "MILK-1L",
  "name": "Whole Milk 1L",
  "description": "Pasteurized fresh milk",
  "price": 90.00,
  "stockQuantity": 20,
  "unit": "pcs",
  "lowStockThreshold": 5
}
```

**Success Response (`201 Created`)**:
```json
{
  "success": true,
  "data": {
    "id": "a1b2c3d4-e5f6-7890-abcd-1234567890ab",
    "sku": "MILK-1L",
    "name": "Whole Milk 1L",
    "price": "90.00",
    "stockQuantity": 20
  }
}
```

---

### 🛒 POS Sale Flow Endpoints

#### 1. Create POS Sale
- **Endpoint**: `POST /shops/:shopId/sales`
- **Auth**: Protected (`OWNER`, `ADMIN`, `SALES`)
- **Description**: Atomically processes a sale transaction inside a database transaction. Verifies stock quantity, deducts sold stock, snapshots product unit price, applies shop tax rate, subtracts discount, and computes total amount. If `isCredit: true`, requires `customerId`, creates a `PENDING` `Debt` record, and updates `Customer.debtBalance`.

**Request Body**:
```json
{
  "customerId": "c1a12345-6789-4bcd-8ef0-123456789abc",
  "items": [
    { "productId": "a1b2c3d4-e5f6-7890-abcd-1234567890ab", "quantity": 2 }
  ],
  "discountAmount": 10.0,
  "paymentMethod": "CASH",
  "isCredit": false
}
```

**Success Response (`201 Created`)**:
```json
{
  "success": true,
  "data": {
    "id": "e2a12345-6789-4bcd-8ef0-123456789abc",
    "shopId": "648408bb-c857-43eb-92fe-018cb8a1eb47",
    "userId": "8cf48530-64b4-4b3d-b7ce-ebe54893bbdf",
    "customerId": "c1a12345-6789-4bcd-8ef0-123456789abc",
    "subtotal": "180.00",
    "taxAmount": "27.00",
    "discountAmount": "10.00",
    "totalAmount": "197.00",
    "paymentMethod": "CASH",
    "status": "COMPLETED",
    "createdAt": "2026-08-18T19:00:00.000Z",
    "items": [
      {
        "id": "f3a12345-6789-4bcd-8ef0-123456789abc",
        "productId": "a1b2c3d4-e5f6-7890-abcd-1234567890ab",
        "quantity": 2,
        "unitPrice": "90.00",
        "subtotal": "180.00",
        "product": { "id": "a1b2c3d4...", "name": "Whole Milk 1L", "sku": "MILK-1L" }
      }
    ]
  }
}
```

**Error Response (`409 Conflict`)**:
```json
{
  "success": false,
  "error": "Insufficient stock for product 'Whole Milk 1L' (SKU: MILK-1L). Available: 1, Requested: 2"
}
```

---

#### 2. List Sales
- **Endpoint**: `GET /shops/:shopId/sales`
- **Auth**: Protected (`OWNER`, `ADMIN`, `SALES`)
- **Query Parameters**: `startDate`, `endDate`, `customerId`, `paymentMethod`.
- **Role Visibility**: `OWNER` & `ADMIN` see all shop sales; `SALES` role only sees sales created by themselves.

**Success Response (`200 OK`)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "e2a12345-6789-4bcd-8ef0-123456789abc",
      "totalAmount": "197.00",
      "paymentMethod": "CASH",
      "status": "COMPLETED",
      "createdAt": "2026-08-18T19:00:00.000Z"
    }
  ]
}
```

---

#### 3. Get Sale Detail
- **Endpoint**: `GET /shops/:shopId/sales/:id`
- **Auth**: Protected (`OWNER`, `ADMIN`, `SALES` - `SALES` role can only view their own sales).

**Success Response (`200 OK`)**:
```json
{
  "success": true,
  "data": {
    "id": "e2a12345-6789-4bcd-8ef0-123456789abc",
    "totalAmount": "197.00",
    "items": [
      { "productId": "a1b2c3d4...", "quantity": 2, "unitPrice": "90.00", "subtotal": "180.00" }
    ]
  }
}
```

---

### 👤 Customer Endpoints

#### 1. List Customers
- **Endpoint**: `GET /shops/:shopId/customers`
- **Auth**: Protected (`OWNER`, `ADMIN`, `SALES`)
- **Query Parameters**: `search` / `name` / `phone` *(Optional)*.

**Success Response (`200 OK`)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "c1a12345-6789-4bcd-8ef0-123456789abc",
      "name": "John Doe",
      "phone": "+251911223344",
      "email": "john@example.com",
      "debtBalance": "0.00"
    }
  ]
}
```

---

#### 2. Create Customer
- **Endpoint**: `POST /shops/:shopId/customers`
- **Auth**: Protected (`OWNER`, `ADMIN`, `SALES`)

**Request Body**:
```json
{
  "name": "John Doe",
  "phone": "+251911223344",
  "email": "john@example.com",
  "address": "Bole, Addis Ababa"
}
```

**Success Response (`201 Created`)**:
```json
{
  "success": true,
  "data": {
    "id": "c1a12345-6789-4bcd-8ef0-123456789abc",
    "name": "John Doe",
    "debtBalance": "0.00"
  }
}
```

---

#### 3. Update Customer
- **Endpoint**: `PATCH /shops/:shopId/customers/:id`
- **Auth**: Protected (`OWNER`, `ADMIN`, `SALES`)

**Request Body**:
```json
{
  "phone": "+251922334455"
}
```

**Success Response (`200 OK`)**:
```json
{
  "success": true,
  "data": {
    "id": "c1a12345-6789-4bcd-8ef0-123456789abc",
    "name": "John Doe",
    "phone": "+251922334455"
  }
}
```

---

#### 4. Get Customer Detail
- **Endpoint**: `GET /shops/:shopId/customers/:id`
- **Auth**: Protected (`OWNER`, `ADMIN`, `SALES`)
- **Description**: Returns customer detail including sales history and open debts.

**Success Response (`200 OK`)**:
```json
{
  "success": true,
  "data": {
    "id": "c1a12345-6789-4bcd-8ef0-123456789abc",
    "name": "John Doe",
    "debtBalance": "300.00",
    "sales": [],
    "debts": []
  }
}
```

---

### 💳 Standalone Debt & Payment Endpoints

#### 1. List Debts
- **Endpoint**: `GET /shops/:shopId/debts`
- **Auth**: Protected (`OWNER`, `ADMIN`, `SALES`)
- **Query Parameters**: `status` (`PENDING`, `PARTIAL`, `PAID`), `customerId`.

**Success Response (`200 OK`)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "d1a12345-6789-4bcd-8ef0-123456789abc",
      "customerId": "c1a12345-6789-4bcd-8ef0-123456789abc",
      "amount": "500.00",
      "status": "PENDING",
      "payments": []
    }
  ]
}
```

---

#### 2. Create Standalone Debt
- **Endpoint**: `POST /shops/:shopId/debts`
- **Auth**: Protected (`OWNER`, `ADMIN`, `SALES`)
- **Description**: Manually records a standalone debt not tied to a sale inside a transaction and syncs `Customer.debtBalance`.

**Request Body**:
```json
{
  "customerId": "c1a12345-6789-4bcd-8ef0-123456789abc",
  "amount": 500.0,
  "dueDate": "2026-09-01T00:00:00.000Z",
  "notes": "Store credit advance"
}
```

**Success Response (`201 Created`)**:
```json
{
  "success": true,
  "data": {
    "id": "d1a12345-6789-4bcd-8ef0-123456789abc",
    "customerId": "c1a12345-6789-4bcd-8ef0-123456789abc",
    "amount": "500.00",
    "status": "PENDING"
  }
}
```

---

#### 3. Record Debt Payment
- **Endpoint**: `POST /shops/:shopId/debts/:id/payments`
- **Auth**: Protected (`OWNER`, `ADMIN`, `SALES`)
- **Description**: Records a `DebtPayment` inside a transaction. Updates `Debt.status` to `PARTIAL` or `PAID` and recomputes `Customer.debtBalance`. Rejects payment on already `PAID` debts with `400 Bad Request`.

**Request Body**:
```json
{
  "amount": 200.0
}
```

**Success Response (`200 OK`)**:
```json
{
  "success": true,
  "data": {
    "id": "d1a12345-6789-4bcd-8ef0-123456789abc",
    "status": "PARTIAL",
    "payments": [
      { "id": "p1a123...", "amount": "200.00", "paidAt": "2026-08-18T19:30:00.000Z" }
    ]
  }
}
```

---

### 📊 Dashboard Aggregate Endpoints

#### 1. Get Dashboard Metrics
- **Endpoint**: `GET /shops/:shopId/dashboard`
- **Auth**: Protected (`OWNER`, `ADMIN` only; `SALES` forbidden `403`)
- **Description**: Returns `todaysSales` (count & total amount created today), `lowStockCount` (count of products where `stockQuantity <= lowStockThreshold`), and `outstandingDebts` (count & total remaining unpaid amount for `PENDING` and `PARTIAL` debts).

**Success Response (`200 OK`)**:
```json
{
  "success": true,
  "data": {
    "todaysSales": {
      "count": 12,
      "totalAmount": 4500.5
    },
    "lowStockCount": 3,
    "outstandingDebts": {
      "count": 4,
      "totalAmount": 1200.0
    }
  }
}
```

**Error Response (`403 Forbidden`)**:
```json
{
  "success": false,
  "error": "Access denied. Role 'SALES' is not authorized."
}
```
