# 🛒 Sales Role - Frontend Overview & API Reference

This document provides a concise, high-level recommendation of the screens, features, and API endpoints available for the **`SALES`** role in the POS System. Frontend teams (Web & Mobile) can use this as a quick reference for mapping backend capabilities to existing UI screens.

---

## 📌 Sales Role Capabilities Summary

Users with the **`SALES`** role are front-line cashiers and sales operators.

| Feature / UI Area | Sales Role Capabilities |
| :--- | :--- |
| **⚡ POS Checkout** | Create sales, select items, apply discounts, choose payment method (`CASH`, `CARD`, `MOBILE`) |
| **📦 Product Catalog** | Read-only search & stock level lookups (cannot create, edit, or delete products) |
| **👥 Customer Directory** | Search existing customers and register new customers |
| **💳 Debt Management** | View customer debt balances and record debt payments |
| **📜 Transaction History** | View shop sales history and receipt details |

> 🔒 **Role Restriction**: `SALES` users cannot create/edit/delete products, modify shop settings, or manage staff. Attempting these actions returns `403 Forbidden`.

---

## 🎨 Sales Workspace UI Layout Concept

When a `SALES` user logs into the app, they land on their primary **Sales Workspace Dashboard**. The UI typically features a persistent **Navigation Sidebar (or Bottom Tab Bar on mobile)** with direct links to: **⚡ POS Checkout** *(default landing view)*, **📦 Product Catalog**, **👥 Customer Directory**, **💳 Debt Management**, and **📜 Transaction History**. Selecting any sidebar item switches the main content view to display that specific feature set while maintaining fast access to checkout.

---

## 🗺️ Recommended UI Modules & API Endpoints

### 1. ⚡ POS Checkout & Sales
* **Endpoints**:
  * `GET /shops/:shopId/products` — Load product catalog & stock
  * `POST /shops/:shopId/sales` — Complete sale transaction
* **Payload Example (`POST /shops/:shopId/sales`)**:
  ```json
  {
    "customerId": "uuid-optional",
    "paymentMethod": "CASH",
    "discountAmount": 5.00,
    "items": [{ "productId": "product-uuid", "quantity": 2, "unitPrice": 18.99 }]
  }
  ```

---

### 2. 📦 Product Catalog (Read-Only)
* **Endpoints**:
  * `GET /shops/:shopId/products?search=item` — Search catalog by name or SKU
  * `GET /shops/:shopId/categories` — Category filter list
* **Notes**: Product creation (`POST`), updates (`PATCH`), and deletion (`DELETE`) are restricted to `OWNER` / `ADMIN` roles.

---

### 3. 👥 Customer Directory
* **Endpoints**:
  * `GET /shops/:shopId/customers?search=name` — Search customer records
  * `POST /shops/:shopId/customers` — Add a new customer
* **Payload Example (`POST /shops/:shopId/customers`)**:
  ```json
  {
    "name": "Jane Smith",
    "phone": "+15550199",
    "email": "jane@example.com"
  }
  ```

---

### 4. 💳 Customer Debt Management
* **Endpoints**:
  * `GET /shops/:shopId/debts` — View outstanding customer debts
  * `POST /shops/:shopId/debts/:debtId/payments` — Record debt payment
* **Payload Example (`POST /shops/:shopId/debts/:debtId/payments`)**:
  ```json
  {
    "amount": 25.00
  }
  ```

---

### 5. 📜 Sales & Transaction History
* **Endpoints**:
  * `GET /shops/:shopId/sales` — View past shop transactions
  * `GET /shops/:shopId/sales/:saleId` — View detailed sale receipt

---

## ⚡ API Quick Reference Table

All requests require the header: `Authorization: Bearer <JWT_TOKEN>`

| Feature | Method | Endpoint Path | Sales Access | Notes |
| :--- | :--- | :--- | :---: | :--- |
| **Auth** | `POST` | `/auth/login` | ✅ | Cashier login |
| **Dashboard** | `GET` | `/shops/:shopId/dashboard` | ✅ | Overview stats & stock alerts |
| **Products** | `GET` | `/shops/:shopId/products` | ✅ | Catalog search |
| **Products** | `POST` / `PATCH` / `DELETE` | `/shops/:shopId/products/*` | 🚫 | *(403 Forbidden for Sales)* |
| **Sales** | `POST` | `/shops/:shopId/sales` | ✅ | Complete sale transaction |
| **Sales** | `GET` | `/shops/:shopId/sales` | ✅ | View transaction history |
| **Customers** | `GET` / `POST` | `/shops/:shopId/customers` | ✅ | Search / add customers |
| **Debts** | `GET` / `POST` | `/shops/:shopId/debts/*` | ✅ | View debts & record payments |
