'use client';

import { useFieldArray, useFormContext, useWatch } from 'react-hook-form';
import { FormData } from '@/components/solicitudes/solicitud-schema';
import { FormControl, FormField, FormMessage } from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Plus, Trash2, Home } from 'lucide-react';
import {
  Field,
  FieldLabel,
  FieldSet,
  FieldLegend,
} from '@/components/ui/field';
import { SeleccionPresupuesto } from '@/types/backend';
import { useEffect, useCallback } from 'react';
import { formatMoney } from '@/lib/utils';
import { toast } from 'sonner';

// --- Diccionario de Hospedajes ---
export const HOSPEDAJE_DICT = {
  'Eje troncal': {
    destinos: ['La Paz', 'Santa Cruz', 'Cochabamba'],
    min: 243.6,
    max: 522.0,
  },
  'Ciudades Intermedias': {
    destinos: ['Sucre', 'Potosi', 'Oruro', 'Tarija'],
    min: 208.8,
    max: 487.2,
  },
  'Bolivia Norte': {
    destinos: ['Trinidad', 'Cobija'],
    min: 180.96,
    max: 348.0,
  },
  Pueblos: {
    destinos: ['Rurrenabaque', 'San Buenaventura', 'Coroico'],
    min: 139.2,
    max: 348.0,
  },
} as const;

type RegionKeys = keyof typeof HOSPEDAJE_DICT;

interface SolicitudHospedajesProps {
  fuentesDisponibles: SeleccionPresupuesto[];
}

export default function SolicitudHospedajes({
  fuentesDisponibles,
}: SolicitudHospedajesProps) {
  const { control } = useFormContext<FormData>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'hospedajes',
  });

  return (
    <FieldSet>
      <div className="mb-4 flex items-center justify-between">
        <FieldLegend className="flex items-center gap-2">
          <Home className="h-5 w-5" />
          Hospedajes
        </FieldLegend>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            const tienePartida = fuentesDisponibles.some((f) => {
              const p = f.poa;
              if (!p) return false;

              const searchStr = [
                p.actividad?.detalleDescripcion,
                p.estructura?.partida?.nombre,
                (p as { partida?: { nombre?: string } }).partida?.nombre,
                p.codigoPresupuestario?.descripcion,
              ]
                .filter(Boolean)
                .join(' ')
                .toUpperCase();

              return searchStr.includes('HOSPEDAJE');
            });

            if (!tienePartida) {
              toast.error(
                "No se encontró presupuesto para alojamiento. Para agregar un hospedaje, primero debe seleccionar una partida presupuestaria de 'Hospedaje' en el Paso 1."
              );
              return;
            }

            append({
              poaId: 0,
              region: '',
              destino: '',
              personas: 1,
              noches: 1,
              cantidadUnitaria: 0,
              costoTotal: 0,
              iva: 0,
              it: 0,
            });
          }}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Agregar Hospedaje
        </Button>
      </div>

      <div className="space-y-4">
        {fields.map((field, index) => (
          <HospedajeCard
            key={field.id}
            index={index}
            remove={remove}
            fuentesDisponibles={fuentesDisponibles}
          />
        ))}
        {fields.length === 0 && (
          <div className="border-muted-foreground/25 flex h-32 flex-col items-center justify-center rounded-lg border-2 border-dashed">
            <Home className="text-muted-foreground/50 mb-2 h-8 w-8" />
            <p className="text-muted-foreground text-sm italic">
              No hay hospedajes registrados.
            </p>
          </div>
        )}
      </div>
    </FieldSet>
  );
}

