'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import Link from 'next/link';
import { SolicitudResponse } from '@/types/solicitud-backend';
import { EstadoBadge } from '@/components/shared/estado-badge';
import { formatDateShort } from '@/lib/utils';

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
    id: 'verDetalle',
    header: '',
    cell: ({ row }) => {
      return (
        <Button asChild variant="ghost" size="sm">
          <Link href={`/app/solicitudes/${row.original.id}?source=monitor`}>
            <Eye className="mr-2 h-4 w-4" />
            Ver Detalle
          </Link>
        </Button>
      );
    },
  },
];
