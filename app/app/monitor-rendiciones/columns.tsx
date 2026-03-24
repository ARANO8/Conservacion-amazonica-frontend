'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { Eye } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EstadoBadge } from '@/components/shared/estado-badge';
import { DownloadRendicionPdfButton } from '@/components/rendiciones/download-rendicion-pdf-button';
import { formatDateShort, formatMoney } from '@/lib/utils';
import type { RendicionResponse } from '@/types/rendicion-backend';

export interface RendicionMonitorRow extends RendicionResponse {
  codigoMonitor: string;
  emisorNombre: string;
  fechaRegistro: string;
  montoRecibido: number;
  saldoLiquidoCalculado: number;
}

export const monitorRendicionesColumns: ColumnDef<RendicionMonitorRow>[] = [
  {
    accessorKey: 'codigoMonitor',
    header: 'Código / ID',
    cell: ({ row }) => {
      return (
        <Badge variant="outline" className="font-medium">
          {row.original.codigoMonitor}
        </Badge>
      );
    },
  },
  {
    id: 'emisor',
    header: 'Emisor',
    accessorFn: (row) => row.emisorNombre,
    cell: ({ row }) => (
      <span className="font-medium">{row.original.emisorNombre}</span>
    ),
  },
  {
    id: 'fecha',
    header: 'Fecha',
    accessorFn: (row) => row.fechaRegistro,
    cell: ({ row }) => formatDateShort(row.original.fechaRegistro),
  },
  {
    id: 'montoRecibido',
    header: 'Monto Recibido',
    accessorFn: (row) => row.montoRecibido,
    cell: ({ row }) => (
      <span className="font-medium text-emerald-600">
        {formatMoney(row.original.montoRecibido)}
      </span>
    ),
  },
  {
    id: 'saldoLiquido',
    header: 'Saldo Líquido',
    accessorFn: (row) => row.saldoLiquidoCalculado,
    cell: ({ row }) => {
      const saldo = row.original.saldoLiquidoCalculado;
      return (
        <span
          className={
            saldo >= 0
              ? 'font-medium text-emerald-600'
              : 'font-medium text-red-600'
          }
        >
          {formatMoney(saldo)}
        </span>
      );
    },
  },
  {
    accessorKey: 'estado',
    header: 'Estado',
    cell: ({ row }) => (
      <EstadoBadge estado={(row.original.estado as string) || ''} />
    ),
  },
  {
    id: 'descargar_pdf',
    header: 'Descargar',
    cell: ({ row }) => (
      <DownloadRendicionPdfButton
        rendicionId={row.original.id}
        fileName={row.original.codigoMonitor}
      />
    ),
  },
  {
    id: 'verDetalle',
    header: '',
    cell: ({ row }) => {
      return (
        <Button asChild variant="ghost" size="sm">
          <Link
            href={`/app/rendiciones/${row.original.id}?source=monitor-rendiciones`}
          >
            <Eye className="mr-2 h-4 w-4" />
            Ver Detalle
          </Link>
        </Button>
      );
    },
  },
];
