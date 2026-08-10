export const ROLES = ["SYSTEM_ADMIN", "OWNER", "SHOP_ADMIN", "SHOP_SALES"] as const;

export type Role = (typeof ROLES)[number];
