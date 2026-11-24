'use client';

import Image from 'next/image';
import { withBasePath } from '@/lib/utils';
import { LoginForm } from '@/components/auth/login-form';
import { ApiStatus } from '@/components/auth/api-status';
import { ModeToggle } from '@/components/mode-toggle';
import { MANUAL_USUARIO_URL } from '@/lib/manual';

export default function LoginPage() {
  return (
    <div className="bg-background relative flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="absolute top-4 right-4 flex items-center gap-4 md:top-6 md:right-6">
        <ModeToggle />
        <ApiStatus />
      </div>
      <div className="w-full max-w-sm">
        <Image
          src={withBasePath('/Logo-AMZ-desk-ok.webp')}
          alt="AMZdesk"
          width={180}
          height={60}
          priority
          className="mx-auto mb-6"
          style={{ width: 'auto', height: 'auto' }}
        />
        <LoginForm />
        <p className="text-muted-foreground mt-6 text-center text-sm">
          ¿Primera vez en AMZ Desk?{' '}
          <a
            href={MANUAL_USUARIO_URL}
            target="_blank"
            rel="noopener"
            className="text-primary font-medium underline-offset-4 hover:underline"
          >
            Lee el manual de usuario
          </a>
        </p>
      </div>
    </div>
  );
}
