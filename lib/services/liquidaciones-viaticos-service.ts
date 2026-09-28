import api from '@/lib/api';
import type {
  GastosLvResponse,
  LiquidacionViaticosPayload,
  LiquidacionViaticosResponse,
  SolicitudLiquidable,
} from '@/types/liquidacion-viaticos-backend';
import type { LiquidacionViaticosInput } from '@/types/liquidacion-viaticos-schema';

/** El backend espera fechas ISO; el formulario trabaja con `yyyy-MM-dd`. */
function toIso(value: string): string {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toISOString();
}

function adaptPayload(
  data: LiquidacionViaticosInput,
  conSolicitud: boolean
): LiquidacionViaticosPayload {
  const directorId = Number(data.directorProgramaId);
  return {
    // La solicitud se fija al crear; al editar no viaja
    ...(conSolicitud ? { solicitudId: data.solicitudId } : {}),
    lugarEmision: data.lugarEmision.trim(),
    fechaEmision: toIso(data.fechaEmision),
    ...(directorId ? { directorProgramaId: directorId } : {}),
    hojas: data.hojas.map((h) => ({
      usuarioId: h.usuarioId,
      cargo: h.cargo.trim(),
      ci: h.ci.trim(),
      sede: h.sede.trim(),
      via: h.via.trim(),
      escala: h.escala.trim(),
      motivoViaje: h.motivoViaje.trim(),
      destino: h.destino.trim(),
      fechaSalida: toIso(h.fechaSalida),
      fechaRetorno: toIso(h.fechaRetorno),
      filas: h.filas.map((f) => ({
        conceptoId: f.conceptoId,
        porcentaje: f.porcentaje,
        dias: f.dias,
        ...(f.solicitudPresupuestoId
          ? { solicitudPresupuestoId: f.solicitudPresupuestoId }
          : {}),
      })),
    })),
  };
}

function descargar(ruta: string, signal?: AbortSignal) {
  return api
    .get(ruta, { responseType: 'blob', signal })
    .then((r) => r.data as Blob);
}

/**
 * Service del módulo Liquidación de Viáticos (ANEXO 5).
 * El token lo inyecta el interceptor de `api` (lib/api.ts).
 */
export const liquidacionesViaticosService = {
  /** Solicitudes propias, desembolsadas y sin liquidación, con sus hojas ya calculadas. */
  async getSolicitudesDisponibles(signal?: AbortSignal) {
    const response = await api.get<SolicitudLiquidable[]>(
      '/liquidaciones-viaticos/solicitudes-disponibles',
      { signal }
    );
    return response.data;
  },

  /** Gastos LV de la liquidación revisada, para importar en la rendición. */
  async getGastosLv(solicitudId: number, signal?: AbortSignal) {
    const response = await api.get<GastosLvResponse>(
      `/liquidaciones-viaticos/solicitud/${solicitudId}/gastos-lv`,
      { signal }
    );
    return response.data;
  },

  async create(data: LiquidacionViaticosInput) {
    const response = await api.post<LiquidacionViaticosResponse>(
      '/liquidaciones-viaticos',
      adaptPayload(data, true)
    );
    return response.data;
  },

  async getAll(signal?: AbortSignal) {
    const response = await api.get<LiquidacionViaticosResponse[]>(
      '/liquidaciones-viaticos',
      { signal }
    );
    return response.data;
  },

  /** Bandeja de revisión del Director de Programa. */
  async getPendientes(signal?: AbortSignal) {
    const response = await api.get<LiquidacionViaticosResponse[]>(
      '/liquidaciones-viaticos/pendientes',
      { signal }
    );
    return response.data;
  },

  async getById(id: string | number, signal?: AbortSignal) {
    const response = await api.get<LiquidacionViaticosResponse>(
      `/liquidaciones-viaticos/${id}`,
      { signal }
    );
    return response.data;
  },

  async update(id: string | number, data: LiquidacionViaticosInput) {
    const response = await api.patch<LiquidacionViaticosResponse>(
      `/liquidaciones-viaticos/${id}`,
      adaptPayload(data, false)
    );
    return response.data;
  },

  async enviar(id: string | number) {
    const response = await api.post<LiquidacionViaticosResponse>(
      `/liquidaciones-viaticos/${id}/enviar`
    );
    return response.data;
  },

  async revisar(id: string | number) {
    const response = await api.post<LiquidacionViaticosResponse>(
      `/liquidaciones-viaticos/${id}/revisar`
    );
    return response.data;
  },

  async observar(id: string | number, motivo: string) {
    const response = await api.post<LiquidacionViaticosResponse>(
      `/liquidaciones-viaticos/${id}/observar`,
      { motivo }
    );
    return response.data;
  },

  async remove(id: string | number) {
    const response = await api.delete(`/liquidaciones-viaticos/${id}`);
    return response.data;
  },

  /** PDF del viaje (una página por persona) o, con `hojaId`, de una persona. */
  downloadPdf(id: string | number, hojaId?: number, signal?: AbortSignal) {
    return descargar(
      hojaId
        ? `/liquidaciones-viaticos/${id}/hojas/${hojaId}/pdf`
        : `/liquidaciones-viaticos/${id}/pdf`,
      signal
    );
  },
};

export default liquidacionesViaticosService;
