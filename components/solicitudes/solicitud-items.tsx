'use client';

import { useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
    <div className="space-y-3 overflow-x-auto pb-4">
      <div className="min-w-[1000px]">
        {' '}
        {/* Ensure generic width for scroll */}
        {/* Headers */}
        {/* Headers */}
        <div className="text-muted-foreground mb-2 grid grid-cols-12 gap-4 px-2 text-xs font-medium tracking-wider uppercase">
          <div className="col-span-4 translate-y-2">Fuente</div>
          <div className="col-span-4 translate-y-2">Partida</div>
          <div className="col-span-2 translate-y-2">Docum.</div>
          <div className="col-span-2 translate-y-2">Tipo</div>
        </div>
        {fields.map((field, idx) => {
          const currentItem = watchedItems?.[idx] || {};
          const q = Number(currentItem.quantity) || 0;
          const u = Number(currentItem.unitCost) || 0;
          const total = q * u;

          return (
            <div
              key={field.id}
              className="bg-muted/20 hover:bg-muted/40 mb-4 grid grid-cols-12 items-center gap-4 rounded-lg border p-4 shadow-sm transition-all"
            >
              {/* FILA 1: Origen y Clasificación */}
              <div className="col-span-4">
                <FormField
                  control={control}
                  name={`items.${idx}.financingSourceId`}
                  render={({ field }) => (
                    <FormItem>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={isLoading}
                      >
                        <FormControl>
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="Fuente" />
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
              </div>

              <div className="col-span-4">
                <FormField
                  control={control}
                  name={`items.${idx}.budgetLineId`}
                  render={({ field }) => (
                    <FormItem>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={isLoading}
                      >
                        <FormControl>
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="Partida" />
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
              </div>

              <div className="col-span-2">
                <FormField
                  control={control}
                  name={`items.${idx}.document`}
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value ?? ''}
                          placeholder="Doc."
                          className="h-9"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className="col-span-2">
                <FormField
                  control={control}
                  name={`items.${idx}.type`}
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value ?? ''}
                          placeholder="Tipo"
                          className="h-9"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              {/* Header Intermedio (Opcional, para claridad) */}
              <div className="text-muted-foreground col-span-12 mt-2 grid grid-cols-12 gap-4 text-[10px] font-medium tracking-wider uppercase">
                <div className="col-span-1"></div>
                <div className="col-span-7 pl-1">Descripción / Detalle</div>
                <div className="col-span-2 text-center">Cant.</div>
                <div className="col-span-2 text-right">Costo U.</div>
              </div>

              {/* FILA 2: Descripción y Montos */}
              <div className="col-span-7">
                <FormField
                  control={control}
                  name={`items.${idx}.description`}
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value ?? ''}
                          placeholder="Descripción del ítem..."
                          className="h-9"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="col-span-2">
                <FormField
                  control={control}
                  name={`items.${idx}.quantity`}
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          className="h-9 px-2 text-center"
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

              <div className="col-span-2">
                <FormField
                  control={control}
                  name={`items.${idx}.unitCost`}
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          className="h-9 px-2 text-right"
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

              <div className="col-span-1 flex justify-center">
                <input
                  type="hidden"
                  {...control.register(`items.${idx}.amount`)}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:bg-destructive/10 h-8 w-8"
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
                    className="size-4"
                  >
                    <path d="M3 6h18" />
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                    <line x1="10" x2="10" y1="11" y2="17" />
                    <line x1="14" x2="14" y1="11" y2="17" />
                  </svg>
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between pt-2">
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
        >
          + Añadir Gasto
        </Button>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground font-bold">
            Total Líquido Pagable Bs. :
          </span>
          <Input
            className="w-36 font-bold"
            readOnly
            value={formatMoney(displayTotal)}
          />
        </div>
      </div>
    </div>
  );
}
