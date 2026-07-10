import { CreateRendicionInput } from '@/types/rendicion-schema';
import { RendicionResponse } from '@/types/rendicion-backend';

export interface CreateRendicionApiPayload {
  solicitudId: number;
  aprobadorActualId: number;
  fechaRendicion: string;
  comprobanteUrl: string;
  gastos: Array<{
    solicitudItemId?: number;
    concepto: string;
    detalle?: string;
    tipoDocumento: 'FACTURA' | 'RECIBO' | 'BOLETA';
    numeroDocumento?: string;
    proveedor?: string;
    fechaDocumento?: string;
    montoBruto: number;
    montoImpuestos: number;
    montoTotal: number;
    montoNeto: number;
    estado?: 'PENDIENTE' | 'COMPROBADO' | 'RECHAZADO';
    partidaId: number;
    tipoRetencion?: 'BIEN' | 'SERVICIO' | 'ALQUILER';
  }>;
  informeGastos?: {
    fechaInicio: string;
    fechaFin: string;
    actividades: Array<{
      fecha: string;
      lugar: string;
      personaInstitucion: string;
      actividadesRealizadas: string;
    }>;
  };
  observaciones?: string;
}

/**
 * Payload para actualizar una rendición observada.
 * Similar a CreateRendicionApiPayload pero sin solicitudId (ya está vinculada).
 */
export interface UpdateRendicionApiPayload {
  aprobadorActualId: number;
  fechaRendicion?: string;
  comprobanteUrl?: string;
  gastos?: CreateRendicionApiPayload['gastos'];
  informeGastos?: CreateRendicionApiPayload['informeGastos'];
  observaciones?: string;
}

function toIsoDateString(value?: string | Date | null): string | undefined {
  if (!value) return undefined;

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;

  return date.toISOString();
}

/**
 * Adapter que transforma el payload del formulario frontend
 * al formato exacto que espera el backend.
 */
export function adaptCreateRendicionPayload(
  data: CreateRendicionInput
): CreateRendicionApiPayload {
  const payload: CreateRendicionApiPayload = {
    solicitudId: data.solicitudId,
    aprobadorActualId: data.aprobadorActualId,
    fechaRendicion: new Date().toISOString(),
    comprobanteUrl: data.comprobanteUrl,
    gastos: (data.gastos ?? []).map((gasto) => ({
      ...(gasto.solicitudItemId !== undefined && {
        solicitudItemId: gasto.solicitudItemId,
      }),
      concepto: gasto.concepto,
      ...(gasto.detalle ? { detalle: gasto.detalle } : {}),
      tipoDocumento: gasto.tipoDocumento,
      ...(gasto.numeroDocumento
        ? { numeroDocumento: gasto.numeroDocumento }
        : {}),
      ...(gasto.proveedor ? { proveedor: gasto.proveedor } : {}),
      ...(toIsoDateString(gasto.fechaDocumento)
        ? { fechaDocumento: toIsoDateString(gasto.fechaDocumento) }
        : {}),
      montoBruto: Number(gasto.montoBruto ?? gasto.montoTotal),
      montoImpuestos: Number(gasto.montoImpuestos ?? 0),
      montoTotal: Number(gasto.montoTotal),
      montoNeto: Number(gasto.montoNeto),
      ...(gasto.estado ? { estado: gasto.estado } : {}),
      partidaId: Number(gasto.partidaId),
      ...(gasto.tipoRetencion ? { tipoRetencion: gasto.tipoRetencion } : {}),
    })),
  };

  if (data.informeGastos && data.informeGastos.actividades?.length > 0) {
    payload.informeGastos = {
      fechaInicio:
        toIsoDateString(data.informeGastos.fechaInicio) ??
        new Date().toISOString(),
      fechaFin:
        toIsoDateString(data.informeGastos.fechaFin) ??
        new Date().toISOString(),
      actividades: data.informeGastos.actividades.map((actividad) => ({
        fecha: toIsoDateString(actividad.fecha) ?? new Date().toISOString(),
        lugar: actividad.lugar,
        personaInstitucion: actividad.personaInstitucion,
        actividadesRealizadas: actividad.actividadesRealizadas,
      })),
    };
  }

  if (data.observaciones) {
    payload.observaciones = data.observaciones;
  }

  return payload;
}

/**
 * Adapter que transforma la respuesta del backend (RendicionResponse)
 * al formato del formulario frontend (CreateRendicionInput).
 * Se usa para prellenar el formulario en modo edición.
 */
