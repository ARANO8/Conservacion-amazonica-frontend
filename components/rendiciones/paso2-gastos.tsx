'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  useFormContext,
  useFieldArray,
  useWatch,
  UseFormReturn,
} from 'react-hook-form';
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
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { FieldGroup, FieldSet, FieldLegend } from '@/components/ui/field';
import {
  CreateRendicionInput,
  TipoDocumentoGastoEnum,
  TipoRetencionEnum,
} from '@/types/rendicion-schema';
import { SolicitudResponse } from '@/types/solicitud-backend';
import { formatMoney } from '@/lib/utils';
import {
  calcularMontoNetoRendicion,
  getCategoriaFromPartida,
  TipoDocRendicion,
  TipoRetencionGeneral,
} from '@/lib/tax-calculator';
import {
  Banknote,
  BookOpen,
  Calculator,
  Layers,
  Plus,
  Trash2,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getTipoDocumentoLabel(tipo: string): string {
  switch (tipo) {
    case 'FACTURA':
      return 'Factura';
    case 'RECIBO':
      return 'Recibo (con retención)';
    case 'BOLETA':
      return 'Boleta (con retención)';
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

// ---------------------------------------------------------------------------
// Sub-componente: Grid de Partidas Aprobadas
// ---------------------------------------------------------------------------

interface PartidasAprobadasProps {
  solicitud: SolicitudResponse | null;
  gastos: CreateRendicionInput['gastos'];
}

function PartidasAprobadas({ solicitud, gastos }: PartidasAprobadasProps) {
  const presupuestos = solicitud?.presupuestos ?? [];

  // Filtrar entradas que tengan al menos código POA para que la card tenga sentido
  const partidas = presupuestos.filter((p) => p.poa?.codigoPoa);

  if (!solicitud) return null;

  if (partidas.length === 0) {
    return (
      <div className="bg-muted/40 mb-6 rounded-lg border border-dashed p-4">
        <div className="flex items-center gap-2">
          <Layers className="text-muted-foreground h-4 w-4 shrink-0" />
          <p className="text-foreground text-sm">
            No se encontraron partidas presupuestarias para esta solicitud.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6 space-y-3">
      {/* Encabezado de sección */}
      <div className="flex items-center gap-2">
        <BookOpen className="text-primary h-4 w-4 shrink-0" />
        <h3 className="text-sm font-bold tracking-wide uppercase">
          Partidas Aprobadas para esta Rendición
        </h3>
      </div>
      <p className="text-foreground text-sm">
        Cada comprobante debe imputarse a una de estas partidas. El monto
        mostrado es el subtotal presupuestado aprobado por línea.
      </p>

      {/* Grid de tarjetas */}
      <div className="flex w-full flex-wrap gap-4">
        {partidas.map((p) => {
          const codigo = p.poa?.codigoPoa ?? '—';
          const partida = p.poa?.estructura?.partida?.nombre ?? 'Sin partida';
          const proyecto = p.poa?.estructura?.proyecto?.nombre;
          const grupo = p.poa?.estructura?.grupo?.nombre;
          const montoAprobado = Number(
            p.subtotalPresupuestado ?? p.poa?.montoPresupuestado ?? 0
          );
          const montoRendido = (gastos ?? []).reduce((sum, gasto) => {
            if (!gasto) return sum;
            if (Number(gasto.partidaId) !== p.id) return sum;
            return sum + (Number(gasto.montoTotal) || 0);
          }, 0);
          const saldo = round2(montoAprobado - montoRendido);

          const saldoUi =
            saldo > 0
              ? {
                  label: `A DEVOLVER: ${formatMoney(saldo)} Bs.`,
                  className:
                    'text-amber-600 border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/40',
                }
              : saldo < 0
                ? {
                    label: `A REEMBOLSAR: ${formatMoney(Math.abs(saldo))} Bs.`,
                    className:
                      'text-blue-600 border-blue-300 bg-blue-50 dark:border-blue-700 dark:bg-blue-950/40',
                  }
                : {
                    label: 'RENDICIÓN EXACTA',
                    className:
                      'text-emerald-600 border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/40',
                  };

          return (
            <Card
              key={p.id}
              className="bg-muted/40 w-full min-w-[280px] flex-1 border shadow-none transition-shadow hover:shadow-sm"
            >
              <CardHeader className="pt-3 pb-2">
                <div className="flex items-start justify-between gap-2">
                  <Badge
                    variant="secondary"
                    className="text-primary bg-primary/10 border-primary/20 shrink-0 border font-mono text-[10px] font-bold"
                  >
                    {codigo}
                  </Badge>
                </div>
                <CardTitle className="text-foreground mt-1 text-xs leading-snug font-semibold">
                  {partida}
                </CardTitle>
                {(proyecto || grupo) && (
                  <p className="text-foreground truncate text-sm">
                    {[proyecto, grupo].filter(Boolean).join(' / ')}
                  </p>
                )}
              </CardHeader>

              <CardContent className="pb-3">
                <Separator className="mb-2" />
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Banknote className="text-muted-foreground h-3.5 w-3.5" />
                      <span className="text-foreground text-sm font-bold tracking-wider uppercase">
                        Aprobado
                      </span>
                    </div>
                    <span className="text-primary text-sm font-black tracking-tight">
                      {formatMoney(montoAprobado)}{' '}
                      <span className="text-foreground text-sm font-normal">
                        Bs.
                      </span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-foreground text-sm font-bold tracking-wider uppercase">
                      Rendido
                    </span>
                    <span className="text-sm font-bold tracking-tight">
                      {formatMoney(montoRendido)}{' '}
                      <span className="text-foreground text-sm font-normal">
                        Bs.
                      </span>
                    </span>
                  </div>
                  <Badge
                    variant="outline"
                    className={`mt-1 w-full justify-center text-sm font-extrabold tracking-wide ${saldoUi.className}`}
                  >
                    {saldoUi.label}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Separator className="mt-4" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-componente: ComprobanteCard (scoped useWatch + useEffect per card)
// ---------------------------------------------------------------------------

interface ComprobanteCardProps {
  index: number;
  solicitud: SolicitudResponse | null;
  onRemove: () => void;
  form: UseFormReturn<CreateRendicionInput>;
}

function ComprobanteCard({
  index,
  solicitud,
  onRemove,
  form,
}: ComprobanteCardProps) {
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
            Comprobante #{index + 1}
          </CardTitle>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="text-destructive hover:bg-destructive/10 hover:text-destructive h-8 w-8 p-0"
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Eliminar comprobante</span>
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
            <FormItem className="md:col-span-1">
              <FormLabel className="text-sm font-bold tracking-wider uppercase">
                Partida Presupuestaria *
              </FormLabel>
              <Select
                value={field.value ? String(field.value) : ''}
                onValueChange={(val) => field.onChange(Number(val))}
              >
                <FormControl>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Selecciona una partida..." />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {(solicitud?.presupuestos ?? []).map((p) => {
                    const codigo = p.poa?.codigoPoa ?? '—';
                    const partida = p.poa?.estructura?.partida?.nombre ?? '—';
                    return (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {codigo} – {partida}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <FormMessage className="text-sm" />
            </FormItem>
          )}
        />

        {/* --- URL Comprobante --- */}
        <FormField
          control={control}
          name={`gastos.${index}.urlComprobante`}
          render={({ field }) => (
            <FormItem className="md:col-span-3">
              <FormLabel className="text-sm font-bold tracking-wider uppercase">
                URL Comprobante *
              </FormLabel>
              <FormControl>
                <Input
                  type="url"
                  placeholder="https://drive.google.com/..."
                  className="h-9 text-sm"
                  {...field}
                />
              </FormControl>
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

// ---------------------------------------------------------------------------
// Componente Principal
// ---------------------------------------------------------------------------

export default function Paso2Gastos({
  solicitud,
}: {
  solicitud: SolicitudResponse | null;
}) {
  const form = useFormContext<CreateRendicionInput>();
  const { control } = form;
  const gastos = useWatch({ control, name: 'gastos' }) ?? [];
  const {
    fields: gastosFields,
    append: appendGasto,
    remove: removeGasto,
  } = useFieldArray({
    control,
    name: 'gastos',
  });
  const {
    fields: gastosSinRespaldoFields,
    append: appendGastoSinRespaldo,
    remove: removeGastoSinRespaldo,
  } = useFieldArray({
    control,
    name: 'gastosSinRespaldo',
  });

  const handleAgregarGasto = () => {
    appendGasto({
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
      partidaId: 0,
      urlComprobante: '',
      tipoRetencion: 'SERVICIO',
    });
  };

  const handleAgregarGastoSinRespaldo = () => {
    appendGastoSinRespaldo({
      fechaGasto: new Date().toISOString().split('T')[0],
      detalle: '',
      monto: 0,
    });
  };

  const totalMontoTotal = gastosFields.reduce((sum, _, idx) => {
    const monto = form.watch(`gastos.${idx}.montoTotal`);
    const valor =
      typeof monto === 'number' ? monto : parseFloat(String(monto ?? 0)) || 0;
    return sum + valor;
  }, 0);

  const totalGastosSinRespaldo = gastosSinRespaldoFields.reduce(
    (sum, _, idx) => {
      const monto = form.watch(`gastosSinRespaldo.${idx}.monto`);
      const valor =
        typeof monto === 'number' ? monto : parseFloat(String(monto ?? 0)) || 0;
      return sum + valor;
    },
    0
  );

  const granTotalRendido = totalMontoTotal + totalGastosSinRespaldo;

  return (
    <FieldSet>
      <FieldLegend>Detalle de Comprobantes y Respaldo Documental</FieldLegend>
      <p className="text-foreground mb-6 text-sm">
        Registra cada comprobante con su documento respaldo (Factura, Recibo o
        Boleta). El monto neto se calcula automáticamente según el tipo de
        documento y la partida presupuestaria.
      </p>

      <PartidasAprobadas solicitud={solicitud} gastos={gastos} />

      <FieldGroup className="space-y-6">
        {/* --- Lista de gastos --- */}
        {gastosFields.length === 0 ? (
          <div className="bg-muted/50 rounded-lg border-2 border-dashed p-6 text-center">
            <p className="text-foreground text-sm font-medium">
              No hay comprobantes agregados aún
            </p>
            <p className="text-foreground mt-1 text-sm">
              Presiona el botón de abajo para empezar a registrar tus
              comprobantes.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {gastosFields.map((field, index) => (
              <ComprobanteCard
                key={field.id}
                index={index}
                solicitud={solicitud}
                onRemove={() => removeGasto(index)}
                form={form}
              />
            ))}

            <div className="mt-4 flex justify-start">
              <Button
                type="button"
                variant="outline"
                onClick={handleAgregarGasto}
                className="border-dashed"
              >
                <Plus className="mr-2 h-4 w-4" />
                Agregar Comprobante
              </Button>
            </div>
          </div>
        )}

        {gastosFields.length === 0 && (
          <div className="mt-4 flex justify-start">
            <Button
              type="button"
              variant="outline"
              onClick={handleAgregarGasto}
              className="border-dashed"
            >
              <Plus className="mr-2 h-4 w-4" />
              Agregar Comprobante
            </Button>
          </div>
        )}

        <Separator className="my-6" />

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold tracking-wider uppercase">
              Gastos Menores / Sin Respaldo (Opcional)
            </h3>
            {gastosSinRespaldoFields.length > 0 && (
              <Badge variant="secondary">
                {gastosSinRespaldoFields.length}
              </Badge>
            )}
          </div>

          {gastosSinRespaldoFields.length === 0 ? (
            <div className="bg-muted/50 rounded-lg border-2 border-dashed p-6 text-center">
              <p className="text-foreground text-sm font-medium">
                No hay gastos menores agregados
              </p>
              <p className="text-foreground mt-1 text-sm">
                Agrega aquí egresos sin respaldo oficial (ej: taxi o compras
                menores).
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {gastosSinRespaldoFields.map((field, index) => (
                <Card key={field.id} className="w-full border shadow-sm">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle className="text-sm font-semibold">
                        Gasto Menor #{index + 1}
                      </CardTitle>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeGastoSinRespaldo(index)}
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive h-8 w-8 p-0"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Eliminar gasto menor</span>
                      </Button>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                      <FormField
                        control={control}
                        name={`gastosSinRespaldo.${index}.fechaGasto`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-bold tracking-wider uppercase">
                              Fecha del Gasto
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

                      <FormField
                        control={control}
                        name={`gastosSinRespaldo.${index}.monto`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-bold tracking-wider uppercase">
                              Monto (Bs.)
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0.00"
                                step="0.01"
                                min="0"
                                className="h-9 text-sm"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(
                                    e.target.value
                                      ? Number.parseFloat(e.target.value)
                                      : 0
                                  )
                                }
                              />
                            </FormControl>
                            <FormMessage className="text-sm" />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={control}
                        name={`gastosSinRespaldo.${index}.detalle`}
                        render={({ field }) => (
                          <FormItem className="md:col-span-2 lg:col-span-3">
                            <FormLabel className="text-sm font-bold tracking-wider uppercase">
                              Detalle del Gasto
                            </FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Describe el gasto menor realizado"
                                className="min-h-16 resize-none text-sm"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage className="text-sm" />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}

              <div className="mt-4 flex justify-start">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAgregarGastoSinRespaldo}
                  className="border-dashed"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar Gasto Menor
                </Button>
              </div>
            </div>
          )}

          {gastosSinRespaldoFields.length === 0 && (
            <div className="mt-4 flex justify-start">
              <Button
                type="button"
                variant="outline"
                onClick={handleAgregarGastoSinRespaldo}
                className="border-dashed"
              >
                <Plus className="mr-2 h-4 w-4" />
                Agregar Gasto Menor
              </Button>
            </div>
          )}
        </div>

        <Separator className="my-6" />

        <div>
          <h3 className="mb-3 text-sm font-bold tracking-wider uppercase">
            Observaciones Generales (Opcional)
          </h3>
          <FormField
            control={control}
            name="observaciones"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Textarea
                    placeholder="Agrega cualquier observación o comentario adicional sobre tu rendición..."
                    className="min-h-20 resize-none text-sm"
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-sm" />
              </FormItem>
            )}
          />
        </div>

        <Card className="border-primary/20 bg-primary/5 w-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold uppercase">
              Resumen General de Gastos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-foreground font-medium">
                Total con Respaldo (Comprobantes):
              </span>
              <span className="font-bold">
                {formatMoney(totalMontoTotal)} Bs.
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-foreground font-medium">
                Total sin Respaldo (Gastos Menores):
              </span>
              <span className="font-bold text-amber-600 dark:text-amber-400">
                {formatMoney(totalGastosSinRespaldo)} Bs.
              </span>
            </div>
            <Separator className="my-2" />
            <div className="flex items-center justify-between text-sm">
              <span className="font-bold uppercase">Gran Total Rendido:</span>
              <span className="text-primary text-lg font-black">
                {formatMoney(granTotalRendido)} Bs.
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-white/60 px-3 py-2 text-sm dark:bg-black/10">
              <span className="font-bold">Comprobantes:</span>
              <Badge variant="secondary">{gastosFields.length}</Badge>
            </div>
          </CardContent>
        </Card>
      </FieldGroup>
    </FieldSet>
  );
}
