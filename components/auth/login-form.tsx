'use client';

import { Eye, EyeOff, Mail } from 'lucide-react';
import Image from 'next/image';
import { withBasePath } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import axios from 'axios';
import * as z from 'zod';
import { useState } from 'react';

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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';

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
  const [showPassword, setShowPassword] = useState(false);
  const [showSplash, setShowSplash] = useState(false);

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
      setShowSplash(true);
      setTimeout(() => {
        router.push('/app/inicio');
      }, 1800);
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
    <>
      <div className={cn('flex flex-col gap-6', className)} {...props}>
        <form onSubmit={handleSubmit(onSubmit)} method="post" action="#">
          <FieldGroup>
            <div className="flex flex-col items-center gap-2 text-center">
              <h1 className="text-xl font-bold">Bienvenido a AMZ Desk</h1>
              <FieldDescription>
                Ingrese sus credenciales para acceder al sistema.
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
                <Dialog>
                  <DialogTrigger asChild>
                    <button
                      type="button"
                      className="text-muted-foreground text-xs underline-offset-4 hover:underline"
                    >
                      Olvidaste tu contraseña?
                    </button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Restablecer Contraseña</DialogTitle>
                      <DialogDescription>
                        Para restablecer su contraseña, por favor contáctese con
                        el administrador del sistema.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="bg-muted/50 flex items-center gap-3 rounded-lg p-4">
                      <Mail className="text-primary h-5 w-5" />
                      <a
                        href="mailto:example@gmail.com"
                        className="text-primary font-medium hover:underline"
                      >
                        example@gmail.com
                      </a>
                    </div>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button variant="outline">Entendido</Button>
                      </DialogClose>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-500">
                  {errors.password.message}
                </p>
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

      {showSplash && (
        <div className="bg-background dark:bg-card fixed inset-0 z-[9999] flex flex-col items-center justify-center">
          <div className="animate-pulse">
            <Image
              src={withBasePath('/Logo-AMZ-desk-ok.webp')}
              alt="Logo AMZdesk"
              width={300}
              height={100}
              priority
              className="h-auto w-[280px] md:w-[320px]"
              style={{ height: 'auto' }}
            />
          </div>
          <p className="text-muted-foreground mt-5 text-sm md:text-base">
            Preparando tu entorno de trabajo...
          </p>
        </div>
      )}
    </>
  );
}
