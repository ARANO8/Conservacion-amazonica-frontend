'use client';

import { useMemo } from 'react';
import { useFieldArray, useWatch, type UseFormReturn } from 'react-hook-form';
import { Plus, Trash2, UserRound } from 'lucide-react';

import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatMoney } from '@/lib/utils';
import {
  PORCENTAJES_VIATICO,
  calcularFila,
  escalaDeConcepto,
  escalaPredominante,
  importeDiaBruto,
  totalizarHoja,
} from '@/lib/liquidacion-viaticos';
import {
  filaVacia,
  type LiquidacionViaticosInput,
} from '@/types/liquidacion-viaticos-schema';
import type { Concepto } from '@/types/catalogs';

const ETIQUETA =
  'text-muted-foreground text-[10px] font-bold tracking-wider uppercase';

/** Nombre de la tarifa en el selector: los países se distinguen entre sí. */
const ETIQUETA_TARIFA: Record<string, string> = {
  PAISES_SUDAMERICA: 'Exterior — Sudamérica',
  PAISES_NORTEAMERICA_EUROPA: 'Exterior — Norteamérica y Europa',
};

export function etiquetaTarifa(nombre: string): string {
  return ETIQUETA_TARIFA[nombre] ?? escalaDeConcepto(nombre);
}

interface HojaLiquidacionCardProps {
  form: UseFormReturn<LiquidacionViaticosInput>;
  index: number;
  /** Tarifas con importe para personal institucional */
  conceptos: Concepto[];
  /** Partida de las filas agregadas a mano */
  partidaPorDefecto?: number;
  onRemove: () => void;
  puedeQuitar: boolean;
}

/**
 * Una hoja del ANEXO 5: los datos de la persona y su tabla de viáticos, con
 * los totales calculados en vivo como los mostrará el formulario impreso.
 */
