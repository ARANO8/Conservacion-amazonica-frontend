'use client';

import { useMemo } from 'react';
import { useWatch, type UseFormReturn } from 'react-hook-form';
import {
  FormField,
  FormItem,
  FormControl,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatMoney } from '@/lib/utils';
import {
  calcularMontoNetoRendicion,
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

export function RetencionesTable({
  form,
  solicitud,
}: RetencionesTableProps) {
  const { control } = form;
  const gastosRaw = useWatch({ control, name: 'gastos' });
  const gastos = useMemo(() => gastosRaw ?? [], [gastosRaw]);

  const rows = useMemo(() => {
    return gastos.map((gasto: Record<string, unknown>, index: number) => {
      const partidaId = Number(gasto?.partidaId ?? 0);
      const presupuesto = (solicitud?.presupuestos ?? []).find(
        (p) => p.id === partidaId,
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

      const result = calcularMontoNetoRendicion(
        montoTotal,
        tipoDocumento as TipoDocRendicion,
        categoria,
        tipoRetencion as TipoRetencionGeneral,
      );

      const rcIva = result.desglose.find(
        (d) => d.label.includes('RC-IVA') || d.label.includes('IVA'),
      )?.monto ?? 0;
      const iue = result.desglose.find((d) => d.label.includes('IUE'))?.monto ?? 0;
      const it = result.desglose.find(
        (d) => d.label === 'IT 3%',
      )?.monto ?? 0;

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
      { montoTotal: 0, rcIva: 0, iue: 0, it: 0, totalImpuestos: 0, neto: 0 },
    );
  }, [rows]);

  const hasAnyRows = rows.some((r) => r.hasValue);
  const showSelectorColumn = rows.some((r) => r.needsSelector);

  if (!hasAnyRows) return null;

  return (
    <div className="w-full overflow-x-auto rounded-lg border border-border">
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr className="bg-muted/60">
            <th className="px-2 py-1 text-[10px] font-bold tracking-wider uppercase text-muted-foreground border-r border-border">
              #
            </th>
            {showSelectorColumn && (
              <th className="px-2 py-1 text-[10px] font-bold tracking-wider uppercase text-muted-foreground w-[100px] border-r border-border">
                Tipo Ret.
              </th>
            )}
            <th className="px-2 py-1 text-[10px] font-bold tracking-wider uppercase text-muted-foreground text-right border-r border-border">
              TOTAL Bs.
            </th>
            <th className="px-2 py-1 text-[10px] font-bold tracking-wider uppercase text-muted-foreground text-right border-r border-border">
              RC-IVA 13%
            </th>
            <th className="px-2 py-1 text-[10px] font-bold tracking-wider uppercase text-muted-foreground text-right border-r border-border">
              IUE 5%
            </th>
            <th className="px-2 py-1 text-[10px] font-bold tracking-wider uppercase text-muted-foreground text-right border-r border-border">
              IT 3%
            </th>
            <th className="px-2 py-1 text-[10px] font-bold tracking-wider uppercase text-muted-foreground text-right border-r border-border">
              TOTAL IMP.
            </th>
            <th className="px-2 py-1 text-[10px] font-bold tracking-wider uppercase text-muted-foreground text-right">
              NETO Bs.
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => {
            if (!row.hasValue && !row.needsSelector)
              return (
                <tr key={idx} className="border-b border-border opacity-40">
                  <td className="px-2 py-1 text-[11px] text-center text-muted-foreground border-r border-border">
                    {idx + 1}
                  </td>
                  {showSelectorColumn && (
                    <td className="px-1 py-1 border-r border-border">
                      <span className="text-muted-foreground">—</span>
                    </td>
                  )}
                  <td className="px-2 py-1 text-right border-r border-border">
                    —
                  </td>
                  <td className="px-2 py-1 text-right border-r border-border">
                    —
                  </td>
                  <td className="px-2 py-1 text-right border-r border-border">
                    —
                  </td>
                  <td className="px-2 py-1 text-right border-r border-border">
                    —
                  </td>
                  <td className="px-2 py-1 text-right border-r border-border">
                    —
                  </td>
                  <td className="px-2 py-1 text-right">—</td>
                </tr>
              );

            return (
              <tr
                key={idx}
                className="border-b border-border hover:bg-muted/30"
              >
                <td className="px-2 py-1 text-[11px] text-center text-muted-foreground border-r border-border">
                  {idx + 1}
                </td>
                {showSelectorColumn && (
                  <td className="px-1 py-1 border-r border-border">
                    {row.needsSelector ? (
                      <TipoRetencionSelect
                        form={form}
                        index={row.index}
                      />
                    ) : (
                      <span className="text-[11px] text-muted-foreground">
                        —
                      </span>
                    )}
                  </td>
                )}
                <td className="px-2 py-1 text-right font-medium tabular-nums border-r border-border">
                  {formatMoney(row.montoTotal)}
                </td>
                <td className="px-2 py-1 text-right tabular-nums border-r border-border">
                  {row.rcIva > 0 ? formatMoney(row.rcIva) : '—'}
                </td>
                <td className="px-2 py-1 text-right tabular-nums border-r border-border">
                  {row.iue > 0 ? formatMoney(row.iue) : '—'}
                </td>
                <td className="px-2 py-1 text-right tabular-nums border-r border-border">
                  {row.it > 0 ? formatMoney(row.it) : '—'}
                </td>
                <td className="px-2 py-1 text-right font-semibold tabular-nums border-r border-border">
                  {row.totalImpuestos > 0 ? formatMoney(row.totalImpuestos) : '—'}
                </td>
                <td className="px-2 py-1 text-right font-bold tabular-nums">
                  {row.neto > 0 ? formatMoney(row.neto) : '—'}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="bg-muted/40 border-t border-border font-semibold">
            <td className="px-2 py-1 text-[11px] text-muted-foreground border-r border-border">
              TOTAL
            </td>
            {showSelectorColumn && (
              <td className="border-r border-border" />
            )}
            <td className="px-2 py-1 text-right tabular-nums border-r border-border">
              {formatMoney(totals.montoTotal)}
            </td>
            <td className="px-2 py-1 text-right tabular-nums border-r border-border">
              {totals.rcIva > 0 ? formatMoney(totals.rcIva) : '—'}
            </td>
            <td className="px-2 py-1 text-right tabular-nums border-r border-border">
              {totals.iue > 0 ? formatMoney(totals.iue) : '—'}
            </td>
            <td className="px-2 py-1 text-right tabular-nums border-r border-border">
              {totals.it > 0 ? formatMoney(totals.it) : '—'}
            </td>
            <td className="px-2 py-1 text-right tabular-nums border-r border-border">
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
              <SelectTrigger className="h-6 text-[10px] px-1">
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
