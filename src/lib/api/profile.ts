import { isMockApiEnabled } from "@/config/env";
import { apiRequest } from "./client";
import { API_ENDPOINTS } from "./endpoints";
import type { UpdateProfileInput, UserProfile } from "./types";

/* ------------------------------------------------------------------ */
/* User Profile API                                                    */
/* ------------------------------------------------------------------ */
export async function getUserProfile(): Promise<UserProfile> {
  const { DEMO_CREDENTIALS } = await import("@/config/env");

  if (isMockApiEnabled()) {
    return {
      id: "u-profile-1",
      email: DEMO_CREDENTIALS.owner.email,
      name: "Alex Owner",
      role: "OWNER",
      shopId: null,
      isActive: true,
      createdAt: "2026-08-12T08:50:41.994Z",
      ownedShops: [
        {
          id: "648408bb-c857-43eb-92fe-018cb8a1eb47",
          name: "SuperMart Boutique",
          businessType: "boutique",
          currency: "ETB",
          taxRate: "15.00",
          isActive: true,
        },
        {
          id: "759519cc-d968-54fc-03af-129dc9b2fc58",
          name: "Andalus Electronics",
          businessType: "electronics",
          currency: "ETB",
          taxRate: "15.00",
          isActive: true,
        },
      ],
      shop: null,
    };
  }

  // Errors propagate: Settings must never show a demo profile as if it were yours.
  return apiRequest<UserProfile>(API_ENDPOINTS.auth.profile);
}

export async function updateUserProfile(input: UpdateProfileInput): Promise<UserProfile> {
  if (isMockApiEnabled()) {
    const existing = await getUserProfile();
    return {
      ...existing,
      email: input.email || existing.email,
      name: input.name || existing.name,
      updatedAt: new Date().toISOString(),
    };
  }

  return apiRequest<UserProfile>(API_ENDPOINTS.auth.profile, {
    method: "PATCH",
    body: input,
  });
}
