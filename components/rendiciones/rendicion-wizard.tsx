'use client';

import { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import {
  CreateRendicionSchema,
  CreateRendicionInput,
  defaultRendicionValues,
  WizardStepRendicion,
} from '@/types/rendicion-schema';
import { SolicitudResponse } from '@/types/solicitud-backend';

import RendicionHeader from './rendicion-header';
import RendicionFooter from './rendicion-footer';
import Paso1Seleccion from './paso1-seleccion';
import Paso2Gastos from './paso2-gastos';

interface RendicionWizardProps {
  /** Lista de solicitudes en estado DESEMBOLSADO, pasadas desde el padre */
  solicitudes: SolicitudResponse[];
}

export default function RendicionWizard({ solicitudes }: RendicionWizardProps) {
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
      toast.error('Completa todos los campos requeridos');
      return;
    }

    setLoading(true);
    try {
      const data = form.getValues();
      // TODO: llamar a rendicionesService.createRendicion(data) cuando el
      // endpoint del backend esté disponible.
      console.log('Payload rendición:', data);
      toast.success('Rendición enviada correctamente');
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Error al enviar la rendición';
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

          {step === 'DECLARACION_JURADA' && (
            <div className="flex h-64 items-center justify-center rounded-xl border-2 border-dashed">
              <p className="text-muted-foreground text-sm italic">
                Paso 3: Declaración Jurada (próximamente)
              </p>
            </div>
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
      </div>
    </FormProvider>
  );
}
