'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import Link from 'next/link';
import { SolicitudResponse } from '@/types/solicitud-backend';

/**
 * Columnas para el Monitor de Solicitudes (solo lectura).
 * Sin acciones de editar/corregir/eliminar — solo "Ver Detalle".
 */
export const monitorColumns: ColumnDef<SolicitudResponse>[] = [
  {
    accessorKey: 'codigoSolicitud',
    header: 'Código',
    cell: ({ row }) => {
      return (
        <Badge variant="outline" className="font-medium">
          {row.original.codigoSolicitud}
        </Badge>
      );
    },
  },
  {
    id: 'solicitante',
    header: 'Solicitante',
    accessorFn: (row) => row.usuarioEmisor?.nombreCompleto || 'Sin Asignar',
    cell: ({ row }) => {
      const nombre =
        row.original.usuarioEmisor?.nombreCompleto || 'Sin Asignar';
      return <span className="font-medium">{nombre}</span>;
    },
  },
  {
    accessorKey: 'motivoViaje',
    header: 'Motivo',
    cell: ({ row }) => {
      const motivo = row.original.motivoViaje || '-';
      return (
        <div className="max-w-[250px] truncate" title={motivo}>
          {motivo}
        </div>
      );
    },
  },
  {
    id: 'fecha',
    header: 'Fecha',
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
    id: 'aprobador',
    header: 'Aprobador',
    accessorFn: (row) =>
      row.aprobador?.nombreCompleto || row.aprobador?.nombre || '-',
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
    id: 'presupuestado',
    header: () => <div className="text-right">Presupuestado</div>,
    cell: ({ row }) => {
      const amount = Number(row.original.montoTotalPresupuestado || 0);
      const formatted = new Intl.NumberFormat('es-BO', {
        style: 'currency',
        currency: 'BOB',
      }).format(amount);

      return (
        <div className="text-muted-foreground text-right text-xs">
          {formatted}
        </div>
      );
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
        REVIEW_SUPERVISOR:
          'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 hover:bg-yellow-200 dark:hover:bg-yellow-900/40 border-yellow-200 dark:border-yellow-800',
        REVIEW_DIRECTOR:
          'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 hover:bg-yellow-200 dark:hover:bg-yellow-900/40 border-yellow-200 dark:border-yellow-800',
        REVIEW_FINANCE:
          'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 hover:bg-yellow-200 dark:hover:bg-yellow-900/40 border-yellow-200 dark:border-yellow-800',
        APPROVED:
          'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/40 border-emerald-200 dark:border-emerald-800',
        APROBADO:
          'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/40 border-emerald-200 dark:border-emerald-800',
        DISBURSED:
          'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/40 border-emerald-200 dark:border-emerald-800',
        COMPLETED:
          'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/40 border-blue-200 dark:border-blue-800',
        REJECTED:
          'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/40 border-red-200 dark:border-red-800',
        RECHAZADO:
          'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/40 border-red-200 dark:border-red-800',
        OBSERVADO:
          'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/40 border-amber-200 dark:border-amber-800',
        DRAFT:
          'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 border-zinc-200 dark:border-zinc-700',
        BORRADOR:
          'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 border-zinc-200 dark:border-zinc-700',
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
    id: 'verDetalle',
    header: '',
    cell: ({ row }) => {
      return (
        <Button asChild variant="ghost" size="sm">
          <Link href={`/dashboard/solicitud/${row.original.id}?source=monitor`}>
            <Eye className="mr-2 h-4 w-4" />
            Ver Detalle
          </Link>
        </Button>
      );
    },
  },
];
