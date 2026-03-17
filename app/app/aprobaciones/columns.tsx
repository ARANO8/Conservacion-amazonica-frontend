'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SolicitudResponse } from '@/types/solicitud-backend';
import { Eye } from 'lucide-react';
import Link from 'next/link';
import { DownloadPdfButton } from '@/components/solicitudes/download-pdf-button';
import { EstadoBadge } from '@/components/shared/estado-badge';
import { formatMoney, formatDateShort } from '@/lib/utils';

export const columns: ColumnDef<SolicitudResponse>[] = [
  {
    accessorKey: 'codigoSolicitud',
    header: 'Código',
    cell: ({ row }) => {
      return (
        <Link href={`/app/aprobaciones/${row.original.id}`}>
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
    cell: ({ row }) => formatDateShort(row.original.fechaSolicitud),
  },
  {
    id: 'solicitante',
    header: 'Solicitante',
    accessorFn: (row) => row.usuarioEmisor?.nombreCompleto || 'Sin Asignar',
  },
  {
    id: 'montoNeto',
    header: () => <div className="text-right">Monto Neto</div>,
    cell: ({ row }) => (
      <div className="text-right font-medium">
        {formatMoney(Number(row.original.montoTotalNeto || 0))}
      </div>
    ),
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
    header: 'Acciones',
    cell: ({ row }) => (
      <Button asChild variant="ghost" size="sm">
        <Link href={`/app/solicitudes/${row.original.id}?source=aprobaciones`}>
          <Eye className="mr-2 h-4 w-4" />
          Revisar
        </Link>
      </Button>
    ),
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
