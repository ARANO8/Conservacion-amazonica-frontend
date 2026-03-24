'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
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
import {
  adaptCreateRendicionPayload,
  adaptUpdateRendicionPayload,
} from '@/lib/adapters/rendicion-adapter';
import { Usuario } from '@/types/catalogs';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import RendicionHeader from './rendicion-header';
import RendicionFooter from './rendicion-footer';
import Paso1Seleccion from './paso1-seleccion';
import Paso2Gastos from './paso2-gastos';
import Paso4Informe from './paso4-informe';

interface RendicionWizardProps {
  /** Lista de solicitudes en estado DESEMBOLSADO, pasadas desde el padre */
  solicitudes: SolicitudResponse[];
  /** Usuarios activos para seleccionar aprobador inicial */
  usuarios: Usuario[];
  /** Usuario autenticado */
  currentUserId?: number;
  /** ID de solicitud pre-seleccionada (desde query params) */
  preSelectedSolicitudId?: number | null;
  /** Modo edición: si true, el wizard está editando una rendición observada */
  isEditMode?: boolean;
  /** ID de la rendición a editar (solo en modo edición) */
  rendicionId?: string;
  /** Valores iniciales del formulario (solo en modo edición) */
  initialValues?: Partial<CreateRendicionInput>;
}

export default function RendicionWizard({
  solicitudes,
  usuarios,
  currentUserId,
  preSelectedSolicitudId,
  isEditMode = false,
  rendicionId,
  initialValues,
}: RendicionWizardProps) {
  const router = useRouter();
  // En modo edición, empezar directamente en gastos (la solicitud ya está fija)
  const [step, setStep] = useState<WizardStepRendicion>(
    isEditMode ? 'GASTOS_RESPALDO' : 'SELECCION'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Combinar valores por defecto con valores iniciales en modo edición
  const mergedDefaultValues: CreateRendicionInput = {
    ...defaultRendicionValues,
    ...(initialValues as Partial<CreateRendicionInput>),
  };

  const form = useForm<CreateRendicionInput>({
    resolver: zodResolver(CreateRendicionSchema),
    defaultValues: mergedDefaultValues,
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

  // Solicitud actualmente seleccionada (para pasar a Paso2Gastos)
  const watchedSolicitudId = useWatch({
    control: form.control,
    name: 'solicitudId',
  });

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
        // En modo edición no regresamos al paso de selección
        if (!isEditMode) {
          setStep('SELECCION');
        }
      }
    }
  }, [preSelectedSolicitudId, solicitudes, form, isEditMode]);

  // ------------------------------------------------------------------
  // Navegación entre pasos con validación por campo
  // ------------------------------------------------------------------

  const handleNext = async () => {
    if (step === 'SELECCION') {
      const isValid = await form.trigger(['solicitudId']);
      if (!isValid) {
        toast.error('Debes seleccionar una solicitud para continuar');
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
      setStep('INFORME_GASTOS');
      window.scrollTo(0, 0);
      return;
    }

    if (step === 'INFORME_GASTOS') {
      const isValid = await form.trigger(['informeGastos']);
      if (!isValid) {
        // El toast ahora será mostrado solo por handleInvalidSubmit
        // si hay errores reales en la validación de Zod
        return;
      }
      setIsModalOpen(true);
    }
  };

  const handleBack = () => {
    if (step === 'GASTOS_RESPALDO') {
      // En modo edición, no se puede volver a selección (solicitud fija)
      if (isEditMode) {
        router.push('/app/rendiciones');
      } else {
        setStep('SELECCION');
        window.scrollTo(0, 0);
      }
    } else if (step === 'INFORME_GASTOS') {
      setStep('GASTOS_RESPALDO');
      window.scrollTo(0, 0);
    }
  };

  // ------------------------------------------------------------------
  // Envío final
  // ------------------------------------------------------------------

  const handleValidSubmit = async (data: CreateRendicionInput) => {
    void data;
    setIsSubmitting(true);
    try {
      const formData = form.getValues();

      if (isEditMode && rendicionId) {
        // Modo edición: usar endpoint PATCH
        const payload = adaptUpdateRendicionPayload(formData);
        await rendicionesService.submitUpdateRendicion(rendicionId, payload);
        toast.success('Rendición corregida y reenviada correctamente');
      } else {
        // Modo creación: usar endpoint POST
        const payload = adaptCreateRendicionPayload(formData);
        await rendicionesService.submitRendicion(payload);
        toast.success('Rendición enviada correctamente');
      }

      setIsModalOpen(false);
      router.push('/app/solicitudes');
    } catch (error: unknown) {
      let message = isEditMode
        ? 'Error al actualizar la rendición.'
        : 'Error al enviar la rendición.';

      if (axios.isAxiosError(error)) {
        const backendMessage = error.response?.data?.message;

        if (Array.isArray(backendMessage)) {
          message = backendMessage.join('. ');
        } else if (typeof backendMessage === 'string') {
          message = backendMessage;
        } else if (typeof error.message === 'string') {
          message = error.message;
        }
      } else if (error instanceof Error && error.message) {
        message = error.message;
      }

      toast.error(message);
    } finally {
      setIsSubmitting(false);
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
    } else if (firstErrorField === 'informeGastos') {
      // Extraer el error específico del informe si existe
      const informeError = errors.informeGastos as FieldError | undefined;
      if (informeError?.message) {
        errorMessage = informeError.message;
      } else {
        errorMessage = 'Revisa el informe antes de continuar';
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

          {step === 'GASTOS_RESPALDO' && (
            <Paso2Gastos solicitud={solicitudSeleccionada} />
          )}

          {step === 'INFORME_GASTOS' && <Paso4Informe />}
        </div>

        {/* Footer con navegación */}
        <RendicionFooter
          step={step}
          onNext={handleNext}
          onBack={handleBack}
          loading={isSubmitting}
          form={form}
          solicitudes={solicitudes}
          isEditMode={isEditMode}
        />

        <Dialog
          open={isModalOpen}
          onOpenChange={(open) => {
            if (!isSubmitting) setIsModalOpen(open);
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
              <FormField
                control={form.control}
                name="aprobadorActualId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-bold tracking-wider uppercase">
                      Aprobador Inmediato *
                    </FormLabel>
                    <Select
                      value={field.value ? String(field.value) : ''}
                      onValueChange={(value) => field.onChange(Number(value))}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecciona un aprobador..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {usuarios
                          .filter((usuario) => usuario.id !== currentUserId)
                          .map((usuario) => (
                            <SelectItem
                              key={usuario.id}
                              value={String(usuario.id)}
                            >
                              {usuario.nombreCompleto}
                              {usuario.cargo ? ` — ${usuario.cargo}` : ''}
                              {usuario.rol ? ` (${usuario.rol})` : ''}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )}
              />

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
                disabled={isSubmitting}
                onClick={() => setIsModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                disabled={
                  isSubmitting ||
                  !canConfirmSubmit ||
                  !form.getValues('aprobadorActualId')
                }
                onClick={() => {
                  void submitRendicion();
                }}
              >
                {isSubmitting
                  ? 'Enviando...'
                  : isEditMode
                    ? 'Confirmar y Reenviar Rendición'
                    : 'Confirmar y Enviar Rendición'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </FormProvider>
  );
}
