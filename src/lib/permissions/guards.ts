import type { Permission } from "./permissions";
import { PERMISSIONS, getPermissionsForRole } from "./permissions";
import type { Role } from "./roles";
import { ROLES } from "./roles";

export function hasRole(userRole: Role | null | undefined, requiredRoles: Role | Role[]) {
  if (!userRole) {
    return false;
  }

  const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
  return roles.includes(userRole);
}

export function hasPermission(userRole: Role | null | undefined, permission: Permission) {
  return getPermissionsForRole(userRole).includes(permission);
}

export function canAccess(
  userRole: Role | null | undefined,
  required: Role | Role[] | Permission | Permission[],
) {
  const values = Array.isArray(required) ? required : [required];
  const roleValues = new Set(ROLES);
  const permissionValues = new Set(Object.values(PERMISSIONS));

  return values.some((value) => {
    if (roleValues.has(value as Role)) {
      return hasRole(userRole, value as Role);
    }

    if (permissionValues.has(value as Permission)) {
      return hasPermission(userRole, value as Permission);
    }

    return false;
  });
}
