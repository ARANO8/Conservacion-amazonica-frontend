import type { Metadata } from 'next';
import { Outfit } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';
import { ThemeToaster } from '@/components/theme-toaster';
import { ThemeProvider } from '@/components/theme-provider';

const outfit = Outfit({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'AMZ desk | Conservacion Amazonica',
  description: 'Sistema de Gestión de Solicitudes',
  icons: {
    icon: '/Logo-AMZ-desk-ok.webp',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={cn('dark', outfit.variable)}
    >
      <body className="font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <ThemeToaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
