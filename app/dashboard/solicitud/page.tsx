'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Field,
  FieldLabel,
  FieldGroup,
  FieldSet,
  FieldLegend,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import SolicitudItems from '@/components/solicitudes/solicitud-items';
import SolicitudViajeItems from '@/components/solicitudes/solicitud-viaje-items';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import api from '@/lib/api';
import { toast } from 'sonner';
import {
  BudgetLine,
  FinancingSource,
  UserCatalog,
  PoaActivity,
} from '@/types/catalogs';

// Esquema Zod
const schema = z.object({
  // Campos visuales (No se envían directamente al DTO, se concatenan en description)
  destinatario: z.string().optional(),
  via: z.string().optional(),
  interino: z.boolean().optional(),
  copia: z.string().optional(),
  desembolso: z.string().optional(),
  proyecto: z.string().optional(),
  poaActivityId: z.string().optional(),
  codigoPOA: z.string().optional(),
  codigoProyecto: z.string().optional(),
  lugarViaje: z.string().optional(),
  fechaViaje: z.string().optional(),
  lugarSolicitud: z.string().optional(),
  fechaSolicitud: z.string().optional(),
  solicitante: z.string().optional(),
  fechaInicio: z.string().optional(),
  fechaFin: z.string().optional(),

  // Tabla 1: Conceptos de Viaje (Visual)
  viaticos: z
    .array(
      z.object({
        concepto: z.string().optional(),
        ciudad: z.string().optional(),
        destino: z.string().optional(),
        tipo: z.string().optional(),
        dias: z.number().optional(),
        personas: z.number().optional(),
      })
    )
    .optional(),

  // Campos del Backend
  motivo: z.string().min(1, 'El motivo es requerido'),
  items: z
    .array(
      z.object({
        description: z.string().min(1, 'El concepto es requerido'),
        budgetLineId: z.string().min(1, 'Partida requerida'),
        financingSourceId: z.string().min(1, 'Fuente requerida'),
        document: z.string().optional(),
        type: z.string().optional(),
        amount: z.number().min(0, 'Monto inválido'),
        quantity: z.coerce.number().min(1, 'Requerido'),
        unitCost: z.coerce.number().min(0, 'No negativo'),
      })
    )
    .min(1, 'Debes agregar al menos un ítem'),
});

export type FormData = z.infer<typeof schema>;

