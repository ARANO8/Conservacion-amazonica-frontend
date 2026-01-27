'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Control,
  useFormContext,
  useWatch,
  useFieldArray,
} from 'react-hook-form';
import { catalogosService } from '@/services/catalogos.service';
import { FormField, FormControl, FormMessage } from '@/components/ui/form';
import {
  Field,
  FieldLabel,
  FieldGroup,
  FieldSet,
  FieldLegend,
} from '@/components/ui/field';

import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import SolicitudViaticos from '@/components/solicitudes/solicitud-viaticos';
import SolicitudGastos from '@/components/solicitudes/solicitud-gastos';
import { FormData } from '@/components/solicitudes/solicitud-schema';
import { PresupuestoReserva, PoaStructureItem } from '@/types/backend';
import { presupuestosService } from '@/services/presupuestos.service';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  Trash2,
  Plus,
  Loader2,
  X,
  Lock,
  Wallet,
  ChevronDown,
  Check,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Concepto, TipoGasto, PoaLookup } from '@/types/catalogs';
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
import { formatMoney, cn } from '@/lib/utils';
import { EntityBase } from '@/types/backend';

// Helper para deduplicar arrays de objetos por ID
function uniqueItems<T extends EntityBase>(items: (T | undefined)[]): T[] {
  const filtered = items.filter((i): i is T => !!i);
  return [...new Map(filtered.map((item) => [item.id, item])).values()];
}

interface SolicitudEconomicaProps {
  control: Control<FormData>;
  watchActividades: FormData['actividades'];
  conceptos: Concepto[];
  tiposGasto: TipoGasto[];
  poaCodes: PoaLookup[];
  misReservas: PresupuestoReserva[];
  setMisReservas: React.Dispatch<React.SetStateAction<PresupuestoReserva[]>>;
}

