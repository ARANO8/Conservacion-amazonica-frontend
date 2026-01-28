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

  // TAREA 1: CALCULAR TOTALES GLOBALES (Reactividad Total)
  const watchFuentes = useWatch({ control, name: 'fuentesSeleccionadas' });
  const watchViaticos = useWatch({ control, name: 'viaticos' });
  const watchItems = useWatch({ control, name: 'items' });
  const watchNomina = useWatch({ control, name: 'nomina' });

  const totales = useMemo(() => {
    const fuentes = watchFuentes || [];
    const viaticos = watchViaticos || [];
    const items = watchItems || [];
    const nomina = watchNomina || [];

    // 1. PRESUPUESTO TOTAL (Suma de montos reservados en las fuentes)
    const totalFuentes = fuentes.reduce(
      (acc: number, f) => acc + (Number(f?.montoReservado) || 0),
      0
    );

    // 2. TOTAL NETO (Presupuestado - Incluye Impuestos/Impacto)
    const totalNeto = [...viaticos, ...items, ...nomina].reduce(
      (acc: number, item) => acc + (Number(item?.montoNeto) || 0),
      0
    );

    // 3. TOTAL EJECUTADO (BRUTO) (Líquido a recibir)
    const totalBruto = [...viaticos, ...items, ...nomina].reduce(
      (acc: number, item) => acc + (Number(item?.liquidoPagable) || 0),
      0
    );

    // 4. SALDO RESTANTE
    const saldoGlobal = totalFuentes - totalNeto;

    return { totalFuentes, totalNeto, totalBruto, saldoGlobal };
  }, [watchFuentes, watchViaticos, watchItems, watchNomina]);

  return (
    <div className="bg-background z-50 shrink-0 border-t p-4 px-6 md:pb-6">
      <div className="flex w-full items-center justify-between">
        {step !== 'PLANIFICACION' ? (
          <Button type="button" variant="outline" size="lg" onClick={onBack}>
            <ChevronLeft className="mr-2 size-4" /> Atrás
          </Button>
        ) : (
          <div />
        )}

        {/* Resumen Económico Alineado a la Derecha */}
        <div className="flex items-center gap-6">
          {step !== 'PLANIFICACION' && (
            <div className="flex items-center gap-4 text-right">
              <div className="flex flex-col">
                <span className="text-muted-foreground text-[10px] font-bold tracking-tight uppercase">
                  TOTAL LÍQUIDO (A Recibir)
                </span>
                <span className="text-sm font-semibold">
                  {formatMoney(totales.totalBruto)}
                </span>
              </div>

              <div className="bg-border h-8 w-[1px]" />

              <div className="flex flex-col">
                <span className="text-primary text-[10px] font-black tracking-tight uppercase">
                  TOTAL PRESUPUESTADO (Incl. Impuestos)
                </span>
                <span className="text-primary text-xl font-black">
                  {formatMoney(totales.totalNeto)}
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
