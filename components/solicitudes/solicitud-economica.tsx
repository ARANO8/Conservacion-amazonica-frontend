'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Control,
  useFormContext,
  useWatch,
  useFieldArray,
} from 'react-hook-form';
import { catalogosService } from '@/lib/services/catalogos-service';
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
import SolicitudHospedajes from '@/components/solicitudes/solicitud-hospedajes';
import { FormData } from '@/components/solicitudes/solicitud-schema';
import { FuenteCard } from './fuente-card';
import {
  SeleccionPresupuesto,
  PoaStructureItem,
} from '@/types/backend';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  Plus,
  Loader2,
  X,
  Wallet,
  ChevronDown,
  Check,
} from 'lucide-react';
import { Concepto, TipoGasto, PoaLookup } from '@/types/catalogs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { cn } from '@/lib/utils';
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
  misSelecciones: SeleccionPresupuesto[];
  setMisSelecciones: React.Dispatch<
    React.SetStateAction<SeleccionPresupuesto[]>
  >;
  // Estado del POA levantado al padre para persistir entre pasos del wizard
  selectedPoa: string;
  setSelectedPoa: React.Dispatch<React.SetStateAction<string>>;
  poaStructure: PoaStructureItem[];
  setPoaStructure: React.Dispatch<React.SetStateAction<PoaStructureItem[]>>;
  initialPoaCode?: string;
  isEditMode?: boolean;
}
export default function SolicitudEconomica({
  control,
  watchActividades,
  conceptos,
  tiposGasto,
  poaCodes,
  misSelecciones,
  setMisSelecciones,
  selectedPoa,
  setSelectedPoa,
  poaStructure,
  setPoaStructure,
  initialPoaCode,
  isEditMode = false,
}: SolicitudEconomicaProps) {
  const { setValue, watch } = useFormContext<FormData>();
  const hasHydratedInitialPoaRef = useRef(false);

  // Estado "Tree-Walker": Estructura completa del POA seleccionado
  const [isLoadingStructure, setIsLoadingStructure] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);

  // selectedPoa y poaStructure ahora vienen del padre (persisten entre pasos del wizard)
  const [isPoaOpen, setIsPoaOpen] = useState(false);

  // Estado para controlar la confirmación de cambio destructivo
  const [pendingChange, setPendingChange] = useState<{
    type: 'POA' | 'PROYECTO';
    value: string;
  } | null>(null);

  // REHYDRATION LOGIC: Cargar estructura si ya tenemos un POA (ej. en modo edición)
  // Si poaStructure.length > 0 significa que ya está cargado (ej. al volver desde paso 3).
  useEffect(() => {
    if (hasHydratedInitialPoaRef.current) {
      return;
    }

    // Si no hay código inicial, ya hay estructura cargada, o estamos cargando → no hacer nada.
    if (!initialPoaCode || isLoadingStructure || poaStructure.length > 0) {
      if (!initialPoaCode || poaStructure.length > 0) {
        hasHydratedInitialPoaRef.current = true;
      }
      return;
    }

    const fetchStructure = async () => {
      try {
        setIsLoadingStructure(true);
        // 1. Obtener datos puros siempre
        const structure =
          await catalogosService.getEstructuraByPoa(initialPoaCode);

        // 2. Solo si es EDICIÓN, aplicamos el parche
        // Nota: Usamos el valor actual de misSelecciones (del prop), pero NO lo ponemos en dependencias para evitar re-loops.
        if (isEditMode && misSelecciones.length > 0) {
          const patched = structure.map((item) => {
            const seleccion = misSelecciones.find((s) => s.poaId === item.id);
            if (seleccion) {
              const montoReembolso = Number(seleccion.montoPresupuestado || 0);
              const saldoBackend = Number(
                item.saldoDisponible ?? item.costoTotal
              );
              const costoTotal = Number(item.costoTotal);
              const saldoVirtualTotal = saldoBackend + montoReembolso;

              // 2. Determinamos si recuperamos todo el dinero (para ocultar warning)
              // Usamos epsilon pequeña para flotantes
              const recupereTodo =
                Math.abs(saldoVirtualTotal - costoTotal) < 0.01;

              return {
                ...item,
                // CRÍTICO: NO SOBRESCRIBIR saldoDisponible CON LA SUMA VIRTUAL.
                // Dejar el saldo del backend para que la tarjeta haga su suma visual natural.
                saldoDisponible: saldoBackend,

                // Solo manipulamos el flag de compromisos para ocultar el badge si aplica
                tieneCompromisos: !recupereTodo,
              };
            }
            return item;
          });
          setPoaStructure(patched);
        } else {
          // 3. Si es CREACIÓN, usamos datos puros
          setPoaStructure(structure);
        }

        hasHydratedInitialPoaRef.current = true;
      } catch {
        toast.error('Error al cargar POA');
      } finally {
        setIsLoadingStructure(false);
      }
    };

    void fetchStructure();
  }, [
    initialPoaCode,
    isEditMode,
    isLoadingStructure,
    misSelecciones,
    poaStructure.length,
    setPoaStructure,
  ]);

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

  // Sincronización de Fuentes: Calcular fuentes disponibles basándonos en las Cards actuales
  const filteredFuentes = useMemo(() => {
    const activePoaIds = new Set(
      watchedFuentes.map((f) => f.poaId).filter(Boolean)
    );
    return misSelecciones.filter((s) => activePoaIds.has(s.poaId));
  }, [misSelecciones, watchedFuentes]);

  // A. Selector de Proyecto (Derivado)
  const availableProjects = useMemo(() => {
    if (!poaStructure.length) return [];
    const projects = poaStructure
      .map((item) => item.estructura?.proyecto)
      .filter(Boolean);
    return uniqueItems(projects);
  }, [poaStructure]);

  /**
   * Ejecuta el cambio de contexto limpiando previamente todos los datos locales.
   */
  const executeResetAndChange = useCallback(
    async (type: 'POA' | 'PROYECTO', newValue: string) => {
      setIsCleaning(true);

      // Limpiar Estado Local y de Formulario
      setMisSelecciones([]);
      setValue('presupuestosIds', []);
      setValue('fuentesSeleccionadas', []);
      setValue('viaticos', []);
      setValue('items', []);

      // Aplicar el Cambio de Contexto
      if (type === 'POA') {
        setSelectedPoa(newValue);
        setValue('proyecto', '');
        setPoaStructure([]);

        if (newValue) {
          try {
            setIsLoadingStructure(true);
            const structure =
              await catalogosService.getEstructuraByPoa(newValue);
            setPoaStructure(structure);
          } catch {
            toast.error('Error al cargar la estructura del POA');
          } finally {
            setIsLoadingStructure(false);
          }
        }
      } else if (type === 'PROYECTO') {
        setValue('proyecto', newValue ? Number(newValue) : '');
      }

      setPendingChange(null);
      setIsCleaning(false);
      toast.info('Formulario limpiado para el nuevo contexto.');
    },
    [setMisSelecciones, setPoaStructure, setSelectedPoa, setValue]
  );

  /**
   * Intercepta la solicitud de cambio. Si hay datos sensibles, pide confirmación.
   */
  const requestChange = useCallback(
    (type: 'POA' | 'PROYECTO', newValue: string) => {
      const hasActiveData = misSelecciones.length > 0;

      // Si es el mismo valor, no hacer nada
      if (type === 'POA' && newValue === selectedPoa) return;
      if (type === 'PROYECTO' && Number(newValue) === Number(watchedProyecto))
        return;

      if (hasActiveData) {
        setPendingChange({ type, value: newValue });
      } else {
        executeResetAndChange(type, newValue);
      }
    },
    [misSelecciones.length, selectedPoa, watchedProyecto, executeResetAndChange]
  );

  const handleClearPoa = useCallback(() => {
    requestChange('POA', '');
  }, [requestChange]);

  return (
    <FieldGroup className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-foreground font-semibold">
          Configuración Global de Presupuesto
        </h3>
        <FieldSet className="bg-muted/20 rounded-xl border p-4 shadow-sm">
          <div className="grid gap-6 md:grid-cols-2">
            <Field>
              <FieldLabel>Código POA</FieldLabel>
              <Popover open={isPoaOpen} onOpenChange={setIsPoaOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={isPoaOpen}
                    className="w-full justify-between font-normal"
                    disabled={isCleaning}
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
                      {isCleaning ? (
                        <Loader2 className="h-4 w-4 animate-spin opacity-50" />
                      ) : (
                        <ChevronDown className="h-4 w-4 opacity-50" />
                      )}
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
                              requestChange('POA', val);
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
                  <FieldLabel>Proyecto</FieldLabel>
                  <Select
                    disabled={!selectedPoa || isLoadingStructure || isCleaning}
                    onValueChange={(val) => {
                      requestChange('PROYECTO', val);
                    }}
                    value={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        {isLoadingStructure || isCleaning ? (
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>
                              {isCleaning ? 'Limpiando...' : 'Cargando...'}
                            </span>
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
          <div className="flex items-center gap-3">
            <FieldLegend>Partida Presupuestaria</FieldLegend>
          </div>
        </div>

        <div className="space-y-4">
          {fields.map((field, index) => (
            <FuenteCard
              key={field.id}
              index={index}
              control={control}
              remove={remove}
              poaStructure={poaStructure}
              proyectoId={Number(watchedProyecto)}
              codigoPoa={selectedPoa}
              misSelecciones={misSelecciones}
              setMisSelecciones={setMisSelecciones}
              isEditMode={isEditMode}
            />
          ))}
          {fields.length === 0 && (
            <div className="text-muted-foreground flex h-32 flex-col items-center justify-center rounded-lg border-2 border-dashed">
              <Wallet className="mb-2 h-8 w-8 opacity-40" />
              <p className="text-sm italic">
                No hay partidas agregadas. Selecciona un proyecto y haz clic en
                &quot;Agregar Partida&quot;.
              </p>
            </div>
          )}

          <div className="mt-4 flex justify-start">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                append({
                  grupoId: '',
                  partidaId: '',
                  codigoPresupuestarioId: '',
                  poaId: null,
                  montoReservado: 0,
                  isLocked: false,
                })
              }
              disabled={!watchedProyecto || isCleaning}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Agregar Partida
            </Button>
          </div>
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
                  disabled={isCleaning}
                />
              </FormControl>
              <FormMessage />
            </Field>
          )}
        />
      </FieldSet>

      <SolicitudHospedajes fuentesDisponibles={filteredFuentes} />

      <SolicitudViaticos
        control={control}
        actividadesPlanificadas={watchActividades || []}
        conceptos={conceptos}
        fuentesDisponibles={filteredFuentes}
      />
      <SolicitudGastos
        control={control}
        grupos={[]}
        tiposGasto={tiposGasto}
        proyectoId={Number(watchedProyecto)}
        fuentesDisponibles={filteredFuentes}
      />

      <AlertDialog
        open={!!pendingChange}
        onOpenChange={(open) => !open && setPendingChange(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              ¿Está seguro de cambiar el contexto?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Al cambiar el{' '}
              {pendingChange?.type === 'POA' ? 'Código POA' : 'Proyecto'}, se
              <span className="text-destructive font-bold">
                {' '}
                eliminarán permanentemente
              </span>{' '}
              todas las partidas presupuestarias seleccionadas y los ítems
              ingresados hasta el momento.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCleaning}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              disabled={isCleaning}
              onClick={(e) => {
                e.preventDefault();
                if (pendingChange) {
                  executeResetAndChange(
                    pendingChange.type,
                    pendingChange.value
                  );
                }
              }}
            >
              {isCleaning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading
                </>
              ) : (
                'Sí, Limpiar y Cambiar'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </FieldGroup>
  );
}