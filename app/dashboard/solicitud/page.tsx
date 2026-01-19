'use client';

import { useState, useMemo } from 'react';
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
  FormMessage,
} from '@/components/ui/form';
import SolicitudViaticos from '@/components/solicitudes/solicitud-viaticos';
import SolicitudGastos from '@/components/solicitudes/solicitud-gastos';
import PlanificacionActividades from '@/components/solicitudes/planificacion-actividades';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { formatMoney } from '@/lib/utils';
import NominaTercerosForm from '@/components/solicitudes/nomina-terceros-form';
import ReviewModal from '@/components/solicitudes/review-modal';

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
  interino: z.boolean().optional(),
  proyecto: z.string().optional(),
  codigoPOA: z.string().optional(),
  grupo: z.string().optional(),
  partida: z.string().optional(),
  codigoProyecto: z.string().optional(),
  lugarSolicitud: z.string().optional(),
  fechaSolicitud: z.string().optional(),
  solicitante: z.string().optional(),
  fechaInicio: z.string().optional(),
  fechaFin: z.string().optional(),

  // Tabla 1: Viáticos / Pasajes
  viaticos: z
    .array(
      z.object({
        concepto: z.string().optional(),
        planificacionId: z.string().optional(),
        tipo: z.string().optional(),
        dias: z.number().optional(),
        personas: z.number().optional(),
        unitCost: z.number().optional(),
        amount: z.number().optional(),
      })
    )
    .optional(),

  // Campos del Backend (Gastos)
  motivo: z.string().min(1, 'El motivo es requerido'),
  items: z
    .array(
      z.object({
        groupId: z.string().optional(),
        budgetLineId: z.string().optional(),
        document: z.string().optional(),
        typeId: z.string().optional(),
        amount: z.number().min(0, 'Monto inválido'),
        quantity: z.number().min(0).optional(),
        unitCost: z.number().min(0).optional(),
        description: z.string().optional(),
        financingSourceId: z.string().optional(),
      })
    )
    .min(1, 'Debes agregar al menos un ítem'),
  // Nómina de Terceros (Paso 3)
  nomina: z
    .array(
      z.object({
        nombreCompleto: z.string().min(1, 'El nombre completo es requerido'),
        institucion: z.string().min(1, 'La institución es requerida'),
      })
    )
    .optional(),

  // Confirmación Final
  destinatario: z.string().min(1, 'Debes seleccionar un destinatario'),
});

export type FormData = z.infer<typeof schema>;

type WizardStep = 'PLANIFICACION' | 'SOLICITUD' | 'NOMINA';

