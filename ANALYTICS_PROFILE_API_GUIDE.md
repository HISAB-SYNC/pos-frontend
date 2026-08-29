# POS Backend User Profile & Shop Analytics API Guide

Welcome! This guide provides dedicated, in-depth documentation for the **User Profile Management** and **Shop Analytics & Reporting** endpoints in the Point of Sale (POS) backend platform. 

It covers profile management (fetching profile details, updating personal information, and changing passwords) as well as comprehensive shop performance reports (daily, weekly, monthly, and custom date range metrics for sales, products, and customers).

---

## 1. Executive Summary & Architecture

### Module Overview
1. **User Profile System**: Allows any authenticated user (`OWNER`, `ADMIN`, or `SALES`) to inspect their account details, view assigned or owned shop details, update their display name and email address, and change their account password.
2. **Shop Reporting & Analytics System**: Provides `OWNER` and `ADMIN` roles with aggregated sales metrics, revenue breakdowns, payment method distribution, sales trends, top-performing product leaderboards, customer acquisition statistics, and outstanding debt summaries over customizable report timeframes (`daily`, `weekly`, `monthly`, or `custom`).

### Base URLs & OpenAPI Documentation
- **Production Base URL**: `https://pos-backend-0fzk.onrender.com`
- **Versioned API Base URL**: `https://pos-backend-0fzk.onrender.com/api/v1`
- **Local Development URL**: `http://localhost:3000` or `http://localhost:3000/api/v1`
- **Interactive Swagger UI**: [https://pos-backend-0fzk.onrender.com/api-docs](https://pos-backend-0fzk.onrender.com/api-docs) (or `/docs`)
- **Raw OpenAPI 3.0 JSON Spec**: [https://pos-backend-0fzk.onrender.com/api-docs/json](https://pos-backend-0fzk.onrender.com/api-docs/json)

### Standard Headers
All requests to protected endpoints require standard HTTP headers:
```http
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

---

## 2. Security Boundaries & Access Control Matrix

### Permissions & Scoping Rules

#### Profile Endpoints (`/auth/profile`)
- **Accessibility**: Available to **all authenticated users** (`OWNER`, `ADMIN`, `SALES`).
- **Data Scoping**: Returns user details along with `ownedShops` (if the user's role is `OWNER`) or `shop` (if the user's role is `ADMIN` or `SALES`).
- **Password Security**: Password hashes and reset tokens are strictly stripped from responses. Updating passwords requires validating `currentPassword`.

#### Shop Analytics Endpoints (`/shops/:shopId/analytics`)
- **Role Restriction**: Restricted to **`OWNER`** and **`ADMIN`** roles.
- **`SALES` Role Prohibition**: Cashiers/Sales personnel attempting to fetch shop analytics are rejected with `403 Forbidden`:
  ```json
  {
    "success": false,
    "error": "Access denied. Role 'SALES' is not authorized."
  }
  ```
- **`SUPER_ADMIN` Role Prohibition**: SuperAdmins cannot directly query operational shop routes and are rejected by `resolveShopAccess` with `403 Forbidden`.
- **Shop Scoping**:
  - `OWNER`: Must own the target shop (`shop.ownerId === req.user.id`).
  - `ADMIN`: Must be assigned to the target shop (`req.user.shopId === targetShopId`).

### Role Permission Matrix

| Endpoint / Action | `OWNER` | `ADMIN` | `SALES` | `SUPER_ADMIN` |
| :--- | :---: | :---: | :---: | :---: |
| **Get Own Profile (`GET /auth/profile`)** | ✅ | ✅ | ✅ | ✅ |
| **Update Own Profile (`PATCH /auth/profile`)** | ✅ | ✅ | ✅ | ✅ |
| **View Shop Analytics (`GET /shops/:shopId/analytics`)** | ✅ (Owned shop) | ✅ (Assigned shop) | ❌ (`403`) | ❌ (`403`) |

---

## 3. User Profile API Reference

The Profile endpoints reside under the authentication module (`/auth/profile` or `/api/v1/auth/profile`).

---

### 1. Get Current User Profile
Retrieves the profile details of the currently authenticated user, including user metadata and associated shop information.

- **HTTP Method**: `GET`
- **Endpoint**: `/api/v1/auth/profile` (or `/auth/profile`)
- **Auth Required**: `Bearer <JWT_TOKEN>`

**cURL Example**:
```bash
curl -X GET https://pos-backend-0fzk.onrender.com/api/v1/auth/profile \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

**Success Response (`200 OK`) — Owner Role Example**:
```json
{
  "success": true,
  "data": {
    "id": "8cf48530-64b4-4b3d-b7ce-ebe54893bbdf",
    "email": "owner@example.com",
    "name": "Alex Owner",
    "role": "OWNER",
    "shopId": null,
    "isActive": true,
    "createdAt": "2026-08-12T08:50:41.994Z",
    "updatedAt": "2026-08-24T23:30:00.000Z",
    "ownedShops": [
      {
        "id": "648408bb-c857-43eb-92fe-018cb8a1eb47",
        "name": "SuperMart Boutique",
        "businessType": "boutique",
        "currency": "ETB",
        "taxRate": "15.00",
        "isActive": true
      }
    ],
    "shop": null
  }
}
```

**Success Response (`200 OK`) — Staff Role (Admin/Sales) Example**:
```json
{
  "success": true,
  "data": {
    "id": "e2a12345-6789-4bcd-8ef0-123456789abc",
    "email": "sales@example.com",
    "name": "Sam Sales",
    "role": "SALES",
    "shopId": "648408bb-c857-43eb-92fe-018cb8a1eb47",
    "isActive": true,
    "createdAt": "2026-08-15T10:20:00.000Z",
    "updatedAt": "2026-08-20T11:00:00.000Z",
    "ownedShops": [],
    "shop": {
      "id": "648408bb-c857-43eb-92fe-018cb8a1eb47",
      "name": "SuperMart Boutique",
      "businessType": "boutique",
      "currency": "ETB",
      "isActive": true
    }
  }
}
```

---

### 2. Update Current User Profile
Updates user profile fields (`name`, `email`, or changes account password).

- **HTTP Method**: `PATCH`
- **Endpoint**: `/api/v1/auth/profile` (or `/auth/profile`)
- **Auth Required**: `Bearer <JWT_TOKEN>`

#### Request Parameters & Rules:
| Field | Type | Required | Rules & Validation |
| :--- | :--- | :--- | :--- |
| `name` | String | Optional | Must be a non-empty string. Trimmed automatically. |
| `email` | String | Optional | Must be a valid email format. Checked for uniqueness across all platform users. |
| `currentPassword` | String | Optional | Required if `newPassword` is supplied. Verified against existing password hash. |
| `newPassword` | String | Optional | Required if `currentPassword` is supplied. Minimum 6 characters recommended. |

> ⚠️ **Important Password Rule**: Changing your password requires passing **both** `currentPassword` and `newPassword`. Providing only one returns `400 Bad Request`.

#### Request Payload Examples:

**Example A: Updating Name & Email**:
```json
{
  "name": "Alex Owner Updated",
  "email": "alex.new@example.com"
}
```

**Example B: Changing Password**:
```json
{
  "currentPassword": "OldPassword123!",
  "newPassword": "NewSecurePassword456!"
}
```

**cURL Example**:
```bash
curl -X PATCH https://pos-backend-0fzk.onrender.com/api/v1/auth/profile \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alex Owner Updated"
  }'
```

**Success Response (`200 OK`)**:
```json
{
  "success": true,
  "data": {
    "id": "8cf48530-64b4-4b3d-b7ce-ebe54893bbdf",
    "email": "alex.new@example.com",
    "name": "Alex Owner Updated",
    "role": "OWNER",
    "shopId": null,
    "isActive": true,
    "updatedAt": "2026-08-25T00:00:00.000Z"
  }
}
```

#### Common Error Responses:

- **Email Collision (`400 Bad Request`)**:
  ```json
  {
    "success": false,
    "error": "A user with this email already exists"
  }
  ```
- **Incorrect Current Password (`400 Bad Request`)**:
  ```json
  {
    "success": false,
    "error": "Invalid current password"
  }
  ```
- **Missing Required Password Field (`400 Bad Request`)**:
  ```json
  {
    "success": false,
    "error": "Both currentPassword and newPassword are required to change password"
  }
  ```

---

## 4. Shop Analytics & Reports API Reference

The Shop Analytics endpoint resides under the shop resource scope (`/shops/:shopId/analytics` or `/api/v1/shops/:shopId/analytics`).

---

### Get Shop Analytics Reports
Calculates and returns multi-dimensional performance metrics for a shop, covering sales revenue, product performance, and customer debt metrics across configurable report periods.

- **HTTP Method**: `GET`
- **Endpoint**: `/api/v1/shops/:shopId/analytics` (or `/shops/:shopId/analytics`)
- **Auth Required**: `Bearer <JWT_TOKEN>` (`OWNER` or `ADMIN` only)

#### Query Parameters:

| Parameter | Type | Default | Description | Options / Format |
| :--- | :--- | :--- | :--- | :--- |
| `period` | String | `daily` | Predefined report time period. | `daily`, `weekly`, `monthly`, `custom` |
| `startDate` | String | Optional | Start date for custom range (or overriding period start). | `YYYY-MM-DD` or ISO string |
| `endDate` | String | Optional | End date for custom range (or overriding period end). | `YYYY-MM-DD` or ISO string |

#### Timeframe Calculation Rules:
- **`daily`** (Default): Begins at `00:00:00.000` today and ends at `23:59:59.999` today.
- **`weekly`**: Covers the past 7 days up to the end of today.
- **`monthly`**: Covers the past 30 days up to the end of today.
- **`custom`**: Uses explicitly provided `startDate` (`00:00:00.000`) and `endDate` (`23:59:59.999`).

---

#### Comprehensive Response Structure & Field Descriptions

The response payload is divided into four main sections:

1. **`dateRange`**: The calculated start and end timestamp ISO strings for the requested period.
2. **`salesAnalytics`**:
   - `totalSalesCount`: Total completed sales count in period.
   - `totalRevenue`: Gross total amount (`ETB` / currency) from completed sales.
   - `totalTaxCollected`: Sum of all tax amounts collected.
   - `totalDiscountsGiven`: Total value of discounts granted.
   - `averageOrderValue`: `totalRevenue / totalSalesCount` (rounded to 2 decimals).
   - `paymentMethodBreakdown`: Aggregated count & revenue per payment method (`CASH`, `CARD`, `MOBILE`).
   - `salesTrend`: Daily chronological summary array (`date`, `salesCount`, `totalRevenue`).
3. **`productAnalytics`**:
   - `topSellingProducts`: Top 5 products by quantity sold in period (`productId`, `name`, `sku`, `totalQuantitySold`, `totalRevenue`).
   - `lowStockCount`: Total count of products currently at or below their low-stock threshold.
   - `totalProductsCount`: Total number of active products in shop catalog.
4. **`customerAnalytics`**:
   - `totalCustomers`: Total customer directory count.
   - `newCustomersInPeriod`: Count of customers registered during this period.
   - `topCustomers`: Top 5 customer spenders in period (`customerId`, `name`, `email`, `phone`, `salesCount`, `totalSpent`).
   - `outstandingDebt`: Count and total remaining balance of unpaid/partial debts for the shop.

---

**cURL Examples**:

- **Default Daily Analytics**:
  ```bash
  curl -X GET https://pos-backend-0fzk.onrender.com/api/v1/shops/648408bb-c857-43eb-92fe-018cb8a1eb47/analytics \
    -H "Authorization: Bearer <JWT_TOKEN>"
  ```

- **Weekly Report**:
  ```bash
  curl -X GET "https://pos-backend-0fzk.onrender.com/api/v1/shops/648408bb-c857-43eb-92fe-018cb8a1eb47/analytics?period=weekly" \
    -H "Authorization: Bearer <JWT_TOKEN>"
  ```

- **Custom Date Range (e.g. August 2026 Monthly Report)**:
  ```bash
  curl -X GET "https://pos-backend-0fzk.onrender.com/api/v1/shops/648408bb-c857-43eb-92fe-018cb8a1eb47/analytics?period=custom&startDate=2026-08-01&endDate=2026-08-31" \
    -H "Authorization: Bearer <JWT_TOKEN>"
  ```

---

**Complete Success Response Example (`200 OK`)**:

```json
{
  "success": true,
  "data": {
    "period": "weekly",
    "dateRange": {
      "startDate": "2026-08-18T00:00:00.000Z",
      "endDate": "2026-08-25T23:59:59.999Z"
    },
    "salesAnalytics": {
      "totalSalesCount": 18,
      "totalRevenue": 4850.00,
      "totalTaxCollected": 727.50,
      "totalDiscountsGiven": 150.00,
      "averageOrderValue": 269.44,
      "paymentMethodBreakdown": {
        "CASH": {
          "count": 10,
          "totalAmount": 2500.00
        },
        "CARD": {
          "count": 5,
          "totalAmount": 1600.00
        },
        "MOBILE": {
          "count": 3,
          "totalAmount": 750.00
        }
      },
      "salesTrend": [
        {
          "date": "2026-08-20",
          "salesCount": 4,
          "totalRevenue": 1100.00
        },
        {
          "date": "2026-08-22",
          "salesCount": 6,
          "totalRevenue": 1750.00
        },
        {
          "date": "2026-08-24",
          "salesCount": 8,
          "totalRevenue": 2000.00
        }
      ]
    },
    "productAnalytics": {
      "topSellingProducts": [
        {
          "productId": "a1b2c3d4-e5f6-7890-abcd-1234567890ab",
          "name": "Whole Milk 1L",
          "sku": "MILK-1L",
          "totalQuantitySold": 45,
          "totalRevenue": 4050.00
        },
        {
          "productId": "f9876543-210a-4bcd-89ef-0123456789ab",
          "name": "Fresh White Bread",
          "sku": "BREAD-WHITE",
          "totalQuantitySold": 30,
          "totalRevenue": 800.00
        }
      ],
      "lowStockCount": 2,
      "totalProductsCount": 48
    },
    "customerAnalytics": {
      "totalCustomers": 35,
      "newCustomersInPeriod": 6,
      "topCustomers": [
        {
          "customerId": "c1a12345-6789-4bcd-8ef0-123456789abc",
          "name": "John Doe",
          "email": "john@example.com",
          "phone": "+251911223344",
          "salesCount": 5,
          "totalSpent": 1850.00
        },
        {
          "customerId": "d2b23456-7890-5cde-9fa1-234567890bcd",
          "name": "Sara Kebede",
          "email": "sara@example.com",
          "phone": "+251922334455",
          "salesCount": 3,
          "totalSpent": 1200.00
        }
      ],
      "outstandingDebt": {
        "count": 3,
        "totalAmount": 950.00
      }
    }
  }
}
```

---

## 5. Frontend Integration Blueprints & Chart Mapping Guide

Frontend developers building Web or Mobile UIs can seamlessly map the analytics response to dashboard widgets and charts:

### 1. KPI Counter Cards (Top Row Summary)
- **Total Revenue**: Bind to `salesAnalytics.totalRevenue` (Display formatted as `ETB 4,850.00`).
- **Total Sales Count**: Bind to `salesAnalytics.totalSalesCount` (e.g. `18 Orders`).
- **Average Order Value**: Bind to `salesAnalytics.averageOrderValue` (e.g. `ETB 269.44 / order`).
- **Outstanding Debts**: Bind to `customerAnalytics.outstandingDebt.totalAmount` (with warning color if > 0).

### 2. Sales Revenue Trend Chart (Area / Line Chart)
- **X-Axis**: `salesAnalytics.salesTrend[i].date` (e.g., `"2026-08-24"`).
- **Y-Axis**: `salesAnalytics.salesTrend[i].totalRevenue`.
- **Tooltip**: Show `salesCount` and `totalRevenue`.

### 3. Payment Method Distribution (Donut / Pie Chart)
- **Slices**:
  - `CASH`: `paymentMethodBreakdown.CASH.totalAmount`
  - `CARD`: `paymentMethodBreakdown.CARD.totalAmount`
  - `MOBILE`: `paymentMethodBreakdown.MOBILE.totalAmount`

### 4. Top Selling Products Leaderboard (Table / Bar Chart)
- Display `productAnalytics.topSellingProducts` array.
- Show columns: **Rank**, **Product Name**, **SKU**, **Qty Sold**, and **Revenue Generated**.

### 5. Period Toggle Selector (UI Component)
- Implement a Segmented Control / Tab Bar with options: `Today (Daily)`, `Past 7 Days (Weekly)`, `Past 30 Days (Monthly)`, and `Custom Range`.
- On change, fire `GET /shops/:shopId/analytics?period=<selected_period>`.
