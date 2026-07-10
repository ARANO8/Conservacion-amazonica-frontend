'use client';

import { useEffect, useMemo, useState } from 'react';
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Check, ChevronsUpDown } from 'lucide-react';
import { formatMoney, cn } from '@/lib/utils';
import {
  calcularMontoNetoRendicion,
  getCategoriaFromPartida,
  type TipoDocRendicion,
  type TipoRetencionGeneral,
} from '@/lib/tax-calculator';
import {
  CreateRendicionInput,
  GastoRendicion,
  TipoDocumentoGastoEnum,
} from '@/types/rendicion-schema';
import type { SolicitudResponse } from '@/types/solicitud-backend';

function round2(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Number.parseFloat(value.toFixed(2));
}

function getTipoDocumentoLabel(tipo: string): string {
  const labels: Record<string, string> = {
    FACTURA: 'Factura',
    RECIBO: 'Recibo',
    BOLETA: 'Boleta',
    LV: 'Liquidación Viáticos',
    DJ: 'Declaración Jurada',
    PPT: 'Planilla Pasajes Terceros',
    PAT: 'Planilla Alimentación Terceros',
    PVT: 'Planilla Viáticos Terceros',
  };
  return labels[tipo] ?? tipo;
}

function sanitizeMonetaryInput(value: string): string {
  const normalized = value.replace(/,/g, '.').replace(/[^0-9.]/g, '');
  const [integerPart, ...decimalParts] = normalized.split('.');
  if (decimalParts.length === 0) return integerPart;
  return `${integerPart}.${decimalParts.join('')}`;
}

interface PartidaComboboxProps {
  value: number;
  onChange: (value: number) => void;
  presupuestos: SolicitudResponse['presupuestos'];
}