export default function SolicitudPage() {
  const router = useRouter();
  const [step, setStep] = useState<WizardStep>('PLANIFICACION');
  const [loading, setLoading] = useState(false);

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
          groupId: '',
          budgetLineId: '42858360-665d-4503-926b-dea2fba56e7a',
          document: 'Factura',
          typeId: '',
          quantity: 1,
          unitCost: 0,
          amount: 0,
          description: '',
          financingSourceId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        },
      ],
      viaticos: [
        {
          concepto: 'viaticos',
          planificacionId: '',
          tipo: 'institucional',
          dias: 1,
          personas: 1,
          unitCost: 0,
          amount: 0,
        },
      ],
      proyecto: 'aaf',
      codigoPOA: '',
      grupo: '',
      partida: '',
      codigoProyecto: '',
      solicitante: 'usuario',
      fechaInicio: '',
      fechaFin: '',
      lugarSolicitud: 'La Paz',
      fechaSolicitud: new Date().toISOString().split('T')[0],
      motivo: '',
      nomina: [],
      destinatario: '',
    },
  });

  const watchActividades = form.watch('actividades');

  // Observar cambios para el Monitor de Presupuesto (Paso 2)
  const watchViaticos = useWatch({ control: form.control, name: 'viaticos' });
  const watchItems = useWatch({ control: form.control, name: 'items' });

  const totalRequested = useMemo(() => {
    const vTotal = (watchViaticos || []).reduce(
      (acc, v) => acc + (v?.amount || 0),
      0
    );
    const iTotal = (watchItems || []).reduce(
      (acc, i) => acc + (i?.amount || 0),
      0
    );
    return vTotal + iTotal;
  }, [watchViaticos, watchItems]);

  const assignedBudget = 20000; // Bs 20,000.00 Estático Temporal
  const budgetBalance = assignedBudget - totalRequested;

  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  const handleNext = async () => {
    if (step === 'PLANIFICACION') {
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
      return;
    }

    if (step === 'SOLICITUD') {
      const isValid = await form.trigger(['motivo', 'items', 'viaticos']);
      if (isValid) {
        setStep('NOMINA');
        window.scrollTo(0, 0);
      } else {
        toast.error('Corrige los errores en la solicitud económica');
      }
      return;
    }

    if (step === 'NOMINA') {
      const isValid = await form.trigger(['nomina']);
      if (isValid) {
        setIsReviewModalOpen(true);
      } else {
        toast.error('Corrige los errores en la nómina');
      }
      return;
    }
  };

  const onSubmit = async (data: FormData) => {
    // Final submission logic (triggered from Modal)
    setLoading(true);
    try {
      console.log('ENVIANDO DATOS:', data);
      toast.success('Solicitud enviada exitosamente');
      router.push('/dashboard/solicitudes');
    } catch (error) {
      console.error(error);
      toast.error('Error al enviar la solicitud');
    } finally {
      setLoading(false);
      setIsReviewModalOpen(false);
    }
  };

  return (
    <div className="bg-background flex h-[calc(100vh-4rem)] w-full flex-col overflow-hidden">
      {/* 1. CABECERA (Breadcrumbs + Título) - Fija */}
      <div className="shrink-0 border-b p-4 px-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">
            {step === 'PLANIFICACION' && '1. Planificación'}
            {step === 'SOLICITUD' && '2. Solicitud Económica'}
            {step === 'NOMINA' && '3. Nómina de Terceros'}
          </h1>
          <div className="bg-muted flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium">
            <span
              className={
                step === 'PLANIFICACION'
                  ? 'text-primary font-bold'
                  : 'text-muted-foreground'
              }
            >
              1. Planificación
            </span>
            <ChevronRight className="text-muted-foreground h-3 w-3" />
            <span
              className={
                step === 'SOLICITUD'
                  ? 'text-primary font-bold'
                  : 'text-muted-foreground'
              }
            >
              2. Solicitud
            </span>
            <ChevronRight className="text-muted-foreground h-3 w-3" />
            <span
              className={
                step === 'NOMINA'
                  ? 'text-primary font-bold'
                  : 'text-muted-foreground'
              }
            >
              3. Nómina
            </span>
          </div>
        </div>
      </div>

      <Form {...form}>
        <ReviewModal
          isOpen={isReviewModalOpen}
          onOpenChange={setIsReviewModalOpen}
          onSubmit={onSubmit}
          loading={loading}
        />
        {step === 'PLANIFICACION' && (
          /* PASO 1: PLANIFICACIÓN */
          <div className="flex flex-1 flex-col overflow-hidden">
            {/* ZONA 1: ÁREA DE SCROLL */}
            <div className="flex-1 overflow-y-auto p-6">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleNext();
                }}
                className="space-y-6"
              >
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
              </form>
            </div>

            {/* ZONA 2: FOOTER FIJO */}
            <div className="bg-background z-50 shrink-0 border-t p-4 px-6 md:pb-6">
              <div className="flex w-full justify-end">
                <Button
                  type="button"
                  size="lg"
                  onClick={handleNext}
                  className="shadow-lg"
                >
                  Siguiente Formulario <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {step === 'SOLICITUD' && (
          /* PASO 2: SOLICITUD ECONÓMICA */
          <div className="relative flex flex-1 flex-col overflow-hidden">
            {/* ZONA 1: ÁREA DE SCROLL */}
            <div className="flex-1 overflow-y-auto p-6">
              <form
                id="solicitud-form"
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <div className="animate-in fade-in duration-500">
                  <FieldGroup className="space-y-6">
                    {/* SECCIÓN 1: PROYECTOS */}
                    <FieldSet>
                      <FieldLegend>Proyectos</FieldLegend>
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <FormField
                          control={form.control}
                          name="codigoPOA"
                          render={({ field }) => (
                            <Field>
                              <FieldLabel>Código POA</FieldLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Seleccionar..." />
                                </SelectTrigger>
                                <SelectContent side="bottom" align="start">
                                  {/* Opciones vacías por ahora */}
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
                              <FieldLabel>Proyecto</FieldLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent side="bottom" align="start">
                                  <SelectItem value="aaf">
                                    AAF FORTALECIMIENTO
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </Field>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="grupo"
                          render={({ field }) => (
                            <Field>
                              <FieldLabel>Grupo</FieldLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Seleccionar..." />
                                </SelectTrigger>
                                <SelectContent side="bottom" align="start">
                                  {/* Opciones vacías por ahora */}
                                </SelectContent>
                              </Select>
                            </Field>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="partida"
                          render={({ field }) => (
                            <Field>
                              <FieldLabel>Partida</FieldLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Seleccionar..." />
                                </SelectTrigger>
                                <SelectContent side="bottom" align="start">
                                  {/* Opciones vacías por ahora */}
                                </SelectContent>
                              </Select>
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
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Seleccionar..." />
                                </SelectTrigger>
                                <SelectContent side="bottom" align="start">
                                  {/* Opciones vacías por ahora */}
                                </SelectContent>
                              </Select>
                            </Field>
                          )}
                        />
                      </div>
                    </FieldSet>

                    <Separator />

                    {/* SECCIÓN 2: INFORMACIÓN DEL VIAJE/TALLER */}
                    <FieldSet>
                      <FieldLegend>Información del Viaje/Taller</FieldLegend>
                      <div className="grid gap-4 md:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="motivo"
                          render={({ field }) => (
                            <Field className="md:col-span-2">
                              <FieldLabel>
                                Motivo <span className="text-red-500">*</span>
                              </FieldLabel>
                              <FormControl>
                                <Textarea
                                  {...field}
                                  placeholder="Explicar motivo de la comisión..."
                                  className="min-h-24"
                                />
                              </FormControl>
                              <FormMessage />
                            </Field>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="planificacionLugares"
                          render={({ field }) => (
                            <Field className="md:col-span-2">
                              <FieldLabel>
                                Lugar del viaje y/o taller{' '}
                                <span className="text-red-500">*</span>
                              </FieldLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="Ej. Riberalta, Puerto Maldonado..."
                                />
                              </FormControl>
                              <FormMessage />
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
                      <FieldLegend>Viáticos / Pasajes</FieldLegend>
                      <SolicitudViaticos
                        control={form.control}
                        actividadesPlanificadas={watchActividades || []}
                      />
                    </FieldSet>

                    <Separator />

                    <FieldSet>
                      <FieldLegend>
                        Otros Gastos <span className="text-red-500">*</span>
                      </FieldLegend>
                      <SolicitudGastos control={form.control} />
                    </FieldSet>
                  </FieldGroup>
                </div>
              </form>
            </div>

            {/* ZONA 2: FOOTER FIJO (MONITOR Y NAVEGACIÓN) */}
            <div className="bg-background z-50 shrink-0 border-t p-4 px-6 md:pb-6">
              <div className="flex items-center justify-between">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={() => setStep('PLANIFICACION')}
                >
                  <ChevronLeft className="mr-2 h-4 w-4" /> Atrás
                </Button>

                <div className="flex items-center gap-8">
                  {/* MONITOR DE PRESUPUESTO */}
                  <div className="hidden items-center gap-6 text-sm sm:flex">
                    <div className="flex flex-col items-end">
                      <span className="text-muted-foreground text-[10px] leading-tight font-bold tracking-wider uppercase">
                        Presupuesto
                      </span>
                      <span className="font-semibold">
                        {formatMoney(assignedBudget)}
                      </span>
                    </div>
                    <div className="bg-border h-8 w-[1px]" />
                    <div className="flex flex-col items-end">
                      <span className="text-muted-foreground text-[10px] leading-tight font-bold tracking-wider uppercase">
                        Total Solicitado
                      </span>
                      <span className="text-primary font-bold">
                        {formatMoney(totalRequested)}
                      </span>
                    </div>
                    <div className="bg-border h-8 w-[1px]" />
                    <div className="flex flex-col items-end">
                      <span className="text-muted-foreground text-[10px] leading-tight font-bold tracking-wider uppercase">
                        Saldo
                      </span>
                      <span
                        className={`font-black ${
                          budgetBalance < 0
                            ? 'text-destructive animate-bounce'
                            : 'text-emerald-600'
                        }`}
                      >
                        {formatMoney(budgetBalance)}
                      </span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    onClick={handleNext}
                    disabled={loading}
                    size="lg"
                    className="min-w-[200px] shadow-lg"
                  >
                    {loading ? 'Procesando...' : 'Siguiente Formulario'}
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 'NOMINA' && (
          /* PASO 3: NÓMINA DE TERCEROS */
          <div className="flex flex-1 flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6">
              <form
                id="nomina-form"
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <div className="animate-in fade-in duration-500">
                  <NominaTercerosForm control={form.control} />
                </div>
              </form>
            </div>

            <div className="bg-background z-50 shrink-0 border-t p-4 px-6 md:pb-6">
              <div className="flex w-full justify-between">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={() => setStep('SOLICITUD')}
                >
                  <ChevronLeft className="mr-2 h-4 w-4" /> Atrás
                </Button>
                <Button
                  type="button"
                  onClick={handleNext}
                  size="lg"
                  className="shadow-lg"
                >
                  Revisar y Enviar <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </Form>
    </div>
  );
}
