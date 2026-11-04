import { create } from "zustand";
import { persist } from "zustand/middleware";

type UiState = {
  sidebarCollapsed: boolean;
  mobileSidebarOpen: boolean;
  notificationPanelOpen: boolean;
  commandPaletteOpen: boolean;
  /** Unread notifications for the active shop (shared by header and sidebar). */
  unreadNotifications: number;
  setSidebarCollapsed: (value: boolean) => void;
  setMobileSidebarOpen: (value: boolean) => void;
  toggleSidebarCollapsed: () => void;
  setNotificationPanelOpen: (value: boolean) => void;
  toggleNotificationPanel: () => void;
  setCommandPaletteOpen: (value: boolean) => void;
  toggleCommandPalette: () => void;
  setUnreadNotifications: (count: number | ((current: number) => number)) => void;
};

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      mobileSidebarOpen: false,
      notificationPanelOpen: false,
      commandPaletteOpen: false,
      unreadNotifications: 0,
      setSidebarCollapsed: (value) => set({ sidebarCollapsed: value }),
      setMobileSidebarOpen: (value) => set({ mobileSidebarOpen: value }),
      toggleSidebarCollapsed: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setNotificationPanelOpen: (value) => set({ notificationPanelOpen: value }),
      toggleNotificationPanel: () =>
        set((state) => ({ notificationPanelOpen: !state.notificationPanelOpen })),
      setCommandPaletteOpen: (value) => set({ commandPaletteOpen: value }),
      toggleCommandPalette: () =>
        set((state) => ({ commandPaletteOpen: !state.commandPaletteOpen })),
      setUnreadNotifications: (count) =>
        set((state) => ({
          unreadNotifications: Math.max(0, typeof count === "function" ? count(state.unreadNotifications) : count),
        })),
    }),
    {
      name: "andalus-ui",
      partialize: (state) => ({ sidebarCollapsed: state.sidebarCollapsed }),
    },
  ),
);
