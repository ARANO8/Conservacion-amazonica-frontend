'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, FormProvider, FieldError } from 'react-hook-form';
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
import { solicitudesService } from '@/lib/services/solicitudes-service';

import RendicionHeader from './rendicion-header';
import RendicionFooter from './rendicion-footer';
import Paso1Seleccion from './paso1-seleccion';
import Paso2Gastos from './paso2-gastos';
import Paso3Declaracion from './paso3-declaracion';

interface RendicionWizardProps {
  /** Lista de solicitudes en estado DESEMBOLSADO, pasadas desde el padre */
  solicitudes: SolicitudResponse[];
}

export default function RendicionWizard({ solicitudes }: RendicionWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState<WizardStepRendicion>('SELECCION');
  const [loading, setLoading] = useState(false);

  const form = useForm<CreateRendicionInput>({
    resolver: zodResolver(CreateRendicionSchema),
    defaultValues: defaultRendicionValues,
  });

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
      setStep('DECLARACION_JURADA');
      window.scrollTo(0, 0);
      return;
    }

    if (step === 'DECLARACION_JURADA') {
      await handleSubmit();
    }
  };

  const handleBack = () => {
    if (step === 'GASTOS_RESPALDO') {
      setStep('SELECCION');
      window.scrollTo(0, 0);
    } else if (step === 'DECLARACION_JURADA') {
      setStep('GASTOS_RESPALDO');
      window.scrollTo(0, 0);
    }
  };

  // ------------------------------------------------------------------
  // Envío final
  // ------------------------------------------------------------------

  const handleSubmit = async () => {
    const isValid = await form.trigger();
    if (!isValid) {
      const errors = form.formState.errors;
      console.error('Errores de validación:', errors);

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
      return;
    }

    setLoading(true);
    try {
      const data = form.getValues();
      const solicitudId = data.solicitudId;

      console.log('Payload que se envía:', JSON.stringify(data, null, 2));

      // Paso 1: Crear la rendición en el backend
      const rendicionResponse = await rendicionesService.createRendicion(data);
      console.log('Rendición creada:', rendicionResponse);

      // Paso 2: Marcar la solicitud como EJECUTADA
      await solicitudesService.marcarEjecutada(solicitudId);
      console.log('Solicitud marcada como EJECUTADA');

      toast.success('Rendición enviada correctamente');

      // Paso 3: Redirigir al dashboard
      setTimeout(() => {
        router.push('/dashboard');
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

      console.error('Error en handleSubmit:', { error, statusCode });
      toast.error(message);
    } finally {
      setLoading(false);
    }
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
          {step === 'SELECCION' && (
            <Paso1Seleccion form={form} solicitudes={solicitudes} />
          )}

          {step === 'GASTOS_RESPALDO' && <Paso2Gastos />}

          {step === 'DECLARACION_JURADA' && <Paso3Declaracion />}
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
      </div>
    </FormProvider>
  );
}
