'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ExternalLink } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatMoney, formatDate } from '@/lib/utils';
import type { GastoRendicionResponse } from '@/types/rendicion-backend';
import type { PartidaContable } from '@/types/catalogs';

interface RendicionGastosSectionProps {
  gastos: GastoRendicionResponse[];
  canEditPartidaContable?: boolean;
  partidasContables?: PartidaContable[];
  onUpdatePartidaContable?: (gastoId: number, partidaContableId: number | null) => Promise<void>;
}

function toNumber(value: string | number | null | undefined): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

export function RendicionGastosSection({
  gastos,
  canEditPartidaContable = false,
  partidasContables = [],
  onUpdatePartidaContable,
}: RendicionGastosSectionProps) {
  if (!gastos || gastos.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Gastos Registrados</CardTitle>
        <p className="text-muted-foreground text-sm">
          {gastos.length} gasto{gastos.length !== 1 ? 's' : ''} registrado
          {gastos.length !== 1 ? 's' : ''}
        </p>
      </CardHeader>
      <CardContent>
        <div className="w-full overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-amzdesk-table-header">
                  Concepto
                </TableHead>
                <TableHead className="text-amzdesk-table-header">
                  Documento
                </TableHead>
                <TableHead className="text-amzdesk-table-header">
                  Proveedor
                </TableHead>
                <TableHead className="text-amzdesk-table-header">
                  Partida Contable
                </TableHead>
                <TableHead className="text-amzdesk-table-header">
                  Fecha
                </TableHead>
                <TableHead className="text-amzdesk-table-header text-right">
                  Monto Total (Bruto)
                </TableHead>
                <TableHead className="text-amzdesk-table-header text-right">
                  Retención / Impuestos
                </TableHead>
                <TableHead className="text-amzdesk-table-header text-right">
                  Efectivo Pagado
                </TableHead>
                <TableHead className="text-amzdesk-table-header">
                  Comprobante
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {gastos.map((gasto) => (
                <TableRow key={gasto.id}>
                  <TableCell>
                    <p className="font-medium">{gasto.concepto || '-'}</p>
                    {gasto.detalle && (
                      <p className="text-muted-foreground text-xs">
                        {gasto.detalle}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">{gasto.tipoDocumento}</p>
                    <p className="text-muted-foreground text-xs">
                      {gasto.numeroDocumento || gasto.nroDocumento || 'S/N'}
                    </p>
                  </TableCell>
                  <TableCell>{gasto.proveedor || '-'}</TableCell>
                  <TableCell>
                    {canEditPartidaContable ? (
                      <select
                        value={gasto.partidaContableId ?? ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          void onUpdatePartidaContable?.(gasto.id, val ? Number(val) : null);
                        }}
                        className="w-full min-w-[140px] max-w-[200px] bg-background border rounded px-1.5 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        <option value="">Seleccionar...</option>
                        {partidasContables.map((pc) => (
                          <option key={pc.id} value={pc.id}>
                            {pc.codigo} - {pc.nombre}
                          </option>
                        ))}
                      </select>
                    ) : gasto.partidaContable ? (
                      <span className="font-medium text-xs">
                        {gasto.partidaContable.codigo} - {gasto.partidaContable.nombre}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {gasto.fechaDocumento
                      ? formatDate(gasto.fechaDocumento)
                      : '-'}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatMoney(
                      toNumber(
                        gasto.montoTotal ?? gasto.montoBruto ?? gasto.monto
                      )
                    )}
                  </TableCell>
                  <TableCell className="text-right font-semibold text-orange-600">
                    {formatMoney(toNumber(gasto.montoImpuestos))}
                  </TableCell>
                  <TableCell className="text-right font-semibold text-emerald-600">
                    {formatMoney(toNumber(gasto.montoNeto ?? gasto.monto))}
                  </TableCell>
                  <TableCell>
                    {gasto.urlComprobante ? (
                      <a
                        href={gasto.urlComprobante}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                      >
                        Ver Comprobante
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    ) : (
                      <span className="text-muted-foreground text-sm">
                        Sin adjunto
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