export function adaptRendicionResponseToFormData(
  rendicion: RendicionResponse
): Partial<CreateRendicionInput> {
  const formData: Partial<CreateRendicionInput> = {
    solicitudId: rendicion.solicitudId,
    aprobadorActualId: 0, // El usuario debe elegir nuevamente
    observaciones: rendicion.observaciones ?? '',
    comprobanteUrl: rendicion.comprobanteUrl ?? '',

    // Gastos con respaldo
    gastos: (rendicion.gastosRendicion ?? []).map((gasto) => ({
      solicitudItemId: undefined, // No se guarda en backend
      concepto: gasto.concepto ?? gasto.detalle ?? '',
      detalle: gasto.detalle ?? '',
      tipoDocumento: (gasto.tipoDocumento ?? 'FACTURA') as
        | 'FACTURA'
        | 'RECIBO'
        | 'BOLETA',
      numeroDocumento: gasto.nroDocumento ?? gasto.numeroDocumento ?? '',
      proveedor: gasto.proveedor ?? '',
      fechaDocumento: gasto.fecha ?? gasto.fechaDocumento ?? '',
      montoBruto: Number(gasto.montoBruto ?? gasto.monto ?? 0),
      montoImpuestos: Number(gasto.montoImpuestos ?? 0),
      montoTotal: Number(
        gasto.montoBruto ?? gasto.montoTotal ?? gasto.monto ?? 0
      ),
      montoNeto: Number(gasto.montoNeto ?? 0),
      estado: (gasto.estado ?? 'PENDIENTE') as
        | 'PENDIENTE'
        | 'COMPROBADO'
        | 'RECHAZADO',
      partidaId: gasto.partidaId ?? 0,
      tipoRetencion:
        (gasto.tipoRetencion as 'BIEN' | 'SERVICIO' | 'ALQUILER') || undefined,
    })),

    // Informe de gastos
    informeGastos: rendicion.informeGastos
      ? {
          fechaInicio: rendicion.informeGastos.fechaInicio ?? '',
          fechaFin: rendicion.informeGastos.fechaFin ?? '',
          actividades: (rendicion.informeGastos.actividades ?? []).map(
            (act) => ({
              fecha: act.fecha ?? '',
              lugar: act.lugar ?? '',
              personaInstitucion: act.personaInstitucion ?? '',
              actividadesRealizadas: act.actividadesRealizadas ?? '',
            })
          ),
        }
      : {
          fechaInicio: '',
          fechaFin: '',
          actividades: [],
        },
  };

  return formData;
}

/**
 * Adapter para actualizar una rendición observada.
 * Similar a adaptCreateRendicionPayload pero sin solicitudId.
 */
export function adaptUpdateRendicionPayload(
  data: CreateRendicionInput
): UpdateRendicionApiPayload {
  const payload: UpdateRendicionApiPayload = {
    aprobadorActualId: data.aprobadorActualId,
    fechaRendicion: new Date().toISOString(),
    comprobanteUrl: data.comprobanteUrl,
    gastos: (data.gastos ?? []).map((gasto) => ({
      ...(gasto.solicitudItemId !== undefined && {
        solicitudItemId: gasto.solicitudItemId,
      }),
      concepto: gasto.concepto,
      ...(gasto.detalle ? { detalle: gasto.detalle } : {}),
      tipoDocumento: gasto.tipoDocumento,
      ...(gasto.numeroDocumento
        ? { numeroDocumento: gasto.numeroDocumento }
        : {}),
      ...(gasto.proveedor ? { proveedor: gasto.proveedor } : {}),
      ...(toIsoDateString(gasto.fechaDocumento)
        ? { fechaDocumento: toIsoDateString(gasto.fechaDocumento) }
        : {}),
      montoBruto: Number(gasto.montoBruto ?? gasto.montoTotal),
      montoImpuestos: Number(gasto.montoImpuestos ?? 0),
      montoTotal: Number(gasto.montoTotal),
      montoNeto: Number(gasto.montoNeto),
      ...(gasto.estado ? { estado: gasto.estado } : {}),
      partidaId: Number(gasto.partidaId),
      ...(gasto.tipoRetencion ? { tipoRetencion: gasto.tipoRetencion } : {}),
    })),
  };

  if (data.informeGastos && data.informeGastos.actividades?.length > 0) {
    payload.informeGastos = {
      fechaInicio:
        toIsoDateString(data.informeGastos.fechaInicio) ??
        new Date().toISOString(),
      fechaFin:
        toIsoDateString(data.informeGastos.fechaFin) ??
        new Date().toISOString(),
      actividades: data.informeGastos.actividades.map((actividad) => ({
        fecha: toIsoDateString(actividad.fecha) ?? new Date().toISOString(),
        lugar: actividad.lugar,
        personaInstitucion: actividad.personaInstitucion,
        actividadesRealizadas: actividad.actividadesRealizadas,
      })),
    };
  }

  if (data.observaciones) {
    payload.observaciones = data.observaciones;
  }

  return payload;
}
