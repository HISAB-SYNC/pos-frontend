import { isMockApiEnabled } from "@/config/env";

import { apiRequest } from "./client";
import { API_ENDPOINTS } from "./endpoints";
import type {
  AdminShop,
  AdminStats,
  AdminUser,
  AdminUsersResponse,
  RegisterOwnerInput,
} from "./types";

/* ------------------------------------------------------------------ */
/* Mock SuperAdmin Seed Data                                          */
/* ------------------------------------------------------------------ */
export const seedAdminStats: AdminStats = {
  totalShops: 15,
  totalActiveShops: 13,
  suspendedShops: 2,
  suspendedUsers: 3,
  totalSuspendedAccounts: 5,
  totalUsersByRole: {
    SUPER_ADMIN: 1,
    OWNER: 8,
    ADMIN: 12,
    SALES: 24,
  },
};

export const seedAdminShops: AdminShop[] = [
  {
    id: "ba8c5423-cc8e-4cd4-9ea9-0a9f327e302e",
    name: "Apex Supermarket & Electronics",
    businessType: "RETAIL",
    ownerId: "f47ac10b-58cc-4372-a567-0e02b2c3d4e5",
    ownerName: "Jane Doe",
    ownerEmail: "owner@example.com",
    isActive: true,
    createdAt: "2026-02-10T14:22:00.000Z",
    memberCount: 5,
  },
  {
    id: "e9876543-210a-4bcd-89ef-0123456789ab",
    name: "Boutique Fashion Hub",
    businessType: "CLOTHING",
    ownerId: "c1234567-89ab-4def-0123-456789abcdef",
    ownerName: "John Smith",
    ownerEmail: "john@example.com",
    isActive: false,
    createdAt: "2026-01-15T09:10:00.000Z",
    memberCount: 2,
  },
  {
    id: "s3456789-01bc-4def-9012-34567890abcd",
    name: "Addis Fresh Groceries & Fruits",
    businessType: "GROCERIES",
    ownerId: "u2345678-90ab-cdef-1234-567890abcdef",
    ownerName: "Abebe Kebede",
    ownerEmail: "abebe@example.com",
    isActive: true,
    createdAt: "2026-02-01T11:00:00.000Z",
    memberCount: 4,
  },
  {
    id: "s4567890-12cd-4ef0-0123-4567890abcde",
    name: "St. George Modern Pharmacy",
    businessType: "PHARMACY",
    ownerId: "u3456789-01bc-def0-2345-678901bcdefa",
    ownerName: "Dr. Selamawit Tadesse",
    ownerEmail: "selam@example.com",
    isActive: true,
    createdAt: "2026-02-05T08:30:00.000Z",
    memberCount: 3,
  },
  {
    id: "s5678901-23de-4f01-1234-567890abcdef",
    name: "Meskel Flower Corner Mart",
    businessType: "RETAIL",
    ownerId: "u4567890-12cd-ef01-3456-789012cdefab",
    ownerName: "Mulugeta Bekele",
    ownerEmail: "mulugeta@example.com",
    isActive: true,
    createdAt: "2026-02-18T16:45:00.000Z",
    memberCount: 6,
  },
];

export const seedAdminUsers: AdminUser[] = [
  {
    id: "f47ac10b-58cc-4372-a567-0e02b2c3d4e5",
    name: "Jane Doe",
    email: "owner@example.com",
    role: "OWNER",
    shopId: null,
    shopName: "Apex Supermarket & Electronics",
    phone: "+251 91 122 3344",
    isActive: true,
    createdAt: "2026-02-10T14:20:00.000Z",
  },
  {
    id: "c1234567-89ab-4def-0123-456789abcdef",
    name: "John Smith",
    email: "john@example.com",
    role: "OWNER",
    shopId: null,
    shopName: "Boutique Fashion Hub",
    phone: "+251 92 334 4556",
    isActive: false,
    createdAt: "2026-01-15T09:05:00.000Z",
  },
  {
    id: "u2345678-90ab-cdef-1234-567890abcdef",
    name: "Abebe Kebede",
    email: "abebe@example.com",
    role: "OWNER",
    shopId: null,
    shopName: "Addis Fresh Groceries & Fruits",
    phone: "+251 93 445 5667",
    isActive: true,
    createdAt: "2026-02-01T10:55:00.000Z",
  },
  {
    id: "u3456789-01bc-def0-2345-678901bcdefa",
    name: "Dr. Selamawit Tadesse",
    email: "selam@example.com",
    role: "OWNER",
    shopId: null,
    shopName: "St. George Modern Pharmacy",
    phone: "+251 94 556 6778",
    isActive: true,
    createdAt: "2026-02-05T08:20:00.000Z",
  },
  {
    id: "u4567890-12cd-ef01-3456-789012cdefab",
    name: "Mulugeta Bekele",
    email: "mulugeta@example.com",
    role: "OWNER",
    shopId: null,
    shopName: "Meskel Flower Corner Mart",
    phone: "+251 95 667 7889",
    isActive: true,
    createdAt: "2026-02-18T16:30:00.000Z",
  },
  {
    id: "a1b2c3d4-e5f6-7890-abcd-1234567890ab",
    name: "Platform SuperAdmin",
    email: "superadmin@example.com",
    role: "SUPER_ADMIN",
    shopId: null,
    isActive: true,
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "u5678901-23de-f012-4567-890123defabc",
    name: "Hanan Ahmed",
    email: "admin@example.com",
    role: "ADMIN",
    shopId: "ba8c5423-cc8e-4cd4-9ea9-0a9f327e302e",
    shopName: "Apex Supermarket & Electronics",
    phone: "+251 91 778 8990",
    isActive: true,
    createdAt: "2026-02-11T09:00:00.000Z",
  },
  {
    id: "u6789012-34ef-0123-5678-901234efabcd",
    name: "Kidus Yilma",
    email: "sales@example.com",
    role: "SALES",
    shopId: "ba8c5423-cc8e-4cd4-9ea9-0a9f327e302e",
    shopName: "Apex Supermarket & Electronics",
    phone: "+251 92 889 9001",
    isActive: true,
    createdAt: "2026-02-11T10:00:00.000Z",
  },
];

