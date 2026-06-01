import { create } from 'zustand';

function getStoredTheme() {
  const stored = typeof window !== 'undefined' ? localStorage.getItem('maad_theme') : 'light';
  return stored === 'dark' ? 'dark' : 'light';
}

const useThemeStore = create((set, get) => ({
  theme: getStoredTheme(),

  toggleTheme: () => {
    const next = get().theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('maad_theme', next);
    document.documentElement.classList.toggle('dark', next === 'dark');
    set({ theme: next });
  },

  initTheme: () => {
    const theme = getStoredTheme();
    document.documentElement.classList.toggle('dark', theme === 'dark');
    set({ theme });
  },
}));

export { useThemeStore };
