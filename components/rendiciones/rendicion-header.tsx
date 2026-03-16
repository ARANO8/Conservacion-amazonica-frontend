import { ChevronRight } from 'lucide-react';
import { WizardStepRendicion } from '@/types/rendicion-schema';

const STEPS: { key: WizardStepRendicion; label: string; short: string }[] = [
  {
    key: 'SELECCION',
    label: '1. Selección de Solicitud',
    short: '1. Selección',
  },
  {
    key: 'GASTOS_RESPALDO',
    label: '2. Comprobantes y Respaldo',
    short: '2. Comprobantes',
  },
  {
    key: 'DECLARACION_JURADA',
    label: '3. Declaración Jurada',
    short: '3. Declaración',
  },
];

interface RendicionHeaderProps {
  step: WizardStepRendicion;
}

export default function RendicionHeader({ step }: RendicionHeaderProps) {
  const currentStep = STEPS.find((s) => s.key === step);

  return (
    <div className="shrink-0 border-b p-4 px-6">
      <div className="flex items-center justify-between">
        {/* Título del paso actual */}
        <h1 className="text-2xl font-bold">{currentStep?.label}</h1>

        {/* Breadcrumb de pasos */}
        <div className="bg-muted hidden items-center gap-1 rounded-full px-3 py-1 text-xs font-medium sm:flex">
          {STEPS.map((s, idx) => (
            <span key={s.key} className="flex items-center gap-1">
              {idx > 0 && (
                <ChevronRight className="text-muted-foreground h-3 w-3 shrink-0" />
              )}
              <span
                className={
                  s.key === step
                    ? 'text-primary font-bold'
                    : 'text-muted-foreground'
                }
              >
                {s.short}
              </span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
