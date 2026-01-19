'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
import NominaTercerosForm from '@/components/solicitudes/nomina-terceros-form';
import ReviewModal from '@/components/solicitudes/review-modal';
import SolicitudHeader from '@/components/solicitudes/solicitud-header';
import SolicitudFooter from '@/components/solicitudes/solicitud-footer';
import {
  formSchema,
  defaultValues,
  FormData,
  WizardStep,
} from '@/components/solicitudes/solicitud-schema';

export default function SolicitudPage() {
  const router = useRouter();
  const [step, setStep] = useState<WizardStep>('PLANIFICACION');
  const [loading, setLoading] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const watchActividades = form.watch('actividades');

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

  const handleBack = () => {
    if (step === 'SOLICITUD') setStep('PLANIFICACION');
    if (step === 'NOMINA') setStep('SOLICITUD');
  };

  const onSubmit = async (data: FormData) => {
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

  // VISTA EXCLUSIVA PASO 3 (NOMINA)
  if (step === 'NOMINA') {
    return (
      <div className="bg-background flex h-[calc(100vh-4rem)] w-full flex-col overflow-hidden">
        <SolicitudHeader step={step} />
        <Form {...form}>
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
            <SolicitudFooter
              step={step}
              onNext={handleNext}
              onBack={handleBack}
              loading={loading}
            />
          </div>
          <ReviewModal
            isOpen={isReviewModalOpen}
            onOpenChange={setIsReviewModalOpen}
            onSubmit={onSubmit}
            loading={loading}
          />
        </Form>
      </div>
    );
  }

  // VISTA COMPARTIDA PASOS 1 y 2
  return (
    <div className="bg-background flex h-[calc(100vh-4rem)] w-full flex-col overflow-hidden">
      <SolicitudHeader step={step} />

      <Form {...form}>
        <div className="relative flex flex-1 flex-col overflow-hidden">
          {/* ÁREA DE SCROLL */}
          <div className="flex-1 overflow-y-auto p-6">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleNext();
              }}
              className="space-y-6"
            >
              <div className="animate-in fade-in duration-500">
                {step === 'PLANIFICACION' && (
                  /* PASO 1: PLANIFICACIÓN */
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
                )}

                {step === 'SOLICITUD' && (
                  /* PASO 2: SOLICITUD ECONÓMICA */
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
                )}
              </div>
            </form>
          </div>

          <SolicitudFooter
            step={step}
            onNext={handleNext}
            onBack={handleBack}
            loading={loading}
          />
        </div>
        <ReviewModal
          isOpen={isReviewModalOpen}
          onOpenChange={setIsReviewModalOpen}
          onSubmit={onSubmit}
          loading={loading}
        />
      </Form>
    </div>
  );
}
