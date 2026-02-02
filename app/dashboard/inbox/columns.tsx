'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SolicitudResponse } from '@/types/solicitud-backend';
import { InboxActions } from './inbox-actions';
import { Eye } from 'lucide-react';
import Link from 'next/link';

export const columns: ColumnDef<SolicitudResponse>[] = [
  {
    accessorKey: 'codigoSolicitud',
    header: 'Código',
    cell: ({ row }) => {
      return (
        <Link href={`/dashboard/inbox/${row.original.id}`}>
          <Badge
            variant="outline"
            className="hover:bg-muted cursor-pointer font-medium"
          >
            {row.original.codigoSolicitud}
          </Badge>
        </Link>
      );
    },
  },
  {
    accessorKey: 'motivoViaje',
    header: 'Motivo',
    cell: ({ row }) => {
      const motivo = row.original.motivoViaje || '-';
      return (
        <div className="max-w-[300px] truncate" title={motivo}>
          {motivo}
        </div>
      );
    },
  },
  {
    id: 'fecha',
    header: 'Fecha Solicitud',
    accessorFn: (row) => row.fechaSolicitud,
    cell: ({ row }) => {
      const value = row.original.fechaSolicitud;
      if (!value) return '-';

      const date = new Date(value);
      if (isNaN(date.getTime())) return '-';

      return new Intl.DateTimeFormat('es-BO', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).format(date);
    },
  },
  {
    id: 'solicitante',
    header: 'Solicitante',
    accessorFn: (row) => row.usuarioEmisor?.nombreCompleto || 'Sin Asignar',
  },
  {
    id: 'montoNeto',
    header: () => <div className="text-right">Monto Neto</div>,
    cell: ({ row }) => {
      const amount = Number(row.original.montoTotalNeto || 0);
      const formatted = new Intl.NumberFormat('es-BO', {
        style: 'currency',
        currency: 'BOB',
      }).format(amount);

      return <div className="text-right font-medium">{formatted}</div>;
    },
  },
  {
    accessorKey: 'estado',
    header: 'Estado',
    cell: ({ row }) => {
      const estado = (row.original.estado as string) || '';

      const variants: Record<string, string> = {
        PENDIENTE:
          'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 hover:bg-yellow-200 dark:hover:bg-yellow-900/40 border-yellow-200 dark:border-yellow-800',
        PENDING:
          'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 hover:bg-yellow-200 dark:hover:bg-yellow-900/40 border-yellow-200 dark:border-yellow-800',
        APPROVED:
          'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/40 border-emerald-200 dark:border-emerald-800',
        APROBADO:
          'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/40 border-emerald-200 dark:border-emerald-800',
        REJECTED:
          'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/40 border-red-200 dark:border-red-800',
        RECHAZADO:
          'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/40 border-red-200 dark:border-red-800',
      };

      return (
        <Badge
          variant="outline"
          className={
            variants[estado] ||
            'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400'
          }
        >
          {estado}
        </Badge>
      );
    },
  },
  {
    id: 'revisar',
    header: '',
    cell: ({ row }) => (
      <Button asChild variant="ghost" size="sm">
        <Link href={`/dashboard/inbox/${row.original.id}`}>
          <Eye className="mr-2 h-4 w-4" />
          Revisar
        </Link>
      </Button>
    ),
  },
  {
    id: 'actions',
    cell: ({ row }) => <InboxActions request={row.original} />,
  },
];
