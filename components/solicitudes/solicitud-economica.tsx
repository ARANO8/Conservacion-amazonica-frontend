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
import {
  SeleccionPresupuesto,
  PoaStructureItem,
  Actividad,
} from '@/types/backend';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  Trash2,
  Plus,
  Loader2,
  X,
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
import { formatMoney, cn } from '@/lib/utils';
import { PoaCard } from './poa-card';
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
  initialData?: Partial<FormData>;
  initialPoaCode?: string;
}
export default function SolicitudEconomica({
  control,
  watchActividades,
  conceptos,
  tiposGasto,
  poaCodes,
  misSelecciones,
  setMisSelecciones,
  initialData,
  initialPoaCode,
}: SolicitudEconomicaProps) {
  const { setValue, watch, reset, getValues } = useFormContext<FormData>();

  // Estado "Tree-Walker": Estructura completa del POA seleccionado
  const [poaStructure, setPoaStructure] = useState<PoaStructureItem[]>([]); // Array de items del POA (Poa objects)
  const [isLoadingStructure, setIsLoadingStructure] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);

  const [selectedPoa, setSelectedPoa] = useState(initialPoaCode || '');
  const [isPoaOpen, setIsPoaOpen] = useState(false);

  // Estado para controlar la confirmación de cambio destructivo
  const [pendingChange, setPendingChange] = useState<{
    type: 'POA' | 'PROYECTO';
    value: string;
  } | null>(null);

  // REHYDRATION LOGIC
  useEffect(() => {
    // Si tenemos datos iniciales y el formulario no tiene fuentes (está "vacío" o recién montado)
    if (initialData && initialPoaCode) {
      // 1. Resetear el formulario con los datos guardados
      reset({ ...getValues(), ...initialData });

      // 2. Restaurar el Código POA visualmente
      setSelectedPoa(initialPoaCode);

      // 3. Cargar la estructura SIN borrar los datos del formulario
      const fetchStructure = async () => {
        try {
          setIsLoadingStructure(true);
          const structure =
            await catalogosService.getEstructuraByPoa(initialPoaCode);
          setPoaStructure(structure);
        } catch (error) {
          toast.error('Error al restaurar la estructura del POA');
        } finally {
          setIsLoadingStructure(false);
        }
      };

      fetchStructure();
    }
  }, [initialData, initialPoaCode, reset, getValues]);

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
          } catch (error) {
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
    [setValue, setMisSelecciones]
  );

  /**
   * Intercepta la solicitud de cambio. Si hay datos sensibles, pide confirmación.
   */
  const requestChange = (type: 'POA' | 'PROYECTO', newValue: string) => {
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
  };

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
              todas las partidas presupuestarias seleccionadas y los
              gastos/viáticos ingresados hasta el momento.
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

/**
 * FuenteCard: Selección puramente client-side (sin llamadas a API de reserva)
 */