// --- Componente Habilita la reactividad individual ---
function HospedajeCard({
  index,
  remove,
  fuentesDisponibles,
}: {
  index: number;
  remove: (index: number) => void;
  fuentesDisponibles: SeleccionPresupuesto[];
}) {
  const { control, setValue, trigger } = useFormContext<FormData>();

  const selectedRegion = useWatch({
    control,
    name: `hospedajes.${index}.region`,
  }) as RegionKeys | '';

  const personas = useWatch({ control, name: `hospedajes.${index}.personas` });
  const noches = useWatch({ control, name: `hospedajes.${index}.noches` });
  const cantidadUnitaria = useWatch({
    control,
    name: `hospedajes.${index}.cantidadUnitaria`,
  });

  const costoTotal =
    useWatch({ control, name: `hospedajes.${index}.costoTotal` }) || 0;
  const iva = useWatch({ control, name: `hospedajes.${index}.iva` }) || 0;
  const it = useWatch({ control, name: `hospedajes.${index}.it` }) || 0;

  const calcularTotales = useCallback(() => {
    const pers = Number(personas) || 0;
    const noch = Number(noches) || 0;
    const unit = Number(cantidadUnitaria) || 0;

    const costoTotal = pers * noch * unit;

    // Acrecentamiento Combinado (100% - 13% IVA - 3% IT = 84%)
    // Monto Bruto = Líquido / 0.84
    const montoBruto = costoTotal / 0.84;

    const ivaCalculado = montoBruto * 0.13;
    const itCalculado = montoBruto * 0.03;

    setValue(
      `hospedajes.${index}.costoTotal`,
      parseFloat(costoTotal.toFixed(2))
    );
    setValue(`hospedajes.${index}.iva`, parseFloat(ivaCalculado.toFixed(2)));
    setValue(`hospedajes.${index}.it`, parseFloat(itCalculado.toFixed(2)));
  }, [personas, noches, cantidadUnitaria, index, setValue]);

  useEffect(() => {
    calcularTotales();
  }, [calcularTotales]);

  const destinosDisponibles = selectedRegion
    ? HOSPEDAJE_DICT[selectedRegion]?.destinos || []
    : [];

  const rangoMin = selectedRegion ? HOSPEDAJE_DICT[selectedRegion]?.min : 0;
  const rangoMax = selectedRegion ? HOSPEDAJE_DICT[selectedRegion]?.max : 0;

  return (
    <div className="bg-card animate-in fade-in slide-in-from-top-2 overflow-hidden rounded-xl border shadow-sm duration-300">
      <div className="space-y-4 p-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* LÍNEA POA */}
          <FormField
            control={control}
            name={`hospedajes.${index}.poaId`}
            render={({ field }) => (
              <Field>
                <FieldLabel>Partida (Línea POA)</FieldLabel>
                <Select
                  onValueChange={(val) => field.onChange(Number(val))}
                  value={field.value ? String(field.value) : ''}
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
                    {fuentesDisponibles
                      .filter((f) => {
                        const p = f.poa;
                        if (!p) return false;
                        const searchStr = [
                          p.actividad?.detalleDescripcion,
                          p.estructura?.partida?.nombre,
                          (p as { partida?: { nombre?: string } }).partida
                            ?.nombre,
                          p.codigoPresupuestario?.descripcion,
                        ]
                          .filter(Boolean)
                          .join(' ')
                          .toUpperCase();
                        return searchStr.includes('HOSPEDAJE');
                      })
                      .map((fuente) => (
                        <SelectItem
                          key={fuente.poaId}
                          value={fuente.poaId.toString()}
                        >
                          POA: {fuente.poaId} -{' '}
                          {fuente.poa?.estructura?.partida?.nombre}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </Field>
            )}
          />

          {/* REGION */}
          <FormField
            control={control}
            name={`hospedajes.${index}.region`}
            render={({ field }) => (
              <Field>
                <FieldLabel>Región</FieldLabel>
                <Select
                  onValueChange={(val) => {
                    field.onChange(val);
                    setValue(`hospedajes.${index}.destino`, ''); // Reset destino on region change

                    // Set default price based on region to avoid validation errors
                    const minPrice =
                      HOSPEDAJE_DICT[val as RegionKeys]?.min || 0;
                    setValue(`hospedajes.${index}.cantidadUnitaria`, minPrice, {
                      shouldValidate: true,
                      shouldDirty: true,
                    });

                    trigger(`hospedajes.${index}.cantidadUnitaria`); // Re-validate
                  }}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Seleccionar Región" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent
                    position="popper"
                    side="bottom"
                    align="start"
                    className="max-h-[200px] w-[var(--radix-select-trigger-width)]"
                  >
                    {Object.keys(HOSPEDAJE_DICT).map((reg) => (
                      <SelectItem key={reg} value={reg}>
                        {reg}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </Field>
            )}
          />

          {/* DESTINO */}
          <FormField
            control={control}
            name={`hospedajes.${index}.destino`}
            render={({ field }) => (
              <Field>
                <FieldLabel>Destino</FieldLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={!selectedRegion}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Seleccionar Destino" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent
                    position="popper"
                    side="bottom"
                    align="start"
                    className="max-h-[200px] w-[var(--radix-select-trigger-width)]"
                  >
                    {destinosDisponibles.map((dest) => (
                      <SelectItem key={dest} value={dest}>
                        {dest}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </Field>
            )}
          />

          {/* PERSONAS */}
          <FormField
            control={control}
            name={`hospedajes.${index}.personas`}
            render={({ field }) => (
              <Field>
                <FieldLabel>Nº Personas</FieldLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </Field>
            )}
          />

          {/* NOCHES */}
          <FormField
            control={control}
            name={`hospedajes.${index}.noches`}
            render={({ field }) => (
              <Field>
                <FieldLabel>Nº Noches</FieldLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </Field>
            )}
          />

          {/* CANTIDAD UNITARIA */}
          <FormField
            control={control}
            name={`hospedajes.${index}.cantidadUnitaria`}
            rules={{
              validate: (value) => {
                if (!selectedRegion) return true;
                const numValue = Number(value);
                if (
                  numValue < (rangoMin ?? 0) ||
                  numValue > (rangoMax ?? Infinity)
                ) {
                  return `La tarifa debe estar entre Bs. ${(rangoMin ?? 0).toFixed(2)} y Bs. ${(rangoMax ?? 0).toFixed(2)} para ${selectedRegion}.`;
                }
                return true;
              },
            }}
            render={({ field, fieldState }) => (
              <Field className="relative flex min-h-[72px] flex-col justify-center">
                <div className="mb-2 flex items-center justify-between">
                  <FieldLabel className="mb-0">
                    Tarifa Unitaria (Bs.)
                  </FieldLabel>
                  {selectedRegion && (
                    <span className="rounded-full border border-emerald-100 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-600 dark:border-emerald-900 dark:bg-emerald-950/50">
                      Bs. {Number(field.value || 0).toFixed(2)}
                    </span>
                  )}
                </div>
                <FormControl>
                  <div className="py-1">
                    <Slider
                      disabled={!selectedRegion}
                      min={rangoMin || 0}
                      max={rangoMax || 100}
                      step={0.5}
                      value={[Number(field.value) || rangoMin || 0]}
                      onValueChange={(vals) => field.onChange(vals[0])}
                      className="w-full disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                </FormControl>
                {selectedRegion && !fieldState.error && (
                  <div className="text-muted-foreground absolute top-[calc(100%+0.25rem)] left-0 mt-1 flex w-full justify-between text-[10px]">
                    <span>Mín: {rangoMin}</span>
                    <span>Máx: {rangoMax}</span>
                  </div>
                )}
                <FormMessage className="absolute top-[calc(100%+0.25rem)] left-0 text-[10px] leading-tight" />
              </Field>
            )}
          />
        </div>
      </div>

      {/* Footer Informático */}
      <div className="bg-muted/50 flex flex-wrap items-center justify-between gap-4 border-t p-3 px-4">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex flex-col">
            <span className="text-muted-foreground text-[10px] uppercase">
              TOTAL LÍQUIDO A RECIBIR
            </span>
            <span className="text-xs font-medium">
              {formatMoney(Number(costoTotal))}
            </span>
          </div>

          <div className="bg-border hidden h-8 w-[1px] sm:block" />

          <div className="flex flex-col">
            <span className="text-muted-foreground text-xs font-bold uppercase">
              TOTAL PRESUPUESTADO (Incl. Impuestos)
            </span>
            <span className="text-primary text-sm font-bold">
              {formatMoney(Number(costoTotal) + Number(iva) + Number(it))}
            </span>
          </div>

          <div className="bg-border hidden h-8 w-[1px] sm:block" />

          <div className="flex flex-wrap gap-4">
            <div className="flex flex-col">
              <span className="text-muted-foreground text-[10px] uppercase">
                IVA 13%
              </span>
              <span className="text-xs font-medium">
                {formatMoney(Number(iva))}
              </span>
            </div>

            <div className="flex flex-col">
              <span className="text-muted-foreground text-[10px] uppercase">
                IT 3%
              </span>
              <span className="text-xs font-medium">
                {formatMoney(Number(it))}
              </span>
            </div>
          </div>
        </div>

        {/* Botón Eliminar */}
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
