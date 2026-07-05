'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

type Theme = 'light' | 'dark' | 'system';
type ResolvedTheme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: ResolvedTheme;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'dark',
  setTheme: () => {},
  resolvedTheme: 'dark',
});

function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

function getStoredTheme(defaultTheme: Theme): Theme {
  if (typeof window === 'undefined') return defaultTheme;
  try {
    return (localStorage.getItem('theme') as Theme) || defaultTheme;
  } catch {
    return defaultTheme;
  }
}

function applyTheme(resolved: ResolvedTheme) {
  document.documentElement.classList.remove('light', 'dark');
  document.documentElement.classList.add(resolved);
}

export function ThemeProvider({
  children,
  defaultTheme = 'system',
}: {
  children: ReactNode;
  defaultTheme?: Theme;
}) {
  const [theme, setThemeState] = useState<Theme>(
    () => getStoredTheme(defaultTheme),
  );
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => {
    const t = getStoredTheme(defaultTheme);
    return t === 'system' ? getSystemTheme() : t;
  });

  useEffect(() => {
    applyTheme(resolvedTheme);
  }, [resolvedTheme]);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      if (theme === 'system') {
        const newResolved = mq.matches ? 'dark' : 'light';
        setResolvedTheme(newResolved);
      }
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme]);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
    const resolved = newTheme === 'system' ? getSystemTheme() : newTheme;
    setResolvedTheme(resolved);
    applyTheme(resolved);
  }, []);

  const value = useMemo(
    () => ({ theme, setTheme, resolvedTheme }),
    [theme, setTheme, resolvedTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
