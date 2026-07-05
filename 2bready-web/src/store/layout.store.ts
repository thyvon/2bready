import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type NavOrientation = 'vertical' | 'horizontal';

interface LayoutState {
  navOrientation: NavOrientation;
  setNavOrientation: (orientation: NavOrientation) => void;
  // Desktop-only (see DashboardSidebar) — collapses the vertical sidebar to an
  // icon-only rail. Persisted like navOrientation, since it's a standing
  // layout preference, not per-session UI state.
  sidebarCollapsed: boolean;
  toggleSidebarCollapsed: () => void;
}

export const useLayoutStore = create<LayoutState>()(
  persist(
    (set) => ({
      navOrientation: 'horizontal',
      setNavOrientation: (navOrientation) => set({ navOrientation }),
      sidebarCollapsed: false,
      toggleSidebarCollapsed: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
    }),
    { name: '2bready-layout' }
  )
);
