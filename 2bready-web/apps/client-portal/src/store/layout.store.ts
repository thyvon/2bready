import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type NavMode = 'topbar' | 'sidebar';

interface LayoutState {
  navMode: NavMode;
  setNavMode: (mode: NavMode) => void;
  sidebarCollapsed: boolean;
  toggleSidebarCollapsed: () => void;
  sidebarMobileOpen: boolean;
  setSidebarMobileOpen: (open: boolean) => void;
  settingsDrawerOpen: boolean;
  setSettingsDrawerOpen: (open: boolean) => void;
}

export const useLayoutStore = create<LayoutState>()(
  persist(
    (set) => ({
      navMode: 'sidebar',
      setNavMode: (navMode) => set({ navMode }),
      sidebarCollapsed: false,
      toggleSidebarCollapsed: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      sidebarMobileOpen: false,
      setSidebarMobileOpen: (open) => set({ sidebarMobileOpen: open }),
      settingsDrawerOpen: false,
      setSettingsDrawerOpen: (open) => set({ settingsDrawerOpen: open }),
    }),
    { name: '2bready-client-layout' },
  ),
);
