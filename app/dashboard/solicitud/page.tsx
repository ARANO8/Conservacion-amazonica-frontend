'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
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

import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormMessage,
} from '@/components/ui/form';
import PlanificacionActividades from '@/components/solicitudes/planificacion-actividades';
import SolicitudEconomica from '@/components/solicitudes/solicitud-economica';
import { toast } from 'sonner';
import NominaTercerosForm from '@/components/solicitudes/nomina-terceros-form';
import ReviewModal from '@/components/solicitudes/review-modal';
import SolicitudHeader from '@/components/solicitudes/solicitud-header';
import SolicitudFooter from '@/components/solicitudes/solicitud-footer';
import { solicitudesService } from '@/lib/services/solicitudes-service';
import { adaptFormToPayload } from '@/lib/adapters/solicitud-adapter';
import { presupuestosService } from '@/services/presupuestos.service';
import { PresupuestoReserva } from '@/types/backend';
import {
  formSchema,
  defaultValues,
  FormData,
  WizardStep,
} from '@/components/solicitudes/solicitud-schema';
import { useCatalogos } from '@/hooks/use-catalogos';
import { Loader2, AlertTriangle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function SolicitudPage() {
  const router = useRouter();
  const [step, setStep] = useState<WizardStep>('PLANIFICACION');
  const [loading, setLoading] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [misReservas, setMisReservas] = useState<PresupuestoReserva[]>([]);
  const [showBudgetWarning, setShowBudgetWarning] = useState(false);

  const { conceptos, tiposGasto, usuarios, poaCodes, isLoading } =
    useCatalogos();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  // Carga inicial de reservas activas
  useEffect(() => {
    const fetchReservas = async () => {
      try {
        const data = await presupuestosService.getMisReservas();
        setMisReservas(data);
        if (data.length > 0) {
          form.setValue(
            'presupuestosIds',
            data.map((r) => r.id)
          );
        }
      } catch (error) {
        console.error('Error al cargar reservas:', error);
        toast.error('No se pudieron cargar tus reservas activas');
      }
    };
    fetchReservas();
  }, [form]);

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
        // Validación de Presupuestos: Verificar que todos los viáticos/gastos tengan reserva
        const watchViaticos = form.getValues('viaticos') || [];
        const watchGastos = form.getValues('items') || [];

        const tieneViaticosSinReserva = watchViaticos.some(
          (v) => !v.solicitudPresupuestoId
        );
        const tieneGastosSinReserva = watchGastos.some(
          (g) => !g.solicitudPresupuestoId
        );

        if (tieneViaticosSinReserva || tieneGastosSinReserva) {
          toast.error(
            'Todos los ítems deben estar vinculados a una fuente de financiamiento'
          );
          return;
        }

        // Budget Balance Validation
        for (const reserva of misReservas) {
          const totalSolicitado =
            watchViaticos
              .filter((v) => v.solicitudPresupuestoId === reserva.id)
              .reduce((sum, v) => sum + (Number(v.montoNeto) || 0), 0) +
            watchGastos
              .filter((g) => g.solicitudPresupuestoId === reserva.id)
              .reduce((sum, g) => sum + (Number(g.montoNeto) || 0), 0);

          const saldoDisponibleReal = Number(
            reserva.poa?.saldoDisponible ?? reserva.poa?.costoTotal ?? 0
          );

          if (totalSolicitado > saldoDisponibleReal + 0.01) {
            const exceso = totalSolicitado - saldoDisponibleReal;
            toast.error(
              `Saldo Insuficiente en ${reserva.poa?.codigoPoa}:
              Disponible: Bs ${saldoDisponibleReal.toFixed(2)}
              Solicitado: Bs ${totalSolicitado.toFixed(2)}
              Exceso: Bs ${exceso.toFixed(2)}`,
              { duration: 5000 }
            );
            return;
          }
        }

        setStep('NOMINA');
        window.scrollTo(0, 0);
      } else {
        toast.error('Corrige los errores en la solicitud de fondos');
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
    const aprobadorId = Number(data.destinatario);

    if (!aprobadorId) {
      toast.error('Por favor, selecciona un destinatario (aprobador)');
      return;
    }

    setLoading(true);
    try {
      const payload = adaptFormToPayload(data, aprobadorId);
      console.log(
        '🚀 PAYLOAD FINAL PARA EL BACKEND:',
        JSON.stringify(payload, null, 2)
      );

      // Enviar la solicitud al backend
      await solicitudesService.createSolicitud(payload);

      toast.success('Solicitud enviada exitosamente');
      router.push('/dashboard/requests');
    } catch (error: unknown) {
      console.error('Error al enviar la solicitud:', error);

      let errorMessage = 'Ocurrió un error al procesar la solicitud';

      if (axios.isAxiosError(error)) {
        errorMessage = error.response?.data?.message || errorMessage;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
    } finally {
      setLoading(false);
      setIsReviewModalOpen(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="text-primary size-10 animate-spin" />
        <span className="text-muted-foreground ml-3 text-sm">
          Cargando catálogos...
        </span>
      </div>
    );
  }

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
                                  placeholder="Describe el propósito de esta movilización"
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
                  <SolicitudEconomica
                    control={form.control}
                    watchActividades={watchActividades || []}
                    conceptos={conceptos}
                    tiposGasto={tiposGasto}
                    poaCodes={poaCodes}
                    misReservas={misReservas}
                    setMisReservas={setMisReservas}
                  />
                )}

                {step === 'NOMINA' && (
                  <NominaTercerosForm control={form.control} />
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
          usuarios={usuarios}
          misReservas={misReservas}
        />

        <AlertDialog
          open={showBudgetWarning}
          onOpenChange={setShowBudgetWarning}
        >
          <AlertDialogContent className="max-w-md">
            <AlertDialogHeader className="flex flex-col items-center text-center">
              <div className="bg-destructive/10 mb-4 flex h-12 w-12 items-center justify-center rounded-full">
                <AlertTriangle className="text-destructive h-6 w-6" />
              </div>
              <AlertDialogTitle className="text-xl font-bold">
                Presupuesto Excedido
              </AlertDialogTitle>
              <AlertDialogDescription>
                El monto total solicitado supera el saldo disponible. Por favor
                ajuste los montos.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="sm:justify-center">
              <AlertDialogAction
                onClick={() => setShowBudgetWarning(false)}
                className="bg-destructive hover:bg-destructive/90 w-full sm:w-auto"
              >
                Entendido
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Form>
    </div>
  );
}
