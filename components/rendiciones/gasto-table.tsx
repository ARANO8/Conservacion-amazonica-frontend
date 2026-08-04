'use client';

import { useEffect, useMemo, useState } from 'react';
import { useWatch, type UseFormReturn } from 'react-hook-form';
import { FormField, FormItem, FormControl } from '@/components/ui/form';
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
  calcularMontoBrutoRendicion,
  getCategoriaFromPartida,
  type TipoDocRendicion,
  type TipoRetencionGeneral,
} from '@/lib/tax-calculator';
import {
  CreateRendicionInput,
  GastoRendicion,
  TipoDocumentoGastoEnum,
  TipoRetencionEnum,
} from '@/types/rendicion-schema';
import {
  desglosarGasto,
  resumirAnexo4,
  type GastoAnexo4,
} from '@/lib/rendicion-anexo4';
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

function PartidaCombobox({
  value,
  onChange,
  presupuestos,
}: PartidaComboboxProps) {
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
          {selected ? `${selected.poa?.codigoPoa ?? '—'}` : 'Seleccionar...'}
          <ChevronsUpDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Buscar partida..."
            className="h-8 text-xs"
          />
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
                      p.id === value ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <div className="flex flex-col">
                    <span className="text-primary font-mono text-[11px] font-bold">
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
  saldoAcumulado,
}: {
  index: number;
  form: UseFormReturn<CreateRendicionInput>;
  solicitud: SolicitudResponse | null;
  onRemove: () => void;
  onTabLastCell: () => void;
  showPartidaColumn: boolean;
  /** Saldo corriente tras descontar el líquido de esta fila */
  saldoAcumulado: number;
}) {
  const { control, setValue } = form;
  const [montoInput, setMontoInput] = useState<string>('');

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

  const taxResult = useMemo(() => {
    const neto =
      typeof montoTotal === 'number'
        ? montoTotal
        : Number.parseFloat(String(montoTotal ?? 0)) || 0;
    return calcularMontoBrutoRendicion(
      neto,
      (tipoDocumento ?? 'FACTURA') as TipoDocRendicion,
      categoria,
      (tipoRetencion ?? 'SERVICIO') as TipoRetencionGeneral
    );
  }, [montoTotal, tipoDocumento, categoria, tipoRetencion]);

  useEffect(() => {
    setValue(`gastos.${index}.montoBruto`, taxResult.montoBruto, {
      shouldValidate: true,
      shouldDirty: true,
    });
    setValue(`gastos.${index}.montoImpuestos`, taxResult.totalRetenciones, {
      shouldValidate: true,
      shouldDirty: true,
    });
    setValue(`gastos.${index}.montoNeto`, taxResult.montoNeto, {
      shouldValidate: true,
      shouldDirty: true,
    });
  }, [
    taxResult.montoNeto,
    taxResult.montoBruto,
    taxResult.totalRetenciones,
    index,
    setValue,
  ]);

  const desglose = useMemo(
    () =>
      desglosarGasto({
        montoLiquido:
          typeof montoTotal === 'number'
            ? montoTotal
            : Number.parseFloat(String(montoTotal ?? 0)) || 0,
        tipoDocumento,
        tipoRetencion,
        nombrePartida,
      }),
    [montoTotal, tipoDocumento, tipoRetencion, nombrePartida]
  );

  // El selector sólo tiene sentido cuando la regla depende de bien/servicio/alquiler
  const needsTipoRetencion =
    (tipoDocumento === 'RECIBO' || tipoDocumento === 'BOLETA') &&
    categoria === 'GENERAL';

  const presupuestos = solicitud?.presupuestos ?? [];

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Tab' && !e.shiftKey) {
      e.preventDefault();
      const container = e.currentTarget.closest('tr');
      if (!container) return;
      const inputs = container.querySelectorAll<HTMLElement>(
        'input, select, button[role="combobox"], [tabindex]'
      );
      const currentIdx = Array.from(inputs).indexOf(
        e.currentTarget as HTMLElement
      );
      if (currentIdx < inputs.length - 1) {
        inputs[currentIdx + 1]?.focus();
      } else {
        onTabLastCell();
      }
    }
  }

  return (
    <tr className="border-border hover:bg-muted/30 border-b">
      {/* # */}
      <td className="text-muted-foreground w-8 px-1.5 py-1 text-center text-[11px]">
        {index + 1}
      </td>

      {/* Fecha */}
      <td className="w-[105px] px-1 py-1">
        <FormField
          control={control}
          name={`gastos.${index}.fechaDocumento`}
          render={({ field }) => (
            <FormItem className="space-y-0">
              <FormControl>
                <input
                  type="date"
                  className="border-input bg-background focus:ring-primary h-7 w-full rounded border px-1.5 text-xs focus:ring-1 focus:outline-none"
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
      <td className="w-[110px] px-1 py-1">
        <FormField
          control={control}
          name={`gastos.${index}.numeroDocumento`}
          render={({ field }) => (
            <FormItem className="space-y-0">
              <FormControl>
                <input
                  type="text"
                  className="border-input bg-background focus:ring-primary h-7 w-full rounded border px-1.5 text-xs focus:ring-1 focus:outline-none"
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
      <td className="w-[100px] px-1 py-1">
        <FormField
          control={control}
          name={`gastos.${index}.tipoDocumento`}
          render={({ field }) => (
            <FormItem className="space-y-0">
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="h-7 px-1.5 text-xs">
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
        <td className="w-[130px] px-1 py-1">
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
      <td className="min-w-[160px] px-1 py-1">
        <FormField
          control={control}
          name={`gastos.${index}.concepto`}
          render={({ field }) => (
            <FormItem className="space-y-0">
              <FormControl>
                <input
                  type="text"
                  className="border-input bg-background focus:ring-primary h-7 w-full rounded border px-1.5 text-xs focus:ring-1 focus:outline-none"
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
      <td className="text-muted-foreground w-[100px] px-1 py-1 text-right text-xs tabular-nums">
        —
      </td>

      {/* EGRESOS */}
      <td className="w-[110px] px-1 py-1">
        <FormField
          control={control}
          name={`gastos.${index}.montoTotal`}
          render={({ field }) => (
            <FormItem className="space-y-0">
              <FormControl>
                <input
                  type="text"
                  inputMode="decimal"
                  className="border-input bg-background focus:ring-primary h-7 w-full rounded border px-1.5 text-right text-xs focus:ring-1 focus:outline-none"
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

      {/* TOTAL C/ IMP (read-only) */}
      <td className="w-[100px] px-1 py-1 text-right text-xs tabular-nums">
        <span className="font-medium">
          {taxResult.montoBruto > 0 ? formatMoney(taxResult.montoBruto) : '—'}
        </span>
      </td>

      {/* SALDO corriente */}
      <td className="border-border w-[100px] border-r px-1 py-1 text-right text-xs tabular-nums">
        <span className="font-medium">{formatMoney(saldoAcumulado)}</span>
      </td>

      {/* ---- Retenciones impositivas ---- */}

      {/* Tipo de retención (sólo aplica a recibo/boleta de partida general) */}
      <td className="w-[95px] px-1 py-1">
        {needsTipoRetencion ? (
          <FormField
            control={control}
            name={`gastos.${index}.tipoRetencion`}
            render={({ field }) => (
              <FormItem className="space-y-0">
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="h-7 px-1 text-[11px]">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {TipoRetencionEnum.options.map((tipo) => (
                      <SelectItem
                        key={tipo}
                        value={tipo}
                        className="text-[11px]"
                      >
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
        ) : (
          <span className="text-muted-foreground block text-center text-[11px]">
            —
          </span>
        )}
      </td>

      {/* TOTAL (bruto) */}
      <td className="w-[95px] px-1 py-1 text-right text-xs tabular-nums">
        {desglose.bruto > 0 ? formatMoney(desglose.bruto) : '—'}
      </td>

      {/* RC-IVA 13% */}
      <td className="w-[85px] px-1 py-1 text-right text-xs tabular-nums">
        {desglose.rcIva > 0 ? formatMoney(desglose.rcIva) : '—'}
      </td>

      {/* IUE 5% */}
      <td className="w-[85px] px-1 py-1 text-right text-xs tabular-nums">
        {desglose.iue > 0 ? formatMoney(desglose.iue) : '—'}
      </td>

      {/* IT 3% */}
      <td className="w-[85px] px-1 py-1 text-right text-xs tabular-nums">
        {desglose.it > 0 ? formatMoney(desglose.it) : '—'}
      </td>

      {/* TOTAL IMPUESTOS */}
      <td className="w-[95px] px-1 py-1 text-right text-xs font-semibold tabular-nums">
        {desglose.totalImpuestos > 0
          ? formatMoney(desglose.totalImpuestos)
          : '—'}
      </td>

      {/* NETO */}
      <td className="border-border w-[95px] border-r px-1 py-1 text-right text-xs font-bold tabular-nums">
        {desglose.neto > 0 ? formatMoney(desglose.neto) : '—'}
      </td>

      {/* Remove */}
      <td className="w-8 px-1 py-1 text-center">
        <button
          type="button"
          onClick={onRemove}
          className="text-destructive hover:bg-destructive/10 inline-flex h-6 w-6 items-center justify-center rounded"
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
    [solicitud?.montoTotalNeto]
  );
  const presupuestos = useMemo(
    () => solicitud?.presupuestos ?? [],
    [solicitud?.presupuestos]
  );
  const showPartidaColumn = presupuestos.length > 1;

  const gastosWatchRaw = useWatch({ control: form.control, name: 'gastos' });
  const gastosWatch = useMemo(() => gastosWatchRaw ?? [], [gastosWatchRaw]);

  // Mismos cálculos que usan el resumen y el detalle, para que no diverjan
  const gastosAnexo = useMemo<GastoAnexo4[]>(
    () =>
      gastosWatch.map((g: Record<string, unknown>) => ({
        montoLiquido: Number(g?.montoTotal ?? 0),
        tipoDocumento: g?.tipoDocumento as string | undefined,
        tipoRetencion: g?.tipoRetencion as string | undefined,
        nombrePartida:
          presupuestos.find((p) => p.id === Number(g?.partidaId ?? 0))?.poa
            ?.estructura?.partida?.nombre ?? null,
      })),
    [gastosWatch, presupuestos]
  );

  const resumen = useMemo(
    () => resumirAnexo4(gastosAnexo, montoAvance),
    [gastosAnexo, montoAvance]
  );

  // Saldo corriente por fila: arranca en el anticipo y descuenta el líquido
  const saldosPorFila = useMemo(
    () =>
      gastosAnexo.reduce<number[]>((acc, g) => {
        const previo = acc.length > 0 ? acc[acc.length - 1] : montoAvance;
        acc.push(round2(previo - desglosarGasto(g).neto));
        return acc;
      }, []),
    [gastosAnexo, montoAvance]
  );

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
    <div className="border-border w-full overflow-x-auto rounded-lg border">
      <table className="w-full border-collapse text-xs">
        <thead>
          {/* Header sub-row: MONTO BS spans INGRESOS | EGRESOS | SALDO */}
          <tr className="bg-muted/60">
            <th className="text-muted-foreground border-border w-8 border-r px-1.5 py-1 text-[10px] font-bold tracking-wider uppercase">
              #
            </th>
            <th className="text-muted-foreground border-border w-[105px] border-r px-1 py-1 text-[10px] font-bold tracking-wider uppercase">
              Fecha
            </th>
            <th className="text-muted-foreground border-border w-[110px] border-r px-1 py-1 text-[10px] font-bold tracking-wider uppercase">
              N° Doc.
            </th>
            <th className="text-muted-foreground border-border w-[100px] border-r px-1 py-1 text-[10px] font-bold tracking-wider uppercase">
              Tipo Doc.
            </th>
            {showPartidaColumn && (
              <th className="text-muted-foreground border-border w-[130px] border-r px-1 py-1 text-[10px] font-bold tracking-wider uppercase">
                Partida
              </th>
            )}
            <th className="text-muted-foreground border-border min-w-[160px] border-r px-1 py-1 text-[10px] font-bold tracking-wider uppercase">
              Descripción
            </th>
            <th
              colSpan={4}
              className="text-muted-foreground border-border border-r px-1 py-1 text-center text-[10px] font-bold tracking-wider uppercase"
            >
              MONTO BS
            </th>
            <th
              colSpan={7}
              className="text-muted-foreground border-border border-r px-1 py-1 text-center text-[10px] font-bold tracking-wider uppercase"
            >
              RETENCIONES IMPOSITIVAS
            </th>
            <th className="border-border w-8 border-r px-1 py-1" />
          </tr>
          {/* Header sub-row: INGRESOS | EGRESOS | SALDO */}
          <tr className="bg-muted/40">
            <th
              colSpan={5 + (showPartidaColumn ? 1 : 0)}
              className="border-border border-r"
            />
            <th className="text-muted-foreground border-border border-r px-1 py-0.5 text-right text-[10px] font-semibold">
              INGRESOS
            </th>
            <th className="text-muted-foreground border-border border-r px-1 py-0.5 text-right text-[10px] font-semibold">
              MONTO LÍQUIDO
            </th>
            <th className="text-muted-foreground border-border border-r px-1 py-0.5 text-right text-[10px] font-semibold">
              TOTAL C/ IMP
            </th>
            <th className="text-muted-foreground border-border border-r px-1 py-0.5 text-right text-[10px] font-semibold">
              SALDO
            </th>
            <th className="text-muted-foreground border-border border-r px-1 py-0.5 text-center text-[10px] font-semibold">
              TIPO RET.
            </th>
            <th className="text-muted-foreground border-border border-r px-1 py-0.5 text-right text-[10px] font-semibold">
              TOTAL
            </th>
            <th className="text-muted-foreground border-border border-r px-1 py-0.5 text-right text-[10px] font-semibold">
              RC-IVA 13%
            </th>
            <th className="text-muted-foreground border-border border-r px-1 py-0.5 text-right text-[10px] font-semibold">
              IUE 5%
            </th>
            <th className="text-muted-foreground border-border border-r px-1 py-0.5 text-right text-[10px] font-semibold">
              IT 3%
            </th>
            <th className="text-muted-foreground border-border border-r px-1 py-0.5 text-right text-[10px] font-semibold">
              TOTAL IMP.
            </th>
            <th className="text-muted-foreground border-border border-r px-1 py-0.5 text-right text-[10px] font-semibold">
              NETO
            </th>
            <th colSpan={1} />
          </tr>
        </thead>
        <tbody>
          {/* FONDO EN AVANCE row */}
          <tr className="bg-primary/5 border-border border-b font-medium">
            <td className="text-muted-foreground border-border border-r px-1.5 py-1 text-center text-[11px]">
              —
            </td>
            <td className="border-border border-r px-1 py-1 text-[11px]">
              {solicitud?.fechaSolicitud
                ? new Date(solicitud.fechaSolicitud).toLocaleDateString('es-BO')
                : '—'}
            </td>
            <td className="border-border border-r px-1 py-1 text-[11px]">
              {solicitud?.codigoSolicitud ?? '—'}
            </td>
            <td className="border-border border-r px-1 py-1 text-[11px]">—</td>
            {showPartidaColumn && (
              <td className="border-border border-r px-1 py-1 text-[11px]">
                —
              </td>
            )}
            <td className="border-border border-r px-1 py-1 text-[11px] font-semibold">
              FONDO EN AVANCE
            </td>
            <td className="border-border border-r px-1 py-1 text-right text-[11px] font-bold text-emerald-600">
              {formatMoney(montoAvance)}
            </td>
            <td className="border-border border-r px-1 py-1 text-right text-[11px]">
              —
            </td>
            <td className="border-border border-r px-1 py-1 text-right text-[11px]">
              —
            </td>
            <td className="border-border border-r px-1 py-1 text-right text-[11px] font-bold">
              {formatMoney(montoAvance)}
            </td>
            {/* El anticipo no tiene retención: las 7 columnas impositivas van vacías */}
            {Array.from({ length: 7 }).map((_, i) => (
              <td
                key={i}
                className="border-border border-r px-1 py-1 text-right text-[11px]"
              >
                —
              </td>
            ))}
            <td className="w-8 px-1 py-1" />
          </tr>

          {/* Gasto rows */}
          {fields.length === 0 ? (
            <tr>
              <td
                colSpan={18 + (showPartidaColumn ? 1 : 0)}
                className="text-muted-foreground px-4 py-6 text-center text-xs"
              >
                No hay gastos agregados. Presiona &quot;+ Agregar fila&quot;
                para empezar.
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
                saldoAcumulado={saldosPorFila[index] ?? montoAvance}
              />
            ))
          )}
        </tbody>
        {/* Footer with totals */}
        <tfoot>
          <tr className="bg-muted/40 border-border border-t font-semibold">
            <td
              colSpan={5 + (showPartidaColumn ? 1 : 0)}
              className="px-1.5 py-1 text-right text-[11px]"
            >
              TOTALES
            </td>
            <td className="border-border border-r px-1 py-1 text-right text-[11px] text-emerald-600">
              {formatMoney(montoAvance)}
            </td>
            <td className="border-border border-r px-1 py-1 text-right text-[11px] text-red-600">
              {formatMoney(resumen.totales.neto)}
            </td>
            <td className="border-border border-r px-1 py-1 text-right text-[11px] text-orange-600">
              {formatMoney(resumen.totales.bruto)}
            </td>
            <td className="border-border border-r px-1 py-1 text-right text-[11px] font-bold">
              {formatMoney(resumen.saldoEfectivo)}
            </td>
            <td className="border-border border-r" />
            <td className="border-border border-r px-1 py-1 text-right text-[11px]">
              {formatMoney(resumen.totales.bruto)}
            </td>
            <td className="border-border border-r px-1 py-1 text-right text-[11px]">
              {resumen.totales.rcIva > 0
                ? formatMoney(resumen.totales.rcIva)
                : '—'}
            </td>
            <td className="border-border border-r px-1 py-1 text-right text-[11px]">
              {resumen.totales.iue > 0 ? formatMoney(resumen.totales.iue) : '—'}
            </td>
            <td className="border-border border-r px-1 py-1 text-right text-[11px]">
              {resumen.totales.it > 0 ? formatMoney(resumen.totales.it) : '—'}
            </td>
            <td className="border-border border-r px-1 py-1 text-right text-[11px]">
              {resumen.totales.totalImpuestos > 0
                ? formatMoney(resumen.totales.totalImpuestos)
                : '—'}
            </td>
            <td className="border-border border-r px-1 py-1 text-right text-[11px] font-bold">
              {formatMoney(resumen.totales.neto)}
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
          className="text-muted-foreground hover:text-foreground h-7 gap-1 text-xs"
        >
          <Plus className="h-3.5 w-3.5" />
          Agregar fila
        </Button>
      </div>
    </div>
  );
}
