import { z } from 'zod';
import { format } from 'date-fns';
import type { PlanViajeResponse } from '@/types/plan-viaje-backend';

/** Los inputs numéricos quedan en null mientras el usuario borra el valor. */
const numero = (schema: z.ZodNumber) =>
  z.preprocess((v) => (v === null || v === '' ? undefined : v), schema);

export const actividadPlanSchema = z
  .object({
    /** Id de la fila guardada: al editar, la conserva (y con ella sus viáticos) */
    id: z.number().optional(),
    fechaInicio: z.string().min(1, 'Selecciona las fechas'),
    fechaFin: z.string().min(1, 'Selecciona las fechas'),
    cantDias: numero(
      z
        .number({ required_error: 'Días es requerido' })
        .min(0.5, 'Mínimo 0.5 días')
    ),
    lugarSalida: z.string().trim().min(1, 'Lugar de salida requerido'),
    lugarLlegada: z.string().trim().min(1, 'Lugar de llegada requerido'),
    actividadProgramada: z.string().trim().min(1, 'Actividad requerida'),
    cantInstitucion: numero(
      z
        .number({ required_error: 'Pers. Inst. es requerido' })
        .int()
        .min(1, 'Debe haber al menos 1 persona institucional')
    ),
    cantTerceros: numero(
      z
        .number({ required_error: 'Terceros es requerido' })
        .int()
        .min(0)
        .max(50, 'Máximo 50 terceros por actividad')
    ),
    // Nómina institucional: se elige en el modal y debe cuadrar con el conteo
    institucionales: z.array(z.number()).default([]),
  })
  .refine((a) => a.fechaFin >= a.fechaInicio, {
    message: 'La fecha de fin es anterior a la de inicio',
    path: ['fechaFin'],
  });

export const planViajeSchema = z.object({
  cargo: z.string().trim().max(200),
  lugaresViaje: z
    .string()
    .trim()
    .min(1, 'Los lugares del viaje son requeridos'),
  objetivoViaje: z.string().trim().min(1, 'El objetivo del viaje es requerido'),
  lugarEmision: z.string().trim().min(1, 'El lugar de emisión es requerido'),
  fechaEmision: z.string().min(1, 'La fecha de emisión es requerida'),
  directorProgramaId: z.string().optional(),
  actividades: z
    .array(actividadPlanSchema)
    .min(1, 'Debes agregar al menos una actividad'),
});

export type PlanViajeFormData = z.infer<typeof planViajeSchema>;
export type ActividadPlanFormData = PlanViajeFormData['actividades'][number];

export function hoyCalendario(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

export function actividadVacia(): ActividadPlanFormData {
  const hoy = hoyCalendario();
  return {
    fechaInicio: hoy,
    fechaFin: hoy,
    cantDias: 1,
    lugarSalida: '',
    lugarLlegada: '',
    actividadProgramada: '',
    cantInstitucion: 1,
    cantTerceros: 0,
    institucionales: [],
  };
}

export function planViajeDefaults(cargo = ''): PlanViajeFormData {
  return {
    cargo,
    lugaresViaje: '',
    objetivoViaje: '',
    lugarEmision: 'La Paz',
    fechaEmision: hoyCalendario(),
    directorProgramaId: '',
    actividades: [actividadVacia()],
  };
}

/** Plan guardado → valores del formulario de edición. */
export function planViajeToForm(plan: PlanViajeResponse): PlanViajeFormData {
  return {
    cargo: plan.cargo ?? '',
    lugaresViaje: plan.lugaresViaje,
    objetivoViaje: plan.objetivoViaje,
    lugarEmision: plan.lugarEmision,
    fechaEmision: plan.fechaEmision.slice(0, 10),
    directorProgramaId: plan.directorProgramaId
      ? String(plan.directorProgramaId)
      : '',
    actividades: plan.actividades.map((a) => ({
      id: a.id,
      fechaInicio: a.fechaInicio.slice(0, 10),
      fechaFin: a.fechaFin.slice(0, 10),
      cantDias: Number(a.diasCalculados),
      lugarSalida: a.lugarSalida ?? '',
      lugarLlegada: a.lugarLlegada ?? '',
      actividadProgramada: a.actividadProgramada,
      cantInstitucion: a.cantidadPersonasInstitucional,
      cantTerceros: a.cantidadPersonasTerceros,
      institucionales: a.participantesInstitucionales.map((p) => p.id),
    })),
  };
}
