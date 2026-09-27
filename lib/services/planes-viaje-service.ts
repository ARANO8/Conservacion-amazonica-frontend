import api from '@/lib/api';
import type {
  EstadoPlanViaje,
  PlanViajePayload,
  PlanViajeResponse,
} from '@/types/plan-viaje-backend';
import type { PlanViajeFormData } from '@/components/planes-viaje/plan-viaje-schema';

/** El backend espera fechas ISO; el formulario trabaja con `yyyy-MM-dd`. */
function toIso(value: string | Date): string {
  if (value instanceof Date) return value.toISOString();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toISOString();
}

/** Las fechas de actividad son de calendario: viajan como `yyyy-MM-dd`. */
function toFechaCalendario(value: string | Date): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return value.slice(0, 10);
}

export function adaptPlanViajePayload(
  data: PlanViajeFormData
): PlanViajePayload {
  const directorId = Number(data.directorProgramaId);
  return {
    cargo: data.cargo.trim(),
    lugaresViaje: data.lugaresViaje.trim(),
    objetivoViaje: data.objetivoViaje.trim(),
    lugarEmision: data.lugarEmision.trim(),
    fechaEmision: toIso(data.fechaEmision),
    ...(directorId ? { directorProgramaId: directorId } : {}),
    actividades: data.actividades.map((a) => ({
      ...(a.id ? { id: a.id } : {}),
      actividadProgramada: a.actividadProgramada.trim(),
      fechaInicio: toFechaCalendario(a.fechaInicio),
      fechaFin: toFechaCalendario(a.fechaFin),
      dias: Number(a.cantDias),
      lugarSalida: a.lugarSalida.trim(),
      lugarLlegada: a.lugarLlegada.trim(),
      cantInstitucional: Number(a.cantInstitucion),
      cantTerceros: Number(a.cantTerceros),
      participantesInstitucionalesIds: a.institucionales ?? [],
    })),
  };
}

/**
 * Service del módulo Plan de Viaje (ANEXO 1).
 * El token lo inyecta el interceptor de `api` (lib/api.ts).
 */
export const planesViajeService = {
  async create(data: PlanViajeFormData, signal?: AbortSignal) {
    const response = await api.post<PlanViajeResponse>(
      '/planes-viaje',
      adaptPlanViajePayload(data),
      { signal }
    );
    return response.data;
  },

  async getAll(
    filtros?: { estado?: EstadoPlanViaje; disponibles?: boolean },
    signal?: AbortSignal
  ) {
    const response = await api.get<PlanViajeResponse[]>('/planes-viaje', {
      params: filtros,
      signal,
    });
    return response.data;
  },

  /** Aprobados, propios y sin solicitud: los que puede usar el wizard. */
  async getDisponibles(signal?: AbortSignal) {
    return this.getAll({ disponibles: true }, signal);
  },

  /** Bandeja de VoBo del Director de Programa. */
  async getPendientes(signal?: AbortSignal) {
    const response = await api.get<PlanViajeResponse[]>(
      '/planes-viaje/pendientes',
      { signal }
    );
    return response.data;
  },

  async getById(id: string | number, signal?: AbortSignal) {
    const response = await api.get<PlanViajeResponse>(`/planes-viaje/${id}`, {
      signal,
    });
    return response.data;
  },

  async update(
    id: string | number,
    data: PlanViajeFormData,
    signal?: AbortSignal
  ) {
    const response = await api.patch<PlanViajeResponse>(
      `/planes-viaje/${id}`,
      adaptPlanViajePayload(data),
      { signal }
    );
    return response.data;
  },

  async enviar(id: string | number) {
    const response = await api.post<PlanViajeResponse>(
      `/planes-viaje/${id}/enviar`
    );
    return response.data;
  },

  async aprobar(id: string | number) {
    const response = await api.post<PlanViajeResponse>(
      `/planes-viaje/${id}/aprobar`
    );
    return response.data;
  },

  async observar(id: string | number, motivo: string) {
    const response = await api.post<PlanViajeResponse>(
      `/planes-viaje/${id}/observar`,
      { motivo }
    );
    return response.data;
  },

  async remove(id: string | number) {
    const response = await api.delete(`/planes-viaje/${id}`);
    return response.data;
  },

  async getAnexo1Html(id: string | number, signal?: AbortSignal) {
    const response = await api.get<string>(`/planes-viaje/${id}/anexo1`, {
      responseType: 'text',
      signal,
    });
    return response.data;
  },

  async downloadPdf(id: string | number, signal?: AbortSignal) {
    const response = await api.get(`/planes-viaje/${id}/pdf`, {
      responseType: 'blob',
      signal,
    });
    return response.data as Blob;
  },
};

export default planesViajeService;
