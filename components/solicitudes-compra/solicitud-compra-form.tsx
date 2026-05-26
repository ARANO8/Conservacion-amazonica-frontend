'use client';

import { useMemo, useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import axios from 'axios';
import { toast } from 'sonner';
import {
  Plus,
  Trash2,
  ShoppingCart,
  ArrowLeft,
  Loader2,
  ChevronDown,
  X,
  Check,
  Wallet,
  SendHorizonal,
} from 'lucide-react';

import {
  Field,
  FieldLabel,
  FieldGroup,
  FieldSet,
  FieldLegend,
} from '@/components/ui/field';
import {
  Form,
  FormControl,
  FormField,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { PoaCard } from '@/components/solicitudes/poa-card';
import { solicitudesService } from '@/lib/services/solicitudes-service';
import { catalogosService } from '@/services/catalogos.service';
import { useAuthStore } from '@/store/auth-store';
import api from '@/lib/api';
import type { PoaStructureItem } from '@/types/backend';
import type { PoaLookup } from '@/types/catalogs';
import {
  solicitudCompraSchema,
  type SolicitudCompraFormData,
} from './solicitud-compra-schema';
import CompraReviewModal from './compra-review-modal';

// Deduplica por id — igual al helper de SolicitudEconomica
function uniqueById<T extends { id: number }>(items: (T | undefined)[]): T[] {
  const filtered = items.filter((i): i is T => !!i);
  return [...new Map(filtered.map((item) => [item.id, item])).values()];
}

interface UsuarioOption {
  id: number;
  nombreCompleto: string;
  rol: string;
  cargo?: string;
}

const emptyItem = {
  descripcion: '',
  cantidad: 1,
  uso: '',
  costoUnitario: 0,
};

interface Props {
  solicitudId?: number;
  initialValues?: Partial<SolicitudCompraFormData>;
  initialPoaCode?: string;
}

export default function SolicitudCompraForm({
  solicitudId,
  initialValues,
  initialPoaCode,
}: Props) {
  const router = useRouter();
  const { user } = useAuthStore();
  const isEdit = typeof solicitudId === 'number';

  // ---- Options loading ----
  const [usuarioOptions, setUsuarioOptions] = useState<UsuarioOption[]>([]);
  const [poaCodes, setPoaCodes] = useState<PoaLookup[]>([]);
  const [loadingOpts, setLoadingOpts] = useState(true);

  // ---- Review modal ----
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // ---- POA cascade state ----
  const [selectedPoaCode, setSelectedPoaCode] = useState('');
  const [isPoaOpen, setIsPoaOpen] = useState(false);
  const [poaStructure, setPoaStructure] = useState<PoaStructureItem[]>([]);
  const [isLoadingStructure, setIsLoadingStructure] = useState(false);
  const [localProyectoId, setLocalProyectoId] = useState(0);
  const [localGrupoId, setLocalGrupoId] = useState(0);
  const [localPartidaId, setLocalPartidaId] = useState(0);

  const hasHydrated = useRef(false);

  const form = useForm<SolicitudCompraFormData>({
    resolver: zodResolver(solicitudCompraSchema),
    defaultValues: {
      aprobadorId: initialValues?.aprobadorId ?? 0,
      poaId: initialValues?.poaId ?? 0,
      motivoSolicitud: initialValues?.motivoSolicitud ?? '',
      proyecto: initialValues?.proyecto ?? '',
      chequeANombreDe:
        initialValues?.chequeANombreDe ?? user?.nombreCompleto ?? '',
      descripcion: initialValues?.descripcion ?? '',
      items:
        initialValues?.items && initialValues.items.length > 0
          ? initialValues.items
          : [{ ...emptyItem }],
    },
    mode: 'onBlur',
  });

  // Reset cuando llegan initialValues (modo edición)
  useEffect(() => {
    if (initialValues) {
      form.reset({
        aprobadorId: initialValues.aprobadorId ?? 0,
        poaId: initialValues.poaId ?? 0,
        motivoSolicitud: initialValues.motivoSolicitud ?? '',
        proyecto: initialValues.proyecto ?? '',
        chequeANombreDe:
          initialValues.chequeANombreDe ?? user?.nombreCompleto ?? '',
        descripcion: initialValues.descripcion ?? '',
        items:
          initialValues.items && initialValues.items.length > 0
            ? initialValues.items
            : [{ ...emptyItem }],
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  const watchedItems = useWatch({ control: form.control, name: 'items' });
  const watchedPoaId = useWatch({ control: form.control, name: 'poaId' });

  const total = useMemo(
    () =>
      (watchedItems ?? []).reduce((acc, item) => {
        return (
          acc +
          (Number(item?.cantidad) || 0) * (Number(item?.costoUnitario) || 0)
        );
      }, 0),
    [watchedItems]
  );

  // ---- Carga inicial de opciones ----
  useEffect(() => {
    const load = async () => {
      try {
        setLoadingOpts(true);
        const [usuariosRes, codes] = await Promise.all([
          api.get<UsuarioOption[]>('/usuarios/lookup/activos'),
          catalogosService.getPoaLookup(),
        ]);
        setUsuarioOptions(usuariosRes.data.filter((u) => u.id !== user?.id));
        setPoaCodes(codes);
      } catch {
        toast.error('No se pudieron cargar las opciones del formulario.');
      } finally {
        setLoadingOpts(false);
      }
    };
    void load();
  }, [user?.id]);

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

  const selectedPoaItem = useMemo(
    () => poaStructure.find((i) => i.id === watchedPoaId),
    [poaStructure, watchedPoaId]
  );

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

  // ---- Abrir modal (valida campos del form body antes de abrir) ----
  const handleOpenReview = async () => {
    const isValid = await form.trigger(['poaId', 'motivoSolicitud', 'items']);
    if (isValid) {
      setIsReviewOpen(true);
    }
  };

  // ---- Payload y submit ----
  const buildPayload = (data: SolicitudCompraFormData) => ({
    tipo: 'COMPRA_SERVICIO' as const,
    poaIds: [data.poaId],
    aprobadorId: data.aprobadorId,
    motivoViaje: data.motivoSolicitud,
    proyecto: data.proyecto || undefined,
    chequeANombreDe: data.chequeANombreDe,
    descripcion: data.descripcion || undefined,
    gastosCompra: data.items.map((item) => ({
      descripcion: item.descripcion,
      cantidad: Number(item.cantidad),
      uso: item.uso || undefined,
      costoUnitario: Number(item.costoUnitario),
      poaId: data.poaId,
    })),
    planificaciones: [],
    viaticos: [],
    gastos: [],
    nominasTerceros: [],
    hospedajes: [],
  });

  const onSubmit = async (data: SolicitudCompraFormData) => {
    try {
      setSubmitting(true);
      if (isEdit && solicitudId !== undefined) {
        await solicitudesService.updateSolicitud(
          solicitudId,
          buildPayload(data)
        );
        toast.success('Solicitud actualizada correctamente.');
      } else {
        await solicitudesService.createSolicitudCompra(buildPayload(data));
        toast.success('Solicitud de fondos registrada correctamente.');
      }
      setIsReviewOpen(false);
      router.push('/app/solicitudes-compra');
      router.refresh();
    } catch (error: unknown) {
      const mensaje =
        axios.isAxiosError(error) && error.response?.data?.message
          ? String(error.response.data.message)
          : 'No se pudo guardar la solicitud. Intente nuevamente.';
      toast.error(mensaje);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-background flex h-[calc(100vh-4rem)] w-full flex-col overflow-hidden">
      {/* Sticky Header */}
      <div className="shrink-0 border-b p-4 px-6">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Volver</span>
          </Button>
          <div className="flex items-center gap-2">
            <ShoppingCart className="text-primary h-5 w-5 shrink-0" />
            <div>
              <h1 className="text-lg leading-tight font-bold">
                {isEdit
                  ? 'Editar Solicitud de Fondos'
                  : 'Nueva Solicitud de Fondos'}
              </h1>
              <p className="text-muted-foreground text-xs">
                Compras y Servicios — ANEXO 3
              </p>
            </div>
          </div>
        </div>
      </div>

      <Form {...form}>
        <div className="relative flex flex-1 flex-col overflow-hidden">
          {/* Área scrollable */}
          <div className="flex-1 overflow-y-auto p-6">
            <form
              id="solicitud-compra-form"
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-6"
            >
              <div className="animate-in fade-in duration-500">
                <FieldGroup>
                  {/* ---- Sección 1: Información General ---- */}
                  <FieldSet>
                    <FieldLegend>
                      Información General de la Solicitud
                    </FieldLegend>
                    <FormField
                      control={form.control}
                      name="motivoSolicitud"
                      render={({ field }) => (
                        <Field>
                          <FieldLabel>
                            MOTIVO DE SOLICITUD:{' '}
                            <span className="text-destructive">*</span>
                          </FieldLabel>
                          <FormControl>
                            <Input
                              placeholder="Ej. TALLER POA 2026"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </Field>
                      )}
                    />
                  </FieldSet>

                  <Separator />

                  {/* ---- Sección 2: Partida Presupuestaria ---- */}
                  <FieldSet>
                    <FieldLegend>Partida Presupuestaria</FieldLegend>

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
                            <Popover
                              open={isPoaOpen}
                              onOpenChange={setIsPoaOpen}
                            >
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
                                    <CommandEmpty>
                                      No se encontraron resultados
                                    </CommandEmpty>
                                    <CommandGroup>
                                      {poaCodes.map((p) => (
                                        <CommandItem
                                          key={p.codigo}
                                          value={p.codigo}
                                          onSelect={(val) =>
                                            void handlePoaCodeSelect(val)
                                          }
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
                              value={
                                localProyectoId ? String(localProyectoId) : ''
                              }
                              onValueChange={(v) => {
                                const proyectoId = Number(v);
                                setLocalProyectoId(proyectoId);
                                setLocalGrupoId(0);
                                setLocalPartidaId(0);
                                form.setValue('poaId', 0);
                                const proyecto = availableProjects.find(
                                  (p) => p.id === proyectoId
                                );
                                form.setValue(
                                  'proyecto',
                                  proyecto?.nombre ?? ''
                                );
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
                                value={
                                  localPartidaId ? String(localPartidaId) : ''
                                }
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
                                <span className="text-sm font-medium">
                                  Ítem Seleccionado
                                </span>
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
                                  selectedPoaItem.codigoPresupuestario
                                    ?.codigoCompleto
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
                                    codigoActividad={
                                      item.codigoPresupuestario?.codigoCompleto
                                    }
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
                  </FieldSet>

                  <Separator />

                  {/* ---- Sección 3: Descripción del Gasto ---- */}
                  <FieldSet>
                    <div className="mb-3 flex items-center justify-between">
                      <FieldLegend className="mb-0">
                        Descripción del Gasto
                      </FieldLegend>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => append({ ...emptyItem })}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Agregar ítem
                      </Button>
                    </div>

                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[90px]">Cantidad</TableHead>
                            <TableHead>Descripción</TableHead>
                            <TableHead className="w-[120px]">Uso</TableHead>
                            <TableHead className="w-[130px]">
                              P/Unit. (Bs)
                            </TableHead>
                            <TableHead className="w-[130px] text-right">
                              Total (Bs)
                            </TableHead>
                            <TableHead className="w-[50px]" />
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {fields.map((fieldRow, index) => {
                            const cantidad =
                              Number(watchedItems?.[index]?.cantidad) || 0;
                            const precio =
                              Number(watchedItems?.[index]?.costoUnitario) || 0;
                            const subtotal = cantidad * precio;

                            return (
                              <TableRow key={fieldRow.id}>
                                <TableCell>
                                  <FormField
                                    control={form.control}
                                    name={`items.${index}.cantidad`}
                                    render={({ field }) => (
                                      <Field>
                                        <FormControl>
                                          <Input
                                            type="number"
                                            min={0}
                                            step="0.01"
                                            {...field}
                                          />
                                        </FormControl>
                                        <FormMessage />
                                      </Field>
                                    )}
                                  />
                                </TableCell>
                                <TableCell>
                                  <FormField
                                    control={form.control}
                                    name={`items.${index}.descripcion`}
                                    render={({ field }) => (
                                      <Field>
                                        <FormControl>
                                          <Input
                                            placeholder="Descripción del gasto"
                                            {...field}
                                          />
                                        </FormControl>
                                        <FormMessage />
                                      </Field>
                                    )}
                                  />
                                </TableCell>
                                <TableCell>
                                  <FormField
                                    control={form.control}
                                    name={`items.${index}.uso`}
                                    render={({ field }) => (
                                      <Field>
                                        <FormControl>
                                          <Select
                                            value={field.value ?? ''}
                                            onValueChange={field.onChange}
                                          >
                                            <SelectTrigger className="min-w-[110px]">
                                              <SelectValue placeholder="—" />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="Oficina">
                                                Oficina
                                              </SelectItem>
                                              <SelectItem value="Campo">
                                                Campo
                                              </SelectItem>
                                            </SelectContent>
                                          </Select>
                                        </FormControl>
                                        <FormMessage />
                                      </Field>
                                    )}
                                  />
                                </TableCell>
                                <TableCell>
                                  <FormField
                                    control={form.control}
                                    name={`items.${index}.costoUnitario`}
                                    render={({ field }) => (
                                      <Field>
                                        <FormControl>
                                          <Input
                                            type="number"
                                            min={0}
                                            step="0.01"
                                            {...field}
                                          />
                                        </FormControl>
                                        <FormMessage />
                                      </Field>
                                    )}
                                  />
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                  {formatMoney(subtotal)}
                                </TableCell>
                                <TableCell>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    disabled={fields.length === 1}
                                    onClick={() => remove(index)}
                                    aria-label="Eliminar ítem"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>

                    <p className="text-muted-foreground text-xs italic">
                      * Se deben presentar facturas o recibos por estos gastos
                    </p>
                  </FieldSet>

                  <Separator />

                  {/* ---- Sección 4: Observaciones ---- */}
                  <FieldSet>
                    <FieldLegend>Observaciones</FieldLegend>
                    <FormField
                      control={form.control}
                      name="descripcion"
                      render={({ field }) => (
                        <Field>
                          <FormControl>
                            <Textarea
                              rows={3}
                              placeholder="Observaciones adicionales..."
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </Field>
                      )}
                    />
                  </FieldSet>
                </FieldGroup>
              </div>
            </form>
          </div>

          {/* Sticky Footer */}
          <div className="bg-background z-50 shrink-0 border-t p-4 px-6 md:pb-6">
            <div className="flex w-full items-center justify-between">
              <div />
              <div className="flex items-center gap-6">
                <div className="flex flex-col text-right">
                  <span className="text-primary text-[10px] font-black tracking-tight uppercase">
                    Total Solicitado
                  </span>
                  <span className="text-primary text-xl font-black">
                    {formatMoney(total)}
                  </span>
                </div>

                <div className="bg-border h-8 w-[1px]" />

                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={() => router.push('/app/solicitudes-compra')}
                >
                  Cancelar
                </Button>

                <Button
                  type="button"
                  size="lg"
                  className="min-w-[160px] shadow-lg transition-all"
                  onClick={() => void handleOpenReview()}
                  disabled={loadingOpts}
                >
                  {loadingOpts ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Cargando...
                    </>
                  ) : (
                    <>
                      Revisar y Enviar
                      <SendHorizonal className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>

        <CompraReviewModal
          isOpen={isReviewOpen}
          onOpenChange={setIsReviewOpen}
          onConfirm={form.handleSubmit(onSubmit)}
          loading={submitting}
          usuarioOptions={usuarioOptions}
          selectedPoaCode={selectedPoaCode}
          selectedPoaItem={selectedPoaItem}
        />
      </Form>
    </div>
  );
}
