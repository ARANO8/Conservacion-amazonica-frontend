'use client';

import { useTheme } from 'next-themes';
import { Toaster } from 'sonner';

export function ThemeToaster() {
  const { theme } = useTheme();

  return (
    <Toaster
      theme={theme as 'light' | 'dark' | 'system'}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg',
          description: 'group-[.toaster]:text-muted-foreground',
          actionButton:
            'group-[.toaster]:bg-primary group-[.toaster]:text-primary-foreground',
          cancelButton:
            'group-[.toaster]:bg-muted group-[.toaster]:text-muted-foreground',
        },
      }}
    />
  );
}
