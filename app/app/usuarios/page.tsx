'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Users } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/store/auth-store';
import {
  usuariosService,
  type CreateUsuarioInput,
  type UpdateUsuarioInput,
  type UsuarioListItem,
} from '@/lib/services/usuarios-service';
import { getUsuariosColumns } from './columns';
import { UsuariosTable } from './usuarios-table';
import { UsuarioFormModal } from './usuario-form-modal';

type FormMode = 'create' | 'edit';

export default function UsuariosPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [usuarios, setUsuarios] = useState<UsuarioListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>('create');
  const [selectedUsuario, setSelectedUsuario] =
    useState<UsuarioListItem | null>(null);

  const isAdmin = user?.rol === 'ADMIN';

  useEffect(() => {
    if (user && !isAdmin) {
      router.replace('/app/inicio');
    }
  }, [isAdmin, router, user]);

  const loadUsuarios = async () => {
    try {
      setIsLoading(true);
      const data = await usuariosService.getAll();
      setUsuarios(data);
    } catch {
      toast.error('No se pudo cargar la gestion de usuarios.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isAdmin) {
      setIsLoading(false);
      return;
    }

    void loadUsuarios();
  }, [isAdmin]);

  const openCreateModal = () => {
    setFormMode('create');
    setSelectedUsuario(null);
    setIsModalOpen(true);
  };

  const openEditModal = (usuario: UsuarioListItem) => {
    setFormMode('edit');
    setSelectedUsuario(usuario);
    setIsModalOpen(true);
  };

  const handleCreate = async (data: CreateUsuarioInput) => {
    try {
      setIsSaving(true);
      const created = await usuariosService.create(data);
      setUsuarios((prev) => [created, ...prev]);
      setIsModalOpen(false);
      toast.success('Usuario creado correctamente.');
    } catch {
      toast.error('No se pudo crear el usuario.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdate = async (id: number, data: UpdateUsuarioInput) => {
    try {
      setIsSaving(true);
      const updated = await usuariosService.update(id, data);
      setUsuarios((prev) =>
        prev.map((usuario) => (usuario.id === id ? updated : usuario))
      );
      setIsModalOpen(false);
      toast.success('Usuario actualizado correctamente.');
    } catch {
      toast.error('No se pudo actualizar el usuario.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (usuario: UsuarioListItem) => {
    try {
      setDeletingId(usuario.id);
      await usuariosService.delete(usuario.id);
      setUsuarios((prev) => prev.filter((item) => item.id !== usuario.id));
      toast.success('Usuario desactivado correctamente.');
    } catch {
      toast.error('No se pudo desactivar el usuario.');
    } finally {
      setDeletingId(null);
    }
  };

  const columns = useMemo(
    () =>
      getUsuariosColumns({
        onEdit: openEditModal,
        onDelete: handleDelete,
        deletingId,
      }),
    [deletingId]
  );

  if (user && !isAdmin) {
    return null;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <Users className="text-primary h-7 w-7" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Gestion de Usuarios
            </h1>
            <p className="text-muted-foreground">
              Modulo de aprovisionamiento de cuentas administrado por ADMIN.
            </p>
          </div>
        </div>

        <Button onClick={openCreateModal} className="gap-2">
          <Plus className="h-4 w-4" />
          Nuevo usuario
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      ) : (
        <UsuariosTable columns={columns} data={usuarios} />
      )}

      <UsuarioFormModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        mode={formMode}
        initialData={selectedUsuario}
        isSubmitting={isSaving}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
      />
    </div>
  );
}
