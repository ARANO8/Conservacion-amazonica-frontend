'use client';

import { useMemo, useEffect, useState } from 'react';
import {
  Control,
  useFieldArray,
  useWatch,
  useFormContext,
} from 'react-hook-form';
import { catalogosService } from '@/services/catalogos.service';
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
import { Grupo, Partida, TipoGasto } from '@/types/catalogs';

interface SolicitudGastosProps {
  control: Control<FormData>;
  grupos: Grupo[];
  tiposGasto: TipoGasto[];
  proyectoId?: number;
}

export default function SolicitudGastos({
  control,
  grupos,
  tiposGasto,
  proyectoId,
}: SolicitudGastosProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  return (
    <div className="space-y-4">
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
          />
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() =>
          append({
            groupId: '',
            budgetLineId: '',
            document: 'Factura',
            typeId: '',
            quantity: 1,
            unitCost: 0,
            amount: 0,
            description: '',
            financingSourceId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
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
}

function GastoCard({
  index,
  control,
  remove,
  grupos,
  tiposGasto,
  isDisabled,
}: GastoCardProps) {
  const { setValue } = useFormContext<FormData>();
  const [partidas, setPartidas] = useState<Partida[]>([]);
  const [isLoadingPartidas, setIsLoadingPartidas] = useState(false);

  const quantity = useWatch({
    control,
    name: `items.${index}.quantity`,
  }) as number;

  const unitCost = useWatch({
    control,
    name: `items.${index}.unitCost`,
  }) as number;

  const liquidoPagable = useWatch({
    control,
    name: `items.${index}.liquidoPagable`,
  }) as number;

  const selectedGroupId = useWatch({
    control,
    name: `items.${index}.groupId`,
  }) as unknown as number;

  const watchDocument = useWatch({
    control,
    name: `items.${index}.document`,
  }) as string;

  const watchTypeId = useWatch({
    control,
    name: `items.${index}.typeId`,
  }) as number;

  const netoTotal = useMemo(() => {
    const q = Number(quantity) || 0;
    const u = Number(unitCost) || 0;
    return q * u;
  }, [quantity, unitCost]);

  const brutoTotal = useMemo(() => {
    const isRecibo = (watchDocument || '').toUpperCase() === 'RECIBO';
    const tipoObj = tiposGasto.find(
      (t) => Number(t.id) === Number(watchTypeId)
    );
    const tipoNombre = (tipoObj?.nombre || '').toUpperCase().trim();

    let extraRate = 0;
    if (isRecibo) {
      if (tipoNombre === 'COMPRA') {
        extraRate = 0.08;
      } else if (
        tipoNombre.includes('ALQUILER') ||
        tipoNombre.includes('SERVICIO')
      ) {
        extraRate = 0.16;
      }
    }
    return netoTotal * (1 + extraRate);
  }, [netoTotal, watchDocument, watchTypeId, tiposGasto]);

  useEffect(() => {
    // Neto -> amount, Bruto -> liquidoPagable
    setValue(`items.${index}.amount`, Number(netoTotal.toFixed(2)));
    setValue(`items.${index}.liquidoPagable`, Number(brutoTotal.toFixed(2)));
  }, [brutoTotal, netoTotal, setValue, index]);

  // Fetch partidas when group changes
  useEffect(() => {
    const fetchPartidas = async () => {
      // Reset logic handled in Select onChange, but ensure we clear options if invalid group
      if (!selectedGroupId || isNaN(Number(selectedGroupId))) {
        setPartidas([]);
        return;
      }

      try {
        setIsLoadingPartidas(true);
        const data = await catalogosService.getPartidasByGrupo(
          Number(selectedGroupId)
        );
        setPartidas(data);
      } catch (error) {
        console.error('Error fetching partidas for row:', error);
        setPartidas([]);
      } finally {
        setIsLoadingPartidas(false);
      }
    };

    fetchPartidas();
  }, [selectedGroupId]);

  // Impuestos informativos (Retenciones)
  const isRecibo = (watchDocument || '').toUpperCase() === 'RECIBO';
  const tipoObj = tiposGasto.find((t) => Number(t.id) === Number(watchTypeId));
  const tipoNombre = (tipoObj?.nombre || '').toUpperCase().trim();

  let iva = 0;
  let it = 0;
  let iue = 0;

  if (isRecibo) {
    if (tipoNombre === 'COMPRA') {
      iue = netoTotal * 0.05;
      it = netoTotal * 0.03;
    } else if (
      tipoNombre.includes('ALQUILER') ||
      tipoNombre.includes('SERVICIO')
    ) {
      iva = netoTotal * 0.13;
      it = netoTotal * 0.03;
    }
  }

  return (
    <div className="bg-card animate-in fade-in slide-in-from-top-2 overflow-hidden rounded-xl border shadow-sm duration-300">
      <div className="space-y-4 p-4">
        {/* FILA SUPERIOR (CLASIFICADORES): 4 Dropdowns */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
          <FormField
            control={control}
            name={`items.${index}.groupId`}
            render={({ field }) => (
              <FormItem>
                <Label className="text-muted-foreground text-xs font-bold uppercase">
                  Grupo
                </Label>
                <Select
                  onValueChange={(val) => {
                    field.onChange(Number(val));
                    // Resetear partida al cambiar de grupo
                    setValue(`items.${index}.budgetLineId`, '');
                    setPartidas([]); // Clear immediately while fetching
                  }}
                  value={field.value?.toString() || ''}
                  disabled={isDisabled}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Seleccionar Grupo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent
                    position="popper"
                    side="bottom"
                    align="start"
                    className="max-h-[200px] w-[var(--radix-select-trigger-width)]"
                  >
                    {grupos.length > 0 ? (
                      grupos.map((grupo) => (
                        <SelectItem key={grupo.id} value={grupo.id.toString()}>
                          {grupo.nombre}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>
                        No hay grupos con presupuesto para este proyecto
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
            name={`items.${index}.budgetLineId`}
            render={({ field }) => (
              <FormItem>
                <Label className="text-muted-foreground text-xs font-bold uppercase">
                  Partida
                </Label>
                <Select
                  onValueChange={(val) => field.onChange(Number(val))}
                  value={field.value?.toString() || ''}
                  disabled={!selectedGroupId || isLoadingPartidas}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      {isLoadingPartidas ? (
                        <span className="text-muted-foreground">
                          Cargando...
                        </span>
                      ) : (
                        <SelectValue placeholder="Seleccionar Partida" />
                      )}
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent
                    position="popper"
                    side="bottom"
                    align="start"
                    className="max-h-[200px] w-[var(--radix-select-trigger-width)]"
                  >
                    {partidas.length > 0 ? (
                      partidas.map((partida) => (
                        <SelectItem
                          key={partida.id}
                          value={partida.id.toString()}
                        >
                          {partida.codigo} - {partida.nombre}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>
                        {isLoadingPartidas
                          ? 'Cargando...'
                          : 'No hay partidas disponibles'}
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
            name={`items.${index}.document`}
            render={({ field }) => (
              <FormItem>
                <Label className="text-muted-foreground text-xs font-bold uppercase">
                  Documento
                </Label>
                <Select
                  onValueChange={field.onChange}
                  value={field.value ?? 'Factura'}
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
                    <SelectItem value="Factura">Factura</SelectItem>
                    <SelectItem value="Recibo">Recibo</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name={`items.${index}.typeId`}
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
            name={`items.${index}.quantity`}
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
            name={`items.${index}.unitCost`}
            render={({ field }) => (
              <FormItem>
                <Label className="text-muted-foreground text-xs font-bold uppercase">
                  Costo Unitario Líquido (Bs)
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
          <div className="space-y-2">
            <Label className="text-muted-foreground text-xs font-bold uppercase">
              Total Neto (Bs)
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
            <span className="text-muted-foreground text-[10px] leading-tight font-bold uppercase">
              Costo Total Presupuestado
            </span>
            <span className="text-primary text-sm font-bold">
              {formatMoney(liquidoPagable || 0)}
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
