'use client';

import { useEffect, useMemo, useState } from 'react';
import { UseFormReturn, useWatch } from 'react-hook-form';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Trash2, Calculator, Check, ChevronsUpDown } from 'lucide-react';
import { formatMoney, cn } from '@/lib/utils';
import {
  calcularMontoNetoRendicion,
  getCategoriaFromPartida,
  TipoDocRendicion,
  TipoRetencionGeneral,
} from '@/lib/tax-calculator';
import {
  CreateRendicionInput,
  TipoDocumentoGastoEnum,
  TipoRetencionEnum,
} from '@/types/rendicion-schema';
import { SolicitudResponse } from '@/types/solicitud-backend';

function getTipoDocumentoLabel(tipo: string): string {
  switch (tipo) {
    case 'FACTURA':
      return 'Factura';
    case 'RECIBO':
      return 'Recibo (con retención)';
    case 'BOLETA':
      return 'Boleta (con retención)';
    case 'LV':
      return 'Liquidación Viáticos (LV)';
    case 'DJ':
      return 'Declaración Jurada (DJ)';
    case 'PPT':
      return 'Planilla de Pasajes Terceros (PPT)';
    case 'PAT':
      return 'Planilla de Alimentación Terceros (PAT)';
    case 'PVT':
      return 'Planilla de Viáticos Terceros (PVT)';
    default:
      return tipo;
  }
}

function sanitizeMonetaryInput(value: string): string {
  const normalized = value.replace(/,/g, '.').replace(/[^0-9.]/g, '');
  const [integerPart, ...decimalParts] = normalized.split('.');
  if (decimalParts.length === 0) return integerPart;
  return `${integerPart}.${decimalParts.join('')}`;
}

function round2(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Number.parseFloat(value.toFixed(2));
}

interface GastoCardProps {
  index: number;
  solicitud: SolicitudResponse | null;
  onRemove: () => void;
  form: UseFormReturn<CreateRendicionInput>;
}

