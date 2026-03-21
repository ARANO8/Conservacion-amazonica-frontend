'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
        <div className="space-y-4">
          {gastos.map((gasto) => (
            <div key={gasto.id} className="rounded-lg border p-4">
              <div className="mb-3">
                <div>
                  <h3 className="font-semibold">{gasto.concepto}</h3>
                  {gasto.detalle && (
                    <p className="text-muted-foreground text-sm">
                      {gasto.detalle}
                    </p>
                  )}
                </div>
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

              <div className="mt-4 grid grid-cols-1 gap-4 border-t pt-4 sm:grid-cols-3">
                <div>
                  <p className="text-muted-foreground text-sm">
                    Monto Total (Bruto)
                  </p>
                  <p className="text-lg font-semibold">
                    {formatMoney(
                      toNumber(
                        gasto.montoTotal ?? gasto.montoBruto ?? gasto.monto
                      )
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">
                    Retencion / Impuestos
                  </p>
                  <p className="text-lg font-semibold text-orange-600">
                    {formatMoney(toNumber(gasto.montoImpuestos))}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">
                    Efectivo Pagado
                  </p>
                  <p className="text-lg font-semibold text-green-600">
                    {formatMoney(toNumber(gasto.montoNeto ?? gasto.monto))}
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