export function HojaLiquidacionCard({
  form,
  index,
  conceptos,
  partidaPorDefecto,
  onRemove,
  puedeQuitar,
}: HojaLiquidacionCardProps) {
  const { control } = form;
  const { fields, append, remove } = useFieldArray({
    control,
    name: `hojas.${index}.filas`,
  });
  const nombre = useWatch({ control, name: `hojas.${index}.nombre` });
  const filas = useWatch({ control, name: `hojas.${index}.filas` });

  const tarifas = useMemo(
    () =>
      new Map(
        conceptos.map((c) => [
          c.id,
          { nombre: c.nombre, tarifa: Number(c.precioInstitucional ?? 0) },
        ])
      ),
    [conceptos]
  );

  const calculo = useMemo(() => {
    const porFila = (filas ?? []).map((f) => {
      const t = tarifas.get(Number(f?.conceptoId));
      const tarifa = t?.tarifa ?? 0;
      const porcentaje = Number(f?.porcentaje ?? 100);
      return {
        nombre: t?.nombre ?? '',
        dias: Number(f?.dias) || 0,
        importeDia: importeDiaBruto(tarifa, porcentaje),
        ...calcularFila(tarifa, Number(f?.dias) || 0, porcentaje),
      };
    });
    return {
      porFila,
      totales: totalizarHoja(porFila),
      escalaSugerida: escalaPredominante(
        porFila
          .filter((f) => f.nombre)
          .map((f) => ({ nombreConcepto: f.nombre, dias: f.dias }))
      ),
    };
  }, [filas, tarifas]);

  const campoTexto = (
    name: 'cargo' | 'ci' | 'sede' | 'via' | 'escala' | 'destino',
    etiqueta: string,
    placeholder?: string
  ) => (
    <FormField
      control={control}
      name={`hojas.${index}.${name}`}
      render={({ field }) => (
        <FormItem className="space-y-1">
          <span className={ETIQUETA}>{etiqueta}</span>
          <FormControl>
            <Input
              className="h-9 text-sm"
              placeholder={placeholder}
              {...field}
            />
          </FormControl>
          <FormMessage className="text-xs" />
        </FormItem>
      )}
    />
  );

  return (
    <section
      aria-label={`Hoja de ${nombre}`}
      className="bg-card space-y-4 rounded-lg border p-4"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <UserRound className="text-primary h-5 w-5 shrink-0" />
          <div>
            <p className="text-sm font-semibold">{nombre}</p>
            <p className="text-muted-foreground text-xs">
              Hoja {index + 1} del ANEXO 5
            </p>
          </div>
        </div>
        {puedeQuitar && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive/80 hover:bg-destructive/10"
            onClick={onRemove}
          >
            <Trash2 className="mr-1 h-4 w-4" />
            Quitar persona
          </Button>
        )}
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        {campoTexto('cargo', 'Cargo *')}
        {campoTexto('ci', 'Nº C.I.', 'Se toma del perfil')}
        {campoTexto('sede', 'Sede')}
        {campoTexto('via', 'Vía', 'Ej. Aérea, terrestre')}
        <FormField
          control={control}
          name={`hojas.${index}.fechaSalida`}
          render={({ field }) => (
            <FormItem className="space-y-1">
              <span className={ETIQUETA}>Fecha de salida *</span>
              <FormControl>
                <Input type="date" className="h-9 text-sm" {...field} />
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name={`hojas.${index}.fechaRetorno`}
          render={({ field }) => (
            <FormItem className="space-y-1">
              <span className={ETIQUETA}>Fecha de retorno *</span>
              <FormControl>
                <Input type="date" className="h-9 text-sm" {...field} />
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />
        {campoTexto('destino', 'Destino *')}
        {campoTexto(
          'escala',
          'Escala',
          calculo.escalaSugerida
            ? `${calculo.escalaSugerida} (sugerida)`
            : 'Comunidad, ciudad, pueblo...'
        )}
        <FormField
          control={control}
          name={`hojas.${index}.motivoViaje`}
          render={({ field }) => (
            <FormItem className="space-y-1 md:col-span-4">
              <span className={ETIQUETA}>Motivo de viaje *</span>
              <FormControl>
                <Textarea className="min-h-14 text-sm" {...field} />
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />
      </div>

      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr className="text-left">
              <th className={`${ETIQUETA} px-2 py-2`}>Tarifa</th>
              <th className={`${ETIQUETA} w-[110px] px-2 py-2`}>%</th>
              <th className={`${ETIQUETA} w-[100px] px-2 py-2`}>Días</th>
              <th className={`${ETIQUETA} w-[120px] px-2 py-2 text-right`}>
                Importe día
              </th>
              <th className={`${ETIQUETA} w-[130px] px-2 py-2 text-right`}>
                Total
              </th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {fields.map((field, i) => (
              <tr key={field.id} className="border-t align-top">
                <td className="px-2 py-1.5">
                  <FormField
                    control={control}
                    name={`hojas.${index}.filas.${i}.conceptoId`}
                    render={({ field: f }) => (
                      <FormItem>
                        <Select
                          value={f.value ? String(f.value) : ''}
                          onValueChange={(v) => f.onChange(Number(v))}
                        >
                          <FormControl>
                            <SelectTrigger
                              aria-label={`Tarifa fila ${i + 1}`}
                              className="h-8 w-full text-xs"
                            >
                              <SelectValue placeholder="Elegir tarifa" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {conceptos.map((c) => (
                              <SelectItem key={c.id} value={String(c.id)}>
                                {etiquetaTarifa(c.nombre)} —{' '}
                                {formatMoney(c.precioInstitucional ?? 0)}/día
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                </td>
                <td className="px-2 py-1.5">
                  <FormField
                    control={control}
                    name={`hojas.${index}.filas.${i}.porcentaje`}
                    render={({ field: f }) => (
                      <Select
                        value={String(f.value)}
                        onValueChange={(v) => f.onChange(Number(v))}
                      >
                        <SelectTrigger
                          aria-label={`Porcentaje fila ${i + 1}`}
                          className="h-8 text-xs"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PORCENTAJES_VIATICO.map((p) => (
                            <SelectItem key={p} value={String(p)}>
                              {p}%
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </td>
                <td className="px-2 py-1.5">
                  <FormField
                    control={control}
                    name={`hojas.${index}.filas.${i}.dias`}
                    render={({ field: f }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            type="number"
                            aria-label={`Días fila ${i + 1}`}
                            step="0.5"
                            min="0.5"
                            className="h-8 text-right text-xs"
                            value={Number.isFinite(f.value) ? f.value : ''}
                            onChange={(e) =>
                              f.onChange(
                                e.target.value === ''
                                  ? Number.NaN
                                  : Number(e.target.value)
                              )
                            }
                            onBlur={f.onBlur}
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                </td>
                <td className="px-2 py-2.5 text-right text-xs tabular-nums">
                  {formatMoney(calculo.porFila[i]?.importeDia ?? 0)}
                </td>
                <td className="px-2 py-2.5 text-right text-xs font-medium tabular-nums">
                  {formatMoney(calculo.porFila[i]?.totalBruto ?? 0)}
                </td>
                <td className="px-1 py-1.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive/80 h-8 w-8"
                    disabled={fields.length === 1}
                    onClick={() => remove(i)}
                  >
                    <Trash2 className="size-4" />
                    <span className="sr-only">Quitar fila</span>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t text-xs">
            <tr>
              <td colSpan={4} className="px-2 py-1.5 text-right font-semibold">
                Total viático
              </td>
              <td className="px-2 py-1.5 text-right font-semibold tabular-nums">
                {formatMoney(calculo.totales.totalBruto)}
              </td>
              <td />
            </tr>
            <tr>
              <td
                colSpan={4}
                className="text-muted-foreground px-2 py-1.5 text-right"
              >
                Menos: retención del RC-IVA 13%
              </td>
              <td className="text-muted-foreground px-2 py-1.5 text-right tabular-nums">
                {formatMoney(calculo.totales.rcIva)}
              </td>
              <td />
            </tr>
            <tr className="bg-primary/5">
              <td
                colSpan={4}
                className="px-2 py-2 text-right font-bold uppercase"
              >
                Total a pagar
              </td>
              <td className="text-primary px-2 py-2 text-right font-bold tabular-nums">
                {formatMoney(calculo.totales.totalLiquido)}
              </td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="text-xs"
        onClick={() => append(filaVacia(partidaPorDefecto))}
      >
        <Plus className="mr-1 h-4 w-4" />
        Agregar fila
      </Button>
    </section>
  );
}

/** Total a pagar de una hoja, para el resumen y la advertencia de presupuesto. */
export function liquidoDeHoja(
  hoja: LiquidacionViaticosInput['hojas'][number] | undefined,
  conceptos: Concepto[]
): number {
  const tarifas = new Map(
    conceptos.map((c) => [c.id, Number(c.precioInstitucional ?? 0)])
  );
  return totalizarHoja(
    (hoja?.filas ?? []).map((f) =>
      calcularFila(
        tarifas.get(Number(f?.conceptoId)) ?? 0,
        Number(f?.dias) || 0,
        Number(f?.porcentaje ?? 100)
      )
    )
  ).totalLiquido;
}
