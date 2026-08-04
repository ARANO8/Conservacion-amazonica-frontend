import { AlertCircle } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

interface ObservacionAlertProps {
  /** Motivo con el que el revisor devolvió la solicitud */
  observacion?: string | null;
  className?: string;
}

/**
 * Muestra el motivo por el que una solicitud fue observada.
 * Devuelve null si no hay observación, para poder invocarlo sin condicionales.
 */
export function ObservacionAlert({
  observacion,
  className,
}: ObservacionAlertProps) {
  if (!observacion?.trim()) return null;

  return (
    <Alert
      className={cn(
        'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200',
        className
      )}
    >
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Solicitud observada</AlertTitle>
      <AlertDescription className="text-amber-800 dark:text-amber-300">
        {observacion}
      </AlertDescription>
    </Alert>
  );
}
