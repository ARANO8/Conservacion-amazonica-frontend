'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
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
  FormMessage,
} from '@/components/ui/form';
import SolicitudItems from '@/components/solicitudes/solicitud-items';
import SolicitudViajeItems from '@/components/solicitudes/solicitud-viaje-items';
import PlanificacionActividades from '@/components/solicitudes/planificacion-actividades';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// Esquema Zod
const schema = z.object({
  // Campos de Planificación (Paso 1)
  planificacionLugares: z
    .string()
    .min(1, 'Lugar/es del viaje y/o taller es/son requerido/s'),
  planificacionObjetivo: z.string().min(1, 'El objetivo es requerido'),
  actividades: z
    .array(
      z.object({
        fechaInicio: z.string().min(1, 'Fecha inicio requerida'),
        fechaFin: z.string().min(1, 'Fecha fin requerida'),
        cantDias: z.number().optional(),
        actividadProgramada: z.string().min(1, 'Actividad requerida'),
        cantInstitucion: z.number().min(0),
        cantTerceros: z.number().min(0),
      })
    )
    .min(1, 'Debes agregar al menos una actividad'),

  // Campos visuales de Solicitud (Paso 2)
  destinatario: z.string().optional(),
  via: z.string().optional(),
  interino: z.boolean().optional(),
  copia: z.string().optional(),
  desembolso: z.string().optional(),
  proyecto: z.string().optional(),
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
        quantity: z.number().min(0).optional(),
        unitCost: z.number().min(0).optional(),
      })
    )
    .min(1, 'Debes agregar al menos un ítem'),
});

export type FormData = z.infer<typeof schema>;

type WizardStep = 'PLANIFICACION' | 'SOLICITUD';