function FuenteCard({
  index,
  control,
  remove,
  poaStructure,
  proyectoId,
  codigoPoa,
  misSelecciones,
  setMisSelecciones,
}: {
  index: number;
  control: Control<FormData>;
  remove: (index: number) => void;
  poaStructure: PoaStructureItem[];
  proyectoId: number;
  codigoPoa: string;
  misSelecciones: SeleccionPresupuesto[];
  setMisSelecciones: React.Dispatch<
    React.SetStateAction<SeleccionPresupuesto[]>
  >;
}) {
  const { setValue, watch } = useFormContext<FormData>();

  // Campos del formulario
  const poaId = watch(`fuentesSeleccionadas.${index}.poaId`) as number | null;
  const montoReservado = watch(
    `fuentesSeleccionadas.${index}.montoReservado`
  ) as number;
  const isLocked = watch(`fuentesSeleccionadas.${index}.isLocked`) as boolean;
  const selectedGrupoId = watch(`fuentesSeleccionadas.${index}.grupoId`);
  const selectedPartidaId = watch(`fuentesSeleccionadas.${index}.partidaId`);
  const watchedFuentes = watch('fuentesSeleccionadas') || [];
  const selectedItemId = watch(
    `fuentesSeleccionadas.${index}.codigoPresupuestarioId`
  );
  const watchedSaldoBackend = watch(
    `fuentesSeleccionadas.${index}.saldoDisponible`
  ) as number;

  // B. Selector de Grupo (Derivado)
  const availableGrupos = useMemo(() => {
    if (!proyectoId || !poaStructure.length) return [];
    const itemsOfProject = poaStructure.filter(
      (i) => i.estructura?.proyecto?.id === proyectoId
    );
    return uniqueItems(
      itemsOfProject.map((i) => i.estructura?.grupo).filter(Boolean)
    );
  }, [poaStructure, proyectoId]);

  // C. Selector de Partida (Derivado)
  const availablePartidas = useMemo(() => {
    if (!selectedGrupoId || !poaStructure.length) return [];
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
    return poaStructure
      .filter(
        (i) =>
          i.estructura?.proyecto?.id === proyectoId &&
          i.estructura?.grupo?.id === Number(selectedGrupoId) &&
          i.estructura?.partida?.id === Number(selectedPartidaId)
      )
      .map((i) => ({
        id: i.id,
        codigoCompleto:
          i.actividad?.detalleDescripcion ||
          i.codigoPresupuestario?.codigoCompleto ||
          i.codigoPresupuestario?.descripcion ||
          `Item ${i.id}`,
        original: i,
      }));
  }, [poaStructure, proyectoId, selectedGrupoId, selectedPartidaId]);

  const viaticosRaw = useWatch({ control, name: 'viaticos' });
  const gastosRaw = useWatch({ control, name: 'items' });

  const viaticos = useMemo(() => viaticosRaw || [], [viaticosRaw]);
  const gastos = useMemo(() => gastosRaw || [], [gastosRaw]);

  // Lógica de Suma (Gross-Up)
  const resumenFinanciero = useMemo(() => {
    if (!poaId) return { neto: 0, bruto: 0 };

    const sumaViaticosNeto = viaticos
      .filter((v) => Number(v.solicitudPresupuestoId) === poaId)
      .reduce((acc: number, v) => acc + (Number(v.liquidoPagable) || 0), 0);

    const sumaViaticosBruto = viaticos
      .filter((v) => Number(v.solicitudPresupuestoId) === poaId)
      .reduce((acc: number, v) => acc + (Number(v.montoNeto) || 0), 0);

    const sumaGastosNeto = gastos
      .filter((g) => Number(g.solicitudPresupuestoId) === poaId)
      .reduce((acc: number, g) => acc + (Number(g.liquidoPagable) || 0), 0);

    const sumaGastosBruto = gastos
      .filter((g) => Number(g.solicitudPresupuestoId) === poaId)
      .reduce((acc: number, g) => acc + (Number(g.montoNeto) || 0), 0);

    return {
      neto: sumaViaticosNeto + sumaGastosNeto,
      bruto: sumaViaticosBruto + sumaGastosBruto,
    };
  }, [viaticos, gastos, poaId]);

  const limit = watchedSaldoBackend || Number(montoReservado || 0);
  const saldoDisponibleLocal = limit - resumenFinanciero.bruto;

  // Selección automática: al elegir un ítem, registrar la selección localmente
  useEffect(() => {
    if (!selectedItemId || isLocked) return;

    const selectedItemObj = availableItems.find(
      (i) => i.id.toString() === selectedItemId.toString()
    );

    if (!selectedItemObj) return;

    const poaItem = selectedItemObj.original;

    // Validación de integridad
    const poaDevuelto = poaItem.codigoPoa || codigoPoa;
    if (poaDevuelto !== codigoPoa) {
      toast.error(
        `Error de integridad: El ítem pertenece a ${poaDevuelto}, se esperaba ${codigoPoa}`
      );
      setValue(`fuentesSeleccionadas.${index}.codigoPresupuestarioId`, '');
      return;
    }

    const rawMonto = poaItem.costoTotal ?? 0;
    const monto =
      typeof rawMonto === 'string' ? parseFloat(rawMonto) : Number(rawMonto);

    const rawSaldo = poaItem.saldoDisponible ?? rawMonto;
    const saldo =
      typeof rawSaldo === 'string' ? parseFloat(rawSaldo) : Number(rawSaldo);

    // Registrar en el formulario
    setValue(`fuentesSeleccionadas.${index}.poaId`, poaItem.id);
    setValue(`fuentesSeleccionadas.${index}.montoReservado`, monto);
    setValue(`fuentesSeleccionadas.${index}.saldoDisponible`, saldo);
    setValue(`fuentesSeleccionadas.${index}.isLocked`, true);

    // Crear la selección local
    const nuevaSeleccion: SeleccionPresupuesto = {
      poaId: poaItem.id,
      poa: {
        id: poaItem.id,
        codigoPoa: poaItem.codigoPoa,
        cantidad: poaItem.cantidad,
        costoUnitario: Number(poaItem.costoUnitario),
        costoTotal: Number(poaItem.costoTotal),
        saldoDisponible: saldo,
        proyectoId: poaItem.estructura?.proyecto?.id ?? 0,
        grupoId: poaItem.estructura?.grupo?.id ?? 0,
        partidaId: poaItem.estructura?.partida?.id ?? 0,
        actividadId: poaItem.actividad?.id ?? 0,
        codigoPresupuestarioId: poaItem.codigoPresupuestario?.id ?? 0,
        actividad: poaItem.actividad as Actividad | undefined,
        codigoPresupuestario: poaItem.codigoPresupuestario,
        estructura: poaItem.estructura,
      },
      montoPresupuestado: monto,
      saldoDisponible: saldo,
    };

    const nuevas = [...misSelecciones, nuevaSeleccion];
    setMisSelecciones(nuevas);
    setValue(
      'presupuestosIds',
      nuevas.map((n) => n.poaId)
    );

    toast.success(`Partida seleccionada: ${formatMoney(monto)}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedItemId]);

  const handleRemoveCard = () => {
    if (poaId) {
      const nuevas = misSelecciones.filter((s) => s.poaId !== poaId);
      setMisSelecciones(nuevas);
      setValue(
        'presupuestosIds',
        nuevas.map((n) => n.poaId)
      );
      toast.info('Partida eliminada');
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
            <Check className="h-3.5 w-3.5" />
            <span className="text-xs font-medium">Partida Seleccionada</span>
          </div>
          <Badge variant="secondary" className="font-mono text-xs">
            POA: {poaId}
          </Badge>
        </div>
      )}

      <div className="space-y-4 p-5">
        <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-2">
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
                        {p.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            )}
          />

          {/* ÍTEM / ACTIVIDAD (VISUALIZACIÓN CON POACARD) */}
          <div className="col-span-full space-y-3">
            <FieldLabel className="text-[10px] font-bold tracking-wider uppercase">
              Seleccionar Ítem / Actividad de Presupuesto
            </FieldLabel>

            {isLocked ? (
              // Vista cuando ya está seleccionado
              <div className="grid grid-cols-1">
                {poaStructure
                  .filter((i) => i.id === Number(selectedItemId))
                  .map((item) => (
                    <PoaCard
                      key={item.id}
                      item={item}
                      isSelected={true}
                      codigoActividad={
                        item.codigoPresupuestario?.codigoCompleto
                      }
                      onSelect={() => {}}
                      isDisabled={true}
                    />
                  ))}
              </div>
            ) : (
              // Selector cuando no hay nada seleccionado
              <div
                className={cn(
                  'grid gap-4',
                  availableItems.length === 1
                    ? 'grid-cols-1'
                    : availableItems.length === 2
                      ? 'grid-cols-1 md:grid-cols-2'
                      : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                )}
              >
                {availableItems.length > 0 ? (
                  availableItems.map((item) => {
                    const isAlreadyAdded = watchedFuentes.some(
                      (f) => Number(f.codigoPresupuestarioId) === item.id
                    );

                    return (
                      <PoaCard
                        key={item.id}
                        item={item.original}
                        isSelected={Number(selectedItemId) === item.id}
                        codigoActividad={
                          item.original.codigoPresupuestario?.codigoCompleto
                        }
                        isAlreadyAdded={isAlreadyAdded}
                        onSelect={(selected) => {
                          setValue(
                            `fuentesSeleccionadas.${index}.codigoPresupuestarioId`,
                            selected.id
                          );
                        }}
                      />
                    );
                  })
                ) : (
                  <div className="text-muted-foreground col-span-full py-4 text-center text-xs italic">
                    {selectedPartidaId
                      ? 'No hay items disponibles para esta partida.'
                      : 'Seleccione Grupo y Partida para ver los items disponibles.'}
                  </div>
                )}
              </div>
            )}

            <FormField
              control={control}
              name={`fuentesSeleccionadas.${index}.codigoPresupuestarioId`}
              render={({ field }) => (
                <input
                  type="hidden"
                  {...field}
                  value={field.value?.toString() || ''}
                />
              )}
            />
          </div>
        </div>
      </div>

      {/* Smart Footer */}
      <div className="bg-muted/40 flex flex-wrap items-center justify-between gap-4 rounded-b-xl border-t px-4 py-3">
        <div className="flex flex-wrap items-center gap-6">
          {/* 1. Límite POA */}
          <div className="flex flex-col">
            <span className="text-muted-foreground text-[10px] font-bold tracking-tight uppercase">
              Límite POA
            </span>
            <span className="text-muted-foreground text-sm font-medium">
              {isLocked
                ? formatMoney(Number(saldoDisponibleLocal) || 0)
                : '---'}
            </span>
          </div>

          <div className="bg-border hidden h-8 w-[1px] sm:block" />

          {/* 2. Solicitado (Neto) */}
          <div className="flex flex-col">
            <span className="text-muted-foreground text-[10px] font-bold tracking-tight uppercase">
              Subtotal Liquido
            </span>
            <span className="text-muted-foreground text-sm font-medium">
              {isLocked ? formatMoney(resumenFinanciero.neto) : '---'}
            </span>
          </div>

          <div className="bg-border hidden h-8 w-[1px] sm:block" />

          {/* 3. Solicitado (Bruto) */}
          <div className="flex flex-col">
            <span className="text-muted-foreground text-[10px] font-bold tracking-tight uppercase">
              Subtotal Presupuestado (Incl. Impuestos)
            </span>
            <span className="text-foreground text-base font-bold">
              {isLocked ? formatMoney(resumenFinanciero.bruto) : '---'}
            </span>
          </div>

          <div className="bg-border hidden h-8 w-[1px] sm:block" />

          {/* 4. Saldo Disponible */}
          <div className="flex flex-col">
            <span className="text-muted-foreground text-[10px] font-bold tracking-tight uppercase">
              Saldo Disponible
            </span>
            <span
              className={cn(
                'text-lg font-black',
                saldoDisponibleLocal < 0
                  ? 'text-destructive animate-pulse'
                  : 'text-emerald-600'
              )}
            >
              {isLocked ? formatMoney(saldoDisponibleLocal) : '---'}
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
          Eliminar
        </Button>
      </div>
    </div>
  );
}
