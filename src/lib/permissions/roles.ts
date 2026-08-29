export const ROLES = ["SUPER_ADMIN", "SYSTEM_ADMIN", "OWNER", "ADMIN", "SALES"] as const;

export type Role = (typeof ROLES)[number];

export const BACKEND_ROLES = ["SUPER_ADMIN", "OWNER", "ADMIN", "SALES"] as const;

export type BackendRole = (typeof BACKEND_ROLES)[number];

export function isBackendRole(role: string): role is BackendRole {
  return BACKEND_ROLES.includes(role as BackendRole);
}

