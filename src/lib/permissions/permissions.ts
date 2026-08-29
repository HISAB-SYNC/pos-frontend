import type { Role } from "./roles";

export const PERMISSIONS = {
  MANAGE_USERS: "MANAGE_USERS",
  MANAGE_SHOPS: "MANAGE_SHOPS",
  MANAGE_PRODUCTS: "MANAGE_PRODUCTS",
  MANAGE_INVENTORY: "MANAGE_INVENTORY",
  MANAGE_CUSTOMERS: "MANAGE_CUSTOMERS",
  MANAGE_DEBTS: "MANAGE_DEBTS",
  MANAGE_SUPPLIERS: "MANAGE_SUPPLIERS",
  MANAGE_EXPENSES: "MANAGE_EXPENSES",
  VIEW_REPORTS: "VIEW_REPORTS",
  MANAGE_SETTINGS: "MANAGE_SETTINGS",
  MANAGE_SUBSCRIPTION: "MANAGE_SUBSCRIPTION",
  USE_POS: "USE_POS",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

const rolePermissions: Record<Role, Permission[]> = {
  SUPER_ADMIN: Object.values(PERMISSIONS),
  SYSTEM_ADMIN: Object.values(PERMISSIONS),
  OWNER: [

    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.MANAGE_SHOPS,
    PERMISSIONS.MANAGE_PRODUCTS,
    PERMISSIONS.MANAGE_INVENTORY,
    PERMISSIONS.MANAGE_CUSTOMERS,
    PERMISSIONS.MANAGE_DEBTS,
    PERMISSIONS.MANAGE_SUPPLIERS,
    PERMISSIONS.MANAGE_EXPENSES,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.MANAGE_SETTINGS,
    PERMISSIONS.MANAGE_SUBSCRIPTION,
    PERMISSIONS.USE_POS,
  ],
  ADMIN: [
    PERMISSIONS.MANAGE_PRODUCTS,
    PERMISSIONS.MANAGE_INVENTORY,
    PERMISSIONS.MANAGE_CUSTOMERS,
    PERMISSIONS.MANAGE_DEBTS,
    PERMISSIONS.MANAGE_SUPPLIERS,
    PERMISSIONS.MANAGE_EXPENSES,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.USE_POS,
  ],
  SALES: [
    PERMISSIONS.MANAGE_PRODUCTS,
    PERMISSIONS.MANAGE_INVENTORY,
    PERMISSIONS.MANAGE_CUSTOMERS,
    PERMISSIONS.MANAGE_DEBTS,
    PERMISSIONS.USE_POS,
  ],
};

export function getPermissionsForRole(role: Role | null | undefined) {
  return role ? (rolePermissions[role] ?? []) : [];
}

export function canDeleteProducts(role: Role | null | undefined) {
  return role === "OWNER" || role === "ADMIN";
}

export function canManageCategories(role: Role | null | undefined) {
  return role === "OWNER" || role === "ADMIN";
}

export function canManageSuppliers(role: Role | null | undefined) {
  return role === "OWNER" || role === "ADMIN";
}

export function canManageStaff(role: Role | null | undefined) {
  return role === "OWNER" || role === "ADMIN";
}

export function canManageShopSettings(role: Role | null | undefined) {
  return role === "OWNER";
}

export * from "./rbac";