export function GastoCard({ index, solicitud, onRemove, form }: GastoCardProps) {
  const { control, setValue } = form;

  // Watch the fields that affect tax calculation
  const montoTotal = useWatch({ control, name: `gastos.${index}.montoTotal` });
  const tipoDocumento = useWatch({
    control,
    name: `gastos.${index}.tipoDocumento`,
  });
  const partidaId = useWatch({ control, name: `gastos.${index}.partidaId` });
  const tipoRetencion = useWatch({
    control,
    name: `gastos.${index}.tipoRetencion`,
  });
  const [openPartida, setOpenPartida] = useState(false);
  const [montoTotalInput, setMontoTotalInput] = useState<string>(() => {
    const numericMontoTotal =
      typeof montoTotal === 'number'
        ? montoTotal
        : Number.parseFloat(String(montoTotal ?? 0));
    if (!Number.isFinite(numericMontoTotal) || numericMontoTotal <= 0) {
      return '';
    }
    return String(numericMontoTotal);
  });

  // Derive category from selected partida name
  const nombrePartida = useMemo(() => {
    const presupuesto = (solicitud?.presupuestos ?? []).find(
      (p) => p.id === Number(partidaId)
    );
    return presupuesto?.poa?.estructura?.partida?.nombre ?? null;
  }, [solicitud, partidaId]);

  const categoria = useMemo(
    () => getCategoriaFromPartida(nombrePartida),
    [nombrePartida]
  );

  // Show tipoRetencion selector only for RECIBO/BOLETA + GENERAL category
  const showTipoRetencion =
    (tipoDocumento === 'RECIBO' || tipoDocumento === 'BOLETA') &&
    categoria === 'GENERAL';

  // Compute tax result
  const taxResult = useMemo(() => {
    const bruto =
      typeof montoTotal === 'number'
        ? montoTotal
        : parseFloat(String(montoTotal ?? 0)) || 0;

    return calcularMontoNetoRendicion(
      bruto,
      (tipoDocumento ?? 'FACTURA') as TipoDocRendicion,
      categoria,
      (tipoRetencion ?? 'SERVICIO') as TipoRetencionGeneral
    );
  }, [montoTotal, tipoDocumento, categoria, tipoRetencion]);

  // Sync montoNeto whenever taxResult changes
  useEffect(() => {
    const montoBruto = round2(taxResult.montoNeto + taxResult.totalRetenciones);
    const montoImpuestos = round2(taxResult.totalRetenciones);

    setValue(`gastos.${index}.montoBruto`, montoBruto, {
      shouldValidate: true,
      shouldDirty: true,
    });
    setValue(`gastos.${index}.montoImpuestos`, montoImpuestos, {
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

  return (
    <Card className="w-full border shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm font-semibold">
            Registro de Gasto #{index + 1}
          </CardTitle>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="text-destructive hover:bg-destructive/10 hover:text-destructive h-8 w-8 p-0"
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Eliminar registro de gasto</span>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* --- Fecha Documento --- */}
        <FormField
          control={control}
          name={`gastos.${index}.fechaDocumento`}
          render={({ field }) => (
            <FormItem className="md:col-span-1">
              <FormLabel className="text-sm font-bold tracking-wider uppercase">
                Fecha
              </FormLabel>
              <FormControl>
                <Input
                  type="date"
                  className="h-9"
                  value={
                    typeof field.value === 'string'
                      ? field.value
                      : field.value instanceof Date
                        ? field.value.toISOString().split('T')[0]
                        : ''
                  }
                  onChange={(e) => field.onChange(e.target.value)}
                />
              </FormControl>
              <FormMessage className="text-sm" />
            </FormItem>
          )}
        />

        {/* --- Tipo Documento --- */}
        <FormField
          control={control}
          name={`gastos.${index}.tipoDocumento`}
          render={({ field }) => (
            <FormItem className="md:col-span-1">
              <FormLabel className="text-sm font-bold tracking-wider uppercase">
                Tipo
              </FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {TipoDocumentoGastoEnum.options.map((tipo) => (
                    <SelectItem key={tipo} value={tipo}>
                      {getTipoDocumentoLabel(tipo)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage className="text-sm" />
            </FormItem>
          )}
        />

        {/* --- Número Documento --- */}
        <FormField
          control={control}
          name={`gastos.${index}.numeroDocumento`}
          render={({ field }) => (
            <FormItem className="md:col-span-1">
              <FormLabel className="text-sm font-bold tracking-wider uppercase">
                N° Documento
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="Ej: 0001-2025-0001234"
                  className="h-9 text-sm"
                  {...field}
                />
              </FormControl>
              <FormMessage className="text-sm" />
            </FormItem>
          )}
        />

        {/* --- Proveedor --- */}
        <FormField
          control={control}
          name={`gastos.${index}.proveedor`}
          render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel className="text-sm font-bold tracking-wider uppercase">
                Proveedor
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="Nombre del proveedor"
                  className="h-9 text-sm"
                  {...field}
                />
              </FormControl>
              <FormMessage className="text-sm" />
            </FormItem>
          )}
        />

        {/* --- Partida Presupuestaria --- */}
        <FormField
          control={control}
          name={`gastos.${index}.partidaId`}
          render={({ field }) => (
            <FormItem className="md:col-span-1 flex flex-col justify-end">
              <FormLabel className="text-sm font-bold tracking-wider uppercase mb-2">
                Partida Presupuestaria *
              </FormLabel>
              <Popover open={openPartida} onOpenChange={setOpenPartida}>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openPartida}
                      className={cn(
                        "w-full justify-between h-9 text-sm font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value
                        ? (() => {
                            const p = (solicitud?.presupuestos ?? []).find(
                              (x) => x.id === field.value
                            );
                            return p
                              ? `${p.poa?.codigoPoa ?? '—'} – ${p.poa?.estructura?.partida?.nombre ?? '—'}`
                              : 'Seleccionar partida...';
                          })()
                        : 'Seleccionar partida...'}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Buscar partida..." />
                    <CommandList>
                      <CommandEmpty>No se encontró la partida.</CommandEmpty>
                      <CommandGroup>
                        {(solicitud?.presupuestos ?? []).map((p) => {
                          const codigo = p.poa?.codigoPoa ?? '—';
                          const partida = p.poa?.estructura?.partida?.nombre ?? '—';
                          return (
                            <CommandItem
                              key={p.id}
                              value={`${codigo} ${partida}`}
                              onSelect={() => {
                                field.onChange(p.id);
                                setOpenPartida(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  p.id === field.value ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <div className="flex flex-col">
                                <span className="font-mono text-xs font-bold text-primary">{codigo}</span>
                                <span className="text-[10px] text-foreground leading-tight">{partida}</span>
                              </div>
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <FormMessage className="text-sm" />
            </FormItem>
          )}
        />

        {/* --- Concepto / Detalle --- */}
        <FormField
          control={control}
          name={`gastos.${index}.concepto`}
          render={({ field }) => (
            <FormItem className="md:col-span-3">
              <FormLabel className="text-sm font-bold tracking-wider uppercase">
                Concepto / Detalle *
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe el gasto realizado (requerido)"
                  className="min-h-16 resize-none text-sm"
                  {...field}
                />
              </FormControl>
              <FormMessage className="text-sm" />
            </FormItem>
          )}
        />

        <Separator className="my-2 md:col-span-3" />

        {/* --- Monto Total (bruto pagado) --- */}
        <FormField
          control={control}
          name={`gastos.${index}.montoTotal`}
          render={({ field }) => (
            <FormItem className="md:col-span-1">
              <FormLabel className="text-sm font-bold tracking-wider uppercase">
                Monto Total Pagado (bruto) Bs. *
              </FormLabel>
              <FormControl>
                <Input
                  type="text"
                  placeholder="0.00"
                  inputMode="decimal"
                  className="h-9 text-sm"
                  name={field.name}
                  ref={field.ref}
                  value={montoTotalInput}
                  onChange={(e) => {
                    const sanitized = sanitizeMonetaryInput(e.target.value);
                    setMontoTotalInput(sanitized);

                    if (!sanitized || sanitized === '.') {
                      field.onChange(0);
                      return;
                    }

                    const parsed = Number.parseFloat(sanitized);
                    const parsedValue = Number.isFinite(parsed) ? parsed : 0;
                    field.onChange(parsedValue);
                    setValue(`gastos.${index}.montoBruto`, parsedValue, {
                      shouldValidate: true,
                      shouldDirty: true,
                    });
                  }}
                  onBlur={() => {
                    field.onBlur();
                    if (!montoTotalInput || montoTotalInput === '.') {
                      setMontoTotalInput('');
                      return;
                    }

                    const parsed = Number.parseFloat(montoTotalInput);
                    if (!Number.isFinite(parsed) || parsed <= 0) {
                      setMontoTotalInput('');
                      field.onChange(0);
                      return;
                    }

                    const rounded = round2(parsed);
                    setMontoTotalInput(rounded.toFixed(2));
                    field.onChange(rounded);
                    setValue(`gastos.${index}.montoBruto`, rounded, {
                      shouldValidate: true,
                      shouldDirty: true,
                    });
                  }}
                />
              </FormControl>
              <FormMessage className="text-sm" />
            </FormItem>
          )}
        />

        {/* --- Panel de Retenciones y Monto Neto --- */}
        <div className="bg-muted/50 space-y-2 rounded-lg p-3 text-sm md:col-span-2">
          {showTipoRetencion && (
            <FormField
              control={control}
              name={`gastos.${index}.tipoRetencion`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-bold tracking-wider uppercase">
                    Tipo de Gasto (Retención) *
                  </FormLabel>
                  <Select
                    value={field.value ?? 'SERVICIO'}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {TipoRetencionEnum.options.map((tipo) => {
                        const labels: Record<string, string> = {
                          BIEN: 'Compra de Bien (IUE 5% + IT 3% = 8%)',
                          SERVICIO: 'Servicio (IUE 12.5% + IT 3% ≈ 16%)',
                          ALQUILER: 'Alquiler (IVA 13% + IT 3% = 16%)',
                        };
                        return (
                          <SelectItem key={tipo} value={tipo}>
                            {labels[tipo] ?? tipo}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-sm" />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={control}
            name={`gastos.${index}.montoBruto`}
            render={({ field }) => (
              <FormItem className="hidden">
                <FormControl>
                  <Input type="number" readOnly tabIndex={-1} {...field} />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name={`gastos.${index}.montoImpuestos`}
            render={({ field }) => (
              <FormItem className="hidden">
                <FormControl>
                  <Input type="number" readOnly tabIndex={-1} {...field} />
                </FormControl>
              </FormItem>
            )}
          />

          <div className="flex items-center gap-1.5">
            <Calculator className="text-muted-foreground h-3.5 w-3.5" />
            <span className="text-foreground font-bold tracking-wider uppercase">
              Retenciones Calculadas
            </span>
          </div>

          {taxResult.desglose.length === 0 ? (
            <p className="text-foreground italic">Sin retenciones (Factura).</p>
          ) : (
            <div className="space-y-1">
              {taxResult.desglose.map((d) => (
                <div
                  key={d.label}
                  className="flex items-center justify-between"
                >
                  <span className="text-foreground">{d.label}:</span>
                  <span className="font-semibold text-orange-600 dark:text-orange-400">
                    − {formatMoney(d.monto)} Bs.
                  </span>
                </div>
              ))}
              <Separator className="my-1" />
              <div className="flex items-center justify-between">
                <span className="text-foreground font-medium">
                  Total Retenciones:
                </span>
                <span className="font-bold text-red-600 dark:text-red-400">
                  − {formatMoney(taxResult.totalRetenciones)} Bs.
                </span>
              </div>
            </div>
          )}

          {/* Monto Neto — readOnly, sincronizado por useEffect */}
          <div className="mt-2 border-t pt-2">
            <FormField
              control={control}
              name={`gastos.${index}.montoNeto`}
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between gap-2">
                    <FormLabel className="text-sm font-bold tracking-wider uppercase">
                      Monto Neto (líquido a proveedor) Bs.
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        readOnly
                        tabIndex={-1}
                        className="bg-background h-8 w-32 cursor-not-allowed text-right text-sm font-bold"
                        value={field.value ?? 0}
                        onChange={() => {}}
                      />
                    </FormControl>
                  </div>
                  <FormMessage className="text-sm" />
                </FormItem>
              )}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
