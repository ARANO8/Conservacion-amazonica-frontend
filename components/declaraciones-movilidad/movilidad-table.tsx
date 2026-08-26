'use client';

import { useMemo, useState } from 'react';
import { useFieldArray, useWatch, type UseFormReturn } from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { FormControl, FormField, FormItem } from '@/components/ui/form';
import { cn, formatMoney } from '@/lib/utils';
import {
  calcularMonto,
  resumirDeclaracion,
  round2,
} from '@/lib/declaracion-movilidad';
import {
  filaMovilidadVacia,
  type DeclaracionMovilidadInput,
} from '@/types/declaracion-movilidad-schema';

/** Deja pasar sólo dígitos y un separador decimal, aceptando coma o punto. */
function sanitizeMonetaryInput(value: string): string {
  const normalized = value.replace(/,/g, '.').replace(/[^0-9.]/g, '');
  const [integerPart, ...decimalParts] = normalized.split('.');
  if (decimalParts.length === 0) return integerPart;
  return `${integerPart}.${decimalParts.join('')}`;
}

const CELDA = 'border-border border-r px-1 py-1';
const CABECERA =
  'text-muted-foreground border-border border-r px-1 py-1 text-[10px] font-bold tracking-wider uppercase';
const INPUT =
  'border-input bg-background focus:ring-primary h-7 w-full rounded border px-1.5 text-xs focus:ring-1 focus:outline-none';
/** Una fila incompleta bloquea el guardado: hay que poder verla en la grilla. */
const ERROR = 'border-destructive ring-destructive/30 ring-1';

interface FilaProps {
  index: number;
  form: UseFormReturn<DeclaracionMovilidadInput>;
  onRemove: () => void;
  onTabLastCell: () => void;
}

