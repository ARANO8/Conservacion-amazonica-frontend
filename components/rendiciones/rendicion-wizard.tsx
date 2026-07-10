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
import { AlertCircle } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

import RendicionHeader from './rendicion-header';
import RendicionFooter from './rendicion-footer';
import Paso1Seleccion from './paso1-seleccion';
import Paso2Gastos from './paso2-gastos';
import Paso4Informe from './paso4-informe';
import { RendicionReviewModal } from './rendicion-review-modal';

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

  // Solicitud actualmente seleccionada (para pasar a Paso2Gastos)
  const watchedSolicitudId = useWatch({
    control: form.control,
    name: 'solicitudId',
  });

  const solicitudSeleccionada =
    solicitudes.find((s) => s.id === watchedSolicitudId) ?? null;

  const observaciones = useWatch({
    control: form.control,
    name: 'observaciones',
  });

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
      const isValid = await form.trigger(['gastos']);
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

    if (firstErrorField === 'informeGastos') {
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
          {/* Banner de observación (solo en modo edición) */}
          {isEditMode && observaciones && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-5 w-5" />
              <AlertTitle>Observación del revisor</AlertTitle>
              <AlertDescription>
                <p className="mt-1 text-sm leading-relaxed">{observaciones}</p>
                <p className="mt-2 text-xs opacity-80">
                  Corrige los datos señalados y selecciona un aprobador para
                  reenviar la rendición a revisión.
                </p>
              </AlertDescription>
            </Alert>
          )}

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

        <RendicionReviewModal
          isOpen={isModalOpen}
          onOpenChange={(open) => {
            if (!isSubmitting) setIsModalOpen(open);
          }}
          onSubmit={handleValidSubmit}
          loading={isSubmitting}
          usuarios={usuarios}
          solicitud={solicitudSeleccionada}
          currentUserId={currentUserId}
          onError={handleInvalidSubmit}
        />
      </div>
    </FormProvider>
  );
}
