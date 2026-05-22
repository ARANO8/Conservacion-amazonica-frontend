'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import axios from 'axios';
import { toast } from 'sonner';
import { Plus, Trash2, Save, Link2, FileText } from 'lucide-react';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatMoney } from '@/lib/utils';
import { cotizacionesService } from '@/lib/services/cotizaciones-service';
import { adaptCotizacionFormToPayload } from '@/lib/adapters/cotizacion-adapter';
import {
  cotizacionSchema,
  type CotizacionFormData,
} from '@/components/cotizaciones/cotizacion-schema';

const emptyLinea = {
  cantidad: 1,
  unidad: '',
  detalle: '',
  precioUnitario: 0,
};

function buildDefaults(initialData?: CotizacionFormData): CotizacionFormData {
  if (initialData) return initialData;

  const hoy = new Date().toISOString().slice(0, 10);
  return {
    tipo: 'PROPIA',
    fecha: hoy,
    proveedorNombre: '',
    proveedorTelefono: '',
    proveedorDireccion: '',
    proveedorCorreo: '',
    garantia: '',
    disponibilidad: '',
    duracionCotizacion: '',
    emiteFactura: false,
    observaciones: '',
    adjuntoUrl: '',
    lineas: [{ ...emptyLinea }],
  };
}

interface CotizacionFormProps {
  cotizacionId?: number;
  initialData?: CotizacionFormData;
}

