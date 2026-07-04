import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type NavOrientation = 'vertical' | 'horizontal';

interface LayoutState {
  navOrientation: NavOrientation;
  setNavOrientation: (orientation: NavOrientation) => void;
}

export const useLayoutStore = create<LayoutState>()(
  persist(
    (set) => ({
      navOrientation: 'horizontal',
      setNavOrientation: (navOrientation) => set({ navOrientation }),
    }),
    { name: '2bready-layout' }
  )
);
