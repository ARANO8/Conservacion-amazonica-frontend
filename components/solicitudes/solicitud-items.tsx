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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Control,
  useFieldArray,
  UseFormWatch,
  useFormContext,
  useWatch,
} from 'react-hook-form';
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { FormData } from '@/app/dashboard/solicitud/page';
import { BudgetLine, FinancingSource } from '@/types/catalogs';

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

  // Calculates total (quantity * unitCost)
  useEffect(() => {
    if (!watchedItems) return;
    (watchedItems as FormData['items']).forEach((item, index) => {
      const q = Number(item.quantity) || 0;
      const u = Number(item.unitCost) || 0;
      const newTotal = q * u; // Base Total

      const currentAmount = Number(item.amount) || 0;

      if (Math.abs(newTotal - currentAmount) > 0.001) {
        setValue(`items.${index}.amount`, newTotal);
      }
    });
  }, [watchedItems, setValue]);

  const displayTotal =
    totalAmount ??
    (watchedItems || []).reduce(
      (acc: number, item) => acc + (Number(item?.amount) || 0),
      0
    );

  return (
    <div className="space-y-4">
      {fields.map((field, idx) => {
        const currentItem = watchedItems?.[idx] || {};
        const q = Number(currentItem.quantity) || 0;
        const u = Number(currentItem.unitCost) || 0;
        const total = q * u;

        // Visual Tax Calculations
        const iva = total * 0.13;
        const it = total * 0.03;
        const iue = total * 0.05;

        return (
          <div
            key={field.id}
            className="bg-card text-card-foreground relative mb-4 overflow-hidden rounded-xl border shadow-sm transition-all hover:shadow-md"
          >
            {/* BLOQUE SUPERIOR: Clasificación (Soft background) */}
            <div className="bg-muted/30 grid grid-cols-1 gap-4 border-b p-4 sm:grid-cols-4">
              <FormField
                control={control}
                name={`items.${idx}.financingSourceId`}
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <Label className="text-muted-foreground text-[10px] font-bold uppercase">
                      Fuente Financiera
                    </Label>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isLoading}
                    >
                      <FormControl>
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue placeholder="Seleccionar fuente" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {financingSources.map((fs) => (
                          <SelectItem key={fs.id} value={String(fs.id)}>
                            {fs.code} - {fs.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name={`items.${idx}.budgetLineId`}
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <Label className="text-muted-foreground text-[10px] font-bold uppercase">
                      Partida Presupuestaria
                    </Label>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isLoading}
                    >
                      <FormControl>
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue placeholder="Seleccionar partida" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {budgetLines.map((bl) => (
                          <SelectItem key={bl.id} value={String(bl.id)}>
                            {bl.code} - {bl.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name={`items.${idx}.document`}
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <Label className="text-muted-foreground text-[10px] font-bold uppercase">
                      Tipo Documento
                    </Label>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value ?? ''}
                        placeholder="Factura, Recibo..."
                        className="h-9 text-xs"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name={`items.${idx}.type`}
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <Label className="text-muted-foreground text-[10px] font-bold uppercase">
                      Tipo Gasto
                    </Label>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value ?? ''}
                        placeholder="Servicio, Compra..."
                        className="h-9 text-xs"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {/* BLOQUE CENTRAL: Detalle Económico */}
            <div className="grid grid-cols-12 items-end gap-4 p-4">
              <div className="col-span-12 sm:col-span-1">
                <FormField
                  control={control}
                  name={`items.${idx}.quantity`}
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <Label className="text-muted-foreground text-[10px] font-bold uppercase">
                        Cant.
                      </Label>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          className="bg-muted/10 h-9 text-center text-xs font-bold"
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

              <div className="col-span-12 sm:col-span-9">
                <FormField
                  control={control}
                  name={`items.${idx}.description`}
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <Label className="text-muted-foreground text-[10px] font-bold uppercase">
                        Descripción / Detalle del Gasto
                      </Label>
                      <FormControl>
                        <Input
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

              <div className="col-span-12 sm:col-span-2">
                <FormField
                  control={control}
                  name={`items.${idx}.unitCost`}
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

            {/* BLOQUE INFERIOR: Resumen e Impuestos (Footer) */}
            <div className="bg-muted/50 flex flex-wrap items-center gap-6 border-t p-3 px-4">
              <div className="flex flex-col">
                <span className="text-muted-foreground text-[9px] font-bold uppercase">
                  Total Líquido
                </span>
                <span className="text-primary text-sm font-black">
                  {formatMoney(total)}
                </span>
              </div>

              <div className="bg-muted-foreground/20 hidden h-8 w-[1px] sm:block" />

              <div className="flex gap-4">
                <div className="flex flex-col">
                  <span className="text-muted-foreground text-[9px] font-bold uppercase">
                    IVA 13%
                  </span>
                  <span className="text-muted-foreground font-mono text-[11px]">
                    {iva.toFixed(2)}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-muted-foreground text-[9px] font-bold uppercase">
                    IT 3%
                  </span>
                  <span className="text-muted-foreground font-mono text-[11px]">
                    {it.toFixed(2)}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-muted-foreground text-[9px] font-bold uppercase">
                    IUE 5%
                  </span>
                  <span className="text-muted-foreground font-mono text-[11px]">
                    {iue.toFixed(2)}
                  </span>
                </div>
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
              budgetLineId: '',
              financingSourceId: '',
              amount: 0,
              quantity: 1,
              unitCost: 0,
              document: '',
              type: '',
              description: '',
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
