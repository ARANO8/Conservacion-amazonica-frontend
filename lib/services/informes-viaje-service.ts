import api from '@/lib/api';
import type {
  InformeViajeResponse,
  CreateInformeViajePayload,
} from '@/types/informe-viaje-backend';
import type { InformeViajeInput } from '@/types/informe-viaje-schema';

/** El backend espera fechas ISO; el formulario trabaja con `yyyy-MM-dd`. */
function toIso(value: string | Date): string {
  if (value instanceof Date) return value.toISOString();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toISOString();
}

function adaptPayload(data: InformeViajeInput): CreateInformeViajePayload {
  return {
    fechaInicio: toIso(data.fechaInicio),
    fechaFin: toIso(data.fechaFin),
    actividades: data.actividades.map((a) => ({
      fecha: toIso(a.fecha),
      lugar: a.lugar.trim(),
      personaInstitucion: a.personaInstitucion.trim(),
      actividadesRealizadas: a.actividadesRealizadas.trim(),
    })),
  };
}

/**
 * Service del módulo Informe de Viaje.
 * El token Bearer lo inyecta el interceptor de `api` (lib/api.ts).
 */
export const informesViajeService = {
  async create(data: InformeViajeInput, signal?: AbortSignal) {
    const response = await api.post<InformeViajeResponse>(
      '/informes-viaje',
      adaptPayload(data),
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
      adaptPayload(data),
      { signal }
    );
    return response.data;
  },

  async remove(id: string | number, signal?: AbortSignal) {
    const response = await api.delete(`/informes-viaje/${id}`, {
      signal,
    });
    return response.data;
  },
};

export default informesViajeService;
