import { z } from 'zod';
import { format } from 'date-fns';
import type {
  InformeViajeResponse,
  PrecargaInforme,
} from '@/types/informe-viaje-backend';

/** ANEXO 7 — Informe de Viaje: lo que se hizo realmente en el viaje. */

export const ActividadInformeSchema = z.object({
  fecha: z.string().min(1, 'La fecha es requerida'),
  lugar: z.string().trim().min(1, 'El lugar es requerido'),
  personaInstitucion: z
    .string()
    .trim()
    .min(1, 'La persona, institución o lugar es requerido'),
  actividadesRealizadas: z
    .string()
    .trim()
    .min(1, 'Describe las actividades realizadas'),
});

export type ActividadInforme = z.infer<typeof ActividadInformeSchema>;

export const InformeViajeSchema = z.object({
  solicitudId: z.number({ required_error: 'Elige la solicitud de viaje' }),
  motivoViaje: z.string().trim().min(1, 'El motivo del viaje es requerido'),
  lugarViaje: z.string().trim().min(1, 'El lugar de viaje es requerido'),
  lugarEmision: z.string().trim().min(1, 'El lugar de emisión es requerido'),
  fechaEmision: z.string().min(1, 'La fecha de emisión es requerida'),
  directorProgramaId: z.string().optional(),
  actividades: z
    .array(ActividadInformeSchema)
    .min(1, 'Debes registrar al menos una actividad'),
});

export type InformeViajeInput = z.infer<typeof InformeViajeSchema>;

export function hoyCalendario(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

export function actividadVacia(fecha = hoyCalendario()): ActividadInforme {
  return {
    fecha,
    lugar: '',
    personaInstitucion: '',
    actividadesRealizadas: '',
  };
}

/** `solicitudId` queda sin valor hasta elegir la solicitud. */
export const defaultInformeViajeValues = {
  motivoViaje: '',
  lugarViaje: '',
  lugarEmision: 'La Paz',
  fechaEmision: hoyCalendario(),
  directorProgramaId: '',
  actividades: [],
} as Omit<InformeViajeInput, 'solicitudId'> as InformeViajeInput;

/** Lo que ya se sabe del viaje → valores del formulario. */
export function valoresDesdePrecarga(
  solicitudId: number,
  precarga: PrecargaInforme
): InformeViajeInput {
  const actividades = precarga.actividades.map((a) => ({
    ...a,
    fecha: a.fecha.slice(0, 10),
  }));
  return {
    ...defaultInformeViajeValues,
    solicitudId,
    motivoViaje: precarga.motivoViaje,
    lugarViaje: precarga.lugarViaje,
    directorProgramaId: precarga.directorProgramaId
      ? String(precarga.directorProgramaId)
      : '',
    actividades: actividades.length
      ? actividades
      : [actividadVacia(precarga.fechaInicio?.slice(0, 10))],
  };
}

/** Informe guardado → valores del formulario de edición. */
export function informeToForm(
  informe: InformeViajeResponse
): InformeViajeInput {
  return {
    solicitudId: informe.solicitudId ?? 0,
    motivoViaje: informe.motivoViaje,
    lugarViaje: informe.lugarViaje,
    lugarEmision: informe.lugarEmision,
    fechaEmision: informe.fechaEmision.slice(0, 10),
    directorProgramaId: informe.directorProgramaId
      ? String(informe.directorProgramaId)
      : '',
    actividades: informe.actividades.map((a) => ({
      fecha: a.fecha.slice(0, 10),
      lugar: a.lugar,
      personaInstitucion: a.personaInstitucion,
      actividadesRealizadas: a.actividadesRealizadas,
    })),
  };
}
