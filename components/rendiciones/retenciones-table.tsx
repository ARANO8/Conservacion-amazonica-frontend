'use client';

import { useMemo } from 'react';
import { useWatch, type UseFormReturn } from 'react-hook-form';
import { FormField, FormItem, FormControl } from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatMoney } from '@/lib/utils';
import {
  calcularMontoBrutoRendicion,
  getCategoriaFromPartida,
  type TipoDocRendicion,
  type TipoRetencionGeneral,
} from '@/lib/tax-calculator';
import {
  CreateRendicionInput,
  TipoRetencionEnum,
} from '@/types/rendicion-schema';
import type { SolicitudResponse } from '@/types/solicitud-backend';

function round2(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Number.parseFloat(value.toFixed(2));
}

interface RetencionesTableProps {
  form: UseFormReturn<CreateRendicionInput>;
  solicitud: SolicitudResponse | null;
}

export function RetencionesTable({ form, solicitud }: RetencionesTableProps) {
  const { control } = form;
  const gastosRaw = useWatch({ control, name: 'gastos' });
  const gastos = useMemo(() => gastosRaw ?? [], [gastosRaw]);

  const rows = useMemo(() => {
    return gastos.map((gasto: Record<string, unknown>, index: number) => {
      const partidaId = Number(gasto?.partidaId ?? 0);
      const presupuesto = (solicitud?.presupuestos ?? []).find(
        (p) => p.id === partidaId
      );
      const nombrePartida =
        presupuesto?.poa?.estructura?.partida?.nombre ?? null;
      const categoria = getCategoriaFromPartida(nombrePartida);
      const tipoDocumento = gasto?.tipoDocumento ?? 'FACTURA';
      const tipoRetencion = gasto?.tipoRetencion ?? 'SERVICIO';
      const montoTotal = Number(gasto?.montoTotal ?? 0);

      const needsSelector =
        (tipoDocumento === 'RECIBO' || tipoDocumento === 'BOLETA') &&
        categoria === 'GENERAL';

      if (montoTotal <= 0) {
        return {
          index,
          montoTotal: 0,
          rcIva: 0,
          iue: 0,
          it: 0,
          totalImpuestos: 0,
          neto: 0,
          needsSelector,
          hasValue: false,
        };
      }

      const result = calcularMontoBrutoRendicion(
        Number(gasto?.montoNeto ?? 0) || montoTotal,
        tipoDocumento as TipoDocRendicion,
        categoria,
        tipoRetencion as TipoRetencionGeneral
      );

      const rcIva =
        result.desglose.find(
          (d) => d.label.includes('RC-IVA') || d.label.includes('IVA')
        )?.monto ?? 0;
      const iue =
        result.desglose.find((d) => d.label.includes('IUE'))?.monto ?? 0;
      const it = result.desglose.find((d) => d.label === 'IT 3%')?.monto ?? 0;

      return {
        index,
        montoTotal,
        rcIva,
        iue,
        it,
        totalImpuestos: result.totalRetenciones,
        neto: result.montoNeto,
        needsSelector,
        hasValue: true,
      };
    });
  }, [gastos, solicitud]);

  const totals = useMemo(() => {
    return rows.reduce(
      (acc, row) => {
        acc.montoTotal = round2(acc.montoTotal + row.montoTotal);
        acc.rcIva = round2(acc.rcIva + row.rcIva);
        acc.iue = round2(acc.iue + row.iue);
        acc.it = round2(acc.it + row.it);
        acc.totalImpuestos = round2(acc.totalImpuestos + row.totalImpuestos);
        acc.neto = round2(acc.neto + row.neto);
        return acc;
      },
      { montoTotal: 0, rcIva: 0, iue: 0, it: 0, totalImpuestos: 0, neto: 0 }
    );
  }, [rows]);

  const hasAnyRows = rows.some((r) => r.hasValue);
  const showSelectorColumn = rows.some((r) => r.needsSelector);

  if (!hasAnyRows) return null;

  return (
    <div className="border-border w-full overflow-x-auto rounded-lg border">
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr className="bg-muted/60">
            <th className="text-muted-foreground border-border border-r px-2 py-1 text-[10px] font-bold tracking-wider uppercase">
              #
            </th>
            {showSelectorColumn && (
              <th className="text-muted-foreground border-border w-[100px] border-r px-2 py-1 text-[10px] font-bold tracking-wider uppercase">
                Tipo Ret.
              </th>
            )}
            <th className="text-muted-foreground border-border border-r px-2 py-1 text-right text-[10px] font-bold tracking-wider uppercase">
              TOTAL Bs.
            </th>
            <th className="text-muted-foreground border-border border-r px-2 py-1 text-right text-[10px] font-bold tracking-wider uppercase">
              RC-IVA 13%
            </th>
            <th className="text-muted-foreground border-border border-r px-2 py-1 text-right text-[10px] font-bold tracking-wider uppercase">
              IUE 5%
            </th>
            <th className="text-muted-foreground border-border border-r px-2 py-1 text-right text-[10px] font-bold tracking-wider uppercase">
              IT 3%
            </th>
            <th className="text-muted-foreground border-border border-r px-2 py-1 text-right text-[10px] font-bold tracking-wider uppercase">
              TOTAL IMP.
            </th>
            <th className="text-muted-foreground px-2 py-1 text-right text-[10px] font-bold tracking-wider uppercase">
              NETO Bs.
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => {
            if (!row.hasValue && !row.needsSelector)
              return (
                <tr key={idx} className="border-border border-b opacity-40">
                  <td className="text-muted-foreground border-border border-r px-2 py-1 text-center text-[11px]">
                    {idx + 1}
                  </td>
                  {showSelectorColumn && (
                    <td className="border-border border-r px-1 py-1">
                      <span className="text-muted-foreground">—</span>
                    </td>
                  )}
                  <td className="border-border border-r px-2 py-1 text-right">
                    —
                  </td>
                  <td className="border-border border-r px-2 py-1 text-right">
                    —
                  </td>
                  <td className="border-border border-r px-2 py-1 text-right">
                    —
                  </td>
                  <td className="border-border border-r px-2 py-1 text-right">
                    —
                  </td>
                  <td className="border-border border-r px-2 py-1 text-right">
                    —
                  </td>
                  <td className="px-2 py-1 text-right">—</td>
                </tr>
              );

            return (
              <tr
                key={idx}
                className="border-border hover:bg-muted/30 border-b"
              >
                <td className="text-muted-foreground border-border border-r px-2 py-1 text-center text-[11px]">
                  {idx + 1}
                </td>
                {showSelectorColumn && (
                  <td className="border-border border-r px-1 py-1">
                    {row.needsSelector ? (
                      <TipoRetencionSelect form={form} index={row.index} />
                    ) : (
                      <span className="text-muted-foreground text-[11px]">
                        —
                      </span>
                    )}
                  </td>
                )}
                <td className="border-border border-r px-2 py-1 text-right font-medium tabular-nums">
                  {formatMoney(row.montoTotal)}
                </td>
                <td className="border-border border-r px-2 py-1 text-right tabular-nums">
                  {row.rcIva > 0 ? formatMoney(row.rcIva) : '—'}
                </td>
                <td className="border-border border-r px-2 py-1 text-right tabular-nums">
                  {row.iue > 0 ? formatMoney(row.iue) : '—'}
                </td>
                <td className="border-border border-r px-2 py-1 text-right tabular-nums">
                  {row.it > 0 ? formatMoney(row.it) : '—'}
                </td>
                <td className="border-border border-r px-2 py-1 text-right font-semibold tabular-nums">
                  {row.totalImpuestos > 0
                    ? formatMoney(row.totalImpuestos)
                    : '—'}
                </td>
                <td className="px-2 py-1 text-right font-bold tabular-nums">
                  {row.neto > 0 ? formatMoney(row.neto) : '—'}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="bg-muted/40 border-border border-t font-semibold">
            <td className="text-muted-foreground border-border border-r px-2 py-1 text-[11px]">
              TOTAL
            </td>
            {showSelectorColumn && <td className="border-border border-r" />}
            <td className="border-border border-r px-2 py-1 text-right tabular-nums">
              {formatMoney(totals.montoTotal)}
            </td>
            <td className="border-border border-r px-2 py-1 text-right tabular-nums">
              {totals.rcIva > 0 ? formatMoney(totals.rcIva) : '—'}
            </td>
            <td className="border-border border-r px-2 py-1 text-right tabular-nums">
              {totals.iue > 0 ? formatMoney(totals.iue) : '—'}
            </td>
            <td className="border-border border-r px-2 py-1 text-right tabular-nums">
              {totals.it > 0 ? formatMoney(totals.it) : '—'}
            </td>
            <td className="border-border border-r px-2 py-1 text-right tabular-nums">
              {totals.totalImpuestos > 0
                ? formatMoney(totals.totalImpuestos)
                : '—'}
            </td>
            <td className="px-2 py-1 text-right tabular-nums">
              {totals.neto > 0 ? formatMoney(totals.neto) : '—'}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function TipoRetencionSelect({
  form,
  index,
}: {
  form: UseFormReturn<CreateRendicionInput>;
  index: number;
}) {
  const { control } = form;
  return (
    <FormField
      control={control}
      name={`gastos.${index}.tipoRetencion`}
      render={({ field }) => (
        <FormItem className="space-y-0">
          <Select value={field.value} onValueChange={field.onChange}>
            <FormControl>
              <SelectTrigger className="h-6 px-1 text-[10px]">
                <SelectValue />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {TipoRetencionEnum.options.map((tipo) => (
                <SelectItem key={tipo} value={tipo} className="text-[10px]">
                  {tipo === 'BIEN'
                    ? 'Bien'
                    : tipo === 'SERVICIO'
                      ? 'Servicio'
                      : 'Alquiler'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormItem>
      )}
    />
  );
}
