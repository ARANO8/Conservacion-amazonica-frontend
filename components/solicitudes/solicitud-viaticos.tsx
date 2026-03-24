'use client';

import { useMemo, useEffect } from 'react';
import {
  Control,
  useFieldArray,
  useWatch,
  useFormContext,
  useFormState,
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Trash2, Briefcase, Plus, ChevronsUpDown } from 'lucide-react';
import { FieldLegend, FieldSet } from '@/components/ui/field';
import { FormData } from '@/components/solicitudes/solicitud-schema';
import { formatMoney, normalizeString } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Concepto } from '@/types/catalogs';
import { SeleccionPresupuesto } from '@/types/backend';
import { toast } from 'sonner';

// Helper function to validate that all selected planificaciones have the same person count
const validatePersonCountMatch = (
  selectedPlanificaciones: FormData['actividades'],
  tipoDestino: string | undefined
): boolean => {
  if (selectedPlanificaciones.length <= 1) return true;

  const personField =
    tipoDestino === 'TERCEROS' ? 'cantTerceros' : 'cantInstitucion';
  const firstValue =
    selectedPlanificaciones[0]?.[
      personField as keyof (typeof selectedPlanificaciones)[0]
    ];

  return selectedPlanificaciones.every(
    (plan) => plan[personField as keyof typeof plan] === firstValue
  );
};

interface SolicitudViaticosProps {
  control: Control<FormData>;
  actividadesPlanificadas: FormData['actividades'];
  conceptos: Concepto[];
  fuentesDisponibles: SeleccionPresupuesto[];
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
    <FieldSet>
      <div className="mb-4 flex items-center justify-between">
        <FieldLegend className="flex items-center gap-2">
          <Briefcase className="h-5 w-5" />
          Detalle de Viáticos
        </FieldLegend>
      </div>

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

        {fields.length === 0 && (
          <div className="border-muted-foreground/25 flex h-32 flex-col items-center justify-center rounded-lg border-2 border-dashed">
            <Briefcase className="text-muted-foreground/50 mb-2 h-8 w-8" />
            <p className="text-muted-foreground text-sm italic">
              No hay viáticos registrados.
            </p>
          </div>
        )}

        <div className="mt-4 flex justify-start">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              // Validar que existan partidas de viáticos antes de agregar
              const tienePresupuestoViaticos = fuentesDisponibles.some((f) =>
                normalizeString(f.poa?.estructura?.partida?.nombre).includes(
                  'VIATICO'
                )
              );

              if (!tienePresupuestoViaticos) {
                toast.error(
                  'No se encontraron partidas de VIÁTICOS en las fuentes seleccionadas.'
                );
                return;
              }

              append({
                conceptoId: 0,
                planificacionIndexes: [],
                tipoDestino: 'INSTITUCIONAL',
                dias: 0,
                cantidadPersonas: 0,
                montoNeto: 0,
                solicitudPresupuestoId: 0,
                liquidoPagable: 0,
              });
            }}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Agregar Viático
          </Button>
        </div>
      </div>
    </FieldSet>
  );
}

interface ViaticoCardProps {
  index: number;
  control: Control<FormData>;
  remove: (index: number) => void;
  actividadesPlanificadas: FormData['actividades'];
  conceptos: Concepto[];
  fuentesDisponibles: SeleccionPresupuesto[];
}

