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

  const totales = useMemo(() => {
    const fuentes = watchFuentes || [];
    const viaticos = watchViaticos || [];
    const items = watchItems || [];

    // 1. PRESUPUESTO TOTAL (Suma de montos reservados en las fuentes)
    const totalFuentes = fuentes.reduce(
      (acc: number, f) => acc + (Number(f?.montoReservado) || 0),
      0
    );

    // 2. TOTAL NETO (Lo que pide el usuario sin impuestos)
    const totalNeto = [...viaticos, ...items].reduce(
      (acc: number, item) => acc + (Number(item?.montoNeto) || 0),
      0
    );

    // 3. TOTAL EJECUTADO (BRUTO) (Costo Real con Impuestos)
    const totalBruto = [...viaticos, ...items].reduce(
      (acc: number, item) => acc + (Number(item?.liquidoPagable) || 0),
      0
    );

    // 4. SALDO RESTANTE
    const saldoGlobal = totalFuentes - totalBruto;

    return { totalFuentes, totalNeto, totalBruto, saldoGlobal };
  }, [watchFuentes, watchViaticos, watchItems]);

  return (
    <div className="bg-background z-50 shrink-0 border-t p-4 px-6 md:pb-6">
      <div className="flex w-full justify-between">
        {step !== 'PLANIFICACION' ? (
          <Button type="button" variant="outline" size="lg" onClick={onBack}>
            <ChevronLeft className="mr-2 size-4" /> Atrás
          </Button>
        ) : (
          <div />
        )}

        <div className="flex items-center gap-8">
          {/* TAREA 2: MONITOR DE PRESUPUESTO GLOBAL (Versión Simplificada) */}
          {(step === 'SOLICITUD' && (
            <div className="flex items-center justify-center gap-12 rounded-xl bg-zinc-950 px-12 py-3 shadow-2xl ring-1 ring-white/10">
              {/* 1. TOTAL LÍQUIDO (A Recibir) */}
              <div className="flex flex-col items-center">
                <span className="text-[10px] leading-tight font-black tracking-widest text-zinc-400 uppercase">
                  TOTAL LÍQUIDO (A Recibir)
                </span>
                <span className="text-lg font-bold text-white">
                  {formatMoney(totales.totalNeto)}
                </span>
              </div>

              <div className="h-10 w-[1px] bg-white/10" />

              {/* 2. TOTAL PRESUPUESTADO (Incl. Impuestos) */}
              <div className="flex flex-col items-center">
                <span className="text-primary text-[10px] leading-tight font-black tracking-widest uppercase">
                  TOTAL PRESUPUESTADO (Incl. Impuestos)
                </span>
                <span className="text-primary text-xl font-black">
                  {formatMoney(totales.totalBruto)}
                </span>
              </div>
            </div>
          )) ||
            (step === 'NOMINA' && (
              <div className="mr-4 flex flex-col items-end">
                <span className="text-muted-foreground text-[10px] font-black uppercase">
                  TOTAL A PAGAR (BRUTO)
                </span>
                <span className="text-primary text-lg font-black">
                  {formatMoney(totales.totalBruto)}
                </span>
              </div>
            ))}

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
