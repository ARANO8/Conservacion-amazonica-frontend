'use client';

import { useMemo, useEffect } from 'react';
import { Control, useFormContext, useWatch } from 'react-hook-form';
import { FormField, FormControl } from '@/components/ui/form';
import { Field, FieldLabel } from '@/components/ui/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Check, Trash2 } from 'lucide-react';
import { formatMoney, cn } from '@/lib/utils';
import { PoaCard } from './poa-card';
import {
  PoaStructureItem,
  SeleccionPresupuesto,
  Actividad,
  EntityBase,
} from '@/types/backend';
import { FormData } from '@/components/solicitudes/solicitud-schema';

// Helper para deduplicar arrays de objetos por ID
function uniqueItems<T extends EntityBase>(items: (T | undefined)[]): T[] {
  const filtered = items.filter((i): i is T => !!i);
  return [...new Map(filtered.map((item) => [item.id, item])).values()];
}

interface FuenteCardProps {
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
  isEditMode?: boolean;
}

export function FuenteCard({
  index,
  control,
  remove,
  poaStructure,
  proyectoId,
  codigoPoa,
  misSelecciones,
  setMisSelecciones,
  isEditMode = false,
}: FuenteCardProps) {
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
  const hospedajesRaw = useWatch({ control, name: 'hospedajes' });

  const viaticos = useMemo(() => viaticosRaw || [], [viaticosRaw]);
  const gastos = useMemo(() => gastosRaw || [], [gastosRaw]);
  const hospedajes = useMemo(() => hospedajesRaw || [], [hospedajesRaw]);

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

    const sumaHospedajesNeto = hospedajes
      .filter((h) => Number(h.poaId) === poaId)
      .reduce((acc: number, h) => acc + (Number(h.costoTotal) || 0), 0);

    const sumaHospedajesBruto = hospedajes
      .filter((h) => Number(h.poaId) === poaId)
      .reduce(
        (acc: number, h) =>
          acc +
          (Number(h.costoTotal) || 0) +
          (Number(h.iva) || 0) +
          (Number(h.it) || 0),
        0
      );

    return {
      neto: sumaViaticosNeto + sumaGastosNeto + sumaHospedajesNeto,
      bruto: sumaViaticosBruto + sumaGastosBruto + sumaHospedajesBruto,
    };
  }, [viaticos, gastos, hospedajes, poaId]);

  // E. Integración con Catálogo (Fresh Data)
  // Buscamos el ítem fresco en la estructura cargada del catálogo para obtener el saldo real
  const freshCatalogItem = useMemo(() => {
    return poaStructure.find((item) => item.id === poaId);
  }, [poaStructure, poaId]);

  // El Límite (la bolsa de dinero disponible para esta partida) se calcula:
  // Saldo fresco del catálogo (lo que queda en DB) + Lo que esta solicitud ya tiene reservado.
  const limit = useMemo(() => {
    if (!freshCatalogItem)
      return watchedSaldoBackend || Number(montoReservado || 0);

    const catalogAvailable = Number(
      freshCatalogItem.saldoDisponible ?? freshCatalogItem.costoTotal
    );
    // IMPORTANTE: Si estamos en edición, el monto ya está descontado del saldo disponible reportado por el catálogo
    // por lo que sumamos nuestro 'montoReservado' para "restaurar" virtualmente nuestra parte.
    return catalogAvailable + Number(montoReservado || 0);
  }, [freshCatalogItem, watchedSaldoBackend, montoReservado]);

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
    setValue(
      `fuentesSeleccionadas.${index}.montoReservado`,
      isEditMode ? monto : 0
    );
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
      montoPresupuestado: isEditMode ? monto : 0,
      saldoDisponible: saldo,
    };

    const nuevas = [...misSelecciones, nuevaSeleccion];
    setMisSelecciones(nuevas);
    setValue(
      'presupuestosIds',
      nuevas.map((n) => n.poaId)
    );

    toast.success(`Partida seleccionada: ${formatMoney(monto)}`);
  }, [
    availableItems,
    codigoPoa,
    index,
    isEditMode,
    isLocked,
    misSelecciones,
    selectedItemId,
    setMisSelecciones,
    setValue,
  ]);

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
            <span className="text-sm font-medium">Partida Seleccionada</span>
          </div>
          <Badge variant="secondary" className="font-mono text-sm">
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
                <FieldLabel className="text-sm font-bold tracking-wider uppercase">
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
                <FieldLabel className="text-sm font-bold tracking-wider uppercase">
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
            <FieldLabel className="text-sm font-bold tracking-wider uppercase">
              Seleccionar Ítem / Actividad de Presupuesto
            </FieldLabel>

            {isLocked ? (
              // Vista cuando ya está seleccionado
              <div className="grid grid-cols-1">
                {(() => {
                  // Priorizar el objeto POA que viene guardado en el formulario
                  const poaFromForm = watch(
                    `fuentesSeleccionadas.${index}.poa`
                  );
                  // freshCatalogItem viene del useMemo arriba, usando poaStructure
                  const itemRaw = freshCatalogItem || poaFromForm;

                  if (!itemRaw) return null;

                  // PASO CRITICO: Inyectamos el 'limit' (que ya tiene el saldo restaurado con datos frescos)
                  // dentro del objeto que pasamos a PoaCard para que la tarjeta muestre el saldo correcto.
                  const itemWithVirtualBalance = {
                    ...itemRaw,
                    saldoDisponible: limit,
                    // Recalculamos si tiene compromisos de TERCEROS
                    tieneCompromisos: limit < Number(itemRaw.costoTotal) - 0.05,
                  };

                  return (
                    <PoaCard
                      key={itemWithVirtualBalance.id}
                      item={itemWithVirtualBalance as PoaStructureItem}
                      isSelected={true}
                      codigoActividad={
                        itemWithVirtualBalance.codigoPresupuestario
                          ?.codigoCompleto
                      }
                      onSelect={() => {}}
                      isDisabled={true}
                    />
                  );
                })()}
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
                  <div className="text-foreground col-span-full py-4 text-center text-sm italic">
                    {selectedPartidaId
                      ? 'No hay items disponibles para esta partida.'
                      : 'Seleccione Grupo y Partida para ver los items disponibles.'}
                  </div>
                )}
              </div>
            )}

            <input
              type="hidden"
              {...control.register(`fuentesSeleccionadas.${index}.codigoPresupuestarioId`)}
              value={selectedItemId?.toString() || ''}
            />
          </div>
        </div>
      </div>

      {/* Smart Footer */}
      <div className="bg-muted/40 flex flex-wrap items-center justify-between gap-4 rounded-b-xl border-t px-4 py-3">
        <div className="flex flex-wrap items-center gap-6">
          {/* 1. Límite POA */}
          <div className="flex flex-col">
            <span className="text-foreground text-sm font-bold tracking-tight uppercase">
              Límite POA
            </span>
            <span className="text-foreground text-sm font-medium">
              {isLocked ? formatMoney(Number(limit) || 0) : '---'}
            </span>
          </div>

          <div className="bg-border hidden h-8 w-[1px] sm:block" />

          {/* 2. Solicitado (Neto) */}
          <div className="flex flex-col">
            <span className="text-foreground text-sm font-bold tracking-tight uppercase">
              Subtotal Liquido
            </span>
            <span className="text-foreground text-sm font-medium">
              {isLocked ? formatMoney(resumenFinanciero.neto) : '---'}
            </span>
          </div>

          <div className="bg-border hidden h-8 w-[1px] sm:block" />

          {/* 3. Solicitado (Bruto) */}
          <div className="flex flex-col">
            <span className="text-foreground text-sm font-bold tracking-tight uppercase">
              Subtotal Presupuestado (Incl. Impuestos)
            </span>
            <span className="text-foreground text-base font-bold">
              {isLocked ? formatMoney(resumenFinanciero.bruto) : '---'}
            </span>
          </div>

          <div className="bg-border hidden h-8 w-[1px] sm:block" />

          {/* 4. Saldo Disponible */}
          <div className="flex flex-col">
            <span className="text-foreground text-sm font-bold tracking-tight uppercase">
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
