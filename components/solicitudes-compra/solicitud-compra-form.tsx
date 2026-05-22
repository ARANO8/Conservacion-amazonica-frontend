'use client';

import { useMemo, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import axios from 'axios';
import { toast } from 'sonner';
import { Plus, Trash2, Save, ShoppingCart } from 'lucide-react';

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
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatMoney } from '@/lib/utils';
import { solicitudesService } from '@/lib/services/solicitudes-service';
import { useAuthStore } from '@/store/auth-store';
import api from '@/lib/api';
import {
  solicitudCompraSchema,
  type SolicitudCompraFormData,
} from './solicitud-compra-schema';

interface PoaOption {
  id: number;
  codigoPoa: string;
  actividad?: { detalleDescripcion: string };
  estructura?: {
    proyecto?: { nombre: string };
    partida?: { nombre: string };
  };
  costoTotal: string | number;
  montoEjecutado: string | number;
}

interface UsuarioOption {
  id: number;
  nombreCompleto: string;
  rol: string;
  cargo?: string;
}

const emptyItem = {
  descripcion: '',
  cantidad: 1,
  uso: '',
  costoUnitario: 0,
};

interface Props {
  solicitudId?: number;
}

export default function SolicitudCompraForm({ solicitudId }: Props) {
  const router = useRouter();
  const { user } = useAuthStore();
  const isEdit = typeof solicitudId === 'number';

  const [poaOptions, setPoaOptions] = useState<PoaOption[]>([]);
  const [usuarioOptions, setUsuarioOptions] = useState<UsuarioOption[]>([]);
  const [loadingOpts, setLoadingOpts] = useState(true);

  const form = useForm<SolicitudCompraFormData>({
    resolver: zodResolver(solicitudCompraSchema),
    defaultValues: {
      aprobadorId: 0,
      poaId: 0,
      motivoSolicitud: '',
      proyecto: '',
      chequeANombreDe: user?.nombreCompleto ?? '',
      descripcion: '',
      items: [{ ...emptyItem }],
    },
    mode: 'onBlur',
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  const watchedItems = useWatch({ control: form.control, name: 'items' });
  const watchedPoaId = useWatch({ control: form.control, name: 'poaId' });

  const total = useMemo(
    () =>
      (watchedItems ?? []).reduce((acc, item) => {
        const cantidad = Number(item?.cantidad) || 0;
        const precio = Number(item?.costoUnitario) || 0;
        return acc + cantidad * precio;
      }, 0),
    [watchedItems]
  );

  const selectedPoa = useMemo(
    () => poaOptions.find((p) => p.id === watchedPoaId),
    [poaOptions, watchedPoaId]
  );

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        setLoadingOpts(true);
        const [poasRes, usuariosRes] = await Promise.all([
          api.get<PoaOption[]>('/poa'),
          api.get<UsuarioOption[]>('/usuarios'),
        ]);
        setPoaOptions(poasRes.data);
        setUsuarioOptions(usuariosRes.data.filter((u) => u.id !== user?.id));
      } catch {
        toast.error('No se pudieron cargar las opciones del formulario.');
      } finally {
        setLoadingOpts(false);
      }
    };
    void fetchOptions();
  }, [user?.id]);

  const onSubmit = async (data: SolicitudCompraFormData) => {
    try {
      await solicitudesService.createSolicitudCompra({
        tipo: 'COMPRA_SERVICIO',
        poaIds: [data.poaId],
        aprobadorId: data.aprobadorId,
        motivoViaje: data.motivoSolicitud,
        proyecto: data.proyecto || undefined,
        chequeANombreDe: data.chequeANombreDe,
        descripcion: data.descripcion || undefined,
        gastosCompra: data.items.map((item) => ({
          descripcion: item.descripcion,
          cantidad: Number(item.cantidad),
          uso: item.uso || undefined,
          costoUnitario: Number(item.costoUnitario),
          poaId: data.poaId,
        })),
        planificaciones: [],
        viaticos: [],
        gastos: [],
        nominasTerceros: [],
        hospedajes: [],
      });

      toast.success('Solicitud de fondos registrada correctamente.');
      router.push('/app/solicitudes-compra');
      router.refresh();
    } catch (error: unknown) {
      const mensaje =
        axios.isAxiosError(error) && error.response?.data?.message
          ? String(error.response.data.message)
          : 'No se pudo guardar la solicitud. Intente nuevamente.';
      toast.error(mensaje);
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="mx-auto max-w-5xl space-y-6 p-6"
      >
        {/* Cabecera */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShoppingCart className="text-primary h-4 w-4" />
              SOLICITUD DE FONDOS EN AVANCE
            </CardTitle>
            <p className="text-muted-foreground text-xs">
              (Expresado en Bolivianos)
            </p>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* A: aprobador */}
            <FormField
              control={form.control}
              name="aprobadorId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    A: <span className="text-destructive">*</span>
                  </FormLabel>
                  <Select
                    disabled={loadingOpts}
                    value={field.value ? String(field.value) : ''}
                    onValueChange={(v) => field.onChange(Number(v))}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione el destinatario..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {usuarioOptions.map((u) => (
                        <SelectItem key={u.id} value={String(u.id)}>
                          {u.nombreCompleto}
                          {u.cargo ? ` — ${u.cargo}` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* DE: emisor (read-only) */}
            <FormItem>
              <FormLabel>DE:</FormLabel>
              <Input
                readOnly
                value={user?.nombreCompleto ?? ''}
                className="bg-muted/50"
              />
            </FormItem>

            {/* CARGO */}
            <FormItem>
              <FormLabel>CARGO:</FormLabel>
              <Input
                readOnly
                value={(user as { cargo?: string })?.cargo ?? ''}
                className="bg-muted/50"
              />
            </FormItem>

            {/* PROYECTO */}
            <FormField
              control={form.control}
              name="proyecto"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>PROYECTO:</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej. Rainforest Trust" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* CÓDIGO DE ACTIVIDAD (POA) */}
            <FormField
              control={form.control}
              name="poaId"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>
                    CÓDIGO DE ACTIVIDAD:{' '}
                    <span className="text-destructive">*</span>
                  </FormLabel>
                  <Select
                    disabled={loadingOpts}
                    value={field.value ? String(field.value) : ''}
                    onValueChange={(v) => field.onChange(Number(v))}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione la partida presupuestaria..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {poaOptions.map((p) => (
                        <SelectItem key={p.id} value={String(p.id)}>
                          {p.codigoPoa}
                          {p.actividad
                            ? ` — ${p.actividad.detalleDescripcion}`
                            : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedPoa && (
                    <p className="text-muted-foreground mt-1 text-xs">
                      Presupuesto: {formatMoney(Number(selectedPoa.costoTotal))}{' '}
                      Bs
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* CHEQUE A NOMBRE DE */}
            <FormField
              control={form.control}
              name="chequeANombreDe"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    CHEQUE A NOMBRE DE:{' '}
                    <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Nombre completo del beneficiario"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* MOTIVO DE SOLICITUD */}
            <FormField
              control={form.control}
              name="motivoSolicitud"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    MOTIVO DE SOLICITUD:{' '}
                    <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Ej. TALLER POA 2026" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* FECHA */}
            <FormItem>
              <FormLabel>FECHA DE SOLICITUD:</FormLabel>
              <Input
                readOnly
                value={new Date().toLocaleDateString('es-BO')}
                className="bg-muted/50"
              />
            </FormItem>
          </CardContent>
        </Card>

        {/* Tabla de ítems */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">DESCRIPCIÓN DEL GASTO</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ ...emptyItem })}
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
                    <TableHead className="w-[90px]">Cantidad</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="w-[120px]">
                      Uso
                      <span className="text-muted-foreground block text-[10px] font-normal">
                        Oficina / Campo
                      </span>
                    </TableHead>
                    <TableHead className="w-[130px]">P/Unit. (Bs)</TableHead>
                    <TableHead className="w-[130px] text-right">
                      Total (Bs)
                    </TableHead>
                    <TableHead className="w-[50px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fields.map((fieldRow, index) => {
                    const cantidad =
                      Number(watchedItems?.[index]?.cantidad) || 0;
                    const precio =
                      Number(watchedItems?.[index]?.costoUnitario) || 0;
                    const subtotal = cantidad * precio;

                    return (
                      <TableRow key={fieldRow.id}>
                        <TableCell>
                          <FormField
                            control={form.control}
                            name={`items.${index}.cantidad`}
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
                            name={`items.${index}.descripcion`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input
                                    placeholder="Descripción del gasto"
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
                            name={`items.${index}.uso`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input
                                    placeholder="Oficina / Campo"
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
                            name={`items.${index}.costoUnitario`}
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

            <p className="text-muted-foreground text-xs italic">
              * Se deben presentar facturas o recibos por estos gastos
            </p>
          </CardContent>
        </Card>

        {/* Observaciones */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Observaciones</CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="descripcion"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder="Observaciones adicionales..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Separator />

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/app/solicitudes-compra')}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            <Save className="mr-2 h-4 w-4" />
            {isEdit ? 'Guardar cambios' : 'Registrar solicitud'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
