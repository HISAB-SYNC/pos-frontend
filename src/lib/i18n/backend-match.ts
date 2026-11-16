import type { MessageKey } from "./messages/index.ts";

/**
 * The backend sends errors and notifications in English. This maps the known
 * ones to message keys (see messages/errors.ts) so they appear in the chosen
 * language; anything unknown is shown exactly as received.
 */
type Vars = Record<string, string>;
type Match = { key: MessageKey; vars: Vars };

const EXACT: Record<string, MessageKey> = {
  // Access and sign-in
  "Authentication token missing or malformed": "backend.signInAgain",
  "Invalid or expired authentication token": "backend.signInAgain",
  "User not authenticated": "backend.signInAgain",
  "Access denied. SuperAdmin authorization required.": "backend.noPermission",
  "SuperAdmin cannot access shop operational routes directly.": "backend.noPermission",
  "Access denied. You are not authorized for this shop.": "backend.noShopAccess",
  "Access denied. You do not own or have access to this shop.": "backend.noShopAccess",
  "Access denied. You can only view your own sales.": "backend.ownSalesOnly",
  "Invalid email or password": "backend.badCredentials",
  "Invalid current password": "backend.badCurrentPassword",
  "This account has been suspended.": "backend.accountSuspended",
  "This shop has been suspended.": "backend.shopSuspended",
  "Your account is pending SuperAdmin approval.": "backend.pendingApproval",
  "A user with this email already exists": "backend.emailExists",
  "Invalid or expired OTP": "backend.invalidOtp",
  "Maximum OTP verification attempts exceeded. Please request a new OTP.": "backend.otpAttempts",
  "Invalid or expired reset token": "backend.invalidResetToken",
  "Invalid reset token": "backend.invalidResetToken",
  "Email and password are required": "backend.emailPasswordRequired",
  "Email, password, and name are required": "backend.registerRequired",
  "Email and OTP are required": "backend.otpRequired",
  "Reset token and newPassword are required": "backend.resetRequired",
  "Both currentPassword and newPassword are required to change password": "backend.passwordChangeRequired",
  "Email is required": "backend.emailRequired",
  "Email cannot be empty": "backend.emailRequired",
  "Name cannot be empty": "backend.nameRequired",
  "User not found": "backend.userNotFound",
  "User profile not found": "backend.userNotFound",
  "JWT_SECRET configuration is missing on server": "backend.serverConfig",
  "JWT_SECRET is not configured on the server": "backend.serverConfig",

  // Staff
  "Staff member not found in this shop": "backend.staffNotFound",
  "Target user is not a staff member of this shop": "backend.staffNotFound",
  "Admins can only manage SALES staff members": "backend.adminSalesOnly",
  "Admins can only create SALES staff members": "backend.adminSalesOnly",
  "Admins can only remove SALES staff members": "backend.adminSalesOnly",
  "Admins can only register staff for their assigned shop": "backend.cannotAddStaff",
  "Only the store Owner can promote staff to ADMIN": "backend.ownerPromoteOnly",
  "Staff role must be either ADMIN or SALES": "backend.staffRoleInvalid",
  "Staff role must be ADMIN or SALES": "backend.staffRoleInvalid",
  "shopId is required for staff members": "backend.staffNeedsShop",
  "You are not authorized to add staff to a shop you do not own": "backend.cannotAddStaff",
  "You are not authorized to create staff members": "backend.cannotAddStaff",
  "You cannot remove your own account from the shop": "backend.cannotRemoveSelf",
  "Email, password, name, role, and shopId are required": "backend.staffFieldsRequired",

  // Shop, products, categories
  "Shop not found": "backend.shopNotFound",
  "Shop not found or access denied": "backend.shopNotFound",
  "Specified shop does not exist": "backend.shopNotFound",
  "Shop ID is required for this operation": "backend.shopRequired",
  "Shop name and businessType are required": "backend.shopFieldsRequired",
  "Product not found in this shop": "backend.productNotFound",
  "SKU, product name, and price are required": "backend.productFieldsRequired",
  "productId is required": "backend.productIdRequired",
  "Category not found in this shop": "backend.categoryNotFound",
  "Specified category does not exist in this shop": "backend.categoryNotFound",
  "Category cannot be empty": "backend.categoryNameRequired",
  "Category name is required": "backend.categoryNameRequired",
  "Invalid expiryDate format": "backend.invalidExpiry",
  "sellingPrice must be a positive number": "backend.sellingPricePositive",
  "unitCost must be zero or a positive number": "backend.unitCostPositive",
  "quantity must be a positive number": "backend.quantityPositive",
  "This change leaves the stock the same": "backend.sameStock",

  // Sales and returns
  "Sale not found in this shop": "backend.saleNotFound",
  "Items array is required and must contain at least one item": "backend.itemsRequired",
  "Items array is required and must contain at least one return item": "backend.returnItemsRequired",
  "Each item quantity must be a positive number": "backend.itemQuantityPositive",
  "Each item must specify a productId": "backend.itemNeedsProduct",
  "Each return item must have a productId": "backend.itemNeedsProduct",
  "Return quantity must be a positive number": "backend.returnQuantityPositive",
  "Valid paymentMethod is required (CASH, CARD, MOBILE)": "backend.paymentMethodRequired",
  "discountAmount must be a non-negative number": "backend.discountNegative",
  "sales array is required and must contain at least one sale": "backend.salesRequired",
  "Customer ID is required when sale is on credit": "backend.creditNeedsCustomer",

  // Customers and debts
  "Customer not found in this shop": "backend.customerNotFound",
  "Customer ID is required": "backend.customerRequired",
  "Customer ID is required for batch debt settlement": "backend.customerRequired",
  "Customer name is required": "backend.customerNameRequired",
  "Debt not found in this shop": "backend.debtNotFound",
  "Debt is already fully paid": "backend.debtAlreadyPaid",
  "No unpaid debts found matching the criteria": "backend.noUnpaidDebts",
  "Payment amount must be a positive number": "backend.paymentPositive",
  "Amount must be a positive number": "backend.amountPositive",

  // Expenses
  "Expense not found": "backend.expenseNotFound",
  "Expense title is required": "backend.expenseTitleRequired",
  "Expense category is required": "backend.expenseCategoryRequired",
  "Expense amount must be a positive number": "backend.expenseAmountPositive",
  "Invalid expense date format. Expected ISO-8601 date string": "backend.invalidDate",
  "Invalid expenseDate format": "backend.invalidDate",
  "Invalid paidAt date format": "backend.invalidDate",
  "Invalid purchasedAt date format": "backend.invalidDate",
  "Invalid transferredAt date format": "backend.invalidDate",
  "Title cannot be empty": "backend.titleEmpty",

  // Suppliers, restocks, funds
  "Supplier not found in this shop": "backend.supplierNotFound",
  "Specified supplier does not exist in this shop": "backend.supplierNotFound",
  "Supplier name is required": "backend.supplierNameRequired",
  "Pick the supplier you owe for a pay-later restock": "backend.pickSupplier",
  "Nothing is owed to this supplier": "backend.nothingOwed",
  "Some selected restocks are not unpaid restocks of this supplier": "backend.notUnpaidRestocks",
  "Money added cannot be recorded for a supplier-credit restock": "backend.noMoneyAddedOnCredit",
  "Money added amount must be a positive number": "backend.moneyAddedPositive",
  "Transfer amount must be a positive number": "backend.transferPositive",
  "Choose two different accounts": "backend.twoAccounts",
  "Notification not found": "backend.notificationNotFound",

  // Notification titles without variables
  "Pending Owner Approval": "notice.pendingOwner.title",
};

