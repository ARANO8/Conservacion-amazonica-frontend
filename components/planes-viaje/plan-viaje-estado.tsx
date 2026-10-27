import { Badge } from '@/components/ui/badge';
import type { PlanViajeResponse } from '@/types/plan-viaje-backend';

/**
 * El plan no pasa por VoBo: su situación se deduce de si está completo y de
 * si ya respalda una solicitud.
 */
export type SituacionPlan = 'INCOMPLETO' | 'DISPONIBLE' | 'VINCULADO';

const SITUACIONES: Record<
  SituacionPlan,
  {
    etiqueta: string;
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
  }
> = {
  INCOMPLETO: { etiqueta: 'Incompleto', variant: 'secondary' },
  DISPONIBLE: { etiqueta: 'Disponible', variant: 'default' },
  VINCULADO: { etiqueta: 'Con solicitud', variant: 'outline' },
};

/** La solicitud vinculada cuenta mientras no esté eliminada. */
export function solicitudVinculada(plan: PlanViajeResponse) {
  return plan.solicitud && !plan.solicitud.deletedAt ? plan.solicitud : null;
}

/**
 * Qué le falta al plan para respaldar una solicitud, o `null` si está
 * completo. Mismas reglas que el backend (`planes-viaje.helper.ts`).
 */
export function faltanteDelPlan(plan: PlanViajeResponse): string | null {
  if (plan.actividades.length === 0) {
    return 'El plan no tiene actividades';
  }
  for (const a of plan.actividades) {
    const seleccionados = a.participantesInstitucionales.length;
    if (seleccionados !== a.cantidadPersonasInstitucional) {
      return `En "${a.actividadProgramada}" declaraste ${a.cantidadPersonasInstitucional} persona(s) institucional(es) pero seleccionaste ${seleccionados}`;
    }
    if (!a.lugarSalida || !a.lugarLlegada) {
      return `En "${a.actividadProgramada}" faltan el lugar de salida o el de llegada`;
    }
  }
  return null;
}

export function situacionPlan(plan: PlanViajeResponse): SituacionPlan {
  if (solicitudVinculada(plan)) return 'VINCULADO';
  return faltanteDelPlan(plan) ? 'INCOMPLETO' : 'DISPONIBLE';
}

export function PlanViajeSituacionBadge({ plan }: { plan: PlanViajeResponse }) {
  const { etiqueta, variant } = SITUACIONES[situacionPlan(plan)];
  return <Badge variant={variant}>{etiqueta}</Badge>;
}

/**
 * Mismas reglas que el backend: libre mientras no respalde una solicitud;
 * vinculado, solo si esa solicitud fue observada.
 */
export function planEditable(plan: PlanViajeResponse): boolean {
  const solicitud = solicitudVinculada(plan);
  return !solicitud || solicitud.estado === 'OBSERVADO';
}

/** Completo y sin solicitud activa: listo para iniciar la solicitud de viaje. */
export function planDisponible(plan: PlanViajeResponse): boolean {
  return situacionPlan(plan) === 'DISPONIBLE';
}
