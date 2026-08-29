import type { Role } from "./roles";

/* ------------------------------------------------------------------ */
/* Granular System Permissions Definition                             */
/* ------------------------------------------------------------------ */
export const APP_PERMISSIONS = {
  // Product Permissions
  PRODUCT_VIEW: "product.view",
  PRODUCT_CREATE: "product.create",
  PRODUCT_EDIT: "product.edit",
  PRODUCT_DELETE: "product.delete",
  PRODUCT_CHANGE_PRICE: "product.change_price",

  // Inventory Permissions
  INVENTORY_VIEW: "inventory.view",
  INVENTORY_ADJUST: "inventory.adjust",
  INVENTORY_TRANSFER: "inventory.transfer",

  // Sales Permissions
  SALES_CREATE: "sales.create",
  SALES_VIEW: "sales.view",
  SALES_VIEW_OWN: "sales.view_own",
  SALES_CANCEL: "sales.cancel",
  SALES_REFUND: "sales.refund",
  SALES_DISCOUNT: "sales.discount",

  // Customer Permissions
  CUSTOMER_VIEW: "customer.view",
  CUSTOMER_CREATE: "customer.create",
  CUSTOMER_EDIT: "customer.edit",
  CUSTOMER_DELETE: "customer.delete",
  CUSTOMER_MANAGE_DEBT: "customer.manage_debt",

  // User & Team Management Permissions
  USER_VIEW: "user.view",
  USER_CREATE: "user.create",
  USER_EDIT: "user.edit",
  USER_DEACTIVATE: "user.deactivate",
  SELLER_MANAGE: "seller.manage",

  // Reports & Financial Permissions
  REPORTS_VIEW_SALES: "reports.view_sales",
  REPORTS_VIEW_INVENTORY: "reports.view_inventory",
  REPORTS_VIEW_PROFIT: "reports.view_profit",
  REPORTS_VIEW_FINANCIAL: "reports.view_financial",

  // Business & Shop Settings
  BUSINESS_VIEW: "business.view",
  BUSINESS_EDIT: "business.edit",
} as const;

export type AppPermission = (typeof APP_PERMISSIONS)[keyof typeof APP_PERMISSIONS];

/* ------------------------------------------------------------------ */
/* Permission Groups for UI Selection                                 */
/* ------------------------------------------------------------------ */
export type PermissionGroup = {
  id: string;
  name: string;
  description: string;
  permissions: Array<{
    id: AppPermission;
    label: string;
    description: string;
  }>;
};

