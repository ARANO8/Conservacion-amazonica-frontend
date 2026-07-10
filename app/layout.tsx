import type { Metadata } from 'next';
import { Outfit } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';
import { ThemeToaster } from '@/components/theme-toaster';
import { ThemeProvider } from '@/components/theme-provider';

const outfit = Outfit({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'AMZdesk | Conservacion Amazonica',
  description: 'AMZdesk, sistema de gestion de solicitudes.',
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
        <ThemeProvider defaultTheme="system">
          {children}
          <ThemeToaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
