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

interface SolicitudGastosProps {
  control: Control<FormData>;
}

export default function SolicitudGastos({ control }: SolicitudGastosProps) {
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
}

function GastoCard({ index, control, remove }: GastoCardProps) {
  const { setValue } = useFormContext<FormData>();

  const quantity = useWatch({
    control,
    name: `items.${index}.quantity`,
  }) as number;

  const unitCost = useWatch({
    control,
    name: `items.${index}.unitCost`,
  }) as number;

  const total = useMemo(() => {
    const q = Number(quantity) || 0;
    const u = Number(unitCost) || 0;
    return q * u;
  }, [quantity, unitCost]);

  useEffect(() => {
    setValue(`items.${index}.amount`, total);
  }, [total, setValue, index]);

  // Impuestos informativos
  const iva = total * 0.13;
  const it = total * 0.03;
  const iue = total * 0.05;

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
                  onValueChange={field.onChange}
                  value={field.value ?? ''}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Seleccionar Grupo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {/* Opciones se cargarán de catálogos en el futuro */}
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
                  onValueChange={field.onChange}
                  value={field.value ?? ''}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Seleccionar Partida" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {/* Opciones se cargarán de catálogos */}
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
                  <SelectContent>
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
                  onValueChange={field.onChange}
                  value={field.value ?? ''}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Seleccionar Tipo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {/* Opciones se cargarán de catálogos */}
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
                  Costo Unitario (Bs)
                </Label>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    className="w-full"
                    value={field.value ?? 0}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="space-y-2">
            <Label className="text-muted-foreground text-xs font-bold uppercase">
              Total (Bs)
            </Label>
            <Input
              value={formatMoney(total)}
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
              Total Líquido
            </span>
            <span className="text-primary text-sm font-bold">
              {formatMoney(total)}
            </span>
          </div>
          <div className="bg-border hidden h-8 w-[1px] sm:block" />
          <div className="flex gap-4">
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
