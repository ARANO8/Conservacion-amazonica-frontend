import { CreateRendicionInput } from '@/types/rendicion-schema';

export interface CreateRendicionApiPayload {
  solicitudId: number;
  aprobadorActualId: number;
  fechaRendicion: string;
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
    urlComprobante?: string;
    tipoRetencion?: 'BIEN' | 'SERVICIO' | 'ALQUILER';
  }>;
  gastosSinRespaldo?: Array<{
    fechaGasto?: string;
    detalle: string;
    monto: number;
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
  declaracionJurada?: {
    confirmaDatosVeridicos: boolean;
    aceptaPoliticaDevolucion: boolean;
    tipoDeclaracion?: 'COMPLETA' | 'PARCIAL' | 'NEGATIVA';
    montoADevolver?: number;
    observaciones?: string;
  };
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
      ...(gasto.urlComprobante ? { urlComprobante: gasto.urlComprobante } : {}),
      ...(gasto.tipoRetencion ? { tipoRetencion: gasto.tipoRetencion } : {}),
    })),
  };

  if (data.gastosSinRespaldo && data.gastosSinRespaldo.length > 0) {
    payload.gastosSinRespaldo = data.gastosSinRespaldo.map((gasto) => ({
      ...(toIsoDateString(gasto.fechaGasto)
        ? { fechaGasto: toIsoDateString(gasto.fechaGasto) }
        : {}),
      detalle: gasto.detalle,
      monto: Number(gasto.monto),
    }));
  }

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

  if (data.declaracionJurada) {
    payload.declaracionJurada = {
      confirmaDatosVeridicos: data.declaracionJurada.confirmaDatosVeridicos,
      aceptaPoliticaDevolucion: data.declaracionJurada.aceptaPoliticaDevolucion,
      ...(data.declaracionJurada.tipoDeclaracion
        ? { tipoDeclaracion: data.declaracionJurada.tipoDeclaracion }
        : {}),
      ...(typeof data.declaracionJurada.montoADevolver === 'number'
        ? { montoADevolver: Number(data.declaracionJurada.montoADevolver) }
        : {}),
      ...(data.declaracionJurada.observaciones
        ? { observaciones: data.declaracionJurada.observaciones }
        : {}),
    };
  }

  if (data.observaciones) {
    payload.observaciones = data.observaciones;
  }

  return payload;
}
