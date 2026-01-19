import { useWatch, useFormContext } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { formatMoney } from '@/lib/utils';
import { WizardStep, FormData } from './solicitud-schema';
import { useMemo } from 'react';

interface SolicitudFooterProps {
  step: WizardStep;
  onNext: () => void;
  onBack: () => void;
  loading?: boolean;
}

export default function SolicitudFooter({
  step,
  onNext,
  onBack,
  loading = false,
}: SolicitudFooterProps) {
  const { control } = useFormContext<FormData>();

  // Observar cambios para el Monitor de Presupuesto
  const watchViaticos = useWatch({ control, name: 'viaticos' });
  const watchItems = useWatch({ control, name: 'items' });

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

  return (
    <div className="bg-background z-50 shrink-0 border-t p-4 px-6 md:pb-6">
      <div className="flex w-full justify-between">
        {step !== 'PLANIFICACION' ? (
          <Button type="button" variant="outline" size="lg" onClick={onBack}>
            <ChevronLeft className="mr-2 h-4 w-4" /> Atrás
          </Button>
        ) : (
          <div /> /* Spacer to keep "Siguiente" on the right */
        )}

        <div className="flex items-center gap-8">
          {/* MONITOR DE PRESUPUESTO - Solo visible en SOLICITUD */}
          {step === 'SOLICITUD' && (
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
          )}

          <Button
            type="button"
            onClick={onNext}
            disabled={loading}
            size="lg"
            className="min-w-[160px] shadow-lg transition-all"
          >
            {step === 'NOMINA' ? (
              <>
                Revisar y Enviar <ChevronRight className="ml-2 h-4 w-4" />
              </>
            ) : (
              <>
                Siguiente <ChevronRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
