'use client';

import { useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Control,
  useFieldArray,
  UseFormWatch,
  useFormContext,
  useWatch,
} from 'react-hook-form';
import { FormControl, FormField, FormItem } from '@/components/ui/form';
import { FormData } from '@/components/solicitudes/solicitud-schema';

interface SolicitudItemsProps {
  control: Control<FormData>;
  watch: UseFormWatch<FormData>;
  budgetLines: BudgetLine[];
  financingSources: FinancingSource[];
  isLoading?: boolean;
  totalAmount?: number;
}

function formatMoney(n: number) {
  return new Intl.NumberFormat('es-BO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    style: 'currency',
    currency: 'BOB',
  }).format(isFinite(n) ? n : 0);
}

export default function SolicitudItems({
  control,
  watch,
  budgetLines,
  financingSources,
  isLoading = false,
  totalAmount,
}: SolicitudItemsProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const { setValue } = useFormContext();

  const watchedItems = useWatch({
    control,
    name: 'items',
  });

  // Calculates total (cantidad * costoUnitario)
  useEffect(() => {
    if (!watchItems) return;
    (watchItems as FormData['items']).forEach((item, index) => {
      const q = Number(item.cantidad) || 0;
      const u = Number(item.costoUnitario) || 0;
      const newTotal = q * u; // Base Total

      const currentAmount = Number(item.liquidoPagable) || 0;

      if (Math.abs(newTotal - currentAmount) > 0.001) {
        setValue(`items.${index}.liquidoPagable`, newTotal);
        setValue(`items.${index}.montoNeto`, newTotal);
      }
    });
  }, [watchedItems, setValue]);

  const totalLiquido = useMemo(() => {
    return (watchItems || []).reduce(
      (acc: number, item) => acc + (Number(item.liquidoPagable) || 0),
      0
    );

  return (
    <div className="space-y-3 overflow-x-auto pb-4">
      <div className="min-w-[1000px]">
        {/* Headers */}
        <div className="text-muted-foreground mb-2 grid grid-cols-[1.5fr_1.5fr_1fr_1fr_0.5fr_0.7fr_0.7fr_0.5fr_0.5fr_0.5fr_0.8fr_0.3fr] gap-2 px-2 text-xs font-medium">
          <div>Detalle</div>
          <div>Partida</div>
          <div>Docum</div>
          <div>Tipo</div>
          <div>Cant</div>
          <div>Costo U.</div>
          <div>Total Bs</div>
          <div>IVA 13%</div>
          <div>IUE 5%</div>
          <div>IT 3%</div>
          <div>Líquido</div>
          <div></div>
        </div>
        {fields.map((field, idx) => {
          const currentItem = watchItems?.[idx] || {};
          const q = Number(currentItem.cantidad) || 0;
          const u = Number(currentItem.costoUnitario) || 0;
          const total = q * u;

          return (
            <div
              key={field.id}
              className="bg-muted/5 grid grid-cols-[1.5fr_1.5fr_1fr_1fr_0.5fr_0.7fr_0.7fr_0.5fr_0.5fr_0.5fr_0.8fr_0.3fr] items-start gap-2 rounded-md border p-2 text-sm"
            >
              {/* Detalle */}
              <div>
                <FormField
                  control={control}
                  name={`items.${idx}.detalle`}
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value ?? ''}
                          placeholder="Descripción..."
                          className="h-8 text-xs"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              {/* Partida / Fuente (solicitudPresupuestoId) */}
              <div>
                <FormField
                  control={control}
                  name={`items.${idx}.solicitudPresupuestoId`}
                  render={({ field }) => (
                    <FormItem>
                      <Select
                        onValueChange={(val) => field.onChange(Number(val))}
                        value={field.value?.toString() || ''}
                      >
                        <FormControl>
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Presupuesto" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {financingSources.map((fs) => (
                            <SelectItem
                              key={fs.id}
                              value={String(fs.id)}
                              className="text-xs"
                            >
                              {fs.code} - {fs.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </div>

              {/* Tipo Documento */}
              <div>
                <FormField
                  control={control}
                  name={`items.${idx}.tipoDocumento`}
                  render={({ field }) => (
                    <FormItem>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || 'FACTURA'}
                      >
                        <FormControl>
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Doc." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="FACTURA">Factura</SelectItem>
                          <SelectItem value="RECIBO">Recibo</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </div>

              {/* Tipo Gasto */}
              <div>
                <FormField
                  control={control}
                  name={`items.${idx}.tipoGastoId`}
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="ID Tipo"
                          className="h-8 text-xs"
                          {...field}
                          onChange={(e) =>
                            field.onChange(Number(e.target.value))
                          }
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              {/* Cantidad */}
              <div>
                <FormField
                  control={control}
                  name={`items.${idx}.cantidad`}
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <Label className="text-muted-foreground text-[10px] font-bold uppercase">
                        Descripción / Detalle del Gasto
                      </Label>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          className="h-8 text-xs"
                          {...field}
                          value={field.value ?? ''}
                          placeholder="Especificar el concepto del gasto..."
                          className="h-9 text-xs"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Costo Unitario */}
              <div>
                <FormField
                  control={control}
                  name={`items.${idx}.costoUnitario`}
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <Label className="text-muted-foreground text-[10px] font-bold uppercase">
                        Costo Unit. (Bs)
                      </Label>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          className="h-9 text-right text-xs font-bold"
                          {...field}
                          onChange={(e) => {
                            const val = e.target.value;
                            field.onChange(val === '' ? '' : Number(val));
                          }}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>

              {/* Total Bs */}
              <div>
                <Input
                  readOnly
                  className="bg-muted h-8 font-mono text-xs"
                  value={total.toFixed(2)}
                />
                <input
                  type="hidden"
                  {...control.register(`items.${idx}.montoNeto`)}
                />
              </div>

              <div className="bg-muted-foreground/20 hidden h-8 w-[1px] sm:block" />

              {/* Liquido */}
              <div>
                <Input
                  readOnly
                  className="h-8 font-mono text-xs font-bold"
                  value={total.toFixed(2)}
                />
                <input
                  type="hidden"
                  {...control.register(`items.${idx}.liquidoPagable`)}
                />
              </div>

              <input
                type="hidden"
                {...control.register(`items.${idx}.amount`)}
              />

              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:bg-destructive/10 ml-auto h-8 gap-2 px-3"
                type="button"
                onClick={() => remove(idx)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="size-3.5"
                >
                  <path d="M3 6h18" />
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                </svg>
                <span className="text-[10px] font-bold uppercase">
                  Eliminar
                </span>
              </Button>
            </div>
          </div>
        );
      })}

      <div className="flex flex-col gap-4 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
        <Button
          variant="outline"
          size="sm"
          type="button"
          onClick={() =>
            append({
              solicitudPresupuestoId: 0,
              tipoDocumento: 'FACTURA',
              tipoGastoId: 0,
              cantidad: 1,
              costoUnitario: 0,
              montoNeto: 0,
              detalle: '',
              liquidoPagable: 0,
            })
          }
          className="h-10 border-dashed px-6"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mr-2 size-4"
          >
            <path d="M5 12h14" />
            <path d="M12 5v14" />
          </svg>
          Nuevo Ítem de Gasto
        </Button>

        <div className="bg-muted/40 border-primary/10 flex items-center gap-3 rounded-xl border p-2 px-4">
          <span className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">
            Monto Total Solicitado (Bs)
          </span>
          <div className="text-primary font-mono text-xl font-black">
            {formatMoney(displayTotal)}
          </div>
        </div>
      </div>
    </div>
  );
}
