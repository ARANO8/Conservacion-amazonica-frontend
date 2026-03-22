'use client';

import { useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import type {
  CreateUsuarioInput,
  UpdateUsuarioInput,
  UsuarioListItem,
} from '@/lib/services/usuarios-service';

const createUsuarioSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  email: z.string().email('Ingresa un email valido'),
  password: z.string().min(6, 'La contrasena debe tener al menos 6 caracteres'),
  rol: z.enum(['ADMIN', 'EJECUTIVO', 'TESORERO', 'USUARIO']),
  cargo: z.string().optional(),
});

const updateUsuarioSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  email: z.string().email('Ingresa un email valido'),
  password: z
    .string()
    .optional()
    .refine(
      (value) => !value || value.length === 0 || value.length >= 6,
      'La contrasena debe tener al menos 6 caracteres'
    ),
  rol: z.enum(['ADMIN', 'EJECUTIVO', 'TESORERO', 'USUARIO']),
  cargo: z.string().optional(),
});

type CreateUsuarioFormValues = z.infer<typeof createUsuarioSchema>;
type UpdateUsuarioFormValues = z.infer<typeof updateUsuarioSchema>;
type UsuarioFormValues = CreateUsuarioFormValues | UpdateUsuarioFormValues;

interface UsuarioFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  initialData?: UsuarioListItem | null;
  isSubmitting: boolean;
  onCreate: (data: CreateUsuarioInput) => Promise<void>;
  onUpdate: (id: number, data: UpdateUsuarioInput) => Promise<void>;
}

const ROLE_OPTIONS = [
  { value: 'ADMIN', label: 'ADMIN' },
  { value: 'EJECUTIVO', label: 'EJECUTIVO' },
  { value: 'TESORERO', label: 'TESORERO' },
  { value: 'USUARIO', label: 'EMISOR' },
] as const;

function mapRoleToFormRole(
  role: string | undefined
): 'ADMIN' | 'EJECUTIVO' | 'TESORERO' | 'USUARIO' {
  if (
    role === 'ADMIN' ||
    role === 'EJECUTIVO' ||
    role === 'TESORERO' ||
    role === 'USUARIO'
  ) {
    return role;
  }

  if (role === 'EMISOR') {
    return 'USUARIO';
  }

  return 'USUARIO';
}

export function UsuarioFormModal({
  open,
  onOpenChange,
  mode,
  initialData,
  isSubmitting,
  onCreate,
  onUpdate,
}: UsuarioFormModalProps) {
  const form = useForm<UsuarioFormValues>({
    resolver: zodResolver(
      mode === 'create' ? createUsuarioSchema : updateUsuarioSchema
    ),
    defaultValues: {
      nombre: '',
      email: '',
      password: '',
      rol: 'USUARIO',
      cargo: '',
    },
  });

  useEffect(() => {
    if (!open) {
      form.reset({
        nombre: '',
        email: '',
        password: '',
        rol: 'USUARIO',
        cargo: '',
      });
      return;
    }

    if (mode === 'edit' && initialData) {
      form.reset({
        nombre: initialData.nombreCompleto,
        email: initialData.email,
        password: '',
        rol: mapRoleToFormRole(String(initialData.rol)),
        cargo: initialData.cargo || '',
      });
    }
  }, [form, initialData, mode, open]);

  const title = mode === 'create' ? 'Crear usuario' : 'Editar usuario';
  const description =
    mode === 'create'
      ? 'Registra una nueva cuenta para aprovisionamiento administrado.'
      : 'Actualiza la informacion del usuario seleccionado.';

  const passwordPlaceholder =
    mode === 'create'
      ? 'Minimo 6 caracteres'
      : 'Opcional: dejar vacio para mantener actual';

  const submitLabel =
    mode === 'create'
      ? isSubmitting
        ? 'Creando...'
        : 'Crear usuario'
      : isSubmitting
        ? 'Guardando...'
        : 'Guardar cambios';

  const onSubmit = async (values: UsuarioFormValues) => {
    const payload = {
      nombre: values.nombre,
      email: values.email,
      password: values.password,
      rol: values.rol,
      cargo: values.cargo,
    };

    if (mode === 'create') {
      await onCreate(payload as CreateUsuarioInput);
      return;
    }

    if (!initialData) return;
    await onUpdate(initialData.id, payload as UpdateUsuarioInput);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input placeholder="Nombre completo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="usuario@dominio.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder={passwordPlaceholder}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="rol"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rol</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecciona un rol" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ROLE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cargo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cargo</FormLabel>
                    <FormControl>
                      <Input placeholder="Cargo del usuario" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {submitLabel}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default UsuarioFormModal;
