'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useFieldArray, useFormContext, useWatch } from 'react-hook-form';
import { format, startOfToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarIcon, Trash2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Field,
  FieldSet,
  FieldLegend,
  FieldLabel,
} from '@/components/ui/field';
import { Separator } from '@/components/ui/separator';
import { cn, formatMoney } from '@/lib/utils';
import { calcularMontosConsultoria } from '@/lib/tax-calculator';
import type { SolicitudCompraFormData } from './solicitud-compra-schema';

const toDate = (value: string | Date | undefined): Date | undefined => {
  if (!value) return undefined;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

/**
 * Reparte un total en N partes iguales a 2 decimales, dejando que la última
 * absorba el redondeo para que la suma cierre exacta.
 */
const repartirEnPartesIguales = (total: number, n: number): number[] => {
  if (n <= 0) return [];
  const base = Math.floor((total / n) * 100) / 100;
  const montos = Array.from({ length: n }, () => base);
  const acumulado = Number((base * (n - 1)).toFixed(2));
  montos[n - 1] = Number((total - acumulado).toFixed(2));
  return montos;
};

export function ConsultoriaSection() {
  const { control, setValue, getValues } =
    useFormContext<SolicitudCompraFormData>();

  const montoLiquido = useWatch({ control, name: 'montoLiquido' });
  const tipoDocumento = useWatch({ control, name: 'tipoDocumento' });
  const pagos = useWatch({ control, name: 'pagos' });

  const { fields, append, remove } = useFieldArray({ control, name: 'pagos' });

  const liquido = Number(montoLiquido) || 0;

  const taxResult = useMemo(
    () => calcularMontosConsultoria(liquido, tipoDocumento ?? 'RECIBO'),
    [liquido, tipoDocumento]
  );

  const sumaPagos = useMemo(
    () => (pagos ?? []).reduce((acc, p) => acc + (Number(p?.monto) || 0), 0),
    [pagos]
  );

  const cuadra = Math.abs(sumaPagos - liquido) <= 0.01;
  const today = useMemo(() => startOfToday(), []);

  // Reparte en partes iguales al cambiar la cantidad de pagos, preservando
  // las filas ya escritas (crece por el final, recorta por el final).
  const handleCantidadPagos = useCallback(
    (cantidad: number) => {
      const actuales = getValues('pagos') ?? [];
      const total = Number(getValues('montoLiquido')) || 0;

      if (cantidad <= 0) {
        setValue('pagos', [], { shouldDirty: true, shouldValidate: true });
        return;
      }

      const montos = repartirEnPartesIguales(total, cantidad);
      const siguientes = Array.from({ length: cantidad }, (_, i) => ({
        monto: montos[i],
        fechaPago: actuales[i]?.fechaPago ?? '',
        descripcion: actuales[i]?.descripcion ?? '',
      }));

      setValue('pagos', siguientes, {
        shouldDirty: true,
        shouldValidate: true,
      });
    },
    [getValues, setValue]
  );

  // Al cambiar el monto del contrato, re-repartir si los pagos aún no fueron
  // ajustados a mano (es decir, si seguían cuadrando con el total anterior).
  const prevLiquido = useRef(liquido);
  useEffect(() => {
    if (prevLiquido.current === liquido) return;
    prevLiquido.current = liquido;

    const actuales = getValues('pagos') ?? [];
    if (actuales.length === 0) return;

    const montos = repartirEnPartesIguales(liquido, actuales.length);
    setValue(
      'pagos',
      actuales.map((p, i) => ({ ...p, monto: montos[i] })),
      { shouldDirty: true, shouldValidate: true }
    );
  }, [liquido, getValues, setValue]);

  return (
    <FieldSet>
      <FieldLegend>Contrato de Consultoría</FieldLegend>

      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          control={control}
          name="montoLiquido"
          render={({ field }) => (
            <Field>
              <FieldLabel>
                MONTO LÍQUIDO DEL CONTRATO (Bs){' '}
                <span className="text-destructive">*</span>
              </FieldLabel>
              <FormControl>
                <Input
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  {...field}
                  value={field.value ?? ''}
                  onChange={(e) => {
                    const raw = e.target.value;
                    field.onChange(
                      raw === ''
                        ? null
                        : /^\d*\.?\d*$/.test(raw)
                          ? Number(raw)
                          : field.value
                    );
                  }}
                />
              </FormControl>
              <p className="text-muted-foreground text-xs">
                Lo que recibe el consultor en mano, sin retenciones.
              </p>
              <FormMessage />
            </Field>
          )}
        />

        <FormField
          control={control}
          name="tipoDocumento"
          render={({ field }) => (
            <Field>
              <FieldLabel>TIPO DE DOCUMENTO</FieldLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="FACTURA">Factura</SelectItem>
                  <SelectItem value="RECIBO">Recibo</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-muted-foreground text-xs">
                Con recibo se aplica retención; con factura no.
              </p>
              <FormMessage />
            </Field>
          )}
        />
      </div>

      {/* Resumen fiscal */}
      <div className="bg-muted/40 mt-4 rounded-lg border p-4">
        <p className="text-muted-foreground mb-3 text-xs font-bold uppercase">
          Retención impositiva
        </p>

        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Líquido al consultor</span>
            <span className="font-medium">
              {formatMoney(taxResult.montoNeto)}
            </span>
          </div>

          {taxResult.desglose.map((d) => (
            <div key={d.label} className="flex justify-between">
              <span className="text-muted-foreground">{d.label}</span>
              <span>{formatMoney(d.monto)}</span>
            </div>
          ))}

          {taxResult.desglose.length === 0 && (
            <div className="text-muted-foreground flex justify-between">
              <span>Sin retenciones</span>
              <span>—</span>
            </div>
          )}

          <Separator className="my-2" />

          <div className="flex justify-between font-semibold">
            <span>Bruto con cargo al POA</span>
            <span>{formatMoney(taxResult.montoBruto)}</span>
          </div>
        </div>
      </div>

      {/* Cronograma de pagos */}
      <div className="mt-6">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <Label className="text-muted-foreground text-xs font-bold uppercase">
              Pagos parciales
            </Label>
            <p className="text-muted-foreground text-xs">
              En cuántos pagos se divide el contrato y en qué fechas.
            </p>
          </div>

          <div className="flex items-end gap-2">
            <div>
              <Label className="text-muted-foreground text-xs">
                Cantidad de pagos
              </Label>
              <Input
                type="text"
                inputMode="numeric"
                className="h-9 w-24"
                value={fields.length || ''}
                placeholder="0"
                onChange={(e) => {
                  const raw = e.target.value;
                  if (raw !== '' && !/^\d+$/.test(raw)) return;
                  const n = raw === '' ? 0 : Math.min(Number(raw), 36);
                  handleCantidadPagos(n);
                }}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9"
              onClick={() =>
                append({ monto: 0, fechaPago: '', descripcion: '' })
              }
            >
              <Plus className="mr-2 h-4 w-4" />
              Agregar pago
            </Button>
          </div>
        </div>

        {fields.length === 0 && (
          <div className="text-muted-foreground rounded-lg border border-dashed p-6 text-center text-sm">
            Indica en cuántos pagos se divide el contrato.
          </div>
        )}

        <div className="space-y-2">
          {fields.map((field, index) => (
            <PagoRow
              key={field.id}
              index={index}
              today={today}
              remove={remove}
            />
          ))}
        </div>

        {fields.length > 0 && (
          <div className="mt-3 flex items-center justify-end gap-3 text-sm">
            <span className="text-muted-foreground">Suma de pagos</span>
            <span
              className={cn(
                'rounded-full px-2.5 py-1 font-medium',
                cuadra
                  ? 'bg-muted text-muted-foreground'
                  : 'bg-destructive/10 text-destructive'
              )}
            >
              {formatMoney(sumaPagos)} / {formatMoney(liquido)}
            </span>
          </div>
        )}

        <FormField
          control={control}
          name="pagos"
          render={() => (
            <FormItem>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </FieldSet>
  );
}

interface PagoRowProps {
  index: number;
  today: Date;
  remove: (index: number) => void;
}

function PagoRow({ index, today, remove }: PagoRowProps) {
  const { control, setValue } = useFormContext<SolicitudCompraFormData>();
  const fechaPago = useWatch({ control, name: `pagos.${index}.fechaPago` });

  const selected = toDate(fechaPago as string | Date | undefined);

  return (
    <div className="bg-card grid grid-cols-1 items-start gap-2 rounded-lg border p-3 md:grid-cols-12 md:p-2">
      <div className="text-muted-foreground flex h-9 items-center text-xs font-bold md:col-span-1">
        Pago {index + 1}
      </div>

      <div className="md:col-span-3">
        <FormField
          control={control}
          name={`pagos.${index}.monto`}
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  className="h-9 text-right"
                  {...field}
                  value={field.value ?? ''}
                  onChange={(e) => {
                    const raw = e.target.value;
                    field.onChange(
                      raw === ''
                        ? null
                        : /^\d*\.?\d*$/.test(raw)
                          ? Number(raw)
                          : field.value
                    );
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="md:col-span-3">
        <FormField
          control={control}
          name={`pagos.${index}.fechaPago`}
          render={() => (
            <FormItem>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      type="button"
                      variant="outline"
                      className={cn(
                        'h-9 w-full justify-start text-left text-xs font-normal',
                        !selected && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      <span className="truncate">
                        {selected
                          ? format(selected, "d 'de' MMMM yyyy", { locale: es })
                          : 'Fecha de pago'}
                      </span>
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    locale={es}
                    selected={selected}
                    onSelect={(date) =>
                      setValue(
                        `pagos.${index}.fechaPago`,
                        date ? date.toISOString() : '',
                        { shouldDirty: true, shouldValidate: true }
                      )
                    }
                    disabled={{ before: today }}
                    className="rounded-md border"
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="md:col-span-4">
        <FormField
          control={control}
          name={`pagos.${index}.descripcion`}
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  className="h-9"
                  placeholder="Producto o hito (opcional)"
                  {...field}
                  value={field.value ?? ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="flex justify-end md:col-span-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="text-destructive hover:text-destructive hover:bg-destructive/10 h-9 w-9"
          onClick={() => remove(index)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
