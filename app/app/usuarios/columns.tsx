'use client';

import { useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Pencil, Trash2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import type { UsuarioListItem } from '@/lib/services/usuarios-service';

interface UsuariosColumnsOptions {
  onEdit: (usuario: UsuarioListItem) => void;
  onDelete: (usuario: UsuarioListItem) => Promise<void>;
  deletingId: number | null;
}

interface RoleBadgeConfig {
  label: string;
  className: string;
}

const ROLE_BADGES: Record<string, RoleBadgeConfig> = {
  ADMIN: {
    label: 'ADMIN',
    className:
      'border-sky-300 bg-sky-100 text-sky-800 dark:border-sky-700 dark:bg-sky-950/40 dark:text-sky-300',
  },
  TESORERO: {
    label: 'TESORERO',
    className:
      'border-amber-300 bg-amber-100 text-amber-800 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  },
  CONTADOR: {
    label: 'CONTADOR',
    className:
      'border-cyan-300 bg-cyan-100 text-cyan-800 dark:border-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300',
  },
  EJECUTIVO: {
    label: 'EJECUTIVO',
    className:
      'border-fuchsia-300 bg-fuchsia-100 text-fuchsia-800 dark:border-fuchsia-700 dark:bg-fuchsia-950/40 dark:text-fuchsia-300',
  },
  APROBADOR: {
    label: 'APROBADOR',
    className:
      'border-indigo-300 bg-indigo-100 text-indigo-800 dark:border-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300',
  },
  EMISOR: {
    label: 'EMISOR',
    className:
      'border-emerald-300 bg-emerald-100 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
  },
  USUARIO: {
    label: 'EMISOR',
    className:
      'border-emerald-300 bg-emerald-100 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
  },
};

function getRoleBadgeConfig(role: string): RoleBadgeConfig {
  return (
    ROLE_BADGES[role] ?? {
      label: role,
      className:
        'border-zinc-300 bg-zinc-100 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300',
    }
  );
}

function UsuarioActionsCell({
  usuario,
  onEdit,
  onDelete,
  deletingId,
}: {
  usuario: UsuarioListItem;
  onEdit: (usuario: UsuarioListItem) => void;
  onDelete: (usuario: UsuarioListItem) => Promise<void>;
  deletingId: number | null;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const isDeletingCurrent = deletingId === usuario.id;

  return (
    <div className="flex items-center justify-end gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onEdit(usuario)}
        disabled={isDeletingCurrent}
      >
        <Pencil className="mr-2 h-4 w-4" />
        Editar
      </Button>

      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" size="sm" disabled={isDeletingCurrent}>
            <Trash2 className="mr-2 h-4 w-4" />
            Desactivar
          </Button>
        </AlertDialogTrigger>

        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desactivar usuario</AlertDialogTitle>
            <AlertDialogDescription>
              Se desactivara a <strong>{usuario.nombreCompleto}</strong>. Esta
              accion ocultara al usuario de las listas activas.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingCurrent}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeletingCurrent}
              onClick={async (event) => {
                event.preventDefault();
                await onDelete(usuario);
                setIsOpen(false);
              }}
            >
              {isDeletingCurrent ? 'Desactivando...' : 'Confirmar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export function getUsuariosColumns({
  onEdit,
  onDelete,
  deletingId,
}: UsuariosColumnsOptions): ColumnDef<UsuarioListItem>[] {
  return [
    {
      accessorKey: 'nombreCompleto',
      header: 'Nombre',
      cell: ({ row }) => (
        <span className="font-medium">{row.original.nombreCompleto}</span>
      ),
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.email}</span>
      ),
    },
    {
      accessorKey: 'rol',
      header: 'Rol',
      cell: ({ row }) => {
        const config = getRoleBadgeConfig(String(row.original.rol));
        return (
          <Badge variant="outline" className={config.className}>
            {config.label}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'cargo',
      header: 'Cargo',
      cell: ({ row }) => row.original.cargo || '-',
    },
    {
      id: 'acciones',
      header: () => <div className="text-right">Acciones</div>,
      cell: ({ row }) => (
        <UsuarioActionsCell
          usuario={row.original}
          onEdit={onEdit}
          onDelete={onDelete}
          deletingId={deletingId}
        />
      ),
    },
  ];
}
