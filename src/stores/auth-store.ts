import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { Role } from "@/lib/permissions/roles";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  shopId?: string | null;
};

type AuthState = {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  setSession: (user: AuthUser, accessToken: string) => void;
  clearSession: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      setSession: (user, accessToken) => set({ user, accessToken, isAuthenticated: true }),
      clearSession: () => set({ user: null, accessToken: null, isAuthenticated: false }),
    }),
    {
      name: "andalus-auth",
    },
  ),
);
