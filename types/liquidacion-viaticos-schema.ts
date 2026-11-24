import { z } from 'zod';
import { format } from 'date-fns';
import type {
  HojaPrecargada,
  LiquidacionViaticosResponse,
  SolicitudLiquidable,
} from '@/types/liquidacion-viaticos-backend';

/** ANEXO 5 — Liquidación de Viáticos: una hoja por persona institucional. */

export const FilaLiquidacionSchema = z.object({
  conceptoId: z.number().min(1, 'Elige la tarifa'),
  porcentaje: z.union([z.literal(100), z.literal(50)]),
  dias: z
    .number({ invalid_type_error: 'Indica los días' })
    .min(0.5, 'Mínimo medio día')
    .multipleOf(0.1, 'Un decimal como máximo'),
  /** Partida de la solicitud a la que se imputa; sin ella, la de los viáticos */
  solicitudPresupuestoId: z.number().optional(),
});

export type FilaLiquidacion = z.infer<typeof FilaLiquidacionSchema>;

export const HojaLiquidacionSchema = z
  .object({
    usuarioId: z.number().min(1),
    /** Solo para mostrar; el backend toma el nombre del usuario */
    nombre: z.string(),
    cargo: z.string().trim().min(1, 'El cargo es requerido'),
    ci: z.string(),
    sede: z.string(),
    via: z.string(),
    /** Vacía: el backend usa la del tipo de destino con más días */
    escala: z.string(),
    motivoViaje: z.string().trim().min(1, 'El motivo es requerido'),
    destino: z.string().trim().min(1, 'El destino es requerido'),
    fechaSalida: z.string().min(1, 'La fecha de salida es requerida'),
    fechaRetorno: z.string().min(1, 'La fecha de retorno es requerida'),
    filas: z
      .array(FilaLiquidacionSchema)
      .min(1, 'Cada persona necesita al menos una fila de viático'),
  })
  .refine((h) => !h.fechaSalida || h.fechaRetorno >= h.fechaSalida, {
    message: 'El retorno no puede ser anterior a la salida',
    path: ['fechaRetorno'],
  });

export type HojaLiquidacion = z.infer<typeof HojaLiquidacionSchema>;

export const LiquidacionViaticosSchema = z.object({
  solicitudId: z.number({ required_error: 'Elige la solicitud de viaje' }),
  lugarEmision: z.string().trim().min(1, 'El lugar de emisión es requerido'),
  fechaEmision: z.string().min(1, 'La fecha de emisión es requerida'),
  directorProgramaId: z.string().optional(),
  hojas: z
    .array(HojaLiquidacionSchema)
    .min(1, 'Agrega al menos una persona')
    .refine(
      (hojas) => new Set(hojas.map((h) => h.usuarioId)).size === hojas.length,
      'Una persona no puede tener dos hojas'
    ),
});

export type LiquidacionViaticosInput = z.infer<
  typeof LiquidacionViaticosSchema
>;

export function hoyCalendario(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

const soloFecha = (v: string | null | undefined) => (v ? v.slice(0, 10) : '');

export function filaVacia(solicitudPresupuestoId?: number): FilaLiquidacion {
  return { conceptoId: 0, porcentaje: 100, dias: 1, solicitudPresupuestoId };
}

/** Hoja nueva para una persona agregada a mano. */
export function hojaVacia(
  persona: { id: number; nombreCompleto: string; cargo?: string | null },
  base?: Pick<
    HojaLiquidacion,
    'motivoViaje' | 'destino' | 'fechaSalida' | 'fechaRetorno'
  >,
  solicitudPresupuestoId?: number
): HojaLiquidacion {
  return {
    usuarioId: persona.id,
    nombre: persona.nombreCompleto,
    cargo: persona.cargo ?? '',
    ci: '',
    sede: 'La Paz',
    via: '',
    escala: '',
    motivoViaje: base?.motivoViaje ?? '',
    destino: base?.destino ?? '',
    fechaSalida: base?.fechaSalida ?? '',
    fechaRetorno: base?.fechaRetorno ?? '',
    filas: [filaVacia(solicitudPresupuestoId)],
  };
}

function hojaDesdePrecarga(h: HojaPrecargada): HojaLiquidacion {
  return {
    usuarioId: h.usuario.id,
    nombre: h.usuario.nombreCompleto,
    cargo: h.cargo,
    ci: h.ci,
    sede: h.sede,
    via: h.via,
    // Se deja vacía para que siga a las filas; el placeholder muestra la sugerida
    escala: '',
    motivoViaje: h.motivoViaje,
    destino: h.destino,
    fechaSalida: soloFecha(h.fechaSalida),
    fechaRetorno: soloFecha(h.fechaRetorno),
    filas: h.filas.map((f) => ({
      conceptoId: f.conceptoId,
      porcentaje: f.porcentaje === 50 ? 50 : 100,
      dias: Number(f.dias),
      solicitudPresupuestoId: f.solicitudPresupuestoId,
    })),
  };
}

/** `solicitudId` queda sin valor hasta elegir la solicitud. */
export const defaultLiquidacionValues = {
  lugarEmision: 'La Paz',
  fechaEmision: hoyCalendario(),
  directorProgramaId: '',
  hojas: [],
} as Omit<LiquidacionViaticosInput, 'solicitudId'> as LiquidacionViaticosInput;

/** Solicitud elegida → una hoja por persona ya calculada. */
export function valoresDesdeSolicitud(
  solicitud: SolicitudLiquidable
): LiquidacionViaticosInput {
  return {
    ...defaultLiquidacionValues,
    solicitudId: solicitud.id,
    directorProgramaId: solicitud.directorProgramaId
      ? String(solicitud.directorProgramaId)
      : '',
    hojas: solicitud.hojas.map(hojaDesdePrecarga),
  };
}

/** Liquidación guardada → valores del formulario de edición. */
export function liquidacionToForm(
  liquidacion: LiquidacionViaticosResponse
): LiquidacionViaticosInput {
  return {
    solicitudId: liquidacion.solicitudId ?? 0,
    lugarEmision: liquidacion.lugarEmision,
    fechaEmision: soloFecha(liquidacion.fechaEmision),
    directorProgramaId: liquidacion.directorProgramaId
      ? String(liquidacion.directorProgramaId)
      : '',
    hojas: liquidacion.hojas.map((h) => ({
      usuarioId: h.usuarioId,
      nombre: h.usuario.nombreCompleto,
      cargo: h.cargo,
      ci: h.ci,
      sede: h.sede,
      via: h.via,
      escala: h.escala,
      motivoViaje: h.motivoViaje,
      destino: h.destino,
      fechaSalida: soloFecha(h.fechaSalida),
      fechaRetorno: soloFecha(h.fechaRetorno),
      filas: h.filas.map((f) => ({
        conceptoId: f.conceptoId,
        porcentaje: f.porcentaje === 50 ? 50 : 100,
        dias: Number(f.dias),
        solicitudPresupuestoId: f.solicitudPresupuestoId ?? undefined,
      })),
    })),
  };
}
