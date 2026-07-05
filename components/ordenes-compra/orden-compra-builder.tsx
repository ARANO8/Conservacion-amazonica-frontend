'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import axios from 'axios';
import { toast } from 'sonner';
import { Plus, Trash2, Save, AlertTriangle, Download } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { cn, formatMoney } from '@/lib/utils';
import { ordenesCompraService } from '@/lib/services/ordenes-compra-service';
import type { OrdenCompraResponse } from '@/types/orden-compra-backend';
import {
  ordenCompraSchema,
  type OrdenCompraFormData,
} from './orden-compra-schema';
import { CuadroItemsDialog } from './cuadro-items-dialog';

interface OrdenCompraBuilderProps {
  ordenId?: number;
  initialData?: OrdenCompraResponse;
  prefillCuadroId?: number;
}

const emptyItem = {
  orden: 1,
  item: '',
  cantidad: 1,
  unidad: '',
  detalle: '',
  precioUnitario: 0,
  cuadroItemId: null,
  sinCuadro: true,
};

export default function OrdenCompraBuilder({
  ordenId,
  initialData,
  prefillCuadroId,
}: OrdenCompraBuilderProps) {
  const router = useRouter();
  const isEdit = typeof ordenId === 'number';

  const [saving, setSaving] = useState(false);
  const [prefillLoading, setPrefillLoading] = useState(false);

  // States for the add-from-cuadro dialog
  const [addCuadroOpen, setAddCuadroOpen] = useState(false);

  const form = useForm<OrdenCompraFormData>({
    resolver: zodResolver(ordenCompraSchema),
    defaultValues: {
      cuadroComparativoId: initialData?.cuadroComparativoId ?? null,
      proveedorNombre: initialData?.proveedorNombre ?? '',
      proveedorDireccion: initialData?.proveedorDireccion ?? '',
      proveedorTelefono: initialData?.proveedorTelefono ?? '',
      lugarEntrega: initialData?.lugarEntrega ?? '',
      formaPago: initialData?.formaPago ?? 'Transferencia bancaria',
      garantia: initialData?.garantia ?? 'N/A',
      observaciones: initialData?.observaciones ?? '',
      items:
        initialData?.items && initialData.items.length > 0
          ? initialData.items.map((it) => ({
              orden: it.orden,
              item: it.item,
              cantidad: Number(it.cantidad),
              unidad: it.unidad ?? '',
              detalle: it.detalle ?? '',
              precioUnitario: Number(it.precioUnitario),
              cuadroItemId: it.cuadroItemId ?? null,
              sinCuadro: it.sinCuadro,
            }))
          : [{ ...emptyItem }],
    },
    mode: 'onBlur',
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  const watchedItems = useWatch({ control: form.control, name: 'items' });


  const totalGeneral = (watchedItems ?? []).reduce(
    (acc, it) => acc + (Number(it?.precioUnitario) || 0) * (Number(it?.cantidad) || 0),
    0
  );

  const haySinCuadro = (watchedItems ?? []).some((it) => it?.sinCuadro);

  // Sync / Reset when initialData lands
  useEffect(() => {
    if (initialData) {
      form.reset({
        cuadroComparativoId: initialData.cuadroComparativoId ?? null,
        proveedorNombre: initialData.proveedorNombre ?? '',
        proveedorDireccion: initialData.proveedorDireccion ?? '',
        proveedorTelefono: initialData.proveedorTelefono ?? '',
        lugarEntrega: initialData.lugarEntrega ?? '',
        formaPago: initialData.formaPago ?? 'Transferencia bancaria',
        garantia: initialData.garantia ?? 'N/A',
        observaciones: initialData.observaciones ?? '',
        items: initialData.items.map((it) => ({
          orden: it.orden,
          item: it.item,
          cantidad: Number(it.cantidad),
          unidad: it.unidad ?? '',
          detalle: it.detalle ?? '',
          precioUnitario: Number(it.precioUnitario),
          cuadroItemId: it.cuadroItemId ?? null,
          sinCuadro: it.sinCuadro,
        })),
      });
    }
  }, [initialData, form]);

  useEffect(() => {
    if (prefillCuadroId && !isEdit) {
      void handlePrefill(prefillCuadroId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefillCuadroId]);

  const handlePrefill = async (cuadroId: number) => {
    setPrefillLoading(true);
    try {
      const data = await ordenesCompraService.prefillFromCuadro(cuadroId);
      form.setValue('cuadroComparativoId', data.cuadroComparativoId);
      form.setValue('proveedorNombre', data.proveedorNombre);
      form.setValue('proveedorDireccion', data.proveedorDireccion || '');
      form.setValue('proveedorTelefono', data.proveedorTelefono || '');
      form.setValue('garantia', data.garantia || 'N/A');
      form.setValue('formaPago', data.formaPago || 'Transferencia bancaria');

      const prefilledItems = data.items.map((it) => ({
        orden: it.orden,
        item: it.item,
        cantidad: it.cantidad,
        unidad: it.unidad || '',
        detalle: it.detalle || '',
        precioUnitario: it.precioUnitario,
        cuadroItemId: it.cuadroItemId,
        sinCuadro: false,
      }));

      form.setValue('items', prefilledItems);
      toast.success(
        `Prellenado desde ${data.cuadroCodigoCuadro}. Revisa y ajusta antes de guardar.`
      );
    } catch (error: unknown) {
      const msg =
        axios.isAxiosError(error) && error.response?.data?.message
          ? String(error.response.data.message)
          : 'No se pudo precargar el cuadro.';
      toast.error(msg);
    } finally {
      setPrefillLoading(false);
    }
  };

  const openAddFromCuadro = () => {
    setAddCuadroOpen(true);
  };

  const confirmAddFromCuadro = async (cuadroId: number, itemIds: number[]) => {
    setPrefillLoading(true);
    try {
      const data = await ordenesCompraService.prefillFromCuadro(cuadroId);
      const toAdd = data.items.filter((it) =>
        itemIds.includes(it.cuadroItemId)
      );
      if (toAdd.length === 0) {
        toast.info('No seleccionaste ningún ítem.');
        return;
      }

      const currentItems = form.getValues('items') || [];
      const maxOrden = currentItems.reduce((m, it) => Math.max(m, it.orden), 0);
      const newRows = toAdd.map((it, idx) => ({
        orden: maxOrden + idx + 1,
        item: it.item,
        cantidad: it.cantidad,
        unidad: it.unidad || '',
        detalle: it.detalle || '',
        precioUnitario: it.precioUnitario,
        cuadroItemId: it.cuadroItemId,
        sinCuadro: false,
      }));

      form.setValue('items', [...currentItems, ...newRows]);
      setAddCuadroOpen(false);
      toast.success(`${newRows.length} ítem(s) agregado(s).`);
    } catch {
      toast.error('No se pudieron cargar los ítems del cuadro seleccionado.');
    } finally {
      setPrefillLoading(false);
    }
  };

  const addEmptyItem = () => {
    const currentItems = form.getValues('items') || [];
    const maxOrden = currentItems.reduce((m, it) => Math.max(m, it.orden), 0);
    append({
      ...emptyItem,
      orden: maxOrden + 1,
      sinCuadro: true,
    });
  };

  const handleRemoveItem = (idx: number) => {
    remove(idx);
    // Recalcular orden para mantener integridad secuencial
    const updated = form.getValues('items').map((it, i) => ({
      ...it,
      orden: i + 1,
    }));
    form.setValue('items', updated);
  };

  const onSubmit = async (data: OrdenCompraFormData) => {
    const payload = {
      cuadroComparativoId: data.cuadroComparativoId || undefined,
      proveedorNombre: data.proveedorNombre.trim(),
      proveedorDireccion: data.proveedorDireccion?.trim() || undefined,
      proveedorTelefono: data.proveedorTelefono?.trim() || undefined,
      lugarEntrega: data.lugarEntrega?.trim() || undefined,
      formaPago: data.formaPago.trim() || 'Transferencia bancaria',
      garantia: data.garantia.trim() || 'N/A',
      observaciones: data.observaciones?.trim() || undefined,
      items: data.items.map((it) => ({
        orden: it.orden,
        item: it.item.trim(),
        cantidad: Number(it.cantidad),
        unidad: it.unidad?.trim() || undefined,
        detalle: it.detalle?.trim() || undefined,
        precioUnitario: Number(it.precioUnitario),
        cuadroItemId: it.cuadroItemId || undefined,
        sinCuadro: it.sinCuadro,
      })),
    };

    setSaving(true);
    try {
      let result: OrdenCompraResponse;
      if (isEdit && ordenId !== undefined) {
        result = await ordenesCompraService.updateOrden(ordenId, payload);
        toast.success('Orden de compra actualizada.');
      } else {
        result = await ordenesCompraService.createOrden(payload);
        toast.success(`Orden ${result.codigoOrden} creada correctamente.`);
      }
      router.push(`/app/ordenes-compra/${result.id}`);
    } catch (error: unknown) {
      const msg =
        axios.isAxiosError(error) && error.response?.data?.message
          ? String(error.response.data.message)
          : 'No se pudo guardar la orden.';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-6">
        {haySinCuadro && (
          <div className="flex items-start gap-3 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              Uno o más ítems no tienen cuadro comparativo de respaldo. Estos
              ítems se incluirán en la orden pero no están respaldados por una
              cotización registrada.
            </span>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Proveedor</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="proveedorNombre"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Nombre del proveedor / empresa *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ej. MITRU Eventos S.R.L."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="proveedorDireccion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dirección</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Av. Montes 123, La Paz"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="proveedorTelefono"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono</FormLabel>
                    <FormControl>
                      <Input placeholder="71234567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="lugarEntrega"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lugar de entrega / prestación</FormLabel>
                    <FormControl>
                      <Input placeholder="Oficinas ACEAA" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="formaPago"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Forma de pago</FormLabel>
                    <FormControl>
                      <Input placeholder="Transferencia bancaria" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="garantia"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Garantía</FormLabel>
                    <FormControl>
                      <Input placeholder="N/A" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="observaciones"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observaciones</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder="Notas adicionales sobre la orden..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="text-base">Ítems de la orden</CardTitle>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={prefillLoading}
                  onClick={() => void openAddFromCuadro()}
                >
                  <Download className="mr-2 h-3.5 w-3.5" />
                  Agregar desde cuadro
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addEmptyItem}
                >
                  <Plus className="mr-2 h-3.5 w-3.5" />
                  Ítem nuevo (sin cuadro)
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">#</TableHead>
                    <TableHead className="min-w-[180px]">
                      Artículo / Servicio
                    </TableHead>
                    <TableHead className="w-24">Cantidad</TableHead>
                    <TableHead className="w-24">Unidad</TableHead>
                    <TableHead className="min-w-[140px]">Detalle</TableHead>
                    <TableHead className="w-32">Precio Unit. (Bs)</TableHead>
                    <TableHead className="w-32 text-right">Total (Bs)</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fields.map((fieldRow, idx) => {
                    const itemWatch = watchedItems?.[idx];
                    const qty = Number(itemWatch?.cantidad) || 0;
                    const price = Number(itemWatch?.precioUnitario) || 0;
                    const isSinCuadro = itemWatch?.sinCuadro;

                    return (
                      <TableRow
                        key={fieldRow.id}
                        className={cn(
                          isSinCuadro && 'bg-amber-50/40 dark:bg-amber-950/10'
                        )}
                      >
                        <TableCell className="text-muted-foreground text-xs">
                          {idx + 1}
                          {isSinCuadro && (
                            <span
                              className="ml-1 text-amber-600 font-bold"
                              title="Sin cuadro comparativo"
                            >
                              *
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <FormField
                            control={form.control}
                            name={`items.${idx}.item`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input
                                    placeholder="Descripción del artículo"
                                    className="h-8 text-sm"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </TableCell>
                        <TableCell>
                          <FormField
                            control={form.control}
                            name={`items.${idx}.cantidad`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input
                                    type="number"
                                    min={0}
                                    step="0.01"
                                    className="h-8 text-sm"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </TableCell>
                        <TableCell>
                          <FormField
                            control={form.control}
                            name={`items.${idx}.unidad`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input
                                    placeholder="Unid."
                                    className="h-8 text-sm"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </TableCell>
                        <TableCell>
                          <FormField
                            control={form.control}
                            name={`items.${idx}.detalle`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input
                                    placeholder="Especificaciones"
                                    className="h-8 text-sm"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </TableCell>
                        <TableCell>
                          <FormField
                            control={form.control}
                            name={`items.${idx}.precioUnitario`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input
                                    type="number"
                                    min={0}
                                    step="0.01"
                                    className="h-8 text-sm"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </TableCell>
                        <TableCell className="text-right text-sm font-medium">
                          {formatMoney(price * qty)}
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive h-7 w-7"
                            onClick={() => handleRemoveItem(idx)}
                            disabled={fields.length <= 1}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            <div className="mt-3 flex items-center justify-end gap-3">
              <span className="text-muted-foreground text-sm">Total general</span>
              <span className="text-lg font-bold">
                {formatMoney(totalGeneral)}
              </span>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving
              ? 'Guardando...'
              : isEdit
                ? 'Actualizar orden'
                : 'Crear orden'}
          </Button>
        </div>

        <CuadroItemsDialog
          open={addCuadroOpen}
          onOpenChange={setAddCuadroOpen}
          onConfirm={confirmAddFromCuadro}
          prefillLoading={prefillLoading}
        />
      </form>
    </Form>
  );
}
