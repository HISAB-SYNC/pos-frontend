# POS Backend API Developer Guide (Frontend & Mobile)

Welcome! This guide provides full technical documentation for integrating Web and Mobile applications with the Point of Sale (POS) backend API.

---

## 1. General Architecture & Conventions

### Base URL
- **Local Development**: `http://localhost:3000`
- **Versioned API Prefix**: `http://localhost:3000/api/v1` (Both `/` and `/api/v1` prefixes are supported)

### Standard Headers
- `Content-Type: application/json`
- `Authorization: Bearer <JWT_TOKEN>` *(Required for all protected endpoints)*

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
| `200 OK` | Request succeeded | Successful GET, PATCH, DELETE, Login |
| `201 Created` | Resource created | Successful POST creation |
| `400 Bad Request` | Invalid input data | Missing required fields, invalid format |
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
| **`OWNER`** | `null` | Multi-shop owner | - Register via `POST /auth/register/owner`<br>- Create shops (`POST /shops`) & update settings<br>- Register `ADMIN` and `SALES` staff for owned shops<br>- Manage all categories, suppliers, and products |
| **`ADMIN`** | Required (`UUID`) | Single shop | - Register `SALES` staff for assigned shop only<br>- Manage categories, suppliers, and products<br>- View low-stock inventory<br>- *Cannot register ADMIN/OWNER users or access other shops* |
| **`SALES`** | Required (`UUID`) | Single shop | - Read categories & products<br>- Create/Update products & view low-stock items<br>- *Cannot manage staff, categories, suppliers, or delete products (`403 Forbidden`)* |

---

## 3. Endpoints Documentation

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

**Error Response (`403 Forbidden`)**:
```json
{
  "success": false,
  "error": "Admins can only create SALES staff members"
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

#### 4. Request Password Reset
- **Endpoint**: `POST /auth/request-reset-password`
- **Auth**: Public
- **Description**: Generates password reset token and logs it to server console (MVP).

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
    "message": "If that email exists, a password reset token has been generated."
  }
}
```

---

#### 5. Reset Password
- **Endpoint**: `POST /auth/reset-password`
- **Auth**: Public
- **Description**: Resets password using valid token.

**Request Body**:
```json
{
  "email": "owner@example.com",
  "token": "K6H6XZX3",
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
- **Auth**: Protected (`OWNER` only, must own shop)

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
    "shopId": "648408bb-c857-43eb-92fe-018cb8a1eb47",
    "name": "Beverages"
  }
}
```

**Error Response (`409 Conflict`)**:
```json
{
  "success": false,
  "error": "A category named 'Beverages' already exists in this shop"
}
```

---

### 🚚 Supplier Endpoints

#### 1. Get Suppliers
- **Endpoint**: `GET /shops/:shopId/suppliers`
- **Auth**: Protected (`OWNER`, `ADMIN` only; `SALES` forbidden `403`)

**Success Response (`200 OK`)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "f891a2bc-3d4e-567f-8901-abcdef234567",
      "shopId": "648408bb-c857-43eb-92fe-018cb8a1eb47",
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
    "shopId": "648408bb-c857-43eb-92fe-018cb8a1eb47",
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
- **Query Parameters**:
  - `search` / `name` / `sku` *(Optional)*: Search string for SKU or product name.
  - `categoryId` *(Optional)*: Filter by Category UUID.

**Example Request**: `GET /shops/648408bb.../products?search=Milk&categoryId=cddbee02...`

**Success Response (`200 OK`)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-1234567890ab",
      "shopId": "648408bb-c857-43eb-92fe-018cb8a1eb47",
      "sku": "MILK-1L",
      "name": "Whole Milk 1L",
      "description": "Pasteurized whole milk",
      "price": "90.00",
      "stockQuantity": 2,
      "unit": "pcs",
      "lowStockThreshold": 5,
      "categoryId": "cddbee02-a5bb-421a-9137-6386671add10",
      "supplierId": "f891a2bc-3d4e-567f-8901-abcdef234567",
      "attributes": null,
      "category": { "id": "cddbee02...", "name": "Beverages" },
      "supplier": { "id": "f891a2bc...", "name": "Fresh Farms Distributors" }
    }
  ]
}
```

---

#### 2. Get Low Stock Products
- **Endpoint**: `GET /shops/:shopId/products/low-stock`
- **Auth**: Protected (`OWNER`, `ADMIN`, `SALES`)
- **Description**: Returns products where `stockQuantity <= lowStockThreshold`.

**Success Response (`200 OK`)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-1234567890ab",
      "sku": "MILK-1L",
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
  "lowStockThreshold": 5,
  "categoryId": "cddbee02-a5bb-421a-9137-6386671add10",
  "supplierId": "f891a2bc-3d4e-567f-8901-abcdef234567",
  "attributes": {
    "volume": "1L",
    "expireDays": 14
  }
}
```

**Success Response (`201 Created`)**:
```json
{
  "success": true,
  "data": {
    "id": "a1b2c3d4-e5f6-7890-abcd-1234567890ab",
    "shopId": "648408bb-c857-43eb-92fe-018cb8a1eb47",
    "sku": "MILK-1L",
    "name": "Whole Milk 1L",
    "price": "90.00",
    "stockQuantity": 20,
    "unit": "pcs",
    "lowStockThreshold": 5
  }
}
```

**Error Response (`409 Conflict`)**:
```json
{
  "success": false,
  "error": "A product with SKU 'MILK-1L' already exists in this shop"
}
```

---

#### 4. Update Product
- **Endpoint**: `PATCH /shops/:shopId/products/:id`
- **Auth**: Protected (`OWNER`, `ADMIN`, `SALES`)

**Request Body**:
```json
{
  "price": 95.00,
  "stockQuantity": 15
}
```

**Success Response (`200 OK`)**:
```json
{
  "success": true,
  "data": {
    "id": "a1b2c3d4-e5f6-7890-abcd-1234567890ab",
    "price": "95.00",
    "stockQuantity": 15
  }
}
```

---

#### 5. Delete Product
- **Endpoint**: `DELETE /shops/:shopId/products/:id`
- **Auth**: Protected (`OWNER`, `ADMIN` only; `SALES` forbidden `403`)

**Success Response (`200 OK`)**:
```json
{
  "success": true,
  "data": {
    "message": "Product deleted successfully"
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
