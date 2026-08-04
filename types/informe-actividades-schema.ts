import { z } from 'zod';

/**
 * ANEXO 7 — Informe de Actividades.
 *
 * Bitácora independiente de un viaje: no cuelga de una solicitud ni de una
 * rendición, sólo de su autor.
 */

export const ActividadInformeSchema = z.object({
  fecha: z.union([z.string().min(1, 'La fecha es requerida'), z.date()]),
  lugar: z.string().min(1, 'El lugar es requerido'),
  personaInstitucion: z
    .string()
    .min(1, 'La persona o institución es requerida'),
  actividadesRealizadas: z
    .string()
    .min(1, 'La descripción de actividades es requerida'),
});

export type ActividadInforme = z.infer<typeof ActividadInformeSchema>;

export const InformeActividadesSchema = z
  .object({
    fechaInicio: z.union([
      z.string().min(1, 'La fecha de inicio es requerida'),
      z.date(),
    ]),
    fechaFin: z.union([
      z.string().min(1, 'La fecha de fin es requerida'),
      z.date(),
    ]),
    actividades: z
      .array(ActividadInformeSchema)
      .min(1, 'Debes registrar al menos una actividad'),
  })
  .superRefine((data, ctx) => {
    const inicio = new Date(data.fechaInicio);
    const fin = new Date(data.fechaFin);
    if (
      !Number.isNaN(inicio.getTime()) &&
      !Number.isNaN(fin.getTime()) &&
      fin < inicio
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['fechaFin'],
        message: 'La fecha de fin no puede ser anterior a la de inicio',
      });
    }
  });

export type InformeActividadesInput = z.infer<typeof InformeActividadesSchema>;

export const defaultInformeActividadesValues: InformeActividadesInput = {
  fechaInicio: '',
  fechaFin: '',
  actividades: [],
};
