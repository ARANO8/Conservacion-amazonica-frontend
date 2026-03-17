'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  useForm,
  FormProvider,
  FieldError,
  FieldErrors,
  FieldValues,
  Path,
  useWatch,
} from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import {
  CreateRendicionSchema,
  CreateRendicionInput,
  DeclaracionJurada,
  defaultRendicionValues,
  WizardStepRendicion,
} from '@/types/rendicion-schema';
import { SolicitudResponse } from '@/types/solicitud-backend';
import { rendicionesService } from '@/lib/services/rendiciones-service';
import { solicitudesService } from '@/lib/services/solicitudes-service';
import { Checkbox } from '@/components/ui/checkbox';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

import RendicionHeader from './rendicion-header';
import RendicionFooter from './rendicion-footer';
import Paso1Seleccion from './paso1-seleccion';
import Paso2Respaldos from './paso2-respaldos';
import Paso2Gastos from './paso2-gastos';

interface RendicionWizardProps {
  /** Lista de solicitudes en estado DESEMBOLSADO, pasadas desde el padre */
  solicitudes: SolicitudResponse[];
  /** ID de solicitud pre-seleccionada (desde query params) */
  preSelectedSolicitudId?: number | null;
}

export default function RendicionWizard({
  solicitudes,
  preSelectedSolicitudId,
}: RendicionWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState<WizardStepRendicion>('SELECCION');
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const form = useForm<CreateRendicionInput>({
    resolver: zodResolver(CreateRendicionSchema),
    defaultValues: defaultRendicionValues,
  });

  // Solicitud actualmente seleccionada (para pasar a Paso2Gastos)
  const watchedSolicitudId = useWatch({
    control: form.control,
    name: 'solicitudId',
  });
  const [confirmaDatosVeridicos, aceptaPoliticaDevolucion] = useWatch({
    control: form.control,
    name: [
      'declaracionJurada.confirmaDatosVeridicos',
      'declaracionJurada.aceptaPoliticaDevolucion',
    ],
  }) as [boolean | undefined, boolean | undefined];

  const canConfirmSubmit =
    confirmaDatosVeridicos === true && aceptaPoliticaDevolucion === true;

  const solicitudSeleccionada =
    solicitudes.find((s) => s.id === watchedSolicitudId) ?? null;

  // Efecto para pre-seleccionar una solicitud si se proporciona el ID
  useEffect(() => {
    if (preSelectedSolicitudId && solicitudes.length > 0) {
      const solicitudExiste = solicitudes.some(
        (s) => s.id === preSelectedSolicitudId
      );

      if (solicitudExiste) {
        // Pre-llenar el formulario con la solicitud seleccionada
        form.setValue('solicitudId', preSelectedSolicitudId);

        // También set la fecha de rendición a hoy (o dejar el default)
        const today = new Date().toISOString().split('T')[0];
        form.setValue('fechaRendicion', today);

        // Con solicitud pre-seleccionada, saltar al paso de respaldos generales
        // para que el usuario no omita adjuntar las cotizaciones obligatorias
        setStep('RESPALDOS_GENERALES');
      }
    }
  }, [preSelectedSolicitudId, solicitudes, form]);

  // ------------------------------------------------------------------
  // Navegación entre pasos con validación por campo
  // ------------------------------------------------------------------

  const handleNext = async () => {
    if (step === 'SELECCION') {
      const isValid = await form.trigger(['solicitudId', 'fechaRendicion']);
      if (!isValid) {
        toast.error('Selecciona una solicitud antes de continuar');
        return;
      }
      setStep('RESPALDOS_GENERALES');
      window.scrollTo(0, 0);
      return;
    }

    if (step === 'RESPALDOS_GENERALES') {
      const isValid = await form.trigger([
        'urlCotizaciones',
        'urlCuadroComparativo',
      ]);
      if (!isValid) {
        toast.error(
          'Adjunta al menos una cotización válida antes de continuar'
        );
        return;
      }
      setStep('GASTOS_RESPALDO');
      window.scrollTo(0, 0);
      return;
    }

    if (step === 'GASTOS_RESPALDO') {
      const isValid = await form.trigger(['gastos', 'gastosSinRespaldo']);
      if (!isValid) {
        toast.error('Revisa los gastos antes de continuar');
        return;
      }
      setIsModalOpen(true);
    }
  };

  const handleBack = () => {
    if (step === 'RESPALDOS_GENERALES') {
      setStep('SELECCION');
      window.scrollTo(0, 0);
    } else if (step === 'GASTOS_RESPALDO') {
      setStep('RESPALDOS_GENERALES');
      window.scrollTo(0, 0);
    }
  };

  // ------------------------------------------------------------------
  // Envío final
  // ------------------------------------------------------------------

  const handleValidSubmit = async (data: CreateRendicionInput) => {
    setLoading(true);
    try {
      const solicitudId = data.solicitudId;

      // Paso 1: Crear la rendición en el backend
      await rendicionesService.createRendicion(data);

      toast.success('Rendición enviada correctamente');

      // Paso 2: Intentar marcar la solicitud como EJECUTADA (es opcional)
      try {
        await solicitudesService.marcarEjecutada(solicitudId);
      } catch (markError) {
        void markError;
        // No es crítico si esto falla - la rendición ya fue creada exitosamente
      }

      // Paso 3: Redirigir al inicio
      setIsModalOpen(false);
      setTimeout(() => {
        router.push('/app/inicio');
      }, 1000);
    } catch (error: unknown) {
      let message = 'Error al enviar la rendición';
      let statusCode: number | undefined;

      // Intentar extraer información del error Axios
      if (typeof error === 'object' && error !== null) {
        const axiosError = error as {
          response?: { status?: number; data?: { message?: string } };
          message?: string;
        };

        statusCode = axiosError.response?.status;
        message =
          axiosError.response?.data?.message || axiosError.message || message;

        // Mensajes específicos para status codes comunes
        if (statusCode === 404) {
          message = `Endpoint no encontrado (404). Verifica que el backend tiene implementado el endpoint para rendiciones. ${message}`;
        } else if (statusCode === 401) {
          message = 'No autorizado. Tu sesión puede haber expirado.';
        } else if (statusCode === 422) {
          message = `Datos inválidos: ${message}`;
        } else if (statusCode === 500) {
          message = `Error del servidor. Intenta nuevamente más tarde. ${message}`;
        }
      } else if (error instanceof Error) {
        message = error.message;
      }

      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleInvalidSubmit = (errors: FieldErrors<CreateRendicionInput>) => {
    // Mostrar el primer error encontrado al usuario
    const firstErrorField = Object.keys(errors)[0];
    let errorMessage = 'Completa todos los campos requeridos';

    if (firstErrorField === 'declaracionJurada') {
      const declaracionErrors = errors.declaracionJurada as FieldError & {
        confirmaDatosVeridicos?: FieldError;
        aceptaPoliticaDevolucion?: FieldError;
      };
      if (declaracionErrors?.confirmaDatosVeridicos?.message) {
        errorMessage = declaracionErrors.confirmaDatosVeridicos.message;
      } else if (declaracionErrors?.aceptaPoliticaDevolucion?.message) {
        errorMessage = declaracionErrors.aceptaPoliticaDevolucion.message;
      } else {
        errorMessage = 'Revisa los términos y condiciones antes de continuar';
      }
    } else if (firstErrorField) {
      const fieldError = errors[firstErrorField as keyof typeof errors] as
        | FieldError
        | undefined;
      errorMessage = fieldError?.message || errorMessage;
    }

    toast.error(errorMessage);
  };

  const submitRendicion = form.handleSubmit(
    handleValidSubmit,
    handleInvalidSubmit
  );

  const getFieldErrorByPath = <TFieldValues extends FieldValues>(
    errors: FieldErrors<TFieldValues>,
    path: Path<TFieldValues>
  ): FieldError | undefined => {
    const keys = path.split('.');
    let current: unknown = errors;

    for (const key of keys) {
      if (!current || typeof current !== 'object' || !(key in current)) {
        return undefined;
      }
      current = (current as Record<string, unknown>)[key];
    }

    if (current && typeof current === 'object' && 'message' in current) {
      return current as FieldError;
    }

    return undefined;
  };

  const declaracionErrors = form.formState.errors.declaracionJurada as Partial<
    Record<keyof DeclaracionJurada, FieldError>
  >;
  const confirmaError = getFieldErrorByPath(
    form.formState.errors,
    'declaracionJurada.confirmaDatosVeridicos'
  );
  const aceptaError = getFieldErrorByPath(
    form.formState.errors,
    'declaracionJurada.aceptaPoliticaDevolucion'
  );

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------

  return (
    <FormProvider {...form}>
      <div className="flex h-full min-h-screen flex-col">
        {/* Header con indicador de pasos */}
        <RendicionHeader step={step} />

        {/* Área de contenido — crece para ocupar el espacio disponible */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {step === 'SELECCION' && (
            <Paso1Seleccion form={form} solicitudes={solicitudes} />
          )}

          {step === 'RESPALDOS_GENERALES' && <Paso2Respaldos />}

          {step === 'GASTOS_RESPALDO' && (
            <Paso2Gastos solicitud={solicitudSeleccionada} />
          )}
        </div>

        {/* Footer con navegación */}
        <RendicionFooter
          step={step}
          onNext={handleNext}
          onBack={handleBack}
          loading={loading}
          form={form}
          solicitudes={solicitudes}
        />

        <Dialog
          open={isModalOpen}
          onOpenChange={(open) => {
            if (!loading) setIsModalOpen(open);
          }}
        >
          <DialogContent className="sm:max-w-[640px]">
            <DialogHeader>
              <DialogTitle>Confirmación de Declaración Jurada</DialogTitle>
              <DialogDescription>
                Antes de enviar la rendición, confirma los siguientes términos.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="bg-card rounded-lg border p-4">
                <FormField
                  control={form.control}
                  name="declaracionJurada.confirmaDatosVeridicos"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start gap-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value === true}
                          onCheckedChange={(checked) => {
                            field.onChange(checked === true);
                          }}
                          className="mt-1"
                        />
                      </FormControl>
                      <div className="flex-1">
                        <FormLabel className="cursor-pointer text-sm leading-relaxed font-semibold">
                          Declaro bajo juramento que los montos detallados en
                          esta rendición son verídicos y se realizaron conforme
                          a lo aprobado en la solicitud.
                        </FormLabel>
                        <FormMessage className="mt-2 text-[10px]" />
                      </div>
                    </FormItem>
                  )}
                />
                {confirmaError && (
                  <p className="text-destructive mt-2 text-xs">
                    {String(confirmaError.message)}
                  </p>
                )}
              </div>

              <div className="bg-card rounded-lg border p-4">
                <FormField
                  control={form.control}
                  name="declaracionJurada.aceptaPoliticaDevolucion"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start gap-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value === true}
                          onCheckedChange={(checked) => {
                            field.onChange(checked === true);
                          }}
                          className="mt-1"
                        />
                      </FormControl>
                      <div className="flex-1">
                        <FormLabel className="cursor-pointer text-sm leading-relaxed font-semibold">
                          Acepto la política de devolución de saldos y, en caso
                          de corresponder, me comprometo a devolver la
                          diferencia dentro de los plazos establecidos.
                        </FormLabel>
                        <FormMessage className="mt-2 text-[10px]" />
                      </div>
                    </FormItem>
                  )}
                />
                {aceptaError && (
                  <p className="text-destructive mt-2 text-xs">
                    {String(aceptaError.message)}
                  </p>
                )}
              </div>
            </div>

            {(declaracionErrors?.confirmaDatosVeridicos ||
              declaracionErrors?.aceptaPoliticaDevolucion) && (
              <p className="text-destructive text-xs">
                Marca ambos checkboxes para confirmar la declaración jurada.
              </p>
            )}

            <DialogFooter className="gap-2 sm:gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={loading}
                onClick={() => setIsModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                disabled={loading || !canConfirmSubmit}
                onClick={() => {
                  void submitRendicion();
                }}
              >
                {loading ? 'Procesando...' : 'Confirmar y Enviar Rendición'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </FormProvider>
  );
}
