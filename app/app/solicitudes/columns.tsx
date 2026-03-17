'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, FileText, Plus } from 'lucide-react';
import Link from 'next/link';
import { SolicitudResponse } from '@/types/solicitud-backend';
import { DownloadPdfButton } from '@/components/solicitudes/download-pdf-button';

export const columns: ColumnDef<SolicitudResponse>[] = [
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
    id: 'aprobador',
    header: 'Aprobador',
    accessorFn: (row) =>
      row.aprobador?.nombreCompleto || row.aprobador?.nombre || '-',
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
        DESEMBOLSADO:
          'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/40 border-emerald-200 dark:border-emerald-800',
        COMPLETED:
          'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/40 border-blue-200 dark:border-blue-800',
        EJECUTADO:
          'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/40 border-blue-200 dark:border-blue-800',
        REJECTED:
          'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/40 border-red-200 dark:border-red-800',
        RECHAZADO:
          'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/40 border-red-200 dark:border-red-800',
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
    id: 'revisar',
    header: 'Revisar',
    cell: ({ row }) => {
      const isObserved = row.original.estado === 'OBSERVADO';

      if (isObserved) {
        return (
          <Button
            asChild
            variant="outline"
            size="sm"
            className="border-amber-600 text-amber-600 hover:bg-amber-50 dark:border-amber-500 dark:text-amber-500 dark:hover:bg-amber-950/30"
          >
            <Link
              href={`/app/solicitudes/${row.original.id}/editar?source=solicitudes`}
            >
              <Eye className="mr-2 h-4 w-4" />
              Corregir
            </Link>
          </Button>
        );
      }

      return (
        <Button asChild variant="ghost" size="sm">
          <Link href={`/app/solicitudes/${row.original.id}?source=solicitudes`}>
            <Eye className="mr-2 h-4 w-4" />
            Revisar
          </Link>
        </Button>
      );
    },
  },
  {
    id: 'rendicion',
    header: 'Rendición',
    cell: ({ row }) => {
      const tienneRendicion = !!row.original.rendicion;
      const esDesembolsado = row.original.estado === 'DESEMBOLSADO';
      const esEjecutado = row.original.estado === 'EJECUTADO';

      if (tienneRendicion) {
        return (
          <Button asChild variant="outline" size="sm">
            <Link href={`/app/rendiciones/${row.original.rendicion!.id}`}>
              <FileText className="mr-2 h-4 w-4" />
              Ver Rendición
            </Link>
          </Button>
        );
      }

      if (esDesembolsado) {
        return (
          <Button asChild variant="outline" size="sm">
            <Link
              href={`/app/rendiciones/nueva?solicitudId=${row.original.id}`}
            >
              <Plus className="mr-2 h-4 w-4" />
              Crear
            </Link>
          </Button>
        );
      }

      if (esEjecutado) {
        return (
          <span className="text-muted-foreground text-xs">Sin rendición</span>
        );
      }

      return null;
    },
  },
  {
    id: 'actions',
    header: 'Descargar',
    cell: ({ row }) => (
      <DownloadPdfButton
        solicitudId={row.original.id}
        codigoSolicitud={row.original.codigoSolicitud}
      />
    ),
  },
];
