'use client';

import { GalleryVerticalEnd } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import axios from 'axios';
import * as z from 'zod';
import { useState } from 'react'; // Import useState explicitly just in case

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/store/auth-store';

// Esquema de validación
const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

type LoginSchema = z.infer<typeof loginSchema>;

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  const router = useRouter();
  const { login, isLoading: authLoading } = useAuthStore();
  // Estado local para errores generales (fuera de campos específicos)
  const [formRootError, setFormRootError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isLoading },
  } = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginSchema) => {
    setFormRootError(null);
    try {
      await login(data);
      router.push('/dashboard');
    } catch (error) {
      // Manejar error de NestJS: { message: string | string[], statusCode: number }
      // O error genérico de conexión
      let errorMessage = 'Error al iniciar sesión';

      if (axios.isAxiosError(error) && error.response?.data?.message) {
        const msg = error.response.data.message;
        errorMessage = Array.isArray(msg) ? msg.join(', ') : msg;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      setFormRootError(errorMessage);
    }
  };

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <FieldGroup>
          <div className="flex flex-col items-center gap-2 text-center">
            <a
              href="#"
              className="flex flex-col items-center gap-2 font-medium"
            >
              <div className="flex size-8 items-center justify-center rounded-md">
                <GalleryVerticalEnd className="size-6" />
              </div>
              {/* <span className="sr-only">SyFin</span> */}
            </a>
            <h1 className="text-xl font-bold">Bienvenido a SyFin</h1>
            <FieldDescription>
              No tienes una cuenta? <Link href="/signup">Registrarse</Link>
            </FieldDescription>
          </div>

          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              {...register('email')}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </Field>

          <Field>
            <div className="flex items-center justify-between">
              <FieldLabel htmlFor="password">Contraseña</FieldLabel>
              <Link
                href="/forgot-password"
                className="text-muted-foreground text-xs underline-offset-4 hover:underline"
              >
                Olvidaste tu contraseña?
              </Link>
            </div>
            <Input id="password" type="password" {...register('password')} />
            {errors.password && (
              <p className="text-sm text-red-500">{errors.password.message}</p>
            )}
          </Field>

          {formRootError && (
            <div className="bg-destructive/15 text-destructive rounded-md p-3 text-sm">
              {formRootError}
            </div>
          )}

          <Field>
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || authLoading}
            >
              {authLoading || isLoading ? 'Ingresando...' : 'Ingresar'}
            </Button>
          </Field>
        </FieldGroup>
      </form>
      <FieldDescription className="px-6 text-center">
        Desarrollado por <a href="#">Team aran08 </a>.
      </FieldDescription>
    </div>
  );
}