export default function SolicitudPage() {
  const router = useRouter();
  const [step, setStep] = useState<WizardStep>('PLANIFICACION');
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<{
    budgetLines: { id: string; code: string; name: string }[];
    financingSources: { id: string; code: string; name: string }[];
  }>({
    budgetLines: [],
    financingSources: [],
  });

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      planificacionLugares: '',
      planificacionObjetivo: '',
      actividades: [
        {
          fechaInicio: new Date().toISOString().split('T')[0],
          fechaFin: new Date().toISOString().split('T')[0],
          cantDias: 1,
          actividadProgramada: '',
          cantInstitucion: 0,
          cantTerceros: 0,
        },
      ],
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
      destinatario: 'director',
      via: 'director-programa',
      copia: 'abraham',
      desembolso: 'abraham',
      proyecto: 'aaf',
      solicitante: 'usuario',
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
    const STATIC_BUDGET_LINES = [
      {
        id: '42858360-665d-4503-926b-dea2fba56e7a',
        code: '22110',
        name: 'Pasajes al Interior del Pais',
      },
    ];
    const STATIC_FINANCING_SOURCES = [
      {
        id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        code: 'RECURSOS PROPIOS',
        name: 'RECURSOS PROPIOS',
      },
    ];

    setOptions({
      budgetLines: STATIC_BUDGET_LINES,
      financingSources: STATIC_FINANCING_SOURCES,
    });
  }, []);

  const goToNext = async () => {
    // Validar solo campos de planificación
    const isValid = await form.trigger([
      'planificacionLugares',
      'planificacionObjetivo',
      'actividades',
    ]);
    if (isValid) {
      setStep('SOLICITUD');
      window.scrollTo(0, 0);
    } else {
      toast.error('Corrige los errores en la planificación');
    }
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const payload = {
        title: `${data.motivo || ''} - ${data.lugarViaje || ''}`.trim(),
        description: data.motivo,
        poaCode: data.codigoPOA,
        place: data.lugarViaje,
        // ... (resto de la lógica de payload)
      };

      console.log('PAYLOAD FINAL:', payload);
      toast.success('Solicitud enviada exitosamente');
      router.push('/dashboard/solicitudes');
    } catch (error) {
      console.error(error);
      toast.error('Error al enviar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="flex-1 space-y-6 p-4 pt-0">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">
            {step === 'PLANIFICACION'
              ? '1. Planificación'
              : '2. Solicitud Económica'}
          </h1>
          <div className="bg-muted flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium">
            <span
              className={
                step === 'PLANIFICACION'
                  ? 'text-primary'
                  : 'text-muted-foreground'
              }
            >
              Planificación
            </span>
            <ChevronRight className="text-muted-foreground h-3 w-3" />
            <span
              className={
                step === 'SOLICITUD' ? 'text-primary' : 'text-muted-foreground'
              }
            >
              Solicitud
            </span>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {step === 'PLANIFICACION' ? (
              /* Contenedor Maestro: Ocupamos el alto disponible para manejar scroll interno */
              <div className="-mx-4 flex h-[calc(100vh-12rem)] flex-col overflow-hidden">
                {/* ZONA 1: ÁREA DE SCROLL (Formulario y Tabla) */}
                <div className="flex-1 overflow-y-auto">
                  <div className="w-full space-y-6 p-6 pb-24">
                    <div className="animate-in fade-in duration-500">
                      <FieldGroup>
                        <FieldSet>
                          <FieldLegend>
                            Información General del Viaje/Taller
                          </FieldLegend>
                          <div className="grid gap-4">
                            <FormField
                              control={form.control}
                              name="planificacionLugares"
                              render={({ field }) => (
                                <Field>
                                  <FieldLabel>
                                    Lugar/es del viaje y/o taller
                                  </FieldLabel>
                                  <FormControl>
                                    <Input
                                      {...field}
                                      placeholder="Ej. La Paz - Santa Cruz - Beni"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </Field>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="planificacionObjetivo"
                              render={({ field }) => (
                                <Field>
                                  <FieldLabel>
                                    Objetivo del Viaje / Taller
                                  </FieldLabel>
                                  <FormControl>
                                    <Textarea
                                      {...field}
                                      placeholder="Describe brevemente el propósito de esta movilización"
                                      className="min-h-24"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </Field>
                              )}
                            />
                          </div>
                        </FieldSet>

                        <Separator />

                        <FieldSet>
                          <FieldLegend>Cronograma de Actividades</FieldLegend>
                          <PlanificacionActividades
                            control={form.control}
                            setValue={form.setValue}
                          />
                        </FieldSet>
                      </FieldGroup>
                    </div>
                  </div>
                </div>

                {/* ZONA 2: FOOTER FIJO (Botón) */}
                <div className="bg-background z-50 mt-auto border-t">
                  <div className="flex w-full justify-end p-4 px-6">
                    <Button
                      type="button"
                      size="lg"
                      onClick={goToNext}
                      className="shadow-lg"
                    >
                      Siguiente Formulario{' '}
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="animate-in slide-in-from-right-5 space-y-6 duration-500">
                <FieldGroup>
                  {/* Formulario de Solicitud Reutilizado */}
                  <FieldSet>
                    <FieldLegend>Datos de Destinatario</FieldLegend>
                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="destinatario"
                        render={({ field }) => (
                          <Field>
                            <FieldLabel>A:</FieldLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="director">
                                  Marcos F. Terán Valenzuela
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </Field>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="via"
                        render={({ field }) => (
                          <Field>
                            <FieldLabel>Vía:</FieldLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="director-programa">
                                  Daniel Marcelo Larrea Alcázar
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </Field>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="solicitante"
                        render={({ field }) => (
                          <Field>
                            <FieldLabel>De (Solicitante):</FieldLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="usuario">
                                  Usuario Actual
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </Field>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="interino"
                        render={({ field }) => (
                          <Field className="flex items-end gap-3 pb-2">
                            <div className="flex items-center gap-2">
                              <input
                                id="interino"
                                type="checkbox"
                                checked={field.value}
                                onChange={field.onChange}
                                className="border-input bg-background size-4 border"
                              />
                              <label htmlFor="interino" className="text-sm">
                                Interino
                              </label>
                            </div>
                          </Field>
                        )}
                      />
                    </div>
                  </FieldSet>

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
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="abraham">
                                  ABRAHAM SALOMÓN POMA
                                </SelectItem>
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
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="abraham">
                                  ABRAHAM SALOMÓN POMA
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </Field>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="proyecto"
                        render={({ field }) => (
                          <Field className="md:col-span-2">
                            <FieldLabel>Proyecto / Actividad POA:</FieldLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="aaf">
                                  AAF FORTALECIMIENTO
                                </SelectItem>
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
                              <Input {...field} />
                            </FormControl>
                          </Field>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="codigoProyecto"
                        render={({ field }) => (
                          <Field>
                            <FieldLabel>
                              Código de Actividad Proyecto
                            </FieldLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                          </Field>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="lugarViaje"
                        render={({ field }) => (
                          <Field className="md:col-span-2">
                            <FieldLabel>
                              Lugar(es) de Viaje y/o Taller
                            </FieldLabel>
                            <FormControl>
                              <Input {...field} />
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
                              Motivo <span className="text-red-500">*</span>
                            </FieldLabel>
                            <FormControl>
                              <Textarea {...field} />
                            </FormControl>
                            <FormMessage />
                          </Field>
                        )}
                      />
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
                      <FormField
                        control={form.control}
                        name="lugarSolicitud"
                        render={({ field }) => (
                          <Field>
                            <FieldLabel>Lugar de Solicitud</FieldLabel>
                            <FormControl>
                              <Input {...field} />
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
                    <FieldLegend>
                      Conceptos de Viaje (Viáticos/Pasajes)
                    </FieldLegend>
                    <SolicitudViajeItems control={form.control} />
                  </FieldSet>

                  <Separator />

                  <FieldSet>
                    <FieldLegend>
                      Conceptos (Gastos Operativos){' '}
                      <span className="text-red-500">*</span>
                    </FieldLegend>
                    <SolicitudItems
                      control={form.control}
                      watch={form.watch}
                      budgetLines={options.budgetLines}
                      financingSources={options.financingSources}
                    />
                  </FieldSet>

                  <div className="flex justify-between pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep('PLANIFICACION')}
                    >
                      <ChevronLeft className="mr-2 h-4 w-4" /> Atrás
                    </Button>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => toast.info('Borrador guardado')}
                      >
                        Guardar Borrador
                      </Button>
                      <Button type="submit" disabled={loading}>
                        {loading ? 'Enviando...' : 'Enviar Solicitud'}
                      </Button>
                    </div>
                  </div>
                </FieldGroup>
              </div>
            )}
          </form>
        </Form>
      </div>
    </div>
  );
}
