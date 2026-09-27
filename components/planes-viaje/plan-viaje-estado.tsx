import { Badge } from '@/components/ui/badge';
import type {
  EstadoPlanViaje,
  PlanViajeResponse,
} from '@/types/plan-viaje-backend';

const ESTADOS: Record<
  EstadoPlanViaje,
  {
    etiqueta: string;
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
  }
> = {
  BORRADOR: { etiqueta: 'Borrador', variant: 'secondary' },
  ENVIADO: { etiqueta: 'Esperando VoBo', variant: 'outline' },
  OBSERVADO: { etiqueta: 'Observado', variant: 'destructive' },
  APROBADO: { etiqueta: 'Aprobado', variant: 'default' },
};

export function PlanViajeEstadoBadge({ estado }: { estado: EstadoPlanViaje }) {
  const { etiqueta, variant } = ESTADOS[estado] ?? ESTADOS.BORRADOR;
  return <Badge variant={variant}>{etiqueta}</Badge>;
}

/** La solicitud vinculada cuenta mientras no esté eliminada. */
export function solicitudVinculada(plan: PlanViajeResponse) {
  return plan.solicitud && !plan.solicitud.deletedAt ? plan.solicitud : null;
}

/**
 * Mismas reglas que el backend: libre en borrador u observado; aprobado,
 * solo si su solicitud fue observada.
 */
export function planEditable(plan: PlanViajeResponse): boolean {
  if (plan.estado === 'BORRADOR' || plan.estado === 'OBSERVADO') return true;
  return (
    plan.estado === 'APROBADO' &&
    solicitudVinculada(plan)?.estado === 'OBSERVADO'
  );
}

/** Aprobado y sin solicitud activa: listo para iniciar la solicitud de viaje. */
export function planDisponible(plan: PlanViajeResponse): boolean {
  return plan.estado === 'APROBADO' && !solicitudVinculada(plan);
}
