import { create } from 'zustand';

interface UIState {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;

  globalSearchOpen: boolean;
  setGlobalSearchOpen: (open: boolean) => void;

  notificationsOpen: boolean;
  setNotificationsOpen: (open: boolean) => void;

  darkMode: boolean;
  toggleDarkMode: () => void;
}

const getInitialDarkMode = (): boolean => {
  if (typeof window === 'undefined') return false;
  const saved = localStorage.getItem('theme');
  if (saved) {
    const isDark = saved === 'dark';
    if (isDark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    return isDark;
  }
  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  if (prefersDark) document.documentElement.classList.add('dark');
  return prefersDark;
};

export const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed: false,
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

  globalSearchOpen: false,
  setGlobalSearchOpen: (open) => set({ globalSearchOpen: open }),

  notificationsOpen: false,
  setNotificationsOpen: (open) => set({ notificationsOpen: open }),

  darkMode: getInitialDarkMode(),
  toggleDarkMode: () =>
    set((state) => {
      const next = !state.darkMode;
      if (typeof window !== 'undefined') {
        if (next) {
          document.documentElement.classList.add('dark');
          localStorage.setItem('theme', 'dark');
        } else {
          document.documentElement.classList.remove('dark');
          localStorage.setItem('theme', 'light');
        }
      }
      return { darkMode: next };
    }),
}));
