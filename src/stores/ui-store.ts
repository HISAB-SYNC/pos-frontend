import { create } from "zustand";
import { persist } from "zustand/middleware";

type UiState = {
  sidebarCollapsed: boolean;
  mobileSidebarOpen: boolean;
  notificationPanelOpen: boolean;
  setSidebarCollapsed: (value: boolean) => void;
  setMobileSidebarOpen: (value: boolean) => void;
  toggleSidebarCollapsed: () => void;
  setNotificationPanelOpen: (value: boolean) => void;
  toggleNotificationPanel: () => void;
};

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      mobileSidebarOpen: false,
      notificationPanelOpen: false,
      setSidebarCollapsed: (value) => set({ sidebarCollapsed: value }),
      setMobileSidebarOpen: (value) => set({ mobileSidebarOpen: value }),
      toggleSidebarCollapsed: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setNotificationPanelOpen: (value) => set({ notificationPanelOpen: value }),
      toggleNotificationPanel: () =>
        set((state) => ({ notificationPanelOpen: !state.notificationPanelOpen })),
    }),
    {
      name: "andalus-ui",
      partialize: (state) => ({ sidebarCollapsed: state.sidebarCollapsed }),
    },
  ),
);