function PartidaCombobox({ value, onChange, presupuestos }: PartidaComboboxProps) {
  const [open, setOpen] = useState(false);
  const selected = presupuestos?.find((p) => p.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="h-7 w-full justify-between px-1.5 text-[11px] font-normal"
        >
          {selected
            ? `${selected.poa?.codigoPoa ?? '—'}`
            : 'Seleccionar...'}
          <ChevronsUpDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar partida..." className="h-8 text-xs" />
          <CommandList>
            <CommandEmpty className="text-xs">No se encontró.</CommandEmpty>
            <CommandGroup>
              {(presupuestos ?? []).map((p) => (
                <CommandItem
                  key={p.id}
                  value={`${p.poa?.codigoPoa ?? ''} ${p.poa?.estructura?.partida?.nombre ?? ''}`}
                  onSelect={() => {
                    onChange(p.id);
                    setOpen(false);
                  }}
                  className="text-xs"
                >
                  <Check
                    className={cn(
                      'mr-2 h-3 w-3',
                      p.id === value ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                  <div className="flex flex-col">
                    <span className="font-mono text-[11px] font-bold text-primary">
                      {p.poa?.codigoPoa ?? '—'}
                    </span>
                    <span className="text-muted-foreground text-[10px] leading-tight">
                      {p.poa?.estructura?.partida?.nombre ?? '—'}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function GastoRow({
  index,
  form,
  solicitud,
  onRemove,
  onTabLastCell,
  showPartidaColumn,
}: {
  index: number;
  form: UseFormReturn<CreateRendicionInput>;
  solicitud: SolicitudResponse | null;
  onRemove: () => void;
  onTabLastCell: () => void;
  showPartidaColumn: boolean;
}) {
  const { control, setValue } = form;
  const [montoInput, setMontoInput] = useState<string>('');

  const montoTotal = useWatch({ control, name: `gastos.${index}.montoTotal` });
  const tipoDocumento = useWatch({ control, name: `gastos.${index}.tipoDocumento` });
  const partidaId = useWatch({ control, name: `gastos.${index}.partidaId` });
  const tipoRetencion = useWatch({ control, name: `gastos.${index}.tipoRetencion` });

  const nombrePartida = useMemo(() => {
    const presupuesto = (solicitud?.presupuestos ?? []).find(
      (p) => p.id === Number(partidaId),
    );
    return presupuesto?.poa?.estructura?.partida?.nombre ?? null;
  }, [solicitud, partidaId]);

  const categoria = useMemo(
    () => getCategoriaFromPartida(nombrePartida),
    [nombrePartida],
  );

  const taxResult = useMemo(() => {
    const bruto =
      typeof montoTotal === 'number'
        ? montoTotal
        : Number.parseFloat(String(montoTotal ?? 0)) || 0;
    return calcularMontoNetoRendicion(
      bruto,
      (tipoDocumento ?? 'FACTURA') as TipoDocRendicion,
      categoria,
      (tipoRetencion ?? 'SERVICIO') as TipoRetencionGeneral,
    );
  }, [montoTotal, tipoDocumento, categoria, tipoRetencion]);

  useEffect(() => {
    const montoBruto = round2(taxResult.montoNeto + taxResult.totalRetenciones);
    setValue(`gastos.${index}.montoBruto`, montoBruto, {
      shouldValidate: true,
      shouldDirty: true,
    });
    setValue(`gastos.${index}.montoImpuestos`, taxResult.totalRetenciones, {
      shouldValidate: true,
      shouldDirty: true,
    });
    setValue(`gastos.${index}.montoTotal`, montoBruto, {
      shouldValidate: true,
      shouldDirty: true,
    });
    setValue(`gastos.${index}.montoNeto`, taxResult.montoNeto, {
      shouldValidate: true,
      shouldDirty: true,
    });
  }, [taxResult.montoNeto, taxResult.totalRetenciones, index, setValue]);

  const presupuestos = solicitud?.presupuestos ?? [];

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Tab' && !e.shiftKey) {
      e.preventDefault();
      const container = e.currentTarget.closest('tr');
      if (!container) return;
      const inputs = container.querySelectorAll<HTMLElement>(
        'input, select, button[role="combobox"], [tabindex]',
      );
      const currentIdx = Array.from(inputs).indexOf(e.currentTarget as HTMLElement);
      if (currentIdx < inputs.length - 1) {
        inputs[currentIdx + 1]?.focus();
      } else {
        onTabLastCell();
      }
    }
  }

  return (
    <tr className="border-b border-border hover:bg-muted/30">
      {/* # */}
      <td className="px-1.5 py-1 text-center text-[11px] text-muted-foreground w-8">
        {index + 1}
      </td>

      {/* Fecha */}
      <td className="px-1 py-1 w-[105px]">
        <FormField
          control={control}
          name={`gastos.${index}.fechaDocumento`}
          render={({ field }) => (
            <FormItem className="space-y-0">
              <FormControl>
                <input
                  type="date"
                  className="h-7 w-full rounded border border-input bg-background px-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  value={
                    typeof field.value === 'string'
                      ? field.value
                      : field.value instanceof Date
                        ? field.value.toISOString().split('T')[0]
                        : ''
                  }
                  onChange={(e) => field.onChange(e.target.value)}
onKeyDown={(e) => handleKeyDown(e)}
              />
            </FormControl>
          </FormItem>
        )}
      />
    </td>

    {/* N° Doc */}
    <td className="px-1 py-1 w-[110px]">
      <FormField
        control={control}
        name={`gastos.${index}.numeroDocumento`}
        render={({ field }) => (
          <FormItem className="space-y-0">
            <FormControl>
              <input
                type="text"
                className="h-7 w-full rounded border border-input bg-background px-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="0001-2025-..."
                {...field}
                value={field.value ?? ''}
                onKeyDown={(e) => handleKeyDown(e)}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </td>

      {/* Tipo Doc */}
      <td className="px-1 py-1 w-[100px]">
        <FormField
          control={control}
          name={`gastos.${index}.tipoDocumento`}
          render={({ field }) => (
            <FormItem className="space-y-0">
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="h-7 text-xs px-1.5">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {TipoDocumentoGastoEnum.options.map((tipo) => (
                    <SelectItem key={tipo} value={tipo} className="text-xs">
                      {getTipoDocumentoLabel(tipo)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />
      </td>

      {/* Partida (conditional) */}
      {showPartidaColumn && (
        <td className="px-1 py-1 w-[130px]">
          <FormField
            control={control}
            name={`gastos.${index}.partidaId`}
            render={({ field }) => (
              <FormItem className="space-y-0">
                <FormControl>
                  <PartidaCombobox
                    value={field.value ?? 0}
                    onChange={field.onChange}
                    presupuestos={presupuestos}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </td>
      )}

      {/* Descripción */}
      <td className="px-1 py-1 min-w-[160px]">
        <FormField
          control={control}
          name={`gastos.${index}.concepto`}
          render={({ field }) => (
            <FormItem className="space-y-0">
              <FormControl>
                <input
                  type="text"
                  className="h-7 w-full rounded border border-input bg-background px-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Descripción..."
                  {...field}
                  value={field.value ?? ''}
                  onKeyDown={(e) => handleKeyDown(e)}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </td>

      {/* INGRESOS */}
      <td className="px-1 py-1 w-[100px] text-right text-xs tabular-nums text-muted-foreground">
        —
      </td>

      {/* EGRESOS */}
      <td className="px-1 py-1 w-[110px]">
        <FormField
          control={control}
          name={`gastos.${index}.montoTotal`}
          render={({ field }) => (
            <FormItem className="space-y-0">
              <FormControl>
                <input
                  type="text"
                  inputMode="decimal"
                  className="h-7 w-full rounded border border-input bg-background px-1.5 text-xs text-right focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="0.00"
                  value={montoInput || (field.value && field.value > 0 ? field.value.toString() : '')}
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
                    if (!montoInput || montoInput === '.') {
                      setMontoInput('');
                      field.onChange(0);
                      return;
                    }
                    const parsed = Number.parseFloat(montoInput);
                    if (!Number.isFinite(parsed) || parsed <= 0) {
                      setMontoInput('');
                      field.onChange(0);
                      return;
                    }
                    const rounded = round2(parsed);
                    setMontoInput(rounded.toFixed(2));
                    field.onChange(rounded);
                  }}
                  onKeyDown={(e) => handleKeyDown(e)}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </td>

      {/* SALDO */}
      <td className="px-1 py-1 w-[100px] text-right text-xs tabular-nums">
        <span className="font-medium">—</span>
      </td>

      {/* Remove */}
      <td className="px-1 py-1 w-8 text-center">
        <button
          type="button"
          onClick={onRemove}
          className="inline-flex items-center justify-center h-6 w-6 rounded text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </td>
    </tr>
  );
}

interface GastoTableProps {
  fields: { id: string }[];
  append: (value: GastoRendicion) => void;
  remove: (index: number) => void;
  solicitud: SolicitudResponse | null;
  form: UseFormReturn<CreateRendicionInput>;
}

export function GastoTable({
  fields,
  append,
  remove,
  solicitud,
  form,
}: GastoTableProps) {
  const montoAvance = useMemo(
    () => Number(solicitud?.montoTotalNeto ?? 0),
    [solicitud?.montoTotalNeto],
  );
  const presupuestos = useMemo(
    () => solicitud?.presupuestos ?? [],
    [solicitud?.presupuestos],
  );
  const showPartidaColumn = presupuestos.length > 1;

  const gastosWatch = useWatch({ control: form.control, name: 'gastos' }) ?? [];

  function handleAgregar() {
    append({
      concepto: '',
      tipoDocumento: 'FACTURA',
      numeroDocumento: '',
      fechaDocumento: new Date().toISOString().split('T')[0],
      montoBruto: 0,
      montoImpuestos: 0,
      montoTotal: 0,
      montoNeto: 0,
      proveedor: '',
      detalle: '',
      partidaId: presupuestos.length === 1 ? presupuestos[0].id : 0,
      tipoRetencion: 'SERVICIO',
    });
  }

  function handleTabLastCell() {
    handleAgregar();
  }

  // Auto-set partidaId for new gastos when only one presupuesto
  useEffect(() => {
    if (presupuestos.length === 1 && fields.length > 0) {
      for (let i = 0; i < fields.length; i++) {
        const current = form.getValues(`gastos.${i}.partidaId`);
        if (!current || current === 0) {
          form.setValue(`gastos.${i}.partidaId`, presupuestos[0].id, {
            shouldValidate: true,
          });
        }
      }
    }
  }, [presupuestos, fields.length, form]);

  return (
    <div className="w-full overflow-x-auto rounded-lg border border-border">
      <table className="w-full border-collapse text-xs">
        <thead>
          {/* Header sub-row: MONTO BS spans INGRESOS | EGRESOS | SALDO */}
          <tr className="bg-muted/60">
            <th className="px-1.5 py-1 text-[10px] font-bold tracking-wider uppercase text-muted-foreground w-8 border-r border-border">
              #
            </th>
            <th className="px-1 py-1 text-[10px] font-bold tracking-wider uppercase text-muted-foreground w-[105px] border-r border-border">
              Fecha
            </th>
            <th className="px-1 py-1 text-[10px] font-bold tracking-wider uppercase text-muted-foreground w-[110px] border-r border-border">
              N° Doc.
            </th>
            <th className="px-1 py-1 text-[10px] font-bold tracking-wider uppercase text-muted-foreground w-[100px] border-r border-border">
              Tipo Doc.
            </th>
            {showPartidaColumn && (
              <th className="px-1 py-1 text-[10px] font-bold tracking-wider uppercase text-muted-foreground w-[130px] border-r border-border">
                Partida
              </th>
            )}
            <th className="px-1 py-1 text-[10px] font-bold tracking-wider uppercase text-muted-foreground min-w-[160px] border-r border-border">
              Descripción
            </th>
            <th
              colSpan={3}
              className="px-1 py-1 text-[10px] font-bold tracking-wider uppercase text-center text-muted-foreground border-r border-border"
            >
              MONTO BS
            </th>
            <th className="px-1 py-1 w-8 border-r border-border" />
          </tr>
          {/* Header sub-row: INGRESOS | EGRESOS | SALDO */}
          <tr className="bg-muted/40">
            <th colSpan={5 + (showPartidaColumn ? 1 : 0)} className="border-r border-border" />
            <th className="px-1 py-0.5 text-[10px] font-semibold text-muted-foreground text-right border-r border-border">
              INGRESOS
            </th>
            <th className="px-1 py-0.5 text-[10px] font-semibold text-muted-foreground text-right border-r border-border">
              EGRESOS
            </th>
            <th className="px-1 py-0.5 text-[10px] font-semibold text-muted-foreground text-right border-r border-border">
              SALDO
            </th>
            <th colSpan={1} />
          </tr>
        </thead>
        <tbody>
          {/* FONDO EN AVANCE row */}
          <tr className="bg-primary/5 border-b border-border font-medium">
            <td className="px-1.5 py-1 text-center text-[11px] text-muted-foreground border-r border-border">
              —
            </td>
            <td className="px-1 py-1 text-[11px] border-r border-border">
              {solicitud?.fechaSolicitud
                ? new Date(solicitud.fechaSolicitud).toLocaleDateString('es-BO')
                : '—'}
            </td>
            <td className="px-1 py-1 text-[11px] border-r border-border">
              {solicitud?.codigoSolicitud ?? '—'}
            </td>
            <td className="px-1 py-1 text-[11px] border-r border-border">—</td>
            {showPartidaColumn && (
              <td className="px-1 py-1 text-[11px] border-r border-border">—</td>
            )}
            <td className="px-1 py-1 text-[11px] font-semibold border-r border-border">
              FONDO EN AVANCE
            </td>
            <td className="px-1 py-1 text-[11px] text-right font-bold text-emerald-600 border-r border-border">
              {formatMoney(montoAvance)}
            </td>
            <td className="px-1 py-1 text-[11px] text-right border-r border-border">
              —
            </td>
            <td className="px-1 py-1 text-[11px] text-right font-bold border-r border-border">
              {formatMoney(montoAvance)}
            </td>
            <td className="px-1 py-1 w-8" />
          </tr>

          {/* Gasto rows */}
          {fields.length === 0 ? (
            <tr>
              <td
                colSpan={10 + (showPartidaColumn ? 1 : 0)}
                className="px-4 py-6 text-center text-xs text-muted-foreground"
              >
                No hay gastos agregados. Presiona &quot;+ Agregar fila&quot; para empezar.
              </td>
            </tr>
          ) : (
            fields.map((field, index) => (
              <GastoRow
                key={field.id}
                index={index}
                form={form}
                solicitud={solicitud}
                onRemove={() => remove(index)}
                onTabLastCell={handleTabLastCell}
                showPartidaColumn={showPartidaColumn}
              />
            ))
          )}
        </tbody>
        {/* Footer with totals */}
        <tfoot>
          <tr className="bg-muted/40 border-t border-border font-semibold">
            <td colSpan={5 + (showPartidaColumn ? 1 : 0)} className="px-1.5 py-1 text-[11px] text-right">
              TOTALES
            </td>
            <td className="px-1 py-1 text-[11px] text-right text-emerald-600 border-r border-border">
              {formatMoney(montoAvance)}
            </td>
            <td className="px-1 py-1 text-[11px] text-right text-red-600 border-r border-border">
               {formatMoney(
                gastosWatch.reduce(
                  (sum: number, g: { montoTotal?: number }) => sum + Number(g?.montoTotal ?? 0),
                  0,
                ),
              )}
            </td>
            <td className="px-1 py-1 text-[11px] text-right font-bold border-r border-border">
              {formatMoney(
                round2(
                  montoAvance -
                    gastosWatch.reduce(
                      (sum: number, g: { montoTotal?: number }) => sum + Number(g?.montoTotal ?? 0),
                      0,
                    ),
                ),
              )}
            </td>
            <td colSpan={1} />
          </tr>
        </tfoot>
      </table>

      {/* Add row button */}
      <div className="flex justify-start px-2 py-1.5">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleAgregar}
          className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground"
        >
          <Plus className="h-3.5 w-3.5" />
          Agregar fila
        </Button>
      </div>
    </div>
  );
}
