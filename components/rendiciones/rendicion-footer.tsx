'use client';

import { useMemo } from 'react';
import { UseFormReturn, useWatch } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ChevronLeft, ChevronRight, PenLine } from 'lucide-react';

import { formatMoney } from '@/lib/utils';
import {
  CreateRendicionInput,
  WizardStepRendicion,
} from '@/types/rendicion-schema';
import { SolicitudResponse } from '@/types/solicitud-backend';

interface RendicionFooterProps {
  step: WizardStepRendicion;
  onNext: () => void;
  onBack: () => void;
  loading?: boolean;
  form: UseFormReturn<CreateRendicionInput>;
  solicitudes: SolicitudResponse[];
  /** Indica si el wizard está en modo edición (rendición observada) */
  isEditMode?: boolean;
}

export default function RendicionFooter({
  step,
  onNext,
  onBack,
  loading = false,
  form,
  solicitudes,
  isEditMode = false,
}: RendicionFooterProps) {
  const solicitudId = useWatch({ control: form.control, name: 'solicitudId' });
  const gastos = useWatch({ control: form.control, name: 'gastos' });

  // Monto anticipado (de la solicitud seleccionada)
  const montoAnticipado = useMemo(() => {
    const sol = solicitudes.find((s) => s.id === solicitudId);
    return Number(sol?.montoTotalPresupuestado ?? 0);
  }, [solicitudes, solicitudId]);

  // Total rendido (suma de gastos ingresados)
  const totalRendido = useMemo(() => {
    return (gastos ?? []).reduce(
      (acc, g) => acc + (Number(g?.montoTotal) || 0),
      0
    );
  }, [gastos]);

  const saldo = montoAnticipado - totalRendido;
  const isLastStep = step === 'GASTOS_RESPALDO';
  // En modo edición, el primer paso es GASTOS_RESPALDO (no SELECCION)
  const isFirstStep = isEditMode
    ? step === 'GASTOS_RESPALDO'
    : step === 'SELECCION';
  const showFinancialSummary =
    step === 'GASTOS_RESPALDO' && montoAnticipado > 0;

  return (
    <div className="bg-background z-50 shrink-0 border-t p-4 px-6 md:pb-6">
      <div className="flex w-full items-center justify-between gap-4">
        {/* Botón Atrás */}
        {!isFirstStep ? (
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={onBack}
            disabled={loading}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Atrás
          </Button>
        ) : (
          <div />
        )}

        {/* Resumen económico (visible a partir del paso 2) */}
        <div className="flex items-center gap-4">
          {showFinancialSummary && (
            <div className="hidden items-center gap-6 text-right sm:flex">
              {/* Anticipado */}
              <div className="flex flex-col">
                <span className="text-muted-foreground text-[10px] font-bold tracking-tight uppercase">
                  Monto Anticipado
                </span>
                <span className="text-sm font-semibold">
                  {formatMoney(montoAnticipado)}
                </span>
              </div>

              <Separator orientation="vertical" className="h-8" />

              {/* Total Rendido */}
              <div className="flex flex-col">
                <span className="text-muted-foreground text-[10px] font-bold tracking-tight uppercase">
                  Total Rendido
                </span>
                <span className="text-sm font-semibold">
                  {formatMoney(totalRendido)}
                </span>
              </div>

              <Separator orientation="vertical" className="h-8" />

              {/* Saldo */}
              <div className="flex flex-col">
                <span className="text-primary text-[10px] font-black tracking-tight uppercase">
                  Saldo a Devolver
                </span>
                <span
                  className={
                    saldo < 0
                      ? 'text-destructive text-xl font-black'
                      : 'text-primary text-xl font-black'
                  }
                >
                  {formatMoney(Math.abs(saldo))}
                  {saldo < 0 && (
                    <span className="ml-1 text-xs font-normal">(excede)</span>
                  )}
                </span>
              </div>
            </div>
          )}

          {/* Botón Siguiente / Enviar */}
          <Button
            type="button"
            size="lg"
            onClick={onNext}
            disabled={loading}
            className="min-w-[160px] shadow-lg transition-all"
          >
            {loading ? (
              'Procesando...'
            ) : isLastStep ? (
              <>
                Finalizar y Firmar
                <PenLine className="ml-2 h-4 w-4" />
              </>
            ) : (
              <>
                Siguiente
                <ChevronRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
