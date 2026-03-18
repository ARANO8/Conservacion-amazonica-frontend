'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatMoney, formatDate } from '@/lib/utils';
import type { GastoRendicionResponse } from '@/types/rendicion-backend';

interface RendicionGastosSectionProps {
  gastos: GastoRendicionResponse[];
}

const ESTADO_GASTO_COLORS = {
  PENDIENTE: 'bg-yellow-100 text-yellow-800',
  COMPROBADO: 'bg-green-100 text-green-800',
  RECHAZADO: 'bg-red-100 text-red-800',
};

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
        <div className="space-y-4">
          {gastos.map((gasto) => (
            <div key={gasto.id} className="rounded-lg border p-4">
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{gasto.concepto}</h3>
                  {gasto.detalle && (
                    <p className="text-muted-foreground text-sm">
                      {gasto.detalle}
                    </p>
                  )}
                </div>
                <Badge
                  className={
                    (gasto.estado
                      ? ESTADO_GASTO_COLORS[gasto.estado]
                      : undefined) || 'bg-gray-100 text-gray-800'
                  }
                >
                  {gasto.estado || 'SIN ESTADO'}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Tipo de Documento</p>
                  <p className="font-medium">{gasto.tipoDocumento}</p>
                </div>
                {(gasto.numeroDocumento || gasto.nroDocumento) && (
                  <div>
                    <p className="text-muted-foreground">Número de Documento</p>
                    <p className="font-medium">
                      {gasto.numeroDocumento || gasto.nroDocumento}
                    </p>
                  </div>
                )}
                {gasto.proveedor && (
                  <div>
                    <p className="text-muted-foreground">Proveedor</p>
                    <p className="font-medium">{gasto.proveedor}</p>
                  </div>
                )}
                {gasto.fechaDocumento && (
                  <div>
                    <p className="text-muted-foreground">Fecha de Documento</p>
                    <p className="font-medium">
                      {formatDate(gasto.fechaDocumento)}
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4 border-t pt-4">
                <div>
                  <p className="text-muted-foreground text-sm">Monto Neto</p>
                  <p className="text-lg font-semibold">
                    {formatMoney(gasto.montoNeto ?? gasto.monto ?? 0)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Monto Total</p>
                  <p className="text-lg font-semibold text-green-600">
                    {formatMoney(gasto.montoTotal ?? gasto.monto ?? 0)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
