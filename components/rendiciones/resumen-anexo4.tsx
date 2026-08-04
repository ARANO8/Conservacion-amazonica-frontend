'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatMoney, cn } from '@/lib/utils';
import type { ResumenAnexo4 } from '@/lib/rendicion-anexo4';

interface ResumenAnexo4Props {
  resumen: ResumenAnexo4;
  /** Anticipo recibido según la solicitud desembolsada */
  importeRecibido: number;
}

/**
 * Bloques de cierre del ANEXO 4: la liquidación de caja ("a favor de") y el
 * conteo de documentos de respaldo.
 *
 * Ambos se calculan sobre el monto **líquido** — el efectivo que se movió —,
 * que es distinto del bruto con cargo al POA.
 */
export function ResumenAnexo4Blocks({
  resumen,
  importeRecibido,
}: ResumenAnexo4Props) {
  const { conteoDocumentos: docs, aFavorEmpleado, aFavorProyecto } = resumen;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {/* Liquidación de caja */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold uppercase">
            Liquidación de Caja
          </CardTitle>
          <p className="text-muted-foreground text-xs">
            Sobre el efectivo desembolsado, sin las retenciones.
          </p>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-foreground font-medium">
              Importe recibido:
            </span>
            <span className="font-semibold tabular-nums">
              {formatMoney(importeRecibido)}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-foreground font-medium">
              Total gastado (efectivo):
            </span>
            <span className="font-semibold tabular-nums">
              {formatMoney(resumen.totales.neto)}
            </span>
          </div>
          <div className="flex items-center justify-between border-t pt-2 text-sm">
            <span className="font-bold">Saldo:</span>
            <span
              className={cn(
                'font-bold tabular-nums',
                resumen.saldoEfectivo < 0 ? 'text-red-600' : 'text-emerald-600'
              )}
            >
              {formatMoney(resumen.saldoEfectivo)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2">
            <div
              className={cn(
                'rounded-md border p-2.5',
                aFavorEmpleado > 0
                  ? 'border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40'
                  : 'border-dashed opacity-60'
              )}
            >
              <p className="text-muted-foreground text-[10px] font-bold uppercase">
                A favor del empleado
              </p>
              <p className="mt-0.5 text-sm font-black tabular-nums">
                {aFavorEmpleado > 0 ? formatMoney(aFavorEmpleado) : '—'}
              </p>
            </div>
            <div
              className={cn(
                'rounded-md border p-2.5',
                aFavorProyecto > 0
                  ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/40'
                  : 'border-dashed opacity-60'
              )}
            >
              <p className="text-muted-foreground text-[10px] font-bold uppercase">
                A favor del proyecto
              </p>
              <p className="mt-0.5 text-sm font-black tabular-nums">
                {aFavorProyecto > 0 ? formatMoney(aFavorProyecto) : '—'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conteo de documentos */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold uppercase">
            Documentos de Respaldo
          </CardTitle>
          <p className="text-muted-foreground text-xs">
            Cantidad y monto desembolsado por tipo de comprobante.
          </p>
        </CardHeader>
        <CardContent>
          <div className="border-border overflow-x-auto rounded-md border">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-muted/60">
                  <th className="text-muted-foreground border-border border-r px-2 py-1.5 text-left text-[10px] font-bold tracking-wider uppercase">
                    Documentos
                  </th>
                  <th className="text-muted-foreground border-border w-[70px] border-r px-2 py-1.5 text-center text-[10px] font-bold tracking-wider uppercase">
                    Cant.
                  </th>
                  <th className="text-muted-foreground w-[110px] px-2 py-1.5 text-right text-[10px] font-bold tracking-wider uppercase">
                    Monto Bs
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-border border-b">
                  <td className="border-border border-r px-2 py-1.5">
                    Facturas
                  </td>
                  <td className="border-border border-r px-2 py-1.5 text-center tabular-nums">
                    {docs.facturasCantidad}
                  </td>
                  <td className="px-2 py-1.5 text-right tabular-nums">
                    {formatMoney(docs.facturasMonto)}
                  </td>
                </tr>
                <tr className="border-border border-b">
                  <td className="border-border border-r px-2 py-1.5">
                    Recibos y otros
                  </td>
                  <td className="border-border border-r px-2 py-1.5 text-center tabular-nums">
                    {docs.recibosCantidad}
                  </td>
                  <td className="px-2 py-1.5 text-right tabular-nums">
                    {formatMoney(docs.recibosMonto)}
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr className="bg-muted/40 font-bold">
                  <td className="border-border border-r px-2 py-1.5">TOTAL</td>
                  <td className="border-border border-r px-2 py-1.5 text-center tabular-nums">
                    {docs.totalCantidad}
                  </td>
                  <td className="px-2 py-1.5 text-right tabular-nums">
                    {formatMoney(docs.totalMonto)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
