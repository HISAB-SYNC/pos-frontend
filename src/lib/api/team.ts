import { isMockApiEnabled } from "@/config/env";
import { getMockStore } from "@/lib/mock/store";
import { apiRequest } from "./client";
import { API_ENDPOINTS } from "./endpoints";
import type { TeamMember, TeamSummary } from "./types";

import { getStaffOverrides, saveStaffOverride } from "./local-cache";

/* ------------------------------------------------------------------ */
/* Team / Users Management API                                         */
/* ------------------------------------------------------------------ */
export async function getTeamSummary(shopId: string): Promise<TeamSummary> {
  const members = await getTeamMembers(shopId);
  return {
    totalTeamMembers: members.length,
    shopAdminCount: members.filter((m) => m.role.toLowerCase().includes("admin")).length,
    shopSalesCount: members.filter((m) => m.role.toLowerCase().includes("sale")).length,
  };
}

export async function getTeamMembers(shopId: string): Promise<TeamMember[]> {
  const store = getMockStore();
  const overrides = getStaffOverrides();

  let members: TeamMember[] = [];

  if (isMockApiEnabled()) {
    members = store.teamMembers.filter((m) => !m.shopId || m.shopId === shopId);
  } else {
    const live = await apiRequest<any[]>(API_ENDPOINTS.shops.staff(shopId));
    if (Array.isArray(live)) {
      members = live.map((s) => ({
        id: s.id,
        shopId: s.shopId || shopId,
        name: s.name,
        email: s.email,
        role: s.role === "ADMIN" ? "Shop Admin" : "Shop Sale",
        status: s.isActive ? "Active" : "Suspended",
        joinedDate: s.createdAt ? new Date(s.createdAt).toLocaleDateString("en-GB") : "Recent",
        lastLogin: s.updatedAt ? new Date(s.updatedAt).toLocaleDateString("en-GB") : "Recent",
        phone: s.phone || "+251911223344",
        permissions: s.role === "ADMIN" ? ["All Admin Permissions"] : ["Sales & POS", "View Products"],
      }));
    } else {
      members = [];
    }
  }

  // Merge any local overrides (so role and profile updates persist cleanly)
  return members.map((m) => {
    if (overrides[m.id]) {
      const ov = overrides[m.id];
      return {
        ...m,
        ...ov,
        role: ov.role || m.role,
      };
    }
    return m;
  });
}

export async function createTeamMember(
  shopId: string,
  input: {
    name: string;
    email?: string;
    role: string;
    password?: string;
    phone?: string;
    permissions?: string[];
  },
) {
  const roleNormalized = input.role.toLowerCase().includes("admin") ? "ADMIN" : "SALES";
  const newMember: TeamMember = {
    id: `tm-${Date.now()}`,
    shopId,
    name: input.name,
    email: input.email || `${input.name.toLowerCase().replace(/\s+/g, ".")}.andalus@gmail.com`,
    role: roleNormalized === "ADMIN" ? "Shop Admin" : "Shop Sale",
    phone: input.phone || "+251911223344",
    status: "Active",
    joinedDate: new Date().toLocaleDateString("en-GB"),
    lastLogin: new Date().toLocaleDateString("en-GB"),
    permissions: input.permissions || (roleNormalized === "ADMIN" ? ["All Admin Permissions"] : ["Sales & POS"]),
  };

  const store = getMockStore();
  store.teamMembers.unshift(newMember);

  const { seedTeamMembers } = await import("@/lib/mock/data");
  seedTeamMembers.unshift(newMember);

  if (!isMockApiEnabled()) {
    try {
      const res = await apiRequest<any>(API_ENDPOINTS.shops.staff(shopId), {
        method: "POST",
        body: {
          name: input.name,
          email: newMember.email,
          password: input.password || "staffpassword123",
          role: roleNormalized,
        },
      });
      if (res && res.id) {
        newMember.id = res.id;
      }
    } catch (err) {
      // Don't pretend the staff account exists: undo the local copy and report it.
      const i = store.teamMembers.indexOf(newMember);
      if (i >= 0) store.teamMembers.splice(i, 1);
      const j = seedTeamMembers.indexOf(newMember);
      if (j >= 0) seedTeamMembers.splice(j, 1);
      throw err;
    }
  }

  return newMember;
}

export async function updateTeamMember(
  shopId: string,
  memberId: string,
  input: Partial<Omit<TeamMember, "id">>,
) {
  const store = getMockStore();
  const { seedTeamMembers } = await import("@/lib/mock/data");

  // Format role string for display & storage
  const roleFormatted =
    input.role === "ADMIN" || input.role === "Shop Admin"
      ? "Shop Admin"
      : input.role === "SALES" || input.role === "Shop Sale"
      ? "Shop Sale"
      : input.role;

  const updatePayload = {
    ...input,
    ...(roleFormatted ? { role: roleFormatted } : {}),
  };

  // 1. Update in mock store
  const storeMember = store.teamMembers.find((m) => m.id === memberId);
  if (storeMember) {
    Object.assign(storeMember, updatePayload);
  }

  // 2. Update in seed data
  const seedMember = seedTeamMembers.find((m) => m.id === memberId);
  if (seedMember) {
    Object.assign(seedMember, updatePayload);
  }

  // 3. Save persistent override in client storage
  saveStaffOverride(memberId, updatePayload);

  // 4. Try live backend
  if (!isMockApiEnabled()) {
    try {
      const response = await apiRequest<{ success: boolean; data: any } | any>(
        API_ENDPOINTS.shops.staffMember(shopId, memberId),
        {
          method: "PUT",
          body: {
            name: input.name,
            email: input.email,
            phone: input.phone,
            role: input.role?.includes("Admin") || input.role === "ADMIN" ? "ADMIN" : "SALES",
            isActive: input.status !== undefined ? input.status === "Active" : undefined,
          },
        }
      );
      if (response && (response.data || response.id)) {
        const data = response.data || response;
        const updated: TeamMember = {
          id: data.id || memberId,
          shopId: data.shopId || shopId,
          name: data.name || input.name || storeMember?.name || "",
          email: data.email || input.email || storeMember?.email || "",
          phone: data.phone || input.phone || storeMember?.phone || "",
          role: data.role === "ADMIN" ? "Shop Admin" : data.role === "SALES" ? "Shop Sale" : (roleFormatted || "Shop Sale"),
          status: data.isActive === false ? "Suspended" : (storeMember?.status || "Active"),
          joinedDate: storeMember?.joinedDate || new Date().toLocaleDateString("en-GB"),
          lastLogin: storeMember?.lastLogin || "Just now",
          permissions: storeMember?.permissions || [],
        };
        return updated;
      }
    } catch (err) {
      console.warn("Backend updateTeamMember failed:", err);
      throw err;
    }
  }

  return (storeMember || seedMember || { id: memberId, ...updatePayload }) as TeamMember;
}

export async function deleteTeamMember(shopId: string, memberId: string) {
  const { seedTeamMembers } = await import("@/lib/mock/data");
  const idx = seedTeamMembers.findIndex((m) => m.id === memberId);
  if (idx !== -1) {
    seedTeamMembers.splice(idx, 1);
  }

  if (!isMockApiEnabled()) {
    await apiRequest(API_ENDPOINTS.shops.staffMember(shopId, memberId), {
      method: "DELETE",
    });
  }

  return { success: true, message: "Team member deleted" };
}
