import Image from 'next/image';
import { LoginForm } from '@/components/auth/login-form';
import { ApiStatus } from '@/components/auth/api-status';
import { ModeToggle } from '@/components/mode-toggle';

export default function LoginPage() {
  return (
    <div className="bg-background relative flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="absolute top-4 right-4 flex items-center gap-4 md:top-6 md:right-6">
        <ModeToggle />
        <ApiStatus />
      </div>
      <div className="w-full max-w-sm">
        <Image
          src="/Logo-AMZ-desk-ok.webp"
          alt="AMZ Desk"
          width={180}
          height={60}
          priority
          className="mx-auto mb-6"
        />
        <LoginForm />
      </div>
    </div>
  );
}
