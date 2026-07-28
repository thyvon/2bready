import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface LayoutState {
  // Desktop-only (see DashboardSidebar) — collapses the vertical sidebar to an
  // icon-only rail. Persisted, since it's a standing layout preference, not
  // per-session UI state. Mirrors admin-portal's layout.store.ts, minus
  // navOrientation — this app has no horizontal-nav mode.
  sidebarCollapsed: boolean;
  toggleSidebarCollapsed: () => void;
}

export const useLayoutStore = create<LayoutState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      toggleSidebarCollapsed: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
    }),
    { name: '2bready-tp-layout' }
  )
);
