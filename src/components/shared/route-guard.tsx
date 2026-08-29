"use client";

import { useEffect, useState } from "react";

import { AccessDenied } from "@/components/shared/access-denied";
import { LoadingState } from "@/components/shared/loading-state";
import { type AppPermission, hasPermission } from "@/lib/permissions/rbac";
import type { Role } from "@/lib/permissions/roles";
import { useAuthStore } from "@/stores/auth-store";

interface RouteGuardProps {
  children: React.ReactNode;
  requiredRole?: Role | Role[];
  requiredPermission?: AppPermission | AppPermission[];
}

export function RouteGuard({
  children,
  requiredRole,
  requiredPermission,
}: RouteGuardProps) {
  const [mounted, setMounted] = useState(false);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <LoadingState />;
  }

  // Check Role requirement
  if (requiredRole) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!user || !roles.includes(user.role)) {
      return (
        <AccessDenied
          requiredRole={roles.join(" or ")}
          description="Your user role does not grant access to this administrative section."
        />
      );
    }
  }

  // Check Granular Permission requirement
  if (requiredPermission) {
    const permissions = Array.isArray(requiredPermission) ? requiredPermission : [requiredPermission];
    const isAllowed = permissions.some((perm) => hasPermission(user?.role, undefined, perm));

    if (!isAllowed) {
      return (
        <AccessDenied
          requiredPermission={permissions.join(", ")}
          description="You do not have the required operational permissions to perform actions on this resource."
        />
      );
    }
  }

  return <>{children}</>;
}