function ViaticoCard({
  index,
  control,
  remove,
  actividadesPlanificadas,
  conceptos,
  fuentesDisponibles,
}: ViaticoCardProps) {
  const { setValue } = useFormContext<FormData>();

  const watchCostoUnitario = useWatch({
    control,
    name: `viaticos.${index}.costoUnitario`,
  });

  const dias = useWatch({
    control,
    name: `viaticos.${index}.dias`,
  }) as number;

  const personas = useWatch({
    control,
    name: `viaticos.${index}.cantidadPersonas`,
  }) as number;

  const watchConceptoId = useWatch({
    control,
    name: `viaticos.${index}.conceptoId`,
  });

  const watchTipoDestino = useWatch({
    control,
    name: `viaticos.${index}.tipoDestino`,
  });

  const watchPlanificacionIndexes = useWatch({
    control,
    name: `viaticos.${index}.planificacionIndexes`,
  }) as number[] | undefined;

  const montoNeto = useWatch({
    control,
    name: `viaticos.${index}.montoNeto`,
  });

  const selectedPlanificaciones = useMemo(() => {
    if (!Array.isArray(watchPlanificacionIndexes)) return [];
    return watchPlanificacionIndexes
      .map((idx) => actividadesPlanificadas[idx])
      .filter(Boolean);
  }, [actividadesPlanificadas, watchPlanificacionIndexes]);

  // Determine if it is and "Exterior" concept
  const isExterior = useMemo(() => {
    const conceptoSeleccionado = conceptos.find(
      (c) => String(c.id) === String(watchConceptoId)
    );
    return (
      conceptoSeleccionado?.nombre.toLowerCase().includes('exterior') || false
    );
  }, [watchConceptoId, conceptos]);

  // Auto-fill logic: Días and Personas based on selected planificación and destination type
  // Use form state to check if the user is interacting with the dropdowns
  const { dirtyFields } = useFormState({ control });

  useEffect(() => {
    const isPlanificacionDirty =
      dirtyFields.viaticos?.[index]?.planificacionIndexes;
    const isTipoDestinoDirty = dirtyFields.viaticos?.[index]?.tipoDestino;

    // Only update if the user explicitly changed the source of truth
    if (
      (isPlanificacionDirty || isTipoDestinoDirty) &&
      selectedPlanificaciones.length > 0
    ) {
      // Validate that all selected planificaciones have the same person count
      if (
        !validatePersonCountMatch(selectedPlanificaciones, watchTipoDestino)
      ) {
        toast.error(
          'La cantidad de personas difiere entre las actividades. Debe crear un viático separado para cada actividad.'
        );
        // Revert selection to previous state
        setValue(`viaticos.${index}.planificacionIndexes`, [], {
          shouldDirty: true,
        });
        return;
      }

      // Sum logic:
      let sumDias = 0;
      const personField =
        watchTipoDestino === 'TERCEROS' ? 'cantTerceros' : 'cantInstitucion';
      const personasValue =
        (selectedPlanificaciones[0]?.[
          personField as keyof (typeof selectedPlanificaciones)[0]
        ] as number) || 0;

      selectedPlanificaciones.forEach((plan) => {
        sumDias += plan.cantDias || 0;
      });

      setValue(`viaticos.${index}.dias`, sumDias, {
        shouldDirty: true,
      });
      setValue(`viaticos.${index}.cantidadPersonas`, personasValue, {
        shouldDirty: true,
      });
    } else if (isPlanificacionDirty && selectedPlanificaciones.length === 0) {
      // User cleared selection completely
      setValue(`viaticos.${index}.dias`, 0, { shouldDirty: true });
      setValue(`viaticos.${index}.cantidadPersonas`, 0, { shouldDirty: true });
    }
  }, [selectedPlanificaciones, watchTipoDestino, setValue, index, dirtyFields]);

  // Get the unit price from the selected concept
  const precioUnitarioLista = useMemo(() => {
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

  // Sync costoUnitario for non-exterior concepts
  useEffect(() => {
    if (!isExterior && precioUnitarioLista > 0) {
      setValue(`viaticos.${index}.costoUnitario`, precioUnitarioLista, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  }, [isExterior, precioUnitarioLista, index, setValue]);

  // Calculate total: días × personas × costo unitario (manual or fixed)
  const netoTotal = useMemo(() => {
    const d = Number(dias) || 0;
    const p = Number(personas) || 0;
    const precio = Number(watchCostoUnitario) || 0;
    return d * p * precio;
  }, [dias, personas, watchCostoUnitario]);

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
                <Label className="text-foreground text-sm font-bold uppercase">
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
                        fuentesDisponibles.map((f) => [f.poaId, f])
                      ).values(),
                    ]
                      .filter((f) =>
                        normalizeString(
                          f.poa?.estructura?.partida?.nombre
                        ).includes('VIATICO')
                      )
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
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name={`viaticos.${index}.conceptoId`}
            render={({ field }) => (
              <FormItem>
                <Label className="text-foreground text-sm font-bold uppercase">
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
            name={`viaticos.${index}.tipoDestino`}
            render={({ field }) => (
              <FormItem>
                <Label className="text-foreground text-sm font-bold uppercase">
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
          <FormField
            control={control}
            name={`viaticos.${index}.planificacionIndexes`}
            render={({ field }) => {
              const selectedValues = Array.isArray(field.value)
                ? field.value
                : [];
              return (
                <FormItem className="flex flex-col">
                  <Label className="text-foreground mb-[2px] text-sm font-bold uppercase">
                    Planificaciones
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={`h-auto min-h-10 w-full flex-wrap justify-start text-left font-normal ${
                            selectedValues.length === 0
                              ? 'text-muted-foreground'
                              : ''
                          }`}
                        >
                          <div className="flex flex-1 flex-wrap items-center gap-1">
                            {selectedValues.length > 0 ? (
                              selectedValues.map((val) => (
                                <Badge
                                  key={val}
                                  variant="secondary"
                                  className="max-w-[150px] truncate text-sm font-normal"
                                >
                                  {
                                    actividadesPlanificadas[val]
                                      ?.actividadProgramada
                                  }
                                </Badge>
                              ))
                            ) : (
                              <span>Seleccionar actividades...</span>
                            )}
                          </div>
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0" align="start">
                      <Command>
                        <CommandList>
                          <CommandEmpty>No hay actividades.</CommandEmpty>
                          <CommandGroup>
                            {actividadesPlanificadas.length > 0 ? (
                              actividadesPlanificadas.map((act, idx) => {
                                const isSelected = selectedValues.includes(idx);
                                return (
                                  <CommandItem
                                    key={idx}
                                    value={act.actividadProgramada}
                                    onSelect={() => {
                                      const updated = isSelected
                                        ? selectedValues.filter(
                                            (v) => v !== idx
                                          )
                                        : [...selectedValues, idx];

                                      // If adding a new item, validate person count match
                                      if (!isSelected && updated.length > 1) {
                                        const planificacionesToValidate =
                                          updated
                                            .map(
                                              (i) => actividadesPlanificadas[i]
                                            )
                                            .filter(Boolean);

                                        if (
                                          !validatePersonCountMatch(
                                            planificacionesToValidate,
                                            watchTipoDestino
                                          )
                                        ) {
                                          toast.error(
                                            'La cantidad de personas difiere entre las actividades. Debe crear un viático separado para cada actividad.'
                                          );
                                          return;
                                        }
                                      }

                                      field.onChange(updated);
                                    }}
                                  >
                                    <Checkbox
                                      checked={isSelected}
                                      className="mr-2"
                                      tabIndex={-1}
                                    />
                                    <span className="truncate">
                                      {act.actividadProgramada}
                                    </span>
                                  </CommandItem>
                                );
                              })
                            ) : (
                              <CommandItem disabled>
                                No hay actividades planificadas
                              </CommandItem>
                            )}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              );
            }}
          />
        </div>

        {/* Fila Central */}
        <div className="grid items-start gap-4 md:grid-cols-3">
          <FormField
            control={control}
            name={`viaticos.${index}.dias`}
            render={({ field }) => (
              <FormItem>
                <Label className="text-foreground text-sm font-bold uppercase">
                  Días
                </Label>
                <FormControl>
                  <Input
                    type="number"
                    step="0.5"
                    {...field}
                    className="bg-muted text-muted-foreground w-full cursor-not-allowed"
                    value={field.value ?? 0}
                    readOnly
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name={`viaticos.${index}.cantidadPersonas`}
            render={({ field }) => (
              <FormItem>
                <Label className="text-foreground text-sm font-bold uppercase">
                  Personas
                </Label>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    className="bg-muted text-muted-foreground w-full cursor-not-allowed"
                    value={field.value ?? 0}
                    readOnly
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name={`viaticos.${index}.costoUnitario`}
            render={({ field }) => (
              <FormItem>
                <Label className="text-foreground text-sm font-bold uppercase">
                  Costo Unitario (Bs)
                </Label>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    {...field}
                    // Si no es exterior y no tiene valor, podemos caer en precioUnitarioLista
                    value={
                      field.value !== undefined
                        ? field.value
                        : precioUnitarioLista
                    }
                    onChange={(e) => {
                      const val =
                        e.target.value === '' ? 0 : parseFloat(e.target.value);
                      field.onChange(val);
                    }}
                    readOnly={!isExterior}
                    className={
                      !isExterior
                        ? 'bg-muted text-muted-foreground cursor-not-allowed focus-visible:ring-0'
                        : ''
                    }
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
            <span className="text-foreground text-sm font-bold uppercase">
              TOTAL LÍQUIDO (A Recibir)
            </span>
            <span className="text-primary text-lg font-semibold">
              {formatMoney(netoTotal || 0)}
            </span>
          </div>
          <div className="bg-border hidden h-10 w-[1px] sm:block" />
          <div className="flex flex-col">
            <span className="text-foreground text-sm font-bold uppercase">
              TOTAL PRESUPUESTADO
            </span>
            <span className="text-sm font-bold">
              {formatMoney(montoNeto || 0)}
            </span>
          </div>
          <div className="bg-border hidden h-8 w-[1px] sm:block" />
          <div className="flex flex-wrap gap-4">
            <div className="flex flex-col">
              <span className="text-foreground text-sm uppercase">
                RC-IVA 13%
              </span>
              <span className="text-sm font-semibold">
                {formatMoney((Number(montoNeto) || 0) * 0.13)}
              </span>
            </div>
            {watchTipoDestino === 'TERCEROS' && (
              <div className="flex flex-col">
                <span className="text-foreground text-sm uppercase">IT 3%</span>
                <span className="text-sm font-semibold">
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
