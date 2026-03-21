'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

interface RendicionGastosSectionProps {
  gastos: GastoRendicionResponse[];
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
