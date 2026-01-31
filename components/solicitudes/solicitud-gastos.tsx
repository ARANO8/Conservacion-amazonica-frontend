'use client';

import { useMemo, useEffect } from 'react';
import {
  Control,
  useFieldArray,
  useWatch,
  useFormContext,
} from 'react-hook-form';
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { FormData } from '@/components/solicitudes/solicitud-schema';
import { formatMoney } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Grupo, TipoGasto } from '@/types/catalogs';
import { PresupuestoReserva } from '@/types/backend';

interface SolicitudGastosProps {
  control: Control<FormData>;
  grupos: Grupo[];
  tiposGasto: TipoGasto[];
  proyectoId?: number;
  fuentesDisponibles: PresupuestoReserva[];
}

export default function SolicitudGastos({
  control,
  grupos,
  tiposGasto,
  proyectoId,
  fuentesDisponibles,
}: SolicitudGastosProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  return (
    <div className="space-y-4">
      <h3 className="text-foreground mb-2 font-semibold">Detalle de Gastos</h3>
      <div className="space-y-4">
        {fields.map((field, index) => (
          <GastoCard
            key={field.id}
            index={index}
            control={control}
            remove={remove}
            grupos={grupos}
            tiposGasto={tiposGasto}
            isDisabled={!proyectoId}
            fuentesDisponibles={fuentesDisponibles}
          />
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() =>
          append({
            solicitudPresupuestoId: 0,
            tipoDocumento: 'FACTURA',
            tipoGastoId: 0,
            cantidad: 1,
            costoUnitario: 0,
            montoNeto: 0,
            detalle: '',
            liquidoPagable: 0,
          })
        }
      >
        + Agregar Otro Gasto
      </Button>
    </div>
  );
}

interface GastoCardProps {
  index: number;
  control: Control<FormData>;
  remove: (index: number) => void;
  grupos: Grupo[];
  tiposGasto: TipoGasto[];
  isDisabled?: boolean;
  fuentesDisponibles: PresupuestoReserva[];
}

function GastoCard({
  index,
  control,
  remove,
  tiposGasto,
  fuentesDisponibles,
}: GastoCardProps) {
  const { setValue } = useFormContext<FormData>();

  const cantidad = useWatch({
    control,
    name: `items.${index}.cantidad`,
  }) as number;

  const costoUnitario = useWatch({
    control,
    name: `items.${index}.costoUnitario`,
  }) as number;

  const liquidoPagable = useWatch({
    control,
    name: `items.${index}.liquidoPagable`,
  }) as number;

  const watchDocumento = useWatch({
    control,
    name: `items.${index}.tipoDocumento`,
  }) as string;

  const watchTipoGastoId = useWatch({
    control,
    name: `items.${index}.tipoGastoId`,
  });

  const montoNeto = useWatch({
    control,
    name: `items.${index}.montoNeto`,
  });

  const netoTotal = useMemo(() => {
    const qty = Number(cantidad) || 0;
    const cost = Number(costoUnitario) || 0;
    return qty * cost;
  }, [cantidad, costoUnitario]);

  const brutoTotal = useMemo(() => {
    const isRecibo = (watchDocumento || '').toUpperCase() === 'RECIBO';
    if (!isRecibo) return netoTotal; // FACTURA is 1:1

    const tipoObj = tiposGasto.find(
      (t) => Number(t.id) === Number(watchTipoGastoId)
    );
    const tipoNombre = (tipoObj?.nombre || '').toUpperCase().trim();

    let factor = 1.0;
    if (tipoNombre === 'COMPRA') {
      factor = 0.92; // 8% Retención
    } else if (
      tipoNombre.includes('ALQUILER') ||
      tipoNombre.includes('SERVICIO')
    ) {
      factor = 0.84; // 16% Retención
    } else if (tipoNombre === 'PEAJE' || tipoNombre === 'AUTO_COMPRA') {
      factor = 1.0; // Sin retención
    }

    // Safety: Rounding to 2 decimal places to avoid floating point issues
    return Number((netoTotal / factor).toFixed(2));
  }, [netoTotal, watchDocumento, watchTipoGastoId, tiposGasto]);

  useEffect(() => {
    setValue(`items.${index}.montoNeto`, Number(brutoTotal.toFixed(2)));
    setValue(`items.${index}.liquidoPagable`, Number(netoTotal.toFixed(2)));
  }, [brutoTotal, netoTotal, setValue, index]);

  // Los gastos ahora se vinculan directamente a una reserva de la canasta,
  // por lo que no requieren cargar partidas dinámicamente aquí.

  // Impuestos informativos (Retenciones) - Calculados sobre el BRUTO
  const isRecibo = (watchDocumento || '').toUpperCase() === 'RECIBO';
  const tipoObj = tiposGasto.find(
    (t) => Number(t.id) === Number(watchTipoGastoId)
  );
  const tipoNombre = (tipoObj?.nombre || '').toUpperCase().trim();
  const currentBruto = Number(montoNeto) || 0;

  let iva = 0;
  let it = 0;
  let iue = 0;

  if (isRecibo) {
    if (tipoNombre === 'COMPRA') {
      // 8% total: IUE (5%) + IT (3%)
      iue = currentBruto * 0.05;
      it = currentBruto * 0.03;
    } else if (tipoNombre.includes('SERVICIO')) {
      // 15.5% total: IUE-Servicios (12.5%) + IT (3%)
      // Aunque el factor es 0.84 (16%), desglosamos el estándar legal o lo más cercano
      iue = currentBruto * 0.125;
      it = currentBruto * 0.03;
    } else if (tipoNombre.includes('ALQUILER')) {
      // 16% total: RC-IVA (13%) + IT (3%)
      iva = currentBruto * 0.13;
      it = currentBruto * 0.03;
    }
  }

  return (
    <div className="bg-card animate-in fade-in slide-in-from-top-2 overflow-hidden rounded-xl border shadow-sm duration-300">
      <div className="space-y-4 p-4">
        {/* FILA SUPERIOR (CLASIFICADORES): 3 Dropdowns */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          <FormField
            control={control}
            name={`items.${index}.solicitudPresupuestoId`}
            render={({ field }) => (
              <FormItem>
                <Label className="text-muted-foreground text-xs font-bold uppercase">
                  Partida Presupuestaria
                </Label>
                <Select
                  onValueChange={(val) => field.onChange(Number(val))}
                  value={field.value?.toString() || ''}
                  disabled={fuentesDisponibles.length === 0}
                >
                  <FormControl>
                    <SelectTrigger className="w-full truncate overflow-hidden">
                      <SelectValue
                        placeholder={
                          fuentesDisponibles.length === 0
                            ? 'Primero agregue una fuente arriba'
                            : 'Seleccionar fuente...'
                        }
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent
                    position="popper"
                    side="bottom"
                    align="start"
                    className="max-h-[200px] w-[var(--radix-select-trigger-width)]"
                  >
                    {[
                      ...new Map(
                        fuentesDisponibles.map((f) => [f.id, f])
                      ).values(),
                    ].map((fuente) => (
                      <SelectItem key={fuente.id} value={fuente.id.toString()}>
                        ID: {fuente.id} -{' '}
                        {fuente.poa?.estructura?.partida?.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name={`items.${index}.tipoDocumento`}
            render={({ field }) => (
              <FormItem>
                <Label className="text-muted-foreground text-xs font-bold uppercase">
                  Documento
                </Label>
                <Select
                  onValueChange={field.onChange}
                  value={field.value ?? 'FACTURA'}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Seleccionar Documento" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent
                    position="popper"
                    side="bottom"
                    align="start"
                    className="max-h-[200px] w-[var(--radix-select-trigger-width)]"
                  >
                    <SelectItem value="FACTURA">Factura</SelectItem>
                    <SelectItem value="RECIBO">Recibo</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name={`items.${index}.tipoGastoId`}
            render={({ field }) => (
              <FormItem>
                <Label className="text-muted-foreground text-xs font-bold uppercase">
                  Tipo
                </Label>
                <Select
                  onValueChange={(val) => field.onChange(Number(val))}
                  value={field.value?.toString() || ''}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Seleccionar Tipo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent
                    position="popper"
                    side="bottom"
                    align="start"
                    className="max-h-[200px] w-[var(--radix-select-trigger-width)]"
                  >
                    {tiposGasto.map((tipo) => (
                      <SelectItem key={tipo.id} value={tipo.id.toString()}>
                        {tipo.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* FILA INFERIOR (ECONÓMICA) */}
        <div className="grid gap-4 md:grid-cols-3">
          <FormField
            control={control}
            name={`items.${index}.cantidad`}
            render={({ field }) => (
              <FormItem>
                <Label className="text-muted-foreground text-xs font-bold uppercase">
                  Cantidad
                </Label>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    className="w-full"
                    value={field.value ?? 0}
                    min={0}
                    onKeyDown={(e) =>
                      ['-', 'e'].includes(e.key) && e.preventDefault()
                    }
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name={`items.${index}.costoUnitario`}
            render={({ field }) => (
              <FormItem>
                <Label className="text-muted-foreground text-xs font-bold uppercase">
                  Costo Unitario (Bs)
                </Label>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    className="w-full"
                    value={field.value}
                    min={0}
                    onKeyDown={(e) =>
                      ['-', 'e'].includes(e.key) && e.preventDefault()
                    }
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="space-y-2">
            <Label className="text-muted-foreground text-xs font-bold uppercase">
              TOTAL LÍQUIDO (A Recibir)
            </Label>
            <Input
              value={formatMoney(netoTotal)}
              readOnly
              className="bg-muted font-bold"
            />
          </div>
        </div>
      </div>

      {/* Footer Informático */}
      <div className="bg-muted/50 flex flex-wrap items-center justify-between gap-4 border-t p-3 px-4">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex flex-col">
            <span className="text-muted-foreground text-xs font-bold uppercase">
              TOTAL PRESUPUESTADO (Incl. Impuestos)
            </span>
            <span className="text-primary text-sm font-bold">
              {formatMoney(montoNeto || 0)}
            </span>
          </div>
          <div className="bg-border hidden h-8 w-[1px] sm:block" />
          <div className="flex flex-wrap gap-4">
            <div className="flex flex-col">
              <span className="text-muted-foreground text-[10px] uppercase">
                IVA 13%
              </span>
              <span className="text-xs font-medium">{formatMoney(iva)}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-muted-foreground text-[10px] uppercase">
                IT 3%
              </span>
              <span className="text-xs font-medium">{formatMoney(it)}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-muted-foreground text-[10px] uppercase">
                IUE 5%
              </span>
              <span className="text-xs font-medium">{formatMoney(iue)}</span>
            </div>
          </div>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => remove(index)}
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="mr-2 size-4" />
          Eliminar
        </Button>
      </div>
    </div>
  );
}
