'use client';

import { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { useForm, FieldErrors } from 'react-hook-form';
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
import SolicitudRespaldos from '@/components/solicitudes/solicitud-respaldos';
import ReviewModal from '@/components/solicitudes/review-modal';
import SolicitudHeader from '@/components/solicitudes/solicitud-header';
import SolicitudFooter from '@/components/solicitudes/solicitud-footer';
import { solicitudesService } from '@/lib/services/solicitudes-service';
import { adaptFormToPayload } from '@/lib/adapters/solicitud-adapter';
import { SeleccionPresupuesto, PoaStructureItem, Poa } from '@/types/backend';
import {
  formSchema,
  defaultValues,
  FormData,
  WizardStep,
} from '@/components/solicitudes/solicitud-schema';
import { useCatalogos } from '@/hooks/use-catalogos';
import { usePreventNavigation } from '@/hooks/use-prevent-navigation';
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
import { useAuthStore } from '@/store/auth-store';

function normalizeInitialSelections(
  fuentesSeleccionadas: FormData['fuentesSeleccionadas']
): SeleccionPresupuesto[] {
  const normalizePoa = (
    poa: NonNullable<FormData['fuentesSeleccionadas']>[number]['poa']
  ): Poa | undefined => {
    if (!poa) {
      return undefined;
    }

    return {
      id: poa.id,
      codigoPoa: poa.codigoPoa,
      cantidad: poa.cantidad ?? 0,
      costoUnitario: poa.costoUnitario ?? 0,
      costoTotal: Number(poa.costoTotal ?? 0),
      saldoDisponible: poa.saldoDisponible,
      montoComprometido: poa.montoComprometido,
      tieneCompromisos: poa.tieneCompromisos,
      proyectoId: poa.proyectoId ?? poa.estructura?.proyecto?.id ?? 0,
      grupoId: poa.grupoId ?? poa.estructura?.grupo?.id ?? 0,
      partidaId: poa.partidaId ?? poa.estructura?.partida?.id ?? 0,
      actividadId: poa.actividadId ?? poa.actividad?.id ?? 0,
      codigoPresupuestarioId: poa.codigoPresupuestarioId ?? poa.id,
      actividad: poa.actividad
        ? {
            id: poa.actividad.id ?? 0,
            nombre:
              poa.actividad.nombre ??
              poa.actividad.detalleDescripcion ??
              `Actividad ${poa.actividad.id}`,
            detalleDescripcion: poa.actividad.detalleDescripcion,
          }
        : undefined,
      codigoPresupuestario: poa.codigoPresupuestario
        ? {
            id: poa.codigoPresupuestario.id ?? 0,
            nombre:
              poa.codigoPresupuestario.nombre ??
              poa.codigoPresupuestario.descripcion ??
              poa.codigoPresupuestario.codigoCompleto ??
              poa.codigoPresupuestario.codigo ??
              `Codigo ${poa.codigoPresupuestario.id}`,
            codigo: poa.codigoPresupuestario.codigo,
            codigoCompleto: poa.codigoPresupuestario.codigoCompleto,
            descripcion: poa.codigoPresupuestario.descripcion,
          }
        : undefined,
      estructura: poa.estructura,
    };
  };

  return (fuentesSeleccionadas ?? [])
    .filter(
      (
        fuente
      ): fuente is NonNullable<FormData['fuentesSeleccionadas']>[number] & {
        poaId: number;
      } => typeof fuente.poaId === 'number'
    )
    .map((fuente) => ({
      poaId: fuente.poaId,
      poa: normalizePoa(fuente.poa),
      montoPresupuestado: fuente.montoPresupuestado ?? 0,
      saldoDisponible: fuente.saldoDisponible ?? 0,
    }));
}

interface SolicitudFormProps {
  initialValues?: Partial<FormData>;
  isEditMode?: boolean;
  solicitudId?: number | string;
}

export default function SolicitudForm({
  initialValues,
  isEditMode = false,
  solicitudId,
}: SolicitudFormProps) {
  const router = useRouter();
  const [step, setStep] = useState<WizardStep>('PLANIFICACION');
  const [loading, setLoading] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [misSelecciones, setMisSelecciones] = useState<SeleccionPresupuesto[]>(
    normalizeInitialSelections(initialValues?.fuentesSeleccionadas)
  );
  const [selectedPoa, setSelectedPoa] = useState<string>(
    initialValues?.fuentesSeleccionadas?.[0]?.poa?.codigoPoa || ''
  );
  const [poaStructure, setPoaStructure] = useState<PoaStructureItem[]>([]);
  const [showBudgetWarning, setShowBudgetWarning] = useState(false);

  const { conceptos, tiposGasto, usuarios, poaCodes, isLoading } =
    useCatalogos();
  const { user } = useAuthStore();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ...defaultValues,
      ...initialValues,
    },
  });

  const {
    formState: { isSubmitSuccessful },
  } = form;

  // Dirty Form Protection: Prevent accidental reload/close ALWAYS until success.
  usePreventNavigation(!isSubmitSuccessful);

  const watchActividades = form.watch('actividades');

  const logValidationErrors = () => {
    console.error('Errores de validación Zod:', form.formState.errors);
  };

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
        logValidationErrors();
        toast.error('Corrige los errores en la planificación');
      }
      return;
    }

    if (step === 'SOLICITUD') {
      const isValid = await form.trigger([
        'motivo',
        'items',
        'viaticos',
        'hospedajes',
      ]);
      if (isValid) {
        // Validación de Presupuestos: Verificar que todos los viáticos/gastos/hospedajes tengan fuente
        const watchViaticos = form.getValues('viaticos') || [];
        const watchGastos = form.getValues('items') || [];
        const watchHospedajes = form.getValues('hospedajes') || [];

        const tieneViaticosSinFuente = watchViaticos.some(
          (v) => !v.solicitudPresupuestoId
        );
        const tieneGastosSinFuente = watchGastos.some(
          (g) => !g.solicitudPresupuestoId
        );
        const tieneHospedajesSinFuente = watchHospedajes.some((h) => !h.poaId);

        if (
          tieneViaticosSinFuente ||
          tieneGastosSinFuente ||
          tieneHospedajesSinFuente
        ) {
          toast.error(
            'Todos los ítems (viáticos, comprobantes y hospedajes) deben estar vinculados a una fuente de financiamiento'
          );
          return;
        }

        // Budget Balance Validation
        for (const seleccion of misSelecciones) {
          const totalSolicitado =
            watchViaticos
              .filter((v) => v.solicitudPresupuestoId === seleccion.poaId)
              .reduce((sum, v) => sum + (Number(v.montoNeto) || 0), 0) +
            watchGastos
              .filter((g) => g.solicitudPresupuestoId === seleccion.poaId)
              .reduce((sum, g) => sum + (Number(g.montoNeto) || 0), 0) +
            watchHospedajes
              .filter((h) => h.poaId === seleccion.poaId)
              .reduce(
                (sum, h) =>
                  sum +
                  (Number(h.costoTotal) || 0) +
                  (Number(h.iva) || 0) +
                  (Number(h.it) || 0),
                0
              );

          const saldoDisponibleReal = seleccion.saldoDisponible;

          // TODO: Considerar tolerancia de 0.01
          if (totalSolicitado > saldoDisponibleReal + 0.01) {
            const exceso = totalSolicitado - saldoDisponibleReal;
            toast.error(
              `Saldo Insuficiente en ${seleccion.poa?.codigoPoa}:
              Disponible: Bs ${saldoDisponibleReal.toFixed(2)}
              Solicitado: Bs ${totalSolicitado.toFixed(2)}
              Exceso: Bs ${exceso.toFixed(2)}`,
              { duration: 5000 }
            );
            return;
          }
        }

        // Orphaned Budget Lines Validation: Every selected source must have at least one use
        for (const seleccion of misSelecciones) {
          const tieneUso =
            watchViaticos.some(
              (v) => Number(v.solicitudPresupuestoId) === seleccion.poaId
            ) ||
            watchGastos.some(
              (g) => Number(g.solicitudPresupuestoId) === seleccion.poaId
            ) ||
            watchHospedajes.some((h) => Number(h.poaId) === seleccion.poaId);

          if (!tieneUso) {
            toast.warning(
              `La partida ${
                seleccion.poaId
              } fue seleccionada pero no tiene montos asignados. Úsala o elimínala de la selección.`
            );
            return;
          }
        }

        setStep('RESPALDOS');
        window.scrollTo(0, 0);
      } else {
        logValidationErrors();
        toast.error('Corrige los errores en el detalle económico');
      }
      return;
    }

    if (step === 'RESPALDOS') {
      const isValid = await form.trigger([
        'urlCuadroComparativo',
        'urlCotizaciones',
      ]);
      if (isValid) {
        setStep('NOMINA');
        window.scrollTo(0, 0);
      } else {
        logValidationErrors();
        toast.error('Corrige los errores en los documentos de respaldo');
      }
      return;
    }

    if (step === 'NOMINA') {
      const isValid = await form.trigger(['nomina']);
      if (isValid) {
        setIsReviewModalOpen(true);
      } else {
        logValidationErrors();
        const errors = form.formState.errors;
        if (errors.nomina) {
          // Obtener el primer mensaje de error para mostrarlo
          const primerError = Array.isArray(errors.nomina)
            ? errors.nomina.find((e) => e !== undefined)
            : errors.nomina;

          const mensajeDetallado = primerError
            ? JSON.stringify(primerError)
            : 'Error desconocido';

          toast.error(
            `Corrige los errores en la nómina. Detalle: ${mensajeDetallado}`
          );
        } else {
          toast.error('Corrige los errores en la nómina');
        }
      }
      return;
    }
  };

  const handleBack = () => {
    if (step === 'SOLICITUD') setStep('PLANIFICACION');
    if (step === 'RESPALDOS') setStep('SOLICITUD');
    if (step === 'NOMINA') setStep('RESPALDOS');
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

      if (isEditMode && solicitudId) {
        // Enviar actualización (PATCH)
        await solicitudesService.updateSolicitud(solicitudId, payload);
        toast.success('Solicitud corregida y enviada exitosamente');
      } else {
        // Enviar nueva solicitud (POST)
        await solicitudesService.createSolicitud(payload);
        toast.success('Solicitud enviada exitosamente');
      }

      router.push('/app/solicitudes');
    } catch (error: unknown) {
      toast.error('Error al enviar la solicitud');
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

  const onError = (errors: FieldErrors<FormData>) => {
    console.error('Errores de validación Zod:', errors);
    toast.error('Corrige los errores marcados en rojo.');
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
                        Información General de la Actividad
                      </FieldLegend>
                      <div className="grid gap-4">
                        <FormField
                          control={form.control}
                          name="planificacionLugares"
                          render={({ field }) => (
                            <Field>
                              <FieldLabel>Lugar de la actividad</FieldLabel>
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
                              <FieldLabel>Objetivo de la actividad</FieldLabel>
                              <FormControl>
                                <Textarea
                                  {...field}
                                  placeholder="Describe el objetivo de esta actividad"
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
                    misSelecciones={misSelecciones}
                    setMisSelecciones={setMisSelecciones}
                    initialPoaCode={
                      initialValues?.fuentesSeleccionadas?.[0]?.poa?.codigoPoa
                    }
                    isEditMode={isEditMode}
                    selectedPoa={selectedPoa}
                    setSelectedPoa={setSelectedPoa}
                    poaStructure={poaStructure}
                    setPoaStructure={setPoaStructure}
                  />
                )}

                {step === 'RESPALDOS' && (
                  <SolicitudRespaldos
                    control={form.control}
                    setValue={form.setValue}
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
          // En modo edición, las selecciones pueden venir de initialValues o del estado local
          misSelecciones={misSelecciones}
          conceptos={conceptos}
          tiposGasto={tiposGasto}
          currentUserId={Number(user?.id)}
          onError={onError}
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