export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    id: "sales",
    name: "Sales & POS Operations",
    description: "Checkout, sales processing, discount application, and returns",
    permissions: [
      { id: APP_PERMISSIONS.SALES_CREATE, label: "Create Sales / POS Checkout", description: "Process sales transactions and print receipts" },
      { id: APP_PERMISSIONS.SALES_VIEW_OWN, label: "View Own Sales", description: "View transactions completed by this user" },
      { id: APP_PERMISSIONS.SALES_VIEW, label: "View All Store Sales", description: "Inspect store-wide sales history" },
      { id: APP_PERMISSIONS.SALES_DISCOUNT, label: "Apply Cart Discounts", description: "Apply percentage or fixed manual discounts" },
      { id: APP_PERMISSIONS.SALES_REFUND, label: "Process Refunds & Returns", description: "Issue refunds for customer returned items" },
      { id: APP_PERMISSIONS.SALES_CANCEL, label: "Cancel Active Sales", description: "Void or cancel active sales transactions" },
    ],
  },
  {
    id: "products",
    name: "Product Catalog",
    description: "Product creation, price modification, and catalog management",
    permissions: [
      { id: APP_PERMISSIONS.PRODUCT_VIEW, label: "View Products", description: "Browse catalog and product details" },
      { id: APP_PERMISSIONS.PRODUCT_CREATE, label: "Add New Products", description: "Create products, barcodes, and categories" },
      { id: APP_PERMISSIONS.PRODUCT_EDIT, label: "Edit Product Info", description: "Update product descriptions, SKUs, and categories" },
      { id: APP_PERMISSIONS.PRODUCT_CHANGE_PRICE, label: "Change Product Prices", description: "Modify cost and retail selling prices" },
      { id: APP_PERMISSIONS.PRODUCT_DELETE, label: "Delete Products", description: "Remove products permanently from catalog" },
    ],
  },
  {
    id: "inventory",
    name: "Inventory & Stock",
    description: "Stock levels, inventory audits, and manual adjustments",
    permissions: [
      { id: APP_PERMISSIONS.INVENTORY_VIEW, label: "View Inventory Levels", description: "Check current quantity in hand and alerts" },
      { id: APP_PERMISSIONS.INVENTORY_ADJUST, label: "Adjust Stock Quantity", description: "Perform manual stock adjustments and write-offs" },
      { id: APP_PERMISSIONS.INVENTORY_TRANSFER, label: "Transfer Stock", description: "Move stock between warehouse and store front" },
    ],
  },
  {
    id: "customers",
    name: "Customers & Debt Ledger",
    description: "Customer accounts, credit sales, and debt collection",
    permissions: [
      { id: APP_PERMISSIONS.CUSTOMER_VIEW, label: "View Customers", description: "Look up customer directory and purchase history" },
      { id: APP_PERMISSIONS.CUSTOMER_CREATE, label: "Add New Customers", description: "Register new customers during checkout or directory" },
      { id: APP_PERMISSIONS.CUSTOMER_EDIT, label: "Edit Customer Info", description: "Update contact details and credit limits" },
      { id: APP_PERMISSIONS.CUSTOMER_MANAGE_DEBT, label: "Manage Customer Debts", description: "Accept debt repayments and record debt ledger entries" },
      { id: APP_PERMISSIONS.CUSTOMER_DELETE, label: "Delete Customers", description: "Remove customer records" },
    ],
  },
  {
    id: "reports",
    name: "Analytics & Reports",
    description: "Financial performance, revenue metrics, and profit margins",
    permissions: [
      { id: APP_PERMISSIONS.REPORTS_VIEW_SALES, label: "View Sales Reports", description: "Access daily, weekly, and monthly sales graphs" },
      { id: APP_PERMISSIONS.REPORTS_VIEW_INVENTORY, label: "View Inventory Reports", description: "Analyze stock turnover and valuation" },
      { id: APP_PERMISSIONS.REPORTS_VIEW_PROFIT, label: "View Profit & Margins", description: "Access gross profit calculations" },
      { id: APP_PERMISSIONS.REPORTS_VIEW_FINANCIAL, label: "View Financial & Tax Reports", description: "Access sensitive tax and revenue ledgers" },
    ],
  },
  {
    id: "users",
    name: "Employee Management",
    description: "Staff accounts, role assignments, and permission controls",
    permissions: [
      { id: APP_PERMISSIONS.SELLER_MANAGE, label: "Manage Sellers / Cashiers", description: "Create, edit, and deactivate seller staff" },
      { id: APP_PERMISSIONS.USER_VIEW, label: "View Team Directory", description: "See list of all store employees and roles" },
      { id: APP_PERMISSIONS.USER_CREATE, label: "Create Store Admins & Staff", description: "Provision new team member accounts" },
      { id: APP_PERMISSIONS.USER_EDIT, label: "Edit Employee Permissions", description: "Modify assigned permissions of lower-tier staff" },
      { id: APP_PERMISSIONS.USER_DEACTIVATE, label: "Suspend / Deactivate Staff", description: "Temporarily freeze or revoke employee access" },
    ],
  },
  {
    id: "business",
    name: "Store Settings & Administration",
    description: "Business profiles, tax rules, and operational configurations",
    permissions: [
      { id: APP_PERMISSIONS.BUSINESS_VIEW, label: "View Store Settings", description: "Inspect store profile and receipt settings" },
      { id: APP_PERMISSIONS.BUSINESS_EDIT, label: "Modify Store Settings", description: "Update store name, tax rates, and currencies" },
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Default Permissions Mapped by Role                                 */
/* ------------------------------------------------------------------ */
export const DEFAULT_ROLE_PERMISSIONS: Record<Role, AppPermission[]> = {
  SUPER_ADMIN: Object.values(APP_PERMISSIONS),
  SYSTEM_ADMIN: Object.values(APP_PERMISSIONS),
  OWNER: [
    APP_PERMISSIONS.PRODUCT_VIEW,
    APP_PERMISSIONS.PRODUCT_CREATE,
    APP_PERMISSIONS.PRODUCT_EDIT,
    APP_PERMISSIONS.PRODUCT_DELETE,
    APP_PERMISSIONS.PRODUCT_CHANGE_PRICE,
    APP_PERMISSIONS.INVENTORY_VIEW,
    APP_PERMISSIONS.INVENTORY_ADJUST,
    APP_PERMISSIONS.INVENTORY_TRANSFER,
    APP_PERMISSIONS.SALES_CREATE,
    APP_PERMISSIONS.SALES_VIEW,
    APP_PERMISSIONS.SALES_VIEW_OWN,
    APP_PERMISSIONS.SALES_CANCEL,
    APP_PERMISSIONS.SALES_REFUND,
    APP_PERMISSIONS.SALES_DISCOUNT,
    APP_PERMISSIONS.CUSTOMER_VIEW,
    APP_PERMISSIONS.CUSTOMER_CREATE,
    APP_PERMISSIONS.CUSTOMER_EDIT,
    APP_PERMISSIONS.CUSTOMER_DELETE,
    APP_PERMISSIONS.CUSTOMER_MANAGE_DEBT,
    APP_PERMISSIONS.USER_VIEW,
    APP_PERMISSIONS.USER_CREATE,
    APP_PERMISSIONS.USER_EDIT,
    APP_PERMISSIONS.USER_DEACTIVATE,
    APP_PERMISSIONS.SELLER_MANAGE,
    APP_PERMISSIONS.REPORTS_VIEW_SALES,
    APP_PERMISSIONS.REPORTS_VIEW_INVENTORY,
    APP_PERMISSIONS.REPORTS_VIEW_PROFIT,
    APP_PERMISSIONS.REPORTS_VIEW_FINANCIAL,
    APP_PERMISSIONS.BUSINESS_VIEW,
    APP_PERMISSIONS.BUSINESS_EDIT,
  ],
  ADMIN: [
    APP_PERMISSIONS.PRODUCT_VIEW,
    APP_PERMISSIONS.PRODUCT_CREATE,
    APP_PERMISSIONS.PRODUCT_EDIT,
    APP_PERMISSIONS.INVENTORY_VIEW,
    APP_PERMISSIONS.INVENTORY_ADJUST,
    APP_PERMISSIONS.SALES_CREATE,
    APP_PERMISSIONS.SALES_VIEW,
    APP_PERMISSIONS.SALES_VIEW_OWN,
    APP_PERMISSIONS.SALES_DISCOUNT,
    APP_PERMISSIONS.CUSTOMER_VIEW,
    APP_PERMISSIONS.CUSTOMER_CREATE,
    APP_PERMISSIONS.CUSTOMER_EDIT,
    APP_PERMISSIONS.CUSTOMER_MANAGE_DEBT,
    APP_PERMISSIONS.USER_VIEW,
    APP_PERMISSIONS.SELLER_MANAGE,
    APP_PERMISSIONS.REPORTS_VIEW_SALES,
    APP_PERMISSIONS.REPORTS_VIEW_INVENTORY,
    APP_PERMISSIONS.BUSINESS_VIEW,
  ],
  SALES: [
    APP_PERMISSIONS.PRODUCT_VIEW,
    APP_PERMISSIONS.SALES_CREATE,
    APP_PERMISSIONS.SALES_VIEW_OWN,
    APP_PERMISSIONS.SALES_DISCOUNT,
    APP_PERMISSIONS.CUSTOMER_VIEW,
    APP_PERMISSIONS.CUSTOMER_CREATE,
    APP_PERMISSIONS.CUSTOMER_MANAGE_DEBT,
  ],
};

/* ------------------------------------------------------------------ */
/* Hierarchical Role Access Rules                                      */
/* ------------------------------------------------------------------ */
export const ROLE_HIERARCHY: Record<Role, number> = {
  SUPER_ADMIN: 4,
  SYSTEM_ADMIN: 4,
  OWNER: 3,
  ADMIN: 2,
  SALES: 1,
};

/**
 * Checks if a user has a specific permission.
 */
export function hasPermission(
  userRole: Role | null | undefined,
  userCustomPermissions: AppPermission[] | null | undefined,
  requiredPermission: AppPermission,
): boolean {
  if (!userRole) return false;
  if (userRole === "SUPER_ADMIN" || userRole === "SYSTEM_ADMIN") return true;

  // If custom permissions array is provided, check explicit assignment
  if (userCustomPermissions && userCustomPermissions.length > 0) {
    return userCustomPermissions.includes(requiredPermission);
  }

  // Fallback to role defaults
  const rolePerms = DEFAULT_ROLE_PERMISSIONS[userRole] || [];
  return rolePerms.includes(requiredPermission);
}

/**
 * Checks if current user can manage a target role.
 * Super Admin -> Owner, Admin, Sales
 * Owner -> Admin, Sales
 * Admin -> Sales only
 * Sales -> Nobody
 */
export function canManageRole(actorRole: Role | null | undefined, targetRole: Role): boolean {
  if (!actorRole) return false;
  const actorLevel = ROLE_HIERARCHY[actorRole] || 0;
  const targetLevel = ROLE_HIERARCHY[targetRole] || 0;
  return actorLevel > targetLevel;
}

/**
 * Returns allowed roles that the current user can create.
 */
export function getAllowedRolesToCreate(actorRole: Role | null | undefined): Array<{ role: Role; label: string }> {
  if (actorRole === "SUPER_ADMIN" || actorRole === "SYSTEM_ADMIN") {
    return [
      { role: "OWNER", label: "Business Owner" },
      { role: "ADMIN", label: "Shop Admin" },
      { role: "SALES", label: "Seller / Cashier" },
    ];
  }

  if (actorRole === "OWNER") {
    return [
      { role: "ADMIN", label: "Shop Admin" },
      { role: "SALES", label: "Seller / Cashier" },
    ];
  }

  if (actorRole === "ADMIN") {
    return [
      { role: "SALES", label: "Seller / Cashier" },
    ];
  }

  return [];
}

/**
 * Returns permissions that current user has authority to assign to lower-tier staff.
 * Rule: A user can never grant a permission they themselves do not possess.
 */
export function getAllowedPermissionsToAssign(
  actorRole: Role | null | undefined,
  actorPermissions?: AppPermission[],
): AppPermission[] {
  if (!actorRole) return [];
  if (actorRole === "SUPER_ADMIN" || actorRole === "SYSTEM_ADMIN") {
    return Object.values(APP_PERMISSIONS);
  }

  if (actorPermissions && actorPermissions.length > 0) {
    return actorPermissions;
  }

  return DEFAULT_ROLE_PERMISSIONS[actorRole] || [];
}
