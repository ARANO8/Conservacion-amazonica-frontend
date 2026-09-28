import api from '@/lib/api';
import type {
  InformeViajePayload,
  InformeViajeResponse,
  SolicitudInformable,
} from '@/types/informe-viaje-backend';
import type { InformeViajeInput } from '@/types/informe-viaje-schema';

/** El backend espera fechas ISO; el formulario trabaja con `yyyy-MM-dd`. */
function toIso(value: string): string {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toISOString();
}

function adaptPayload(
  data: InformeViajeInput,
  conSolicitud: boolean
): InformeViajePayload {
  const directorId = Number(data.directorProgramaId);
  return {
    // La solicitud se fija al crear; al editar no viaja
    ...(conSolicitud ? { solicitudId: data.solicitudId } : {}),
    motivoViaje: data.motivoViaje.trim(),
    lugarViaje: data.lugarViaje.trim(),
    lugarEmision: data.lugarEmision.trim(),
    fechaEmision: toIso(data.fechaEmision),
    ...(directorId ? { directorProgramaId: directorId } : {}),
    actividades: data.actividades.map((a) => ({
      fecha: toIso(a.fecha),
      lugar: a.lugar.trim(),
      personaInstitucion: a.personaInstitucion.trim(),
      actividadesRealizadas: a.actividadesRealizadas.trim(),
    })),
  };
}

/**
 * Service del módulo Informe de Viaje (ANEXO 7).
 * El token lo inyecta el interceptor de `api` (lib/api.ts).
 */
export const informesViajeService = {
  /** Solicitudes propias, desembolsadas y sin informe, con su precarga. */
  async getSolicitudesDisponibles(signal?: AbortSignal) {
    const response = await api.get<SolicitudInformable[]>(
      '/informes-viaje/solicitudes-disponibles',
      { signal }
    );
    return response.data;
  },

  async create(data: InformeViajeInput, signal?: AbortSignal) {
    const response = await api.post<InformeViajeResponse>(
      '/informes-viaje',
      adaptPayload(data, true),
      { signal }
    );
    return response.data;
  },

  async getAll(signal?: AbortSignal) {
    const response = await api.get<InformeViajeResponse[]>('/informes-viaje', {
      signal,
    });
    return response.data;
  },

  /** Bandeja de revisión del Director de Programa. */
  async getPendientes(signal?: AbortSignal) {
    const response = await api.get<InformeViajeResponse[]>(
      '/informes-viaje/pendientes',
      { signal }
    );
    return response.data;
  },

  async getById(id: string | number, signal?: AbortSignal) {
    const response = await api.get<InformeViajeResponse>(
      `/informes-viaje/${id}`,
      { signal }
    );
    return response.data;
  },

  async update(
    id: string | number,
    data: InformeViajeInput,
    signal?: AbortSignal
  ) {
    const response = await api.patch<InformeViajeResponse>(
      `/informes-viaje/${id}`,
      adaptPayload(data, false),
      { signal }
    );
    return response.data;
  },

  async enviar(id: string | number) {
    const response = await api.post<InformeViajeResponse>(
      `/informes-viaje/${id}/enviar`
    );
    return response.data;
  },

  async revisar(id: string | number) {
    const response = await api.post<InformeViajeResponse>(
      `/informes-viaje/${id}/revisar`
    );
    return response.data;
  },

  async observar(id: string | number, motivo: string) {
    const response = await api.post<InformeViajeResponse>(
      `/informes-viaje/${id}/observar`,
      { motivo }
    );
    return response.data;
  },

  async remove(id: string | number) {
    const response = await api.delete(`/informes-viaje/${id}`);
    return response.data;
  },

  async downloadPdf(id: string | number, signal?: AbortSignal) {
    const response = await api.get(`/informes-viaje/${id}/pdf`, {
      responseType: 'blob',
      signal,
    });
    return response.data as Blob;
  },
};

export default informesViajeService;
