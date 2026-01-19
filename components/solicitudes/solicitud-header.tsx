import { ChevronRight } from 'lucide-react';
import { WizardStep } from './solicitud-schema';

interface SolicitudHeaderProps {
  step: WizardStep;
}

export default function SolicitudHeader({ step }: SolicitudHeaderProps) {
  return (
    <div className="shrink-0 border-b p-4 px-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          {step === 'PLANIFICACION' && '1. Planificación'}
          {step === 'SOLICITUD' && '2. Solicitud Económica'}
          {step === 'NOMINA' && '3. Nómina de Terceros'}
        </h1>
        <div className="bg-muted flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium">
          <span
            className={
              step === 'PLANIFICACION'
                ? 'text-primary font-bold'
                : 'text-muted-foreground'
            }
          >
            1. Planificación
          </span>
          <ChevronRight className="text-muted-foreground h-3 w-3" />
          <span
            className={
              step === 'SOLICITUD'
                ? 'text-primary font-bold'
                : 'text-muted-foreground'
            }
          >
            2. Solicitud
          </span>
          <ChevronRight className="text-muted-foreground h-3 w-3" />
          <span
            className={
              step === 'NOMINA'
                ? 'text-primary font-bold'
                : 'text-muted-foreground'
            }
          >
            3. Nómina
          </span>
        </div>
      </div>
    </div>
  );
}