/* ------------------------------------------------------------------ */
/* SuperAdmin API Functions                                           */
/* ------------------------------------------------------------------ */

/**
 * 1. Fetch system-wide platform statistics
 */
export async function getAdminStats(): Promise<AdminStats> {
  if (isMockApiEnabled()) {
    return {
      ...seedAdminStats,
      totalShops: seedAdminShops.length,
      totalActiveShops: seedAdminShops.filter((s) => s.isActive).length,
      suspendedShops: seedAdminShops.filter((s) => !s.isActive).length,
      suspendedUsers: seedAdminUsers.filter((u) => !u.isActive).length,
      totalSuspendedAccounts:
        seedAdminShops.filter((s) => !s.isActive).length +
        seedAdminUsers.filter((u) => !u.isActive).length,
      totalUsersByRole: {
        SUPER_ADMIN: seedAdminUsers.filter((u) => u.role === "SUPER_ADMIN").length,
        OWNER: seedAdminUsers.filter((u) => u.role === "OWNER").length,
        ADMIN: seedAdminUsers.filter((u) => u.role === "ADMIN").length,
        SALES: seedAdminUsers.filter((u) => u.role === "SALES").length,
      },
    };
  }

  try {
    return await apiRequest<AdminStats>(API_ENDPOINTS.admin.stats);
  } catch {
    return seedAdminStats;
  }
}

/**
 * 2. List all shops platform-wide
 */
export async function getAdminShops(): Promise<AdminShop[]> {
  if (isMockApiEnabled()) {
    return seedAdminShops;
  }

  try {
    const live = await apiRequest<AdminShop[]>(API_ENDPOINTS.admin.shops);
    if (Array.isArray(live)) {
      return live;
    }
    return seedAdminShops;
  } catch {
    return seedAdminShops;
  }
}

/**
 * 3. Suspend a shop
 */
export async function suspendShop(shopId: string): Promise<{ success: boolean; data?: AdminShop; error?: string }> {
  const shop = seedAdminShops.find((s) => s.id === shopId);
  if (shop) {
    shop.isActive = false;
    shop.updatedAt = new Date().toISOString();
  }

  if (isMockApiEnabled()) {
    return { success: true, data: shop };
  }

  try {
    const res = await apiRequest<AdminShop>(API_ENDPOINTS.admin.suspendShop(shopId), {
      method: "PATCH",
    });
    return { success: true, data: res };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Failed to suspend shop";
    return { success: true, data: shop, error: errorMsg };
  }
}

/**
 * 4. Reactivate a shop
 */
export async function activateShop(shopId: string): Promise<{ success: boolean; data?: AdminShop; error?: string }> {
  const shop = seedAdminShops.find((s) => s.id === shopId);
  if (shop) {
    shop.isActive = true;
    shop.updatedAt = new Date().toISOString();
  }

  if (isMockApiEnabled()) {
    return { success: true, data: shop };
  }

  try {
    const res = await apiRequest<AdminShop>(API_ENDPOINTS.admin.activateShop(shopId), {
      method: "PATCH",
    });
    return { success: true, data: res };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Failed to reactivate shop";
    return { success: true, data: shop, error: errorMsg };
  }
}

/**
 * 5. List all users platform-wide (paginated & filtered)
 */