export default function SolicitudEconomica({
  control,
  watchActividades,
  conceptos,
  tiposGasto,
  poaCodes,
  misReservas,
  setMisReservas,
}: SolicitudEconomicaProps) {
  const { setValue, watch } = useFormContext<FormData>();

  // Estado "Tree-Walker": Estructura completa del POA seleccionado
  const [poaStructure, setPoaStructure] = useState<PoaStructureItem[]>([]); // Array de items del POA (Poa objects)
  const [isLoadingStructure, setIsLoadingStructure] = useState(false);

  const [selectedPoa, setSelectedPoa] = useState('');
  const [isPoaOpen, setIsPoaOpen] = useState(false);

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'fuentesSeleccionadas',
  });

  const watchedProyecto = watch('proyecto');

  // Observar montos para cálculos globales y sincronización de fuentes
  const watchFuentesRaw = useWatch({ control, name: 'fuentesSeleccionadas' });

  const watchedFuentes = useMemo(
    () => watchFuentesRaw || [],
    [watchFuentesRaw]
  );

  // TAREA 1: Sincronización de Fuentes (Eliminar IDs Fantasmas)
  // Calculamos las fuentes disponibles basándonos exclusivamente en lo que está en las Cards actuales
  const filteredFuentes = useMemo(() => {
    const activeIds = new Set(
      watchedFuentes.map((f) => f.reservaId).filter(Boolean)
    );
    return misReservas.filter((r) => activeIds.has(r.id));
  }, [misReservas, watchedFuentes]);

  // A. Selector de Proyecto (Derivado)
  // Input: poaStructure (cargado al seleccionar POA)
  // Output: Lista única de proyectos disponibles en este POA
  const availableProjects = useMemo(() => {
    if (!poaStructure.length) return [];
    const projects = poaStructure
      .map((item) => item.estructura?.proyecto)
      .filter(Boolean);
    return uniqueItems(projects);
  }, [poaStructure]);

  const handlePoaChange = useCallback(
    async (codigo: string) => {
      setSelectedPoa(codigo);
      setValue('proyecto', '');
      setValue('fuentesSeleccionadas', []);
      setPoaStructure([]); // Limpiar estructura anterior

      if (!codigo) return;

      try {
        setIsLoadingStructure(true);
        // TAREA 1: Cargar estructura completa usando el nuevo endpoint
        console.log(
          '🌳 Cargando estructura completa para POA de forma segura:',
          codigo
        );
        const structure = await catalogosService.getEstructuraByPoa(codigo);
        console.log('✅ Estructura cargada:', structure.length, 'items');
        setPoaStructure(structure);
      } catch (error) {
        console.error('Error fetching POA structure:', error);
        toast.error('Error al cargar la estructura del POA');
      } finally {
        setIsLoadingStructure(false);
      }
    },
    [setValue]
  );

  const handleClearPoa = useCallback(async () => {
    setSelectedPoa('');
    setValue('proyecto', '');
    setValue('fuentesSeleccionadas', []);
    setPoaStructure([]);

    // Liberar todas las reservas
    for (const r of misReservas) {
      try {
        await presupuestosService.liberar(r.id);
      } catch {
        // Silently ignore
      }
    }
    setMisReservas([]);
    setValue('presupuestosIds', []);
  }, [misReservas, setMisReservas, setValue]);

  return (
    <FieldGroup className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-foreground font-semibold">
          Configuración Global de Presupuesto
        </h3>
        <FieldSet className="bg-muted/20 rounded-xl border p-4 shadow-sm">
          <div className="grid gap-6 md:grid-cols-2">
            <Field>
              <FieldLabel>Actividad / POA Macro</FieldLabel>
              <Popover open={isPoaOpen} onOpenChange={setIsPoaOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={isPoaOpen}
                    className="w-full justify-between font-normal"
                  >
                    {selectedPoa || 'Seleccionar POA...'}
                    <div className="flex items-center gap-1">
                      {selectedPoa && (
                        <X
                          className="h-4 w-4 opacity-50 hover:opacity-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleClearPoa();
                          }}
                        />
                      )}
                      <ChevronDown className="h-4 w-4 opacity-50" />
                    </div>
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-[var(--radix-popover-trigger-width)] p-0"
                  align="start"
                >
                  <Command>
                    <CommandInput placeholder="Buscar código POA..." />
                    <CommandList>
                      <CommandEmpty>No se encontraron resultados</CommandEmpty>
                      <CommandGroup>
                        {poaCodes.map((item) => (
                          <CommandItem
                            key={item.codigo}
                            value={item.codigo}
                            onSelect={(val) => {
                              handlePoaChange(val);
                              setIsPoaOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                'mr-2 h-4 w-4',
                                selectedPoa === item.codigo
                                  ? 'opacity-100'
                                  : 'opacity-0'
                              )}
                            />
                            {item.codigo}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </Field>

            <FormField
              control={control}
              name="proyecto"
              render={({ field }) => (
                <Field>
                  <FieldLabel>Proyecto Destino</FieldLabel>
                  <Select
                    disabled={!selectedPoa || isLoadingStructure}
                    onValueChange={(val) => {
                      field.onChange(Number(val));
                      setValue('fuentesSeleccionadas', []); // Reset cards on project change
                    }}
                    value={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        {isLoadingStructure ? (
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Cargando Estructura...</span>
                          </div>
                        ) : (
                          <SelectValue placeholder="Seleccionar Proyecto..." />
                        )}
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent
                      position="popper"
                      side="bottom"
                      sideOffset={5}
                    >
                      {availableProjects.map((p) => (
                        <SelectItem key={p.id} value={p.id.toString()}>
                          {p.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              )}
            />
          </div>
        </FieldSet>
      </div>

      {/* CARDS DE FUENTES */}
      <FieldSet>
        <div className="mb-4 flex items-center justify-between">
          <FieldLegend>Fuentes de Financiamiento</FieldLegend>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              append({
                grupoId: '',
                partidaId: '',
                codigoPresupuestarioId: '',
                reservaId: null,
                montoReservado: 0,
                isLocked: false,
              })
            }
            disabled={!watchedProyecto}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Agregar Fuente
          </Button>
        </div>

        <div className="space-y-4">
          {fields.map((field, index) => (
            <FuenteCard
              key={field.id}
              index={index}
              control={control}
              remove={remove}
              poaStructure={poaStructure} // PASAMOS LA ESTRUCTURA COMPLETA
              proyectoId={Number(watchedProyecto)}
              codigoPoa={selectedPoa}
              misReservas={misReservas}
              setMisReservas={setMisReservas}
            />
          ))}
          {fields.length === 0 && (
            <div className="text-muted-foreground flex h-32 flex-col items-center justify-center rounded-lg border-2 border-dashed">
              <Wallet className="mb-2 h-8 w-8 opacity-40" />
              <p className="text-sm italic">
                No hay fuentes agregadas. Selecciona un proyecto y haz clic en
                &quot;Agregar Fuente&quot;.
              </p>
            </div>
          )}
        </div>
      </FieldSet>

      <Separator />

      <FieldSet>
        <FieldLegend>Información Complementaria</FieldLegend>
        <FormField
          control={control}
          name="motivo"
          render={({ field }) => (
            <Field>
              <FieldLabel>Motivo de la Solicitud</FieldLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Describa el motivo o justificación..."
                />
              </FormControl>
              <FormMessage />
            </Field>
          )}
        />
      </FieldSet>

      <SolicitudViaticos
        control={control}
        actividadesPlanificadas={watchActividades || []}
        conceptos={conceptos}
        fuentesDisponibles={filteredFuentes} // USAMOS LA LISTA FILTRADA REACTIVA
      />
      <SolicitudGastos
        control={control}
        grupos={[]}
        tiposGasto={tiposGasto}
        proyectoId={Number(watchedProyecto)}
        fuentesDisponibles={filteredFuentes} // USAMOS LA LISTA FILTRADA REACTIVA
      />
    </FieldGroup>
  );
}

/**
 * FuenteCard: Utiliza lógica de derivación (Tree-Walker) en lugar de fetch individual
 */
function FuenteCard({
  index,
  control,
  remove,
  poaStructure, // Estructura completa recibida del padre
  proyectoId,
  codigoPoa,
  misReservas,
  setMisReservas,
}: {
  index: number;
  control: Control<FormData>;
  remove: (index: number) => void;
  poaStructure: PoaStructureItem[];
  proyectoId: number;
  codigoPoa: string;
  misReservas: PresupuestoReserva[];
  setMisReservas: React.Dispatch<React.SetStateAction<PresupuestoReserva[]>>;
}) {
  const { setValue, watch } = useFormContext<FormData>();
  const [isReserving, setIsReserving] = useState(false);

  // Campos del formulario
  const reservaId = watch(`fuentesSeleccionadas.${index}.reservaId`) as
    | number
    | null;
  const montoReservado = watch(
    `fuentesSeleccionadas.${index}.montoReservado`
  ) as number;
  const isLocked = watch(`fuentesSeleccionadas.${index}.isLocked`) as boolean;
  const selectedGrupoId = watch(`fuentesSeleccionadas.${index}.grupoId`);
  const selectedPartidaId = watch(`fuentesSeleccionadas.${index}.partidaId`);
  const selectedItemId = watch(
    `fuentesSeleccionadas.${index}.codigoPresupuestarioId`
  );

  // B. Selector de Grupo (Derivado)
  const availableGrupos = useMemo(() => {
    if (!proyectoId || !poaStructure.length) return [];
    // Filtrar ítems del proyecto seleccionado
    const itemsOfProject = poaStructure.filter(
      (i) => i.estructura?.proyecto?.id === proyectoId
    );
    // Extraer grupos únicos
    return uniqueItems(
      itemsOfProject.map((i) => i.estructura?.grupo).filter(Boolean)
    );
  }, [poaStructure, proyectoId]);

  // C. Selector de Partida (Derivado)
  const availablePartidas = useMemo(() => {
    if (!selectedGrupoId || !poaStructure.length) return [];
    // Filtrar ítems del grupo seleccionado (y proyecto)
    const itemsOfGrupo = poaStructure.filter(
      (i) =>
        i.estructura?.proyecto?.id === proyectoId &&
        i.estructura?.grupo?.id === Number(selectedGrupoId)
    );
    return uniqueItems(
      itemsOfGrupo.map((i) => i.estructura?.partida).filter(Boolean)
    );
  }, [poaStructure, proyectoId, selectedGrupoId]);

  // D. Selector de Ítem (Derivado)
  const availableItems = useMemo(() => {
    if (!selectedPartidaId || !poaStructure.length) return [];
    // Filtrar ítems finales
    return poaStructure
      .filter(
        (i) =>
          i.estructura?.proyecto?.id === proyectoId &&
          i.estructura?.grupo?.id === Number(selectedGrupoId) &&
          i.estructura?.partida?.id === Number(selectedPartidaId)
      )
      .map((i) => ({
        id: i.codigoPresupuestario?.id || i.id, // Ajustar según estructura real
        codigoCompleto:
          i.codigoPresupuestario?.codigoCompleto ||
          i.codigoPresupuestario?.descripcion ||
          `Item ${i.id}`,
        // Preservar objeto original para reserva
        original: i,
      }));
  }, [poaStructure, proyectoId, selectedGrupoId, selectedPartidaId]);

  const viaticosRaw = useWatch({ control, name: 'viaticos' });
  const gastosRaw = useWatch({ control, name: 'items' });

  const viaticos = useMemo(() => viaticosRaw || [], [viaticosRaw]);
  const gastos = useMemo(() => gastosRaw || [], [gastosRaw]);

  // TAREA 1: Lógica de Suma (Gross-Up)
  // Calculamos por separado el Neto (informativo) y el Bruto (impacto real)
  const resumenFinanciero = useMemo(() => {
    if (!reservaId) return { neto: 0, bruto: 0 };

    const sumaViaticosNeto = viaticos
      .filter((v) => Number(v.solicitudPresupuestoId) === reservaId)
      .reduce((acc: number, v) => acc + (Number(v.montoNeto) || 0), 0);

    const sumaViaticosBruto = viaticos
      .filter((v) => Number(v.solicitudPresupuestoId) === reservaId)
      .reduce((acc: number, v) => acc + (Number(v.liquidoPagable) || 0), 0);

    const sumaGastosNeto = gastos
      .filter((g) => Number(g.solicitudPresupuestoId) === reservaId)
      .reduce((acc: number, g) => acc + (Number(g.montoNeto) || 0), 0);

    const sumaGastosBruto = gastos
      .filter((g) => Number(g.solicitudPresupuestoId) === reservaId)
      .reduce((acc: number, g) => acc + (Number(g.liquidoPagable) || 0), 0);

    return {
      neto: sumaViaticosNeto + sumaGastosNeto,
      bruto: sumaViaticosBruto + sumaGastosBruto,
    };
  }, [viaticos, gastos, reservaId]);

  const saldoDisponible = Number(montoReservado || 0) - resumenFinanciero.bruto;

  // Reserva automática
  useEffect(() => {
    if (!selectedItemId || isReserving || isLocked) return;

    const performReserve = async () => {
      setIsReserving(true);
      try {
        console.log('🎯 Reservando ítem (Tree-Walker Logic):', selectedItemId);

        // Encontrar el objeto completo en la estructura local (evita llamar al backend para detalles)
        const selectedItemObj = availableItems.find(
          (i) => i.id.toString() === selectedItemId.toString()
        );

        if (!selectedItemObj) {
          throw new Error('Ítem no encontrado en la estructura cargada');
        }

        const poaItem = selectedItemObj.original;

        // Validación de integridad YA está garantizada por la derivación, pero doble check:
        const poaDevuelto =
          poaItem.poa?.codigoPoa || poaItem.codigoPoa || codigoPoa;
        if (poaDevuelto !== codigoPoa) {
          throw new Error(
            `Integrity Error: Item belongs to ${poaDevuelto}, expected ${codigoPoa}`
          );
        }

        // Reservar usando el ID del item del POA (presupuesto)
        const reserva = await presupuestosService.reservar(poaItem.id);

        console.log('🔍 Reserva Response:', JSON.stringify(reserva, null, 2));

        const rawMonto =
          reserva.poa?.costoTotal ?? reserva.montoPresupuestado ?? 0;

        const monto =
          typeof rawMonto === 'string'
            ? parseFloat(rawMonto)
            : Number(rawMonto);

        setValue(`fuentesSeleccionadas.${index}.reservaId`, reserva.id);
        setValue(`fuentesSeleccionadas.${index}.montoReservado`, monto);
        setValue(`fuentesSeleccionadas.${index}.isLocked`, true);

        const nuevas = [...misReservas, reserva];
        setMisReservas(nuevas);
        setValue(
          'presupuestosIds',
          nuevas.map((n) => n.id)
        );

        toast.success(`Reserva exitosa: ${formatMoney(monto)}`);
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : 'Error al reservar saldo';
        toast.error(message);
        setValue(`fuentesSeleccionadas.${index}.codigoPresupuestarioId`, '');
      } finally {
        setIsReserving(false);
      }
    };

    performReserve();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedItemId]);

  const handleRemoveCard = async () => {
    if (reservaId) {
      try {
        await presupuestosService.liberar(reservaId);
        const nuevas = misReservas.filter((r) => r.id !== reservaId);
        setMisReservas(nuevas);
        setValue(
          'presupuestosIds',
          nuevas.map((n) => n.id)
        );
        toast.info('Fuente liberada');
      } catch {
        // ignore
      }
    }
    remove(index);
  };

  return (
    <div
      className={cn(
        'bg-card relative rounded-xl border shadow-sm transition-all',
        isLocked && 'ring-primary/30 ring-2'
      )}
    >
      {isLocked && (
        <div className="bg-primary/5 flex items-center justify-between rounded-t-xl border-b px-4 py-2">
          <div className="text-primary flex items-center gap-2">
            <Lock className="h-3.5 w-3.5" />
            <span className="text-xs font-medium">Fuente Reservada</span>
          </div>
          <Badge variant="secondary" className="font-mono text-xs">
            ID: {reservaId}
          </Badge>
        </div>
      )}

      <div className="space-y-4 p-5">
        <div className="grid gap-4 sm:grid-cols-3">
          {/* GRUPO */}
          <FormField
            control={control}
            name={`fuentesSeleccionadas.${index}.grupoId`}
            render={({ field }) => (
              <Field>
                <FieldLabel className="text-[10px] font-bold tracking-wider uppercase">
                  Grupo
                </FieldLabel>
                <Select
                  disabled={isLocked}
                  onValueChange={(val) => {
                    field.onChange(Number(val));
                    setValue(`fuentesSeleccionadas.${index}.partidaId`, '');
                    setValue(
                      `fuentesSeleccionadas.${index}.codigoPresupuestarioId`,
                      ''
                    );
                  }}
                  value={field.value?.toString()}
                >
                  <FormControl>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent position="popper" side="bottom" sideOffset={5}>
                    {availableGrupos.map((g) => (
                      <SelectItem key={g.id} value={g.id.toString()}>
                        {g.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            )}
          />

          {/* PARTIDA */}
          <FormField
            control={control}
            name={`fuentesSeleccionadas.${index}.partidaId`}
            render={({ field }) => (
              <Field>
                <FieldLabel className="text-[10px] font-bold tracking-wider uppercase">
                  Partida
                </FieldLabel>
                <Select
                  disabled={!selectedGrupoId || isLocked}
                  onValueChange={(val) => {
                    field.onChange(Number(val));
                    setValue(
                      `fuentesSeleccionadas.${index}.codigoPresupuestarioId`,
                      ''
                    );
                  }}
                  value={field.value?.toString()}
                >
                  <FormControl>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent position="popper" side="bottom" sideOffset={5}>
                    {availablePartidas.map((p) => (
                      <SelectItem key={p.id} value={p.id.toString()}>
                        {p.codigo} - {p.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            )}
          />

          {/* ÍTEM */}
          <FormField
            control={control}
            name={`fuentesSeleccionadas.${index}.codigoPresupuestarioId`}
            render={({ field }) => (
              <Field>
                <FieldLabel className="text-[10px] font-bold tracking-wider uppercase">
                  Ítem / Actividad
                </FieldLabel>
                <Select
                  disabled={!selectedPartidaId || isLocked}
                  onValueChange={(val) => field.onChange(Number(val))}
                  value={field.value?.toString()}
                >
                  <FormControl>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent position="popper" side="bottom" sideOffset={5}>
                    {availableItems.map((item) => (
                      <SelectItem key={item.id} value={item.id.toString()}>
                        {item.codigoCompleto}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            )}
          />
        </div>
      </div>

      {/* TAREA 2: ACTUALIZAR VISUALIZACIÓN (Smart Footer Mejorado) */}
      <div className="bg-muted/40 flex flex-wrap items-center justify-between gap-4 rounded-b-xl border-t px-4 py-3">
        <div className="flex flex-wrap items-center gap-6">
          {/* 1. Límite POA */}
          <div className="flex flex-col">
            <span className="text-muted-foreground text-[10px] font-bold tracking-tight uppercase">
              Límite POA
            </span>
            <span className="text-muted-foreground text-sm font-medium">
              {isLocked ? formatMoney(Number(montoReservado) || 0) : '---'}
            </span>
          </div>

          <div className="bg-border hidden h-8 w-[1px] sm:block" />

          {/* 2. Solicitado (Neto) */}
          <div className="flex flex-col">
            <span className="text-muted-foreground text-[10px] font-bold tracking-tight uppercase">
              Solicitado (Neto)
            </span>
            <span className="text-muted-foreground text-sm font-medium">
              {isLocked ? formatMoney(resumenFinanciero.neto) : '---'}
            </span>
          </div>

          <div className="bg-border hidden h-8 w-[1px] sm:block" />

          {/* 3. Solicitado (Bruto) - Costo Real */}
          <div className="flex flex-col">
            <span className="text-muted-foreground text-[10px] font-bold tracking-tight uppercase">
              Solicitado (Bruto)
            </span>
            <span className="text-foreground text-base font-bold">
              {isLocked ? formatMoney(resumenFinanciero.bruto) : '---'}
            </span>
          </div>

          <div className="bg-border hidden h-8 w-[1px] sm:block" />

          {/* 4. Saldo Disponible (Límite - Bruto) */}
          <div className="flex flex-col">
            <span className="text-muted-foreground text-[10px] font-bold tracking-tight uppercase">
              Saldo Disponible
            </span>
            <span
              className={cn(
                'text-lg font-black',
                saldoDisponible < 0
                  ? 'text-destructive animate-pulse'
                  : 'text-emerald-600'
              )}
            >
              {isLocked ? formatMoney(saldoDisponible) : '---'}
            </span>
          </div>
        </div>

        {/* Botón Eliminar */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleRemoveCard}
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          {isLocked ? 'Liberar y Eliminar' : 'Eliminar'}
        </Button>
      </div>
      {isReserving && (
        <div className="bg-background/80 absolute inset-0 z-10 flex items-center justify-center rounded-xl backdrop-blur-[1px]">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="text-primary h-6 w-6 animate-spin" />
            <span className="text-sm font-medium">Reservando fondos...</span>
          </div>
        </div>
      )}
    </div>
  );
}
