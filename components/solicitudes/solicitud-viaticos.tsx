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
import { Concepto } from '@/types/catalogs';
import { PresupuestoReserva } from '@/types/backend';
import { toast } from 'sonner';

interface SolicitudViaticosProps {
  control: Control<FormData>;
  actividadesPlanificadas: FormData['actividades'];
  conceptos: Concepto[];
  fuentesDisponibles: PresupuestoReserva[];
}

export default function SolicitudViaticos({
  control,
  actividadesPlanificadas,
  conceptos,
  fuentesDisponibles,
}: SolicitudViaticosProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'viaticos',
  });

  return (
    <div className="space-y-4">
      <h3 className="text-foreground mb-2 font-semibold">
        Detalle de Viáticos
      </h3>
      <div className="space-y-4">
        {fields.map((field, index) => (
          <ViaticoCard
            key={field.id}
            index={index}
            control={control}
            remove={remove}
            actividadesPlanificadas={actividadesPlanificadas}
            conceptos={conceptos}
            fuentesDisponibles={fuentesDisponibles}
          />
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => {
          // Validar que existan partidas de viáticos antes de agregar
          const tienePresupuestoViaticos = fuentesDisponibles.some((f) =>
            f.poa?.estructura?.partida?.nombre
              ?.toUpperCase()
              .includes('VIATICOS')
          );

          if (!tienePresupuestoViaticos) {
            toast.error(
              'No se encontraron partidas de VIÁTICOS en las fuentes seleccionadas.'
            );
            return;
          }

          append({
            conceptoId: 0,
            planificacionIndex: 0,
            tipoDestino: 'INSTITUCIONAL',
            dias: 0,
            cantidadPersonas: 0,
            montoNeto: 0,
            solicitudPresupuestoId: 0,
            liquidoPagable: 0,
          });
        }}
      >
        + Agregar Viático
      </Button>
    </div>
  );
}

interface ViaticoCardProps {
  index: number;
  control: Control<FormData>;
  remove: (index: number) => void;
  actividadesPlanificadas: FormData['actividades'];
  conceptos: Concepto[];
  fuentesDisponibles: PresupuestoReserva[];
}

function ViaticoCard({
  index,
  control,
  remove,
  actividadesPlanificadas,
  conceptos,
  fuentesDisponibles,
}: ViaticoCardProps) {
  const { setValue, trigger } = useFormContext<FormData>();

  const dias = useWatch({
    control,
    name: `viaticos.${index}.dias`,
  }) as number;

  const personas = useWatch({
    control,
    name: `viaticos.${index}.cantidadPersonas`,
  }) as number;

  const liquidoPagable = useWatch({
    control,
    name: `viaticos.${index}.liquidoPagable`,
  }) as number;

  const watchConceptoId = useWatch({
    control,
    name: `viaticos.${index}.conceptoId`,
  });

  const watchTipoDestino = useWatch({
    control,
    name: `viaticos.${index}.tipoDestino`,
  });

  const watchPlanificacionIndex = useWatch({
    control,
    name: `viaticos.${index}.planificacionIndex`,
  });

  const montoNeto = useWatch({
    control,
    name: `viaticos.${index}.montoNeto`,
  });

  const selectedPlanificacion = useMemo(() => {
    // Assuming planificacionIndex corresponds to the array index of actividadesPlanificadas
    return actividadesPlanificadas[Number(watchPlanificacionIndex)];
  }, [actividadesPlanificadas, watchPlanificacionIndex]);

  const maxDias = selectedPlanificacion?.cantDias ?? 0;
  const maxPersonas =
    watchTipoDestino === 'INSTITUCIONAL'
      ? (selectedPlanificacion?.cantInstitucion ?? 0)
      : (selectedPlanificacion?.cantTerceros ?? 0);

  const isZeroLimit = selectedPlanificacion ? maxPersonas === 0 : false;

  useEffect(() => {
    if (selectedPlanificacion && maxPersonas === 0) {
      setValue(`viaticos.${index}.cantidadPersonas`, 0);
    }
  }, [maxPersonas, selectedPlanificacion, setValue, index]);

  // Get the unit price from the selected concept
  const precioUnitario = useMemo(() => {
    if (!watchConceptoId || !watchTipoDestino) return 0;

    const conceptoObj = conceptos.find(
      (c) => String(c.id) === String(watchConceptoId)
    );

    if (!conceptoObj) return 0;

    const priceStr =
      watchTipoDestino === 'INSTITUCIONAL'
        ? conceptoObj.precioInstitucional
        : conceptoObj.precioTerceros;

    return priceStr ? parseFloat(priceStr) : 0;
  }, [watchConceptoId, watchTipoDestino, conceptos]);

  // Calculate total: días × personas × precio unitario
  const netoTotal = useMemo(() => {
    const d = Number(dias) || 0;
    const p = Number(personas) || 0;
    const precio = Number(precioUnitario) || 0;
    return d * p * precio;
  }, [dias, personas, precioUnitario]);

  useEffect(() => {
    const factor = watchTipoDestino === 'TERCEROS' ? 0.84 : 0.87;
    const brutoTotal = netoTotal / factor;

    const resultBruto = Number(brutoTotal.toFixed(2));
    setValue(`viaticos.${index}.montoNeto`, resultBruto, {
      shouldValidate: resultBruto > 0,
      shouldDirty: true,
    });
  }, [netoTotal, watchTipoDestino, setValue, index]);

  useEffect(() => {
    // Neto a Recibir (Liquido Pagable)
    setValue(`viaticos.${index}.liquidoPagable`, Number(netoTotal.toFixed(2)));
  }, [netoTotal, setValue, index]);

  return (
    <div className="bg-card animate-in fade-in slide-in-from-top-2 overflow-hidden rounded-xl border shadow-sm duration-300">
      <div className="space-y-4 p-4">
        {/* Fila Superior: Distribución Equitativa (4 columnas) */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
          <FormField
            control={control}
            name={`viaticos.${index}.solicitudPresupuestoId`}
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
                            ? 'Primero agregue fuente...'
                            : 'Seleccionar fuente...'
                        }
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent
                    position="popper"
                    side="bottom"
                    className="max-h-[200px] w-[var(--radix-select-trigger-width)]"
                  >
                    {[
                      ...new Map(
                        fuentesDisponibles.map((f) => [f.id, f])
                      ).values(),
                    ]
                      .filter((f) =>
                        (f.poa?.estructura?.partida?.nombre ?? '')
                          .toUpperCase()
                          .includes('VIATICOS')
                      )
                      .map((fuente) => (
                        <SelectItem
                          key={fuente.id}
                          value={fuente.id.toString()}
                        >
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
            name={`viaticos.${index}.conceptoId`}
            render={({ field }) => (
              <FormItem>
                <Label className="text-muted-foreground text-xs font-bold uppercase">
                  Concepto Viático
                </Label>
                <Select
                  onValueChange={(val) => field.onChange(Number(val))}
                  value={field.value?.toString() || ''}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Concepto..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent
                    position="popper"
                    side="bottom"
                    align="start"
                    className="max-h-[200px] w-[var(--radix-select-trigger-width)]"
                  >
                    {conceptos.map((concepto) => (
                      <SelectItem key={concepto.id} value={String(concepto.id)}>
                        {concepto.nombre}
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
            name={`viaticos.${index}.planificacionIndex`}
            render={({ field }) => (
              <FormItem>
                <Label className="text-muted-foreground text-xs font-bold uppercase">
                  Planificación
                </Label>
                <Select
                  onValueChange={(val) => field.onChange(Number(val))}
                  value={field.value?.toString() || ''}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Seleccionar actividad..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent
                    position="popper"
                    side="bottom"
                    align="start"
                    className="max-h-[200px] w-[var(--radix-select-trigger-width)]"
                  >
                    {actividadesPlanificadas.length > 0 ? (
                      actividadesPlanificadas.map((act, idx) => (
                        <SelectItem key={idx} value={String(idx)}>
                          {act.actividadProgramada}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-actividades" disabled>
                        No hay actividades
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name={`viaticos.${index}.tipoDestino`}
            render={({ field }) => (
              <FormItem>
                <Label className="text-muted-foreground text-xs font-bold uppercase">
                  Tipo
                </Label>
                <Select
                  onValueChange={field.onChange}
                  value={field.value ?? 'INSTITUCIONAL'}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent
                    position="popper"
                    side="bottom"
                    align="start"
                    className="max-h-[200px] w-[var(--radix-select-trigger-width)]"
                  >
                    <SelectItem value="INSTITUCIONAL">Institucional</SelectItem>
                    <SelectItem value="TERCEROS">Tercero</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Fila Central */}
        <div className="grid items-start gap-4 md:grid-cols-3">
          <FormField
            control={control}
            name={`viaticos.${index}.dias`}
            render={({ field }) => (
              <FormItem>
                <Label className="text-muted-foreground text-xs font-bold uppercase">
                  Días
                </Label>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    className="w-full"
                    value={field.value ?? 0}
                    min={0}
                    max={maxDias > 0 ? maxDias : undefined}
                    onKeyDown={(e) =>
                      ['-', 'e'].includes(e.key) && e.preventDefault()
                    }
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      if (maxDias > 0 && val > maxDias) {
                        field.onChange(maxDias);
                      } else {
                        field.onChange(val);
                      }
                      // Only trigger validation if value is valid to clear existing error
                      if (val >= 1) {
                        trigger(`viaticos.${index}.dias`);
                      }
                    }}
                  />
                </FormControl>
                {selectedPlanificacion && (
                  <p className="text-muted-foreground mt-1 text-[10px] italic">
                    Máximo permitido: {maxDias}
                  </p>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name={`viaticos.${index}.cantidadPersonas`}
            render={({ field }) => (
              <FormItem>
                <Label className="text-muted-foreground text-xs font-bold uppercase">
                  Personas
                </Label>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    className="w-full"
                    value={field.value ?? 0}
                    min={0}
                    max={maxPersonas > 0 ? maxPersonas : undefined}
                    disabled={isZeroLimit}
                    onKeyDown={(e) =>
                      ['-', 'e'].includes(e.key) && e.preventDefault()
                    }
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      if (maxPersonas > 0 && val > maxPersonas) {
                        field.onChange(maxPersonas);
                      } else {
                        field.onChange(val);
                      }
                      // Only trigger validation if value is valid to clear existing error
                      if (val >= 1) {
                        trigger(`viaticos.${index}.cantidadPersonas`);
                      }
                    }}
                  />
                </FormControl>
                {selectedPlanificacion && (
                  <div className="mt-1">
                    {isZeroLimit ? (
                      <p className="text-destructive text-[10px] font-medium italic">
                        Sin cupo en Planificación para este tipo
                      </p>
                    ) : (
                      <p className="text-muted-foreground text-[10px] italic">
                        Máximo permitido: {maxPersonas}
                      </p>
                    )}
                  </div>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="space-y-2">
            <Label className="text-muted-foreground text-xs font-bold uppercase">
              Costo Unitario (Bs)
            </Label>
            <Input
              type="number"
              value={precioUnitario.toFixed(2)}
              readOnly
              className="bg-muted text-muted-foreground cursor-not-allowed focus-visible:ring-0"
            />
          </div>
          <FormField
            control={control}
            name={`viaticos.${index}.montoNeto`}
            render={({ field }) => (
              <FormItem>
                <Label className="text-muted-foreground text-xs font-bold uppercase">
                  TOTAL LÍQUIDO (A Recibir)
                </Label>
                <FormControl>
                  <Input
                    {...field}
                    className="w-full"
                    value={formatMoney(netoTotal)}
                    min={0}
                    onKeyDown={(e) =>
                      ['-', 'e'].includes(e.key) && e.preventDefault()
                    }
                    onChange={(e) => field.onChange(Number(e.target.value))}
                    readOnly
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
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
                RC-IVA 13%
              </span>
              <span className="text-xs font-medium">
                {formatMoney((Number(montoNeto) || 0) * 0.13)}
              </span>
            </div>
            {watchTipoDestino === 'TERCEROS' && (
              <div className="flex flex-col">
                <span className="text-muted-foreground text-[10px] uppercase">
                  IT 3%
                </span>
                <span className="text-xs font-medium">
                  {formatMoney((Number(montoNeto) || 0) * 0.03)}
                </span>
              </div>
            )}
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