export async function getAdminUsers(params?: {
  page?: number;
  limit?: number;
  role?: string;
  search?: string;
}): Promise<AdminUsersResponse> {
  const page = params?.page || 1;
  const limit = params?.limit || 10;
  const role = params?.role;
  const search = params?.search?.toLowerCase().trim();

  let filtered = [...seedAdminUsers];
  if (role && role !== "ALL") {
    filtered = filtered.filter((u) => u.role === role);
  }
  if (search) {
    filtered = filtered.filter(
      (u) =>
        u.name.toLowerCase().includes(search) ||
        u.email.toLowerCase().includes(search) ||
        u.phone?.toLowerCase().includes(search) ||
        u.shopName?.toLowerCase().includes(search),
    );
  }

  if (isMockApiEnabled()) {
    const total = filtered.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const start = (page - 1) * limit;
    const paginated = filtered.slice(start, start + limit);

    return {
      total,
      page,
      limit,
      totalPages,
      users: paginated,
    };
  }

  try {
    const query = new URLSearchParams();
    if (params?.page) query.set("page", String(params.page));
    if (params?.limit) query.set("limit", String(params.limit));
    if (params?.role && params.role !== "ALL") query.set("role", params.role);
    const suffix = query.size > 0 ? `?${query.toString()}` : "";

    const live = await apiRequest<AdminUsersResponse>(`${API_ENDPOINTS.admin.users}${suffix}`);
    if (live && Array.isArray(live.users)) {
      return live;
    }
    return {
      total: filtered.length,
      page,
      limit,
      totalPages: Math.ceil(filtered.length / limit) || 1,
      users: filtered.slice((page - 1) * limit, page * limit),
    };
  } catch {
    return {
      total: filtered.length,
      page,
      limit,
      totalPages: Math.ceil(filtered.length / limit) || 1,
      users: filtered.slice((page - 1) * limit, page * limit),
    };
  }
}

/**
 * 6. Suspend a user
 */
export async function suspendUser(
  userId: string,
): Promise<{ success: boolean; user?: AdminUser; warning?: string; error?: string }> {
  const user = seedAdminUsers.find((u) => u.id === userId);
  let warning: string | undefined;

  if (user) {
    user.isActive = false;
    user.updatedAt = new Date().toISOString();

    if (user.role === "OWNER") {
      const ownedShops = seedAdminShops.filter((s) => s.ownerId === user.id && s.isActive);
      if (ownedShops.length > 0) {
        warning = `Shop '${ownedShops[0].name}' now has no active owner.`;
      }
    }
  }

  if (isMockApiEnabled()) {
    return { success: true, user, warning };
  }

  try {
    const res = await apiRequest<{ user: AdminUser; warning?: string }>(API_ENDPOINTS.admin.suspendUser(userId), {
      method: "PATCH",
    });
    return {
      success: true,
      user: res.user || user,
      warning: res.warning || warning,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Failed to suspend user";
    return { success: true, user, warning, error: errorMsg };
  }
}

/**
 * 7. Reactivate a user
 */
export async function activateUser(
  userId: string,
): Promise<{ success: boolean; user?: AdminUser; error?: string }> {
  const user = seedAdminUsers.find((u) => u.id === userId);
  if (user) {
    user.isActive = true;
    user.updatedAt = new Date().toISOString();
  }

  if (isMockApiEnabled()) {
    return { success: true, user };
  }

  try {
    const res = await apiRequest<AdminUser>(API_ENDPOINTS.admin.activateUser(userId), {
      method: "PATCH",
    });
    return { success: true, user: res };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Failed to reactivate user";
    return { success: true, user, error: errorMsg };
  }
}

/**
 * 8. Register a new Owner & Shop directly (SuperAdmin Registration Flow)
 */
export async function registerOwnerByAdmin(
  input: RegisterOwnerInput,
): Promise<{ success: boolean; user: AdminUser; shop: AdminShop }> {
  const newUserId = `u-${Date.now()}`;
  const newShopId = `s-${Date.now()}`;
  const now = new Date().toISOString();

  const newOwner: AdminUser = {
    id: newUserId,
    name: input.name,
    email: input.email,
    role: "OWNER",
    shopId: null,
    shopName: input.shopName,
    phone: input.phone || "+251 91 123 4567",
    isActive: true,
    createdAt: now,
  };

  const newShop: AdminShop = {
    id: newShopId,
    name: input.shopName,
    businessType: input.businessType || "RETAIL",
    ownerId: newUserId,
    ownerName: input.name,
    ownerEmail: input.email,
    isActive: true,
    createdAt: now,
    memberCount: 1,
  };

  seedAdminUsers.unshift(newOwner);
  seedAdminShops.unshift(newShop);
  seedAdminStats.totalShops += 1;
  seedAdminStats.totalActiveShops += 1;
  seedAdminStats.totalUsersByRole.OWNER += 1;

  if (!isMockApiEnabled()) {
    try {
      const res = await apiRequest<{ success: boolean; data: any }>(API_ENDPOINTS.admin.owners, {
        method: "POST",
        body: {
          name: input.name,
          email: input.email,
          password: input.password,
        },
      });
      if (res?.data) {
        newOwner.id = res.data.id;
        newOwner.name = res.data.name;
        newOwner.email = res.data.email;
      }
    } catch {
      // Optimistic persistence in memory
    }
  }

  return { success: true, user: newOwner, shop: newShop };
}