function MovilidadRow({ index, form, onRemove, onTabLastCell }: FilaProps) {
  const { control } = form;
  const [montoInput, setMontoInput] = useState<string>('');

  const montoGastado = useWatch({
    control,
    name: `detalles.${index}.montoGastado`,
  });

  // Columna E del Excel: sale sola del gasto declarado, nunca se edita.
  const monto = useMemo(
    () => calcularMonto(Number(montoGastado ?? 0)),
    [montoGastado]
  );

  // Tabular en la última celda de la fila agrega una fila nueva, como en Excel.
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key !== 'Tab' || e.shiftKey) return;
    const fila = e.currentTarget.closest('tr');
    if (!fila) return;

    const inputs = fila.querySelectorAll<HTMLElement>('input');
    const actual = Array.from(inputs).indexOf(e.currentTarget as HTMLElement);
    if (actual < inputs.length - 1) return;

    e.preventDefault();
    onTabLastCell();
  }

  return (
    <tr className="border-border hover:bg-muted/30 border-b">
      <td className="text-muted-foreground border-border w-8 border-r px-1.5 py-1 text-center text-[11px]">
        {index + 1}
      </td>

      <td className={`${CELDA} w-[120px]`}>
        <FormField
          control={control}
          name={`detalles.${index}.fecha`}
          render={({ field, fieldState }) => (
            <FormItem className="space-y-0">
              <FormControl>
                <input
                  type="date"
                  className={cn(INPUT, fieldState.error && ERROR)}
                  value={
                    typeof field.value === 'string'
                      ? field.value
                      : field.value instanceof Date
                        ? field.value.toISOString().split('T')[0]
                        : ''
                  }
                  onChange={(e) => field.onChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </td>

      <td className={`${CELDA} w-[150px]`}>
        <FormField
          control={control}
          name={`detalles.${index}.origen`}
          render={({ field, fieldState }) => (
            <FormItem className="space-y-0">
              <FormControl>
                <input
                  type="text"
                  className={cn(INPUT, fieldState.error && ERROR)}
                  placeholder="La Paz"
                  {...field}
                  onKeyDown={handleKeyDown}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </td>

      <td className={`${CELDA} w-[150px]`}>
        <FormField
          control={control}
          name={`detalles.${index}.destino`}
          render={({ field, fieldState }) => (
            <FormItem className="space-y-0">
              <FormControl>
                <input
                  type="text"
                  className={cn(INPUT, fieldState.error && ERROR)}
                  placeholder="Tarija"
                  {...field}
                  onKeyDown={handleKeyDown}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </td>

      <td className={`${CELDA} min-w-[200px]`}>
        <FormField
          control={control}
          name={`detalles.${index}.motivo`}
          render={({ field, fieldState }) => (
            <FormItem className="space-y-0">
              <FormControl>
                <input
                  type="text"
                  className={cn(INPUT, fieldState.error && ERROR)}
                  placeholder="Traslado al taller POA 2026"
                  {...field}
                  onKeyDown={handleKeyDown}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </td>

      {/* Columna auxiliar (la naranja del Excel): sólo existe al llenar. */}
      <td className={`${CELDA} w-[120px] bg-amber-50 dark:bg-amber-950/30`}>
        <FormField
          control={control}
          name={`detalles.${index}.montoGastado`}
          render={({ field, fieldState }) => (
            <FormItem className="space-y-0">
              <FormControl>
                <input
                  type="text"
                  inputMode="decimal"
                  className={cn(INPUT, 'text-right', fieldState.error && ERROR)}
                  placeholder="0.00"
                  value={
                    montoInput ||
                    (field.value && field.value > 0
                      ? field.value.toString()
                      : '')
                  }
                  onChange={(e) => {
                    const sanitized = sanitizeMonetaryInput(e.target.value);
                    setMontoInput(sanitized);
                    if (!sanitized || sanitized === '.') {
                      field.onChange(0);
                      return;
                    }
                    const parsed = Number.parseFloat(sanitized);
                    field.onChange(Number.isFinite(parsed) ? parsed : 0);
                  }}
                  onBlur={() => {
                    const parsed = Number.parseFloat(montoInput);
                    if (
                      !montoInput ||
                      !Number.isFinite(parsed) ||
                      parsed <= 0
                    ) {
                      setMontoInput('');
                      field.onChange(0);
                      return;
                    }
                    const redondeado = round2(parsed);
                    setMontoInput(redondeado.toFixed(2));
                    field.onChange(redondeado);
                  }}
                  onKeyDown={handleKeyDown}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </td>

      <td
        className={`${CELDA} w-[120px] text-right text-[11px] font-semibold tabular-nums`}
      >
        {monto > 0 ? formatMoney(monto) : '—'}
      </td>

      <td className="border-border w-9 border-r px-1 py-1 text-center">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="text-destructive hover:bg-destructive/10 hover:text-destructive h-7 w-7 p-0"
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span className="sr-only">Eliminar fila {index + 1}</span>
        </Button>
      </td>
    </tr>
  );
}

/** Las tres filas del pie del anexo, compartidas por la grilla y la vista. */
function PieAnexo({
  totalBruto,
  retencion,
  totalLiquido,
  colSpan,
  columnasSobrantes = 0,
}: {
  totalBruto: number;
  retencion: number;
  totalLiquido: number;
  colSpan: number;
  columnasSobrantes?: number;
}) {
  const filas: { etiqueta: string; valor: number; destacada?: boolean }[] = [
    { etiqueta: 'TOTAL', valor: totalBruto },
    {
      etiqueta: 'Menos retención impositiva por servicios 15.5%',
      valor: retencion,
    },
    { etiqueta: 'TOTAL', valor: totalLiquido, destacada: true },
  ];

  return (
    <tfoot>
      {filas.map((fila, index) => (
        <tr
          key={index}
          className={
            fila.destacada
              ? 'bg-muted/60 border-border border-t font-bold'
              : 'bg-muted/40 border-border border-t font-semibold'
          }
        >
          <td
            colSpan={colSpan}
            className="border-border border-r px-1.5 py-1 text-center text-[11px]"
          >
            {fila.etiqueta}
          </td>
          <td className="border-border border-r px-1 py-1 text-right text-[11px] tabular-nums">
            {formatMoney(fila.valor)}
          </td>
          {columnasSobrantes > 0 && (
            <td
              colSpan={columnasSobrantes}
              className="border-border border-r"
            />
          )}
        </tr>
      ))}
    </tfoot>
  );
}

interface MovilidadTableProps {
  form: UseFormReturn<DeclaracionMovilidadInput>;
}

/** Grilla editable del ANEXO 6, con la columna auxiliar de captura. */
export function MovilidadTable({ form }: MovilidadTableProps) {
  const { control } = form;
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'detalles',
  });

  const detalles = useWatch({ control, name: 'detalles' });

  const resumen = useMemo(() => {
    const montos = (detalles ?? []).map((detalle) =>
      calcularMonto(Number(detalle?.montoGastado ?? 0))
    );
    return resumirDeclaracion(montos);
  }, [detalles]);

  function handleAgregar() {
    append({ ...filaMovilidadVacia });
  }

  return (
    <div className="border-border w-full overflow-x-auto rounded-lg border">
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr className="bg-muted/60">
            <th className={`${CABECERA} w-8`}>#</th>
            <th className={`${CABECERA} w-[120px]`}>Fecha</th>
            <th className={`${CABECERA} w-[150px]`}>Origen</th>
            <th className={`${CABECERA} w-[150px]`}>Destino</th>
            <th className={`${CABECERA} min-w-[200px]`}>Motivo</th>
            <th
              className={`${CABECERA} w-[120px] bg-amber-100 dark:bg-amber-950/50`}
            >
              Gasto real Bs
            </th>
            <th className={`${CABECERA} w-[120px]`}>Monto Bs</th>
            <th className="border-border w-9 border-r px-1 py-1" />
          </tr>
        </thead>

        <tbody>
          {fields.map((field, index) => (
            <MovilidadRow
              key={field.id}
              index={index}
              form={form}
              onRemove={() => remove(index)}
              onTabLastCell={handleAgregar}
            />
          ))}

          {fields.length === 0 && (
            <tr>
              <td
                colSpan={8}
                className="text-muted-foreground px-2 py-6 text-center text-xs"
              >
                No hay tramos registrados.
              </td>
            </tr>
          )}
        </tbody>

        <PieAnexo
          totalBruto={resumen.totalBruto}
          retencion={resumen.retencion}
          totalLiquido={resumen.totalLiquido}
          colSpan={6}
          columnasSobrantes={1}
        />
      </table>

      <div className="flex justify-start px-2 py-1.5">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleAgregar}
          className="text-muted-foreground hover:text-foreground h-7 gap-1 text-xs"
        >
          <Plus className="h-3.5 w-3.5" />
          Agregar fila
        </Button>
      </div>
    </div>
  );
}

export interface FilaMovilidadPersistida {
  fecha: string;
  origen: string;
  destino: string;
  motivo: string;
  monto: number;
}

interface MovilidadTablePreviewProps {
  detalles: FilaMovilidadPersistida[];
  totalBruto: number;
  retencion: number;
  totalLiquido: number;
}

/**
 * Vista de la declaración guardada: la planilla tal como se imprime, con los
 * montos que devolvió el servidor y sin la columna auxiliar de captura.
 */
export function MovilidadTablePreview({
  detalles,
  totalBruto,
  retencion,
  totalLiquido,
}: MovilidadTablePreviewProps) {
  return (
    <div className="border-border w-full overflow-x-auto rounded-lg border">
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr className="bg-muted/60">
            <th className={`${CABECERA} w-[120px]`}>Fecha</th>
            <th className={`${CABECERA} w-[150px]`}>Origen</th>
            <th className={`${CABECERA} w-[150px]`}>Destino</th>
            <th className={`${CABECERA} min-w-[200px]`}>Motivo</th>
            <th className={`${CABECERA} w-[130px]`}>Monto Bs</th>
          </tr>
        </thead>

        <tbody>
          {detalles.map((detalle, index) => (
            <tr key={index} className="border-border border-b">
              <td className={`${CELDA} text-[11px]`}>{detalle.fecha}</td>
              <td className={`${CELDA} text-[11px]`}>{detalle.origen}</td>
              <td className={`${CELDA} text-[11px]`}>{detalle.destino}</td>
              <td className={`${CELDA} text-[11px]`}>{detalle.motivo}</td>
              <td
                className={`${CELDA} text-right text-[11px] font-semibold tabular-nums`}
              >
                {formatMoney(detalle.monto)}
              </td>
            </tr>
          ))}

          {detalles.length === 0 && (
            <tr>
              <td
                colSpan={5}
                className="text-muted-foreground px-2 py-6 text-center text-xs"
              >
                No hay tramos registrados.
              </td>
            </tr>
          )}
        </tbody>

        <PieAnexo
          totalBruto={totalBruto}
          retencion={retencion}
          totalLiquido={totalLiquido}
          colSpan={4}
        />
      </table>
    </div>
  );
}

export default MovilidadTable;
