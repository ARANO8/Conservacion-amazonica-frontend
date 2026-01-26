import Image from 'next/image';
import { SignupForm } from '@/components/auth/signup-form';

export default function SignupPage() {
  return (
    <div className="bg-background flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Image
          src="/Logo-AMZ-desk-ok.webp"
          alt="AMZ Desk"
          width={180}
          height={60}
          priority
          className="mx-auto mb-6"
        />
        <SignupForm />
      </div>
    </div>
  );
}
