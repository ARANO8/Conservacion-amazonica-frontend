'use client';

import { useFormContext, useFieldArray, useWatch } from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { FormField, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Field, FieldSet, FieldLegend } from '@/components/ui/field';
import { formatMoney } from '@/lib/utils';
import type { SolicitudCompraFormData } from './solicitud-compra-schema';

const emptyItem = {
  descripcion: '',
  cantidad: 1,
  uso: '',
  costoUnitario: 0,
};

export function SolicitudCompraItemsTable() {
  const { control } = useFormContext<SolicitudCompraFormData>();

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const watchedItems = useWatch({ control, name: 'items' });

  return (
    <FieldSet>
      <div className="mb-3 flex items-center justify-between">
        <FieldLegend className="mb-0">Descripción del Gasto</FieldLegend>
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
              <TableHead className="w-[130px]">P/Unit. (Bs)</TableHead>
              <TableHead className="w-[130px] text-right">Total (Bs)</TableHead>
              <TableHead className="w-[50px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {fields.map((fieldRow, index) => {
              const cantidad = Number(watchedItems?.[index]?.cantidad) || 0;
              const precio = Number(watchedItems?.[index]?.costoUnitario) || 0;
              const subtotal = cantidad * precio;

              return (
                <TableRow key={fieldRow.id}>
                  <TableCell>
                    <FormField
                      control={control}
                      name={`items.${index}.cantidad`}
                      render={({ field }) => (
                        <Field>
                          <FormControl>
                            <Input
                              type="text"
                              inputMode="decimal"
                              {...field}
                              value={field.value ?? ''}
                              onChange={(e) => {
                                const raw = e.target.value;
                                field.onChange(
                                  raw === ''
                                    ? null
                                    : /^\d*\.?\d*$/.test(raw)
                                      ? Number(raw)
                                      : field.value
                                );
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </Field>
                      )}
                    />
                  </TableCell>
                  <TableCell>
                    <FormField
                      control={control}
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
                      control={control}
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
                                <SelectItem value="Oficina">Oficina</SelectItem>
                                <SelectItem value="Campo">Campo</SelectItem>
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
                      control={control}
                      name={`items.${index}.costoUnitario`}
                      render={({ field }) => (
                        <Field>
                          <FormControl>
                            <Input
                              type="text"
                              inputMode="decimal"
                              {...field}
                              value={field.value ?? ''}
                              onChange={(e) => {
                                const raw = e.target.value;
                                field.onChange(
                                  raw === ''
                                    ? null
                                    : /^\d*\.?\d*$/.test(raw)
                                      ? Number(raw)
                                      : field.value
                                );
                              }}
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
  );
}