const num = "([\\d.,]+)";
const PATTERNS: Array<{ re: RegExp; key: MessageKey; vars: (m: RegExpMatchArray) => Vars }> = [
  // Errors
  { re: new RegExp(`^Payment is more than what is owed \\(${num} ETB\\)$`), key: "backend.payMoreThanOwed", vars: (m) => ({ amount: m[1] }) },
  { re: new RegExp(`^Payment is more than the selected restocks \\(${num} ETB\\)$`), key: "backend.payMoreThanSelected", vars: (m) => ({ amount: m[1] }) },
  { re: /^A product with SKU '(.*)' already exists in this shop$/, key: "backend.skuExists", vars: (m) => ({ sku: m[1] }) },
  { re: /^A category named '(.*)' already exists in this shop$/, key: "backend.categoryExists", vars: (m) => ({ name: m[1] }) },
  { re: new RegExp(`^Can't remove ${num}: only ${num} in stock$`), key: "backend.cantRemoveMore", vars: (m) => ({ quantity: m[1], before: m[2] }) },
  { re: /^Sale cannot be returned because its status is already (\w+)$/, key: "backend.saleNotReturnable", vars: (m) => ({ status: m[1] }) },
  { re: /^Product with ID '.*' not found in this shop$/, key: "backend.productNotFound", vars: () => ({}) },
  { re: /^Product with ID '.*' was not part of this sale$/, key: "backend.returnNotInSale", vars: () => ({}) },
  { re: /^Cannot [A-Z]+ .* - Route not found$/, key: "backend.routeNotFound", vars: () => ({}) },
  { re: /^Access denied\. Role '.*' is not authorized\.$/, key: "backend.noPermission", vars: () => ({}) },
  {
    re: new RegExp(`^Buying price \\(${num} ETB\\) is not lower than the selling price \\(${num} ETB\\)\\. Each sale would lose ${num} ETB\\.$`),
    key: "backend.belowCost",
    vars: (m) => ({ buy: m[1], sell: m[2], loss: m[3] }),
  },
  {
    re: new RegExp(`^Buying and selling price are both ${num} ETB, so this product makes no profit\\.$`),
    key: "backend.noProfit",
    vars: (m) => ({ sell: m[1] }),
  },

  // Notification titles
  { re: /^Out of Stock: (.+)$/, key: "notice.outOfStock.title", vars: (m) => ({ name: m[1] }) },
  { re: /^Low Stock Alert: (.+)$/, key: "notice.lowStock.title", vars: (m) => ({ name: m[1] }) },
  { re: /^Sells at cost \(no profit\): (.+)$/, key: "notice.sellsAtCost.title", vars: (m) => ({ name: m[1] }) },
  { re: /^Priced below cost: (.+)$/, key: "notice.belowCost.title", vars: (m) => ({ name: m[1] }) },
  { re: /^Product Expired: (.+)$/, key: "notice.expired.title", vars: (m) => ({ name: m[1] }) },
  { re: /^Product Expiring Soon: (.+)$/, key: "notice.expiring.title", vars: (m) => ({ name: m[1] }) },
  { re: /^Overdue Debt: (.+)$/, key: "notice.overdueDebt.title", vars: (m) => ({ name: m[1] }) },

  // Notification messages
  {
    re: new RegExp(`^(.+?) \\(SKU: (.*?)\\) has ${num} (\\S*) remaining \\(threshold: ${num}\\)\\.$`),
    key: "notice.lowStock.message",
    vars: (m) => ({ name: m[1], sku: m[2], qty: m[3], unit: m[4], threshold: m[5] }),
  },
  {
    re: new RegExp(`^(.+?) \\(SKU: (.*?)\\) sells for ${num} ETB, the same as its buying price, so it makes no profit\\. .*$`),
    key: "notice.sellsAtCost.message",
    vars: (m) => ({ name: m[1], sku: m[2], sell: m[3] }),
  },
  {
    re: new RegExp(`^(.+?) \\(SKU: (.*?)\\) sells for ${num} ETB but costs ${num} ETB to buy, a loss of ${num} ETB on every sale\\. Check its prices\\.$`),
    key: "notice.belowCost.message",
    vars: (m) => ({ name: m[1], sku: m[2], sell: m[3], buy: m[4], loss: m[5] }),
  },
  { re: /^(.+?) \(SKU: (.*?)\) expired on (.+)\.$/, key: "notice.expired.message", vars: (m) => ({ name: m[1], sku: m[2], date: m[3] }) },
  { re: /^(.+?) \(SKU: (.*?)\) will expire on (.+)\.$/, key: "notice.expiring.message", vars: (m) => ({ name: m[1], sku: m[2], date: m[3] }) },
  {
    re: new RegExp(`^Debt of ${num} ETB for customer (.+) was due on (.+)\\.$`),
    key: "notice.overdueDebt.message",
    vars: (m) => ({ amount: m[1], name: m[2], date: m[3] }),
  },
  {
    re: /^New owner (.+) \((.+)\) registered and is awaiting approval\.$/,
    key: "notice.pendingOwner.message",
    vars: (m) => ({ name: m[1], email: m[2] }),
  },
];

/** Finds the message key and values for a known backend text, or null. */
export function matchBackendText(text: string): Match | null {
  const exact = EXACT[text];
  if (exact) return { key: exact, vars: {} };
  for (const rule of PATTERNS) {
    const m = text.match(rule.re);
    if (m) return { key: rule.key, vars: rule.vars(m) };
  }
  return null;
}

type Translate = (key: MessageKey, vars?: Record<string, string | number>) => string;

/** Translates one backend text with `t`; unknown text is returned unchanged. */
export function translateBackendText(text: string | null | undefined, t: Translate): string {
  if (!text) return "";
  const match = matchBackendText(text.trim());
  return match ? t(match.key, match.vars) : text;
}