export default function CotizacionForm({
  cotizacionId,
  initialData,
}: CotizacionFormProps) {
  const router = useRouter();
  const isEdit = typeof cotizacionId === 'number';

  const form = useForm<CotizacionFormData>({
    resolver: zodResolver(cotizacionSchema),
    defaultValues: buildDefaults(initialData),
    mode: 'onBlur',
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'lineas',
  });

  const tipo = useWatch({ control: form.control, name: 'tipo' });
  const isExterna = tipo === 'EXTERNA';

  const watchedLineas = useWatch({
    control: form.control,
    name: 'lineas',
  });

  const total = useMemo(() => {
    return (watchedLineas ?? []).reduce((acc, linea) => {
      const cantidad = Number(linea?.cantidad) || 0;
      const precio = Number(linea?.precioUnitario) || 0;
      return acc + cantidad * precio;
    }, 0);
  }, [watchedLineas]);

  const onSubmit = async (data: CotizacionFormData) => {
    try {
      const payload = adaptCotizacionFormToPayload(data);

      if (isEdit) {
        await cotizacionesService.updateCotizacion(cotizacionId, payload);
        toast.success('Cotización actualizada correctamente.');
      } else {
        await cotizacionesService.createCotizacion(payload);
        toast.success('Cotización registrada correctamente.');
      }

      router.push('/app/cotizaciones');
      router.refresh();
    } catch (error: unknown) {
      const mensaje =
        axios.isAxiosError(error) && error.response?.data?.message
          ? String(error.response.data.message)
          : 'No se pudo guardar la cotización. Intente nuevamente.';
      toast.error(mensaje);
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="mx-auto max-w-5xl space-y-6 p-6"
      >
        {/* Toggle tipo */}
        <div className="flex gap-2">
          <Button
            type="button"
            variant={!isExterna ? 'default' : 'outline'}
            className="flex-1"
            onClick={() =>
              form.setValue('tipo', 'PROPIA', { shouldValidate: true })
            }
          >
            <FileText className="mr-2 h-4 w-4" />
            Cotización Propia
          </Button>
          <Button
            type="button"
            variant={isExterna ? 'default' : 'outline'}
            className="flex-1"
            onClick={() =>
              form.setValue('tipo', 'EXTERNA', { shouldValidate: true })
            }
          >
            <Link2 className="mr-2 h-4 w-4" />
            Cotización Externa
          </Button>
        </div>

        {/* Banner modo externa */}
        {isExterna && (
          <div className="flex items-start gap-3 rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 dark:border-sky-800 dark:bg-sky-950/40">
            <Link2 className="mt-0.5 h-4 w-4 shrink-0 text-sky-600 dark:text-sky-400" />
            <p className="text-sm text-sky-800 dark:text-sky-300">
              <span className="font-medium">Modo externo:</span> ingresa los
              datos básicos del proveedor, transcribe los ítems y adjunta la URL
              del documento original como respaldo. Los campos de condiciones
              son opcionales.
            </p>
          </div>
        )}

        {/* Datos del proveedor */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Datos del Proveedor</CardTitle>
            {isExterna && (
              <Badge
                variant="outline"
                className="border-sky-300 bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300"
              >
                Externa
              </Badge>
            )}
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="fecha"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {!isExterna && (
              <FormField
                control={form.control}
                name="proveedorTelefono"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono</FormLabel>
                    <FormControl>
                      <Input placeholder="Teléfono del proveedor" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <FormField
              control={form.control}
              name="proveedorNombre"
              render={({ field }) => (
                <FormItem className={isExterna ? '' : 'md:col-span-2'}>
                  <FormLabel>Señor(es) / Proveedor</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Nombre o razón social del proveedor"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {!isExterna && (
              <>
                <FormField
                  control={form.control}
                  name="proveedorDireccion"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Dirección</FormLabel>
                      <FormControl>
                        <Input placeholder="Dirección" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="proveedorCorreo"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Correo Electrónico</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="correo@proveedor.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            {/* URL adjunto — solo visible en modo EXTERNA */}
            {isExterna && (
              <FormField
                control={form.control}
                name="adjuntoUrl"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>
                      URL del documento externo{' '}
                      <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://drive.google.com/... o https://dropbox.com/..."
                        {...field}
                      />
                    </FormControl>
                    <p className="text-muted-foreground text-xs">
                      Enlace al PDF, imagen o documento escaneado del proveedor.
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </CardContent>
        </Card>

        {/* Ítems */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">
              Detalle de Servicios o Materiales
            </CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ ...emptyLinea })}
            >
              <Plus className="mr-2 h-4 w-4" />
              Agregar ítem
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[110px]">Cantidad</TableHead>
                    <TableHead className="w-[120px]">Unidad</TableHead>
                    <TableHead>Detalle</TableHead>
                    <TableHead className="w-[140px]">P/Unit. (Bs)</TableHead>
                    <TableHead className="w-[140px] text-right">
                      Total (Bs)
                    </TableHead>
                    <TableHead className="w-[60px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fields.map((fieldRow, index) => {
                    const cantidad =
                      Number(watchedLineas?.[index]?.cantidad) || 0;
                    const precio =
                      Number(watchedLineas?.[index]?.precioUnitario) || 0;
                    const subtotal = cantidad * precio;

                    return (
                      <TableRow key={fieldRow.id}>
                        <TableCell>
                          <FormField
                            control={form.control}
                            name={`lineas.${index}.cantidad`}
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
                            name={`lineas.${index}.unidad`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input placeholder="Pza, Kg..." {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </TableCell>
                        <TableCell>
                          <FormField
                            control={form.control}
                            name={`lineas.${index}.detalle`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input
                                    placeholder="Descripción del ítem"
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
                            name={`lineas.${index}.precioUnitario`}
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

            <div className="flex justify-end">
              <div className="text-right">
                <p className="text-muted-foreground text-xs uppercase">Total</p>
                <p className="text-xl font-bold">{formatMoney(total)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Condiciones — solo visibles en modo PROPIA */}
        {!isExterna && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Condiciones de la Cotización
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="garantia"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Garantía</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej. 12 meses" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="disponibilidad"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Disponibilidad</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej. Inmediata" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="duracionCotizacion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duración Cotización</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej. 30 días" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="emiteFactura"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center gap-3 pt-8">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="!mt-0">Emite Factura</FormLabel>
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
                        placeholder="Observaciones adicionales"
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

        {/* Observaciones en modo externa */}
        {isExterna && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Observaciones</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="observaciones"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        rows={3}
                        placeholder="Observaciones adicionales sobre esta cotización externa"
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
            onClick={() => router.push('/app/cotizaciones')}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            <Save className="mr-2 h-4 w-4" />
            {isEdit ? 'Guardar cambios' : 'Registrar cotización'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
