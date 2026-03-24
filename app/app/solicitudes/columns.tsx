'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, FileText, Plus } from 'lucide-react';
import Link from 'next/link';
import { SolicitudResponse } from '@/types/solicitud-backend';
import { DownloadPdfButton } from '@/components/solicitudes/download-pdf-button';
import { EstadoBadge } from '@/components/shared/estado-badge';
import { formatDateShort } from '@/lib/utils';

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
    cell: ({ row }) => formatDateShort(row.original.fechaSolicitud),
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
    cell: ({ row }) => (
      <EstadoBadge estado={(row.original.estado as string) || ''} />
    ),
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
      const tieneRendicion = !!row.original.rendicion;
      const esDesembolsado = row.original.estado === 'DESEMBOLSADO';
      const esEjecutado = row.original.estado === 'EJECUTADO';

      // Prioridad 1: Si ya tiene rendición, mostrar botón "Ver Rendición"
      if (tieneRendicion || esEjecutado) {
        return (
          <Button asChild variant="secondary" size="sm">
            <Link href={`/app/rendiciones/detalle/${row.original.id}`}>
              <FileText className="mr-2 h-4 w-4" />
              Ver Rendición
            </Link>
          </Button>
        );
      }

      // Prioridad 2: Si está desembolsado y NO tiene rendición, permitir crear
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

      return <span className="text-muted-foreground text-xs">-</span>;
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
