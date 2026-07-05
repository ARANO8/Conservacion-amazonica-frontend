'use client';

import { useMemo, useEffect, useState, useRef, useCallback } from 'react';
import { UseFormReturn, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import {
  Check,
  ChevronDown,
  Loader2,
  X,
  Wallet,
} from 'lucide-react';
import {
  Field,
  FieldLabel,
} from '@/components/ui/field';
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
import { cn } from '@/lib/utils';
import { PoaCard } from '@/components/solicitudes/poa-card';
import { catalogosService } from '@/lib/services/catalogos-service';
import type { PoaStructureItem } from '@/types/backend';
import type { PoaLookup } from '@/types/catalogs';
import type { SolicitudCompraFormData } from './solicitud-compra-schema';

function uniqueById<T extends { id: number }>(items: (T | undefined)[]): T[] {
  const filtered = items.filter((i): i is T => !!i);
  return [...new Map(filtered.map((item) => [item.id, item])).values()];
}

interface PoaSelectorCascadeProps {
  form: UseFormReturn<SolicitudCompraFormData>;
  poaCodes: PoaLookup[];
  initialValues?: Partial<SolicitudCompraFormData>;
  initialPoaCode?: string;
  onPoaChange?: (poaCode: string, poaItem?: PoaStructureItem) => void;
}

export function PoaSelectorCascade({
  form,
  poaCodes,
  initialValues,
  initialPoaCode,
  onPoaChange,
}: PoaSelectorCascadeProps) {
  const [selectedPoaCode, setSelectedPoaCode] = useState('');
  const [isPoaOpen, setIsPoaOpen] = useState(false);
  const [poaStructure, setPoaStructure] = useState<PoaStructureItem[]>([]);
  const [isLoadingStructure, setIsLoadingStructure] = useState(false);
  const [localProyectoId, setLocalProyectoId] = useState(0);
  const [localGrupoId, setLocalGrupoId] = useState(0);
  const [localPartidaId, setLocalPartidaId] = useState(0);

  const hasHydrated = useRef(false);

  const watchedPoaId = useWatch({ control: form.control, name: 'poaId' });

  const selectedPoaItem = useMemo(
    () => poaStructure.find((i) => i.id === watchedPoaId),
    [poaStructure, watchedPoaId]
  );

  // Propagar cambios de POA al padre
  useEffect(() => {
    if (onPoaChange) {
      onPoaChange(selectedPoaCode, selectedPoaItem);
    }
  }, [selectedPoaCode, selectedPoaItem, onPoaChange]);

  // ---- Re-hidratación para modo edición ----
  useEffect(() => {
    if (hasHydrated.current) return;
    if (!initialPoaCode || isLoadingStructure || poaStructure.length > 0) {
      if (!initialPoaCode || poaStructure.length > 0) {
        hasHydrated.current = true;
      }
      return;
    }

    const hydrate = async () => {
      try {
        setIsLoadingStructure(true);
        const structure =
          await catalogosService.getEstructuraByPoa(initialPoaCode);
        setPoaStructure(structure);
        setSelectedPoaCode(initialPoaCode);

        // Pre-seleccionar la cascada basándonos en el poaId guardado
        if (initialValues?.poaId) {
          const item = structure.find((i) => i.id === initialValues.poaId);
          if (item?.estructura) {
            setLocalProyectoId(item.estructura.proyecto?.id ?? 0);
            setLocalGrupoId(item.estructura.grupo?.id ?? 0);
            setLocalPartidaId(item.estructura.partida?.id ?? 0);
          }
        }
        hasHydrated.current = true;
      } catch {
        toast.error('Error al cargar la estructura del POA.');
      } finally {
        setIsLoadingStructure(false);
      }
    };

    void hydrate();
  }, [
    initialPoaCode,
    initialValues?.poaId,
    isLoadingStructure,
    poaStructure.length,
  ]);

  // ---- Derivados de la cascada ----
  const availableProjects = useMemo(() => {
    if (!poaStructure.length) return [];
    return uniqueById(
      poaStructure.map((i) => i.estructura?.proyecto).filter(Boolean)
    );
  }, [poaStructure]);

  const availableGrupos = useMemo(() => {
    if (!localProyectoId || !poaStructure.length) return [];
    return uniqueById(
      poaStructure
        .filter((i) => i.estructura?.proyecto?.id === localProyectoId)
        .map((i) => i.estructura?.grupo)
        .filter(Boolean)
    );
  }, [poaStructure, localProyectoId]);

  const availablePartidas = useMemo(() => {
    if (!localGrupoId || !poaStructure.length) return [];
    return uniqueById(
      poaStructure
        .filter(
          (i) =>
            i.estructura?.proyecto?.id === localProyectoId &&
            i.estructura?.grupo?.id === localGrupoId
        )
        .map((i) => i.estructura?.partida)
        .filter(Boolean)
    );
  }, [poaStructure, localProyectoId, localGrupoId]);

  const availableItems = useMemo(() => {
    if (!localPartidaId || !poaStructure.length) return [];
    return poaStructure.filter(
      (i) =>
        i.estructura?.proyecto?.id === localProyectoId &&
        i.estructura?.grupo?.id === localGrupoId &&
        i.estructura?.partida?.id === localPartidaId
    );
  }, [poaStructure, localProyectoId, localGrupoId, localPartidaId]);


  // ---- Handlers ----
  const handlePoaCodeSelect = useCallback(
    async (code: string) => {
      if (code === selectedPoaCode) {
        setIsPoaOpen(false);
        return;
      }
      setSelectedPoaCode(code);
      setLocalProyectoId(0);
      setLocalGrupoId(0);
      setLocalPartidaId(0);
      form.setValue('poaId', 0);
      setPoaStructure([]);
      setIsPoaOpen(false);

      if (code) {
        try {
          setIsLoadingStructure(true);
          const structure = await catalogosService.getEstructuraByPoa(code);
          setPoaStructure(structure);
        } catch {
          toast.error('Error al cargar la estructura del POA.');
        } finally {
          setIsLoadingStructure(false);
        }
      }
    },
    [selectedPoaCode, form]
  );

  const handleClearPoa = useCallback(() => {
    setSelectedPoaCode('');
    setPoaStructure([]);
    setLocalProyectoId(0);
    setLocalGrupoId(0);
    setLocalPartidaId(0);
    form.setValue('poaId', 0);
    form.setValue('proyecto', '');
  }, [form]);

  const handleClearPoaItem = useCallback(() => {
    form.setValue('poaId', 0);
  }, [form]);

  return (
    <div className="space-y-4">
      {/* --- Bloque 1: Configuración Global (POA + Proyecto) --- */}
      <div className="rounded-lg border p-4">
        <p className="text-muted-foreground mb-3 text-[10px] font-black tracking-widest uppercase">
          Configuración Global de Presupuesto
        </p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Código POA — combobox buscable */}
          <Field>
            <FieldLabel>Código POA</FieldLabel>
            <Popover open={isPoaOpen} onOpenChange={setIsPoaOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  role="combobox"
                  aria-expanded={isPoaOpen}
                  className="w-full justify-between font-normal"
                  disabled={isLoadingStructure}
                >
                  {selectedPoaCode || 'Seleccionar POA...'}
                  <div className="flex items-center gap-1">
                    {selectedPoaCode && (
                      <X
                        className="h-4 w-4 opacity-50 hover:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleClearPoa();
                        }}
                      />
                    )}
                    {isLoadingStructure ? (
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
                      {poaCodes.map((p) => (
                        <CommandItem
                          key={p.codigo}
                          value={p.codigo}
                          onSelect={(val) => void handlePoaCodeSelect(val)}
                        >
                          <Check
                            className={cn(
                              'mr-2 h-4 w-4',
                              selectedPoaCode === p.codigo
                                ? 'opacity-100'
                                : 'opacity-0'
                            )}
                          />
                          {p.codigo}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </Field>

          {/* Proyecto — siempre visible, disabled hasta elegir POA */}
          <Field>
            <FieldLabel>Proyecto</FieldLabel>
            <Select
              disabled={!selectedPoaCode || isLoadingStructure}
              value={localProyectoId ? String(localProyectoId) : ''}
              onValueChange={(v) => {
                const proyectoId = Number(v);
                setLocalProyectoId(proyectoId);
                setLocalGrupoId(0);
                setLocalPartidaId(0);
                form.setValue('poaId', 0);
                const proyecto = availableProjects.find(
                  (p) => p.id === proyectoId
                );
                form.setValue('proyecto', proyecto?.nombre ?? '');
              }}
            >
              <SelectTrigger>
                {isLoadingStructure ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Cargando...</span>
                  </div>
                ) : (
                  <SelectValue placeholder="Seleccionar..." />
                )}
              </SelectTrigger>
              <SelectContent>
                {availableProjects.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
      </div>

      {/* --- Bloque 2: Partida (Grupo + Partida + PoaCards) --- */}
      <div className="space-y-3">
        {/* Grupo + Partida — aparecen tras elegir Proyecto */}
        {localProyectoId > 0 && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field>
              <FieldLabel>Grupo</FieldLabel>
              <Select
                disabled={!localProyectoId}
                value={localGrupoId ? String(localGrupoId) : ''}
                onValueChange={(v) => {
                  setLocalGrupoId(Number(v));
                  setLocalPartidaId(0);
                  form.setValue('poaId', 0);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent>
                  {availableGrupos.map((g) => (
                    <SelectItem key={g.id} value={String(g.id)}>
                      {g.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel>Partida</FieldLabel>
              <Select
                disabled={!localGrupoId}
                value={localPartidaId ? String(localPartidaId) : ''}
                onValueChange={(v) => {
                  setLocalPartidaId(Number(v));
                  form.setValue('poaId', 0);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent>
                  {availablePartidas.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
        )}

        {/* PoaCard bloqueada (ítem ya seleccionado) */}
        {watchedPoaId > 0 && selectedPoaItem ? (
          <div className="ring-primary/30 bg-primary/5 rounded-xl ring-2">
            <div className="flex items-center justify-between rounded-t-xl border-b px-4 py-2">
              <div className="text-primary flex items-center gap-2">
                <Check className="h-3.5 w-3.5" />
                <span className="text-sm font-medium">Ítem Seleccionado</span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClearPoaItem}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="mr-1 h-3.5 w-3.5" />
                Cambiar selección
              </Button>
            </div>
            <div className="p-4">
              <PoaCard
                item={selectedPoaItem}
                isSelected
                isDisabled
                codigoActividad={
                  selectedPoaItem.codigoPresupuestario?.codigoCompleto
                }
                onSelect={() => {}}
              />
            </div>
          </div>
        ) : localPartidaId > 0 ? (
          // Ítems disponibles para seleccionar
          availableItems.length > 0 ? (
            <div className="space-y-2">
              <p className="text-muted-foreground text-[10px] font-black tracking-widest uppercase">
                Seleccionar Ítem / Actividad de Presupuesto
              </p>
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
                {availableItems.map((item) => (
                  <PoaCard
                    key={item.id}
                    item={item}
                    isSelected={watchedPoaId === item.id}
                    codigoActividad={item.codigoPresupuestario?.codigoCompleto}
                    onSelect={(selected) =>
                      form.setValue('poaId', selected.id, {
                        shouldValidate: true,
                      })
                    }
                  />
                ))}
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground py-2 text-sm italic">
              No hay ítems disponibles para esta partida.
            </p>
          )
        ) : (
          // Estado vacío con mensaje contextual
          <div className="text-muted-foreground flex h-24 flex-col items-center justify-center rounded-lg border-2 border-dashed">
            <Wallet className="mb-2 h-6 w-6 opacity-40" />
            <p className="text-sm italic">
              {!selectedPoaCode
                ? 'Selecciona un Código POA para comenzar.'
                : !localProyectoId
                  ? 'Selecciona un Proyecto para continuar.'
                  : !localGrupoId
                    ? 'Selecciona el Grupo para continuar.'
                    : 'Selecciona la Partida para ver los ítems.'}
            </p>
          </div>
        )}
      </div>

      {/* Error de validación de poaId */}
      {form.formState.errors.poaId && (
        <p className="text-destructive text-sm">
          {form.formState.errors.poaId.message}
        </p>
      )}
    </div>
  );
}