export default function SolicitudPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [options, setOptions] = useState<{
    budgetLines: BudgetLine[];
    financingSources: FinancingSource[];
    users: UserCatalog[];
    poaActivities: PoaActivity[];
  }>({
    budgetLines: [],
    financingSources: [],
    users: [],
    poaActivities: [],
  });

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      interino: false,
      items: [
        {
          description: 'Gasto',
          budgetLineId: '',
          financingSourceId: '',
          amount: 0,
          quantity: 1,
          unitCost: 0,
          document: '',
          type: '',
        },
      ],
      viaticos: [],
      // Valores por defecto para selects visuales
      destinatario: '',
      via: '',
      copia: '',
      desembolso: '',
      proyecto: '',
      poaActivityId: '',
      solicitante: '',
      fechaInicio: '',
      fechaFin: '',
      codigoPOA: '',
      codigoProyecto: '',
      lugarViaje: '',
      fechaViaje: '',
      lugarSolicitud: 'La Paz',
      fechaSolicitud: new Date().toISOString().split('T')[0],
      motivo: '',
    },
  });

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [blRes, fsRes, uRes, poaRes] = await Promise.all([
          api.get<BudgetLine[]>('/catalogs/budget-lines'),
          api.get<FinancingSource[]>('/catalogs/financing-sources'),
          api.get<UserCatalog[]>('/catalogs/users'),
          api.get<PoaActivity[]>('/catalogs/poa-activities'),
        ]);

        setOptions({
          budgetLines: blRes.data,
          financingSources: fsRes.data,
          users: uRes.data,
          poaActivities: poaRes.data,
        });
      } catch (error) {
        console.error('Error fetching catalogs:', error);
        toast.error('Error de Catálogos', {
          description:
            'No se pudieron cargar los datos de las listas. Intente recargar.',
        });
      } finally {
        setLoadingOptions(false);
      }
    };
    fetchOptions();
  }, []);

  const watchedProject = form.watch('proyecto');

  const projects = useMemo(() => {
    return Array.from(
      new Set(options.poaActivities.map((a) => a.project))
    ).sort();
  }, [options.poaActivities]);

  const filteredActivities = useMemo(() => {
    if (!watchedProject) return [];
    return options.poaActivities.filter((a) => a.project === watchedProject);
  }, [options.poaActivities, watchedProject]);

  const uniqueUsers = useMemo(() => {
    const seen = new Set();
    return options.users.filter((u) => {
      const duplicate = seen.has(u.name);
      seen.add(u.name);
      return !duplicate;
    });
  }, [options.users]);

  // Función para formatear moneda
  const formatBOB = (n: number) => {
    return new Intl.NumberFormat('es-BO', {
      style: 'currency',
      currency: 'BOB',
    }).format(n);
  };

  // Cálculo del monto total en tiempo real usando useWatch
  const watchedItems = useWatch({
    control: form.control,
    name: 'items',
  });

  const totalGeneral = (watchedItems || []).reduce(
    (acc, item) => acc + (Number(item?.amount) || 0),
    0
  );

  const handlePreSubmit = async () => {
    // Validar solo campos visibles antes de abrir el modal
    const isValid = await form.trigger([
      'motivo',
      'items',
      'viaticos',
      'codigoPOA',
      'lugarViaje',
      'fechaInicio',
      'fechaFin',
    ]);

    if (isValid) {
      setIsConfirmModalOpen(true);
    } else {
      toast.error('Formulario Incompleto', {
        description: 'Por favor, revisa los campos requeridos y los errores.',
      });
    }
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      // Transformación de datos para el Backend (Strict DTOs)
      const payload = {
        title: `${data.motivo || ''} - ${data.lugarViaje || ''}`.trim(),
        description: data.motivo,
        poaCode: data.codigoPOA,
        place: data.lugarViaje,
        startDate: data.fechaInicio
          ? new Date(data.fechaInicio).toISOString()
          : null,
        endDate: data.fechaFin ? new Date(data.fechaFin).toISOString() : null,
        receiverName: data.destinatario || '',
        refById: data.copia || null,
        disbursementToId: data.desembolso || null,
        poaActivityId: data.poaActivityId || null,
        viaticos:
          data.viaticos
            ?.filter((v) => v.concepto && v.concepto.trim() !== '')
            .map((v) => ({
              concept: v.concepto,
              city: v.ciudad,
              destination: v.destino,
              transportType: v.tipo,
              days: Number(v.dias),
              peopleCount: Number(v.personas),
            })) || [],
        items: data.items.map((item) => {
          const qty = Number(item.quantity) || 0;
          const cost = Number(item.unitCost) || 0;
          return {
            description:
              item.description ||
              `${item.document || ''} ${item.type || ''}`.trim() ||
              'Gasto',
            budgetLineId: item.budgetLineId, // Debe ser UUID string
            financingSourceId: item.financingSourceId, // Debe ser UUID string
            quantity: qty,
            unitCost: cost,
            amount: qty * cost,
          };
        }),
      };

      await api.post('/requests', payload);

      toast.success('Solicitud creada', {
        description: 'La solicitud ha sido enviada exitosamente.',
      });

      router.push('/dashboard/solicitudes');
    } catch (error) {
      console.error('Error creating request:', error);
      toast.error('Error', {
        description: 'No se pudo crear la solicitud. Intente nuevamente.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="flex-1 space-y-6 p-4 pt-0">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FieldGroup>
              <Separator />

              <FieldSet>
                <FieldLegend>Proyecto y Responsables</FieldLegend>
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="copia"
                    render={({ field }) => (
                      <Field>
                        <FieldLabel>Ref (Copia):</FieldLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          disabled={loadingOptions}
                        >
                          <SelectTrigger>
                            <SelectValue
                              placeholder={
                                loadingOptions ? 'Cargando...' : 'Selecciona'
                              }
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {uniqueUsers.map((u) => (
                              <SelectItem key={u.id} value={u.id}>
                                <span className="block w-full max-w-[280px] truncate">
                                  {u.name} - {u.position}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </Field>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="desembolso"
                    render={({ field }) => (
                      <Field>
                        <FieldLabel>Desembolso a Nombre De:</FieldLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          disabled={loadingOptions}
                        >
                          <SelectTrigger>
                            <SelectValue
                              placeholder={
                                loadingOptions ? 'Cargando...' : 'Selecciona'
                              }
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {uniqueUsers.map((u) => (
                              <SelectItem key={u.id} value={u.id}>
                                <span className="block w-full max-w-[280px] truncate">
                                  {u.name} - {u.position}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </Field>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="proyecto"
                    render={({ field }) => (
                      <Field>
                        <FieldLabel>Proyecto POA:</FieldLabel>
                        <Select
                          onValueChange={(val) => {
                            field.onChange(val);
                            form.setValue('poaActivityId', '');
                            form.setValue('codigoPOA', '');
                          }}
                          defaultValue={field.value}
                          disabled={loadingOptions}
                        >
                          <SelectTrigger>
                            <SelectValue
                              placeholder={
                                loadingOptions
                                  ? 'Cargando...'
                                  : 'Selecciona proyecto'
                              }
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {projects.map((p) => (
                              <SelectItem key={p} value={p}>
                                {p}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </Field>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="poaActivityId"
                    render={({ field }) => (
                      <Field>
                        <FieldLabel>Actividad / POA:</FieldLabel>
                        <Select
                          onValueChange={(val) => {
                            field.onChange(val);
                            const act = options.poaActivities.find(
                              (a) => a.id === val
                            );
                            if (act) {
                              form.setValue('codigoPOA', act.code);
                            }
                          }}
                          defaultValue={field.value}
                          disabled={!watchedProject || loadingOptions}
                        >
                          <SelectTrigger>
                            <SelectValue
                              placeholder={
                                !watchedProject
                                  ? 'Primero selecciona proyecto'
                                  : 'Selecciona actividad'
                              }
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {filteredActivities.map((a) => (
                              <SelectItem key={a.id} value={a.id}>
                                <span className="block w-full max-w-[350px] truncate">
                                  {a.code} - {a.description}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </Field>
                    )}
                  />
                </div>
              </FieldSet>

              <Separator />

              <FieldSet>
                <FieldLegend>Información del Viaje/Taller</FieldLegend>
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="codigoPOA"
                    render={({ field }) => (
                      <Field>
                        <FieldLabel>Código de Actividad POA</FieldLabel>
                        <FormControl>
                          <Input {...field} placeholder="Ej. 32113" />
                        </FormControl>
                      </Field>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="codigoProyecto"
                    render={({ field }) => (
                      <Field>
                        <FieldLabel>Código de Actividad Proyecto</FieldLabel>
                        <FormControl>
                          <Input {...field} placeholder="Ej. A.133" />
                        </FormControl>
                      </Field>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lugarViaje"
                    render={({ field }) => (
                      <Field className="md:col-span-2">
                        <FieldLabel>Lugar(es) de Viaje y/o Taller</FieldLabel>
                        <FormControl>
                          <Input {...field} placeholder="Ej. La Paz, Cobija" />
                        </FormControl>
                      </Field>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="fechaViaje"
                    render={({ field }) => (
                      <Field>
                        <FieldLabel>Fecha viaje y/o Taller</FieldLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                      </Field>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="motivo"
                    render={({ field }) => (
                      <Field className="md:col-span-2">
                        <FieldLabel>
                          Motivo del Viaje y/o Taller{' '}
                          <span className="text-red-500">*</span>
                        </FieldLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Descripción detallada del motivo"
                          />
                        </FormControl>
                        <FormMessage />
                      </Field>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4 md:col-span-2">
                    <FormField
                      control={form.control}
                      name="fechaInicio"
                      render={({ field }) => (
                        <Field>
                          <FieldLabel>Fecha Inicio</FieldLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                        </Field>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="fechaFin"
                      render={({ field }) => (
                        <Field>
                          <FieldLabel>Fecha Fin</FieldLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                        </Field>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="lugarSolicitud"
                    render={({ field }) => (
                      <Field>
                        <FieldLabel>Lugar de Solicitud</FieldLabel>
                        <FormControl>
                          <Input {...field} placeholder="Ej. La Paz" />
                        </FormControl>
                      </Field>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="fechaSolicitud"
                    render={({ field }) => (
                      <Field>
                        <FieldLabel>Fecha Solicitud</FieldLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                      </Field>
                    )}
                  />
                </div>
              </FieldSet>

              <Separator />

              <FieldSet>
                <FieldLegend>Conceptos de Viaje</FieldLegend>
                <SolicitudViajeItems control={form.control} />
              </FieldSet>

              <Separator />

              <FieldSet>
                <FieldLegend>
                  Conceptos (detalle) <span className="text-red-500">*</span>
                </FieldLegend>
                <div className="p-1">
                  {form.formState.errors.items?.root && (
                    <p className="text-destructive mb-2 text-sm font-medium">
                      {form.formState.errors.items.root.message}
                    </p>
                  )}
                  {form.formState.errors.items &&
                    !form.formState.errors.items.root && (
                      <p className="text-destructive mb-2 text-sm font-medium">
                        Revisa los errores en los ítems.
                      </p>
                    )}
                  <SolicitudItems
                    control={form.control}
                    watch={form.watch}
                    budgetLines={options.budgetLines}
                    financingSources={options.financingSources}
                    isLoading={loadingOptions}
                    totalAmount={totalGeneral}
                  />
                </div>
              </FieldSet>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="secondary" onClick={() => {}}>
                  Guardar Borrador
                </Button>
                <Button type="button" onClick={handlePreSubmit}>
                  Revisar y Enviar
                </Button>
              </div>
            </FieldGroup>

            {/* Modal de Confirmación */}
            <Dialog
              open={isConfirmModalOpen}
              onOpenChange={setIsConfirmModalOpen}
            >
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Confirmar Solicitud</DialogTitle>
                  <DialogDescription>
                    Resumen de la solicitud antes del envío final.
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-muted-foreground text-sm font-medium">
                      Monto Total:
                    </p>
                    <p className="text-primary text-2xl font-bold">
                      {formatBOB(totalGeneral)}
                    </p>
                  </div>

                  <FormField
                    control={form.control}
                    name="destinatario"
                    render={({ field }) => (
                      <Field>
                        <FieldLabel>Dirigido a (Destinatario):</FieldLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          disabled={loadingOptions}
                        >
                          <SelectTrigger>
                            <SelectValue
                              placeholder={
                                loadingOptions
                                  ? 'Cargando usuarios...'
                                  : 'Selecciona destinatario'
                              }
                            />
                          </SelectTrigger>
                          <SelectContent className="max-h-[200px]">
                            {uniqueUsers.map((u) => (
                              <SelectItem key={u.id} value={u.name}>
                                <span className="block w-full max-w-[380px] truncate">
                                  {u.name} - {u.position}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </Field>
                    )}
                  />
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsConfirmModalOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading || !form.watch('destinatario')}
                    onClick={form.handleSubmit(onSubmit)}
                  >
                    {loading ? 'Enviando...' : 'Confirmar y Enviar'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </form>
        </Form>
      </div>
    </div>
  );
}
