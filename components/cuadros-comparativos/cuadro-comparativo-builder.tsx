'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  useForm,
  useFieldArray,
  useWatch,
  type FieldErrors,
} from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import axios from 'axios';
import { toast } from 'sonner';
import { Plus, Trash2, Save, Download, Link2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { formatMoney, normalizeString } from '@/lib/utils';
import { cotizacionesService } from '@/lib/services/cotizaciones-service';
import { cuadrosComparativosService } from '@/lib/services/cuadros-comparativos-service';
import { adaptCuadroFormToPayload } from '@/lib/adapters/cuadro-comparativo-adapter';
import { CuadroAnalisis } from '@/components/cuadros-comparativos/cuadro-analisis';
import type { AnalisisInput } from '@/lib/cuadro-analisis';
import { cuadroComparativoSchema } from '@/components/cuadros-comparativos/cuadro-comparativo-schema';
import type { CotizacionResponse } from '@/types/cotizacion-backend';
import type { CuadroComparativoFormData } from '@/components/cuadros-comparativos/cuadro-comparativo-schema';
import { CotizacionExternaRapidaDialog } from '@/components/cotizaciones/cotizacion-externa-rapida-dialog';

interface Columna {
  cotizacionId: number;
  proveedorNombre: string;
  codigo: string;
  lineas: {
    detalle: string;
    cantidad: number;
    unidad: string;
    precioUnitario: number;
  }[];
}

interface PrecioCelda {
  precioUnitario: number;
  noMenciona: boolean;
}

interface CuadroComparativoBuilderProps {
  cuadroId?: number;
  initialData?: CuadroComparativoFormData;
}

const NINGUNO = 'none';

/** Debe coincidir con el `.min()` de `cotizaciones` en cuadroComparativoSchema */
const MIN_COTIZACIONES = 2;

export default function CuadroComparativoBuilder({
  cuadroId,
  initialData,
}: CuadroComparativoBuilderProps) {
  const router = useRouter();
  const isEdit = typeof cuadroId === 'number';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cotizaciones, setCotizaciones] = useState<CotizacionResponse[]>([]);
  const [rapidaOpen, setRapidaOpen] = useState(false);
  const [fuenteItems, setFuenteItems] = useState<string>('');

  const form = useForm<CuadroComparativoFormData>({
    resolver: zodResolver(cuadroComparativoSchema),
    defaultValues: {
      lugarFecha: initialData?.lugarFecha ?? '',
      observaciones: initialData?.observaciones ?? '',
      recomendadaIndex: initialData?.recomendadaIndex ?? null,
      cotizaciones: initialData?.cotizaciones ?? [],
      items: initialData?.items ?? [],
    },
    mode: 'onBlur',
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  const watchedCotizacionesValue = useWatch({
    control: form.control,
    name: 'cotizaciones',
  });
  const watchedCotizaciones = useMemo(
    () => watchedCotizacionesValue || [],
    [watchedCotizacionesValue]
  );

  const watchedItemsValue = useWatch({ control: form.control, name: 'items' });
  const watchedItems = useMemo(
    () => watchedItemsValue || [],
    [watchedItemsValue]
  );

  const watchedRecomendadaIndex = useWatch({
    control: form.control,
    name: 'recomendadaIndex',
  });

  // Sync / Reset when initialData lands
  useEffect(() => {
    const cargar = async () => {
      try {
        setLoading(true);
        const data = await cotizacionesService.getCotizaciones();
        setCotizaciones(data);

        if (initialData) {
          form.reset({
            lugarFecha: initialData.lugarFecha ?? '',
            observaciones: initialData.observaciones ?? '',
            recomendadaIndex: initialData.recomendadaIndex,
            cotizaciones: initialData.cotizaciones,
            items: initialData.items,
          });
        }
      } catch {
        toast.error('No se pudieron cargar las cotizaciones.');
      } finally {
        setLoading(false);
      }
    };
    void cargar();
  }, [initialData, form]);

  const cols = useMemo<Columna[]>(() => {
    return watchedCotizaciones.map((c) => {
      const full = cotizaciones.find((d) => d.id === c.cotizacionId);
      return {
        cotizacionId: c.cotizacionId,
        proveedorNombre: c.proveedorNombre,
        codigo: full?.codigoCotizacion ?? `#${c.cotizacionId}`,
        lineas: (full?.lineas ?? []).map((l) => ({
          detalle: l.detalle,
          cantidad: Number(l.cantidad) || 0,
          unidad: l.unidad ?? '',
          precioUnitario: Number(l.precioUnitario) || 0,
        })),
      };
    });
  }, [watchedCotizaciones, cotizaciones]);

  const totalesPorColumna = useMemo(() => {
    return cols.map((_, ci) =>
      watchedItems.reduce((acc, item) => {
        const celda = item?.precios?.[ci];
        if (!celda || celda.noMenciona) return acc;
        return (
          acc +
          (Number(celda.precioUnitario) || 0) * (Number(item.cantidad) || 0)
        );
      }, 0)
    );
  }, [cols, watchedItems]);

  const analisisInput = useMemo<AnalisisInput>(
    () => ({
      columnas: cols.map((c) => ({ proveedorNombre: c.proveedorNombre })),
      items: watchedItems.map((item) => ({
        descripcion: item.descripcion || '(sin descripción)',
        cantidad: Number(item.cantidad) || 0,
        precios: cols.map((_, ci) => {
          const celda = item.precios?.[ci];
          return {
            precioUnitario: Number(celda?.precioUnitario) || 0,
            noMenciona: celda?.noMenciona ?? true,
          };
        }),
      })),
    }),
    [cols, watchedItems]
  );

  const toggleCotizacion = (cot: CotizacionResponse) => {
    const currentCots = form.getValues('cotizaciones') || [];
    const currentItems = form.getValues('items') || [];
    const currentRecIndex = form.getValues('recomendadaIndex');

    const idx = currentCots.findIndex((c) => c.cotizacionId === cot.id);
    if (idx >= 0) {
      const newCots = currentCots.filter((_, i) => i !== idx);
      const newItems = currentItems.map((it) => ({
        ...it,
        ganadoraIndex:
          it.ganadoraIndex === idx
            ? null
            : it.ganadoraIndex !== null && it.ganadoraIndex > idx
              ? it.ganadoraIndex - 1
              : it.ganadoraIndex,
        precios: (it.precios || []).filter((_, i) => i !== idx),
      }));
      const newRecIndex =
        currentRecIndex === idx
          ? null
          : currentRecIndex !== null && currentRecIndex > idx
            ? currentRecIndex - 1
            : currentRecIndex;

      form.setValue('cotizaciones', newCots);
      form.setValue('items', newItems);
      form.setValue('recomendadaIndex', newRecIndex);
    } else {
      const newCots = [
        ...currentCots,
        {
          cotizacionId: cot.id,
          proveedorNombre: cot.proveedorNombre,
        },
      ];
      const newItems = currentItems.map((it) => ({
        ...it,
        precios: [...(it.precios || []), autoPrecio(cot, it.descripcion)],
      }));

      form.setValue('cotizaciones', newCots);
      form.setValue('items', newItems);
    }
  };

  const autoPrecio = (
    cot: CotizacionResponse,
    descripcion: string
  ): PrecioCelda => {
    const objetivo = normalizeString(descripcion);
    const match = (cot.lineas ?? []).find(
      (l) => normalizeString(l.detalle) === objetivo
    );
    if (match) {
      return {
        precioUnitario: Number(match.precioUnitario) || 0,
        noMenciona: false,
      };
    }
    return { precioUnitario: 0, noMenciona: true };
  };

  const cargarItemsDesde = (cotizacionId: string) => {
    const col = cols.find((c) => String(c.cotizacionId) === cotizacionId);
    if (!col) return;
    if (col.lineas.length === 0) {
      toast.info('La cotización seleccionada no tiene ítems.');
      return;
    }
    const cotizacionesFull = cols.map((c) =>
      cotizaciones.find((d) => d.id === c.cotizacionId)
    );
    const nuevos = col.lineas.map((linea) => ({
      descripcion: linea.detalle,
      cantidad: linea.cantidad,
      unidad: linea.unidad,
      ganadoraIndex: null,
      precios: cols.map((_, ci) => {
        const full = cotizacionesFull[ci];
        return full
          ? autoPrecio(full, linea.detalle)
          : { precioUnitario: 0, noMenciona: true };
      }),
    }));
    form.setValue('items', nuevos);
    toast.success(
      `${nuevos.length} ítems cargados desde ${col.proveedorNombre}.`
    );
  };

  const agregarItem = () => {
    append({
      descripcion: '',
      cantidad: 1,
      unidad: '',
      ganadoraIndex: null,
      precios: cols.map(() => ({ precioUnitario: 0, noMenciona: false })),
    });
  };

  const handleRemoveItem = (idx: number) => {
    remove(idx);
  };

  const handleRapidaSuccess = (newCot: CotizacionResponse) => {
    setCotizaciones((prev) => [...prev, newCot]);
    toggleCotizacion(newCot);
  };

  // Sin esto, un rechazo de zod no ejecuta onSubmit y la pantalla queda muda:
  // ni toast, ni navegación, ni petición. Las reglas de nivel de arreglo
  // (mínimo de cotizaciones e ítems) no tienen un FormMessage donde mostrarse.
  const onInvalid = (errores: FieldErrors<CuadroComparativoFormData>) => {
    const motivo =
      errores.cotizaciones?.message ??
      errores.items?.message ??
      errores.items?.root?.message;

    toast.error(
      typeof motivo === 'string'
        ? motivo
        : 'Revisa los campos marcados en rojo antes de guardar.'
    );
  };

  const onSubmit = async (data: CuadroComparativoFormData) => {
    try {
      setSaving(true);
      const payload = adaptCuadroFormToPayload(data);
      if (isEdit && cuadroId !== undefined) {
        await cuadrosComparativosService.updateCuadro(cuadroId, payload);
        toast.success('Cuadro comparativo actualizado.');
      } else {
        await cuadrosComparativosService.createCuadro(payload);
        toast.success('Cuadro comparativo registrado.');
      }
      router.push('/app/cuadros-comparativos');
      router.refresh();
    } catch (error: unknown) {
      const mensaje =
        axios.isAxiosError(error) && error.response?.data?.message
          ? String(error.response.data.message)
          : 'No se pudo guardar el cuadro comparativo.';
      toast.error(mensaje);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-10 w-full max-w-md" />
        <Skeleton className="h-[420px] w-full" />
      </div>
    );
  }

  const seleccionadasIds = new Set(
    watchedCotizaciones.map((c) => c.cotizacionId)
  );

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit, onInvalid)}
        className="space-y-6 p-6"
      >
        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <CardTitle className="text-base">
                1. Selecciona las cotizaciones a comparar
              </CardTitle>
              <p className="text-muted-foreground text-xs">
                {cols.length} de {MIN_COTIZACIONES} mínimo
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setRapidaOpen(true)}
            >
              <Link2 className="mr-2 h-4 w-4" />
              Cotización externa rápida
            </Button>
          </CardHeader>
          <CardContent>
            {cotizaciones.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No tienes cotizaciones registradas. Crea una cotización propia o
                agrega una cotización externa rápida con el botón de arriba.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
                {cotizaciones.map((cot) => {
                  const checked = seleccionadasIds.has(cot.id);
                  const isExterna = cot.tipo === 'EXTERNA';
                  return (
                    <label
                      key={cot.id}
                      className="hover:bg-accent flex cursor-pointer items-start gap-3 rounded-md border p-3"
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => toggleCotizacion(cot)}
                        className="mt-0.5"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-medium">
                            {cot.proveedorNombre}
                          </p>
                          {isExterna && (
                            <span className="shrink-0 rounded-full bg-sky-100 px-1.5 py-0.5 text-[10px] font-medium text-sky-700 dark:bg-sky-950/60 dark:text-sky-300">
                              Externa
                            </span>
                          )}
                        </div>
                        <p className="text-muted-foreground text-xs">
                          {cot.codigoCotizacion} · {cot.lineas?.length ?? 0}{' '}
                          ítems · {formatMoney(cot.total)}
                        </p>
                        {isExterna && cot.adjuntoUrl && (
                          <a
                            href={cot.adjuntoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="block truncate text-[10px] text-sky-600 hover:underline"
                          >
                            Ver documento
                          </a>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            )}

            {cols.length > 0 && cols.length < MIN_COTIZACIONES && (
              <p className="text-muted-foreground mt-3 text-xs">
                Un cuadro comparativo necesita al menos {MIN_COTIZACIONES}{' '}
                cotizaciones. Si el proveedor no está registrado, usa
                &laquo;Cotización externa rápida&raquo;.
              </p>
            )}

            {form.formState.errors.cotizaciones?.message && (
              <p className="text-destructive mt-3 text-sm">
                {form.formState.errors.cotizaciones.message}
              </p>
            )}
          </CardContent>
        </Card>

        {cols.length >= 1 && (
          <Card>
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-base">
                2. Ítems y precios por cotización
              </CardTitle>
              <div className="flex flex-wrap items-center gap-2">
                <Select value={fuenteItems} onValueChange={setFuenteItems}>
                  <SelectTrigger className="h-9 w-[220px]">
                    <SelectValue placeholder="Cargar ítems desde..." />
                  </SelectTrigger>
                  <SelectContent>
                    {cols.map((c) => (
                      <SelectItem
                        key={c.cotizacionId}
                        value={String(c.cotizacionId)}
                      >
                        {c.proveedorNombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!fuenteItems}
                  onClick={() => cargarItemsDesde(fuenteItems)}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Cargar ítems
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={agregarItem}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar ítem
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40px]">#</TableHead>
                      <TableHead className="min-w-[220px]">
                        Descripción
                      </TableHead>
                      <TableHead className="w-[90px]">Cant.</TableHead>
                      <TableHead className="w-[110px]">Unid.</TableHead>
                      {cols.map((c) => (
                        <TableHead
                          key={c.cotizacionId}
                          className="min-w-[200px] text-center"
                        >
                          {c.proveedorNombre}
                        </TableHead>
                      ))}
                      <TableHead className="w-[150px]">Ganador</TableHead>
                      <TableHead className="w-[50px]" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fields.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={6 + cols.length}
                          className="text-muted-foreground h-20 text-center"
                        >
                          Carga ítems desde una cotización o agrégalos
                          manualmente.
                        </TableCell>
                      </TableRow>
                    ) : (
                      fields.map((fieldRow, idx) => (
                        <TableRow key={fieldRow.id}>
                          <TableCell className="text-muted-foreground text-xs">
                            {idx + 1}
                          </TableCell>
                          <TableCell>
                            <FormField
                              control={form.control}
                              name={`items.${idx}.descripcion`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input
                                      placeholder="Detalle del ítem"
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
                                    <Input placeholder="Unid." {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </TableCell>
                          {cols.map((c, ci) => {
                            const noMencionaWatch = form.watch(
                              `items.${idx}.precios.${ci}.noMenciona`
                            );
                            return (
                              <TableCell key={c.cotizacionId}>
                                <div className="flex flex-col gap-1 text-center">
                                  <FormField
                                    control={form.control}
                                    name={`items.${idx}.precios.${ci}.precioUnitario`}
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormControl>
                                          <Input
                                            type="number"
                                            min={0}
                                            step="0.01"
                                            disabled={noMencionaWatch}
                                            className="h-8 text-right text-xs"
                                            {...field}
                                          />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  <FormField
                                    control={form.control}
                                    name={`items.${idx}.precios.${ci}.noMenciona`}
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormControl>
                                          <label className="text-muted-foreground flex cursor-pointer items-center justify-center gap-1.5 text-[10px]">
                                            <Checkbox
                                              checked={field.value}
                                              onCheckedChange={field.onChange}
                                              className="h-3 w-3 rounded"
                                            />
                                            No menciona
                                          </label>
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                </div>
                              </TableCell>
                            );
                          })}
                          <TableCell>
                            <FormField
                              control={form.control}
                              name={`items.${idx}.ganadoraIndex`}
                              render={({ field }) => (
                                <FormItem>
                                  <Select
                                    value={
                                      field.value === null
                                        ? NINGUNO
                                        : String(field.value)
                                    }
                                    onValueChange={(v) =>
                                      field.onChange(
                                        v === NINGUNO ? null : Number(v)
                                      )
                                    }
                                  >
                                    <FormControl>
                                      <SelectTrigger className="h-9">
                                        <SelectValue />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value={NINGUNO}>
                                        Sin selección
                                      </SelectItem>
                                      {cols.map((c, ci) => (
                                        <SelectItem
                                          key={c.cotizacionId}
                                          value={String(ci)}
                                        >
                                          {c.proveedorNombre}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </TableCell>
                          <TableCell>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveItem(idx)}
                              aria-label="Eliminar ítem"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                    {watchedItems.length > 0 && (
                      <TableRow className="bg-muted/50 font-semibold">
                        <TableCell colSpan={4} className="text-right">
                          TOTALES
                        </TableCell>
                        {cols.map((c, ci) => (
                          <TableCell
                            key={c.cotizacionId}
                            className="text-center"
                          >
                            {formatMoney(totalesPorColumna[ci] ?? 0)}
                          </TableCell>
                        ))}
                        <TableCell colSpan={2} />
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {(form.formState.errors.items?.message ??
                form.formState.errors.items?.root?.message) && (
                <p className="text-destructive mt-3 text-sm">
                  {form.formState.errors.items?.message ??
                    form.formState.errors.items?.root?.message}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {cols.length >= 1 && watchedItems.length > 0 && (
          <CuadroAnalisis
            input={analisisInput}
            recomendadaIndex={watchedRecomendadaIndex}
          />
        )}

        {cols.length >= 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                3. Recomendación y observaciones
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="recomendadaIndex"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cotización recomendada</FormLabel>
                    <Select
                      value={
                        field.value === null ? NINGUNO : String(field.value)
                      }
                      onValueChange={(v) =>
                        field.onChange(v === NINGUNO ? null : Number(v))
                      }
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona la recomendada" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={NINGUNO}>
                          Sin recomendación
                        </SelectItem>
                        {cols.map((c, ci) => (
                          <SelectItem key={c.cotizacionId} value={String(ci)}>
                            {c.proveedorNombre} ·{' '}
                            {formatMoney(totalesPorColumna[ci] ?? 0)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lugarFecha"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lugar y Fecha</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ej. La Paz, 23 de octubre de 2025"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="observaciones"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Observaciones</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={3}
                        placeholder="Observaciones del cuadro comparativo"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        )}

        <Separator />

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/app/cuadros-comparativos')}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {isEdit ? 'Guardar cambios' : 'Registrar cuadro comparativo'}
          </Button>
        </div>

        <CotizacionExternaRapidaDialog
          open={rapidaOpen}
          onOpenChange={setRapidaOpen}
          onSuccess={handleRapidaSuccess}
        />
      </form>
    </Form>
  );
}
