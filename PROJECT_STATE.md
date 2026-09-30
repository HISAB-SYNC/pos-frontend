# Project state

## Current status
Completed Multi-Debt Selection and "Pay All at Once" settlement across both backend (`pos-backend`) and frontend (`pos-frontend`). Merchants can settle all open debt vouchers in one click or select specific vouchers via checkboxes across Customer Ledger modals, Customer History drawers, and the All Debts table with atomic batch backend synchronization.

## Decisions made
- **Backend Batch Payment Endpoint (`pos-backend`)**:
  - In [src/routes/debtRoutes.js](file:///home/muhammed/Projects/pos-backend/src/routes/debtRoutes.js), mounted `POST /shops/:shopId/debts/batch-payments` authorized for `OWNER`, `ADMIN`, and `SALES` (placed before `/:id/payments` parameter route).
  - In [src/controllers/debtController.js](file:///home/muhammed/Projects/pos-backend/src/controllers/debtController.js), implemented `handleBatchPayment`.
  - In [src/services/debtService.js](file:///home/muhammed/Projects/pos-backend/src/services/debtService.js), implemented `recordBatchDebtPayments(shopId, data)` in an atomic `prisma.$transaction`. Settles open vouchers via FIFO or targeted `debtIds`, creates `DebtPayment` records, updates voucher status (`PAID`/`PARTIAL`), and invokes `recomputeCustomerDebtBalance(tx, customerId)`.
  - In [tests/customers_debts_dashboard.test.js](file:///home/muhammed/Projects/pos-backend/tests/customers_debts_dashboard.test.js), verified with automated tests; all suites in backend passed 100% cleanly.
- **Frontend Batch Debt Settlement & Selection UI (`pos-frontend`)**:
  - In [endpoints.ts](file:///home/muhammed/Projects/pos-frontend/src/lib/api/endpoints.ts), registered `API_ENDPOINTS.shops.debtBatchPayments`.
  - In [app-data.ts](file:///home/muhammed/Projects/pos-frontend/src/lib/api/app-data.ts):
    - Exported top-level `normalizeDebt` and ensured `getDebts` keeps `store.debts` synchronized with live data.
    - Updated `recordDebtPayment` to accept candidate debts and calculate exact per-voucher FIFO payment allocations across all targeted vouchers, preventing single-voucher payment monopolization.
    - Added resilient individual endpoint settlement fallback when connecting to Render instances without the batch endpoint, updating every settled voucher to `PAID` or `PARTIAL` with payment installments.
  - In [debts/page.tsx](file:///home/muhammed/Projects/pos-frontend/src/app/(dashboard)/debts/page.tsx):
    - In `ReceivePaymentModal` and `BatchSettleModal`, pass the exact selected voucher records into `recordDebtPayment`.
    - Implemented optimistic UI updates in `onSuccess` so all selected vouchers immediately switch status to `PAID` and customer balances update instantly before `loadData()` re-syncs.
- **Landing Page Swiss Minimalist Redesign & Hero Polish**:
  - In [landing-page/page.tsx](file:///home/muhammed/Projects/pos-frontend/src/app/landing-page/page.tsx), overhauled layout adhering strictly to `/ui-style` and `/anti-ai-look`: replaced centered AI-cliché hero and radial glowing color blobs with an asymmetric 12-column Swiss grid, calibrated architectural dot-matrix coordinate canvas, removed overlapping floating badges, focused `#5B4FE9` indigo terminal backlight pedestal, smooth entrance and hover micro-animations, flat hairline dividers, and structured 4-column operational ledgers.
  - In [dashboard-preview.tsx](file:///home/muhammed/Projects/pos-frontend/src/components/landing/dashboard-preview.tsx), aligned terminal simulation with deep neutrals, `#5B4FE9` highlights, tactile click micro-feedback, item-add count animations, and clean typography.
- **Settings & Profile Rework**:
  - In [settings/page.tsx](file:///home/muhammed/Projects/pos-frontend/src/app/(dashboard)/settings/page.tsx), connected personal information updates (`name`, `email`) and password changes (`currentPassword`, `newPassword`) to `PATCH /auth/profile`.
  - Added multi-shop selector and configuration editor for shop owners calling `PATCH /shops/:id`.
- **Credit Sales Itemization**:
  - In [pos/page.tsx](file:///home/muhammed/Projects/pos-frontend/src/app/(dashboard)/pos/page.tsx), `executeSale()` persists purchased credit goods into `pos_credit_debt_items`.
  - In [debts/page.tsx](file:///home/muhammed/Projects/pos-frontend/src/app/(dashboard)/debts/page.tsx), rendered itemized goods cards with item name, quantity badge (`2x`), unit price, and line total.

- **Debt Page UX/UI Redesign & Swiss Minimalist Polish (`debts/page.tsx`)**:
  - Overhauled `ReceivePaymentModal` into a compact 2-column responsive layout with real-time FIFO allocation preview (`[Fully Paid ✓]`, `[Partial]`, `[Unchanged]`), quick tender chips (`Cash`, `Telebirr`, `CBE Bank`, `Card`), and credit utilization indicator.
  - Implemented Customer Debt Ledger (Tab 1) inline expandable voucher peek with credit health bar, overdue age calculations (`Xd OVERDUE`), oldest due date indicators, and prominent "Pay All" primary actions.
  - Added interactive column sorting and actionable aging filters (`All Debts`, `Overdue`, `Due This Week`, `Pending`, `Partial`, `Settled`) to Tab 2.
  - Enhanced `CustomerDebtHistoryModal` with an "Unpaid Only" toggle and formatted SMS/WhatsApp statement export to clipboard.
  - Fully retired legacy neon lime `#c0e763` across the board, replacing with deep zinc-950, emerald status indicators, and indigo `#5B4FE9` accents.

- **Global Design System Migration to Electric Indigo (`#5B4FE9`)**:
  - Fully updated `.agents/skills/ui-style/SKILL.md` and `src/styles/globals.css` with Electric Indigo tokens (`#5B4FE9`, HSL `245 78% 61%`, hover `#4D40D9`, white text).
  - Cleaned all legacy neon lime (`#c0e763`, `#b0d952`, `#f3fad9`, `#5c7f12`) across every file in `src/`:
    - Layout components: `dashboard-sidebar.tsx`, `dashboard-header.tsx`, `notifications-panel.tsx`, `shop-switcher.tsx`, `andalus-mark.tsx`, `dashboard-widgets.tsx`, `auth-shell.tsx`.
    - Dashboard pages: `debts`, `orders`, `products`, `customers`, `inventory`, `reports` (including SVG chart stops), `expenses`, `notifications`, `dashboard`, `pos`, `users`.
    - SuperAdmin pages: `admin/dashboard`, `admin/shops`, `admin/users`.
    - Auth & Utilities: `login`, `not-found.tsx`.
  - Enforced Swiss Minimalist principles: deep `zinc-950` primary actions, `#5B4FE9` accent rings and chips, emerald reserved strictly for operational success (e.g. Paid, In-Stock, Settled).
  - Verified 0 remaining lime occurrences across `src/` and verified with `npm run typecheck` (0 errors).

- **Dark Fill Token Migration (`zinc-950` → `slate-900`)**:
  - Replaced all filled dark backgrounds (buttons, icon badges, active tabs, floating bars) from `zinc-950`/`zinc-900` to `slate-900`/`slate-800` (`#0F172A`) globally across all TSX files.
  - Rationale: `slate-900` has subtle blue-gray undertones that harmonize with Electric Indigo (`#5B4FE9`); pure `zinc-950` created a harsh neutral clash against the purple-blue hue.
  - Text colors (`text-zinc-950`), light borders, and surface backgrounds remain zinc (correct for white-surface contexts).
  - Verified 0 remaining `bg-zinc-950` / `bg-zinc-900` fill occurrences and `npm run typecheck` passed with 0 errors.

## In progress
- Frontend design language fully migrated. Palette: `#5B4FE9` (Electric Indigo) + `#0F172A` (Slate-900 fills) + zinc text/surfaces + semantic status tokens.

## Next step
- End-to-end user visual review on dev server (http://localhost:3000).
- Stage and commit changes when user requests.

## Known issues
- Cloud Render backend is running older build without `PUT /shops/:shopId/staff/:id` and without `sale.items` in `getShopDebts` until committed and deployed to the remote repo.


