import api from '@/lib/api';
import type {
  InformeActividadesResponse,
  CreateInformeActividadesPayload,
} from '@/types/informe-actividades-backend';
import type { InformeActividadesInput } from '@/types/informe-actividades-schema';

/** El backend espera fechas ISO; el formulario trabaja con `yyyy-MM-dd`. */
function toIso(value: string | Date): string {
  if (value instanceof Date) return value.toISOString();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toISOString();
}

function adaptPayload(
  data: InformeActividadesInput
): CreateInformeActividadesPayload {
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
 * Service del módulo Informe de Actividades.
 * El token Bearer lo inyecta el interceptor de `api` (lib/api.ts).
 */
export const informesActividadesService = {
  async create(data: InformeActividadesInput, signal?: AbortSignal) {
    const response = await api.post<InformeActividadesResponse>(
      '/informes-actividades',
      adaptPayload(data),
      { signal }
    );
    return response.data;
  },

  async getAll(signal?: AbortSignal) {
    const response = await api.get<InformeActividadesResponse[]>(
      '/informes-actividades',
      { signal }
    );
    return response.data;
  },

  async getById(id: string | number, signal?: AbortSignal) {
    const response = await api.get<InformeActividadesResponse>(
      `/informes-actividades/${id}`,
      { signal }
    );
    return response.data;
  },

  async update(
    id: string | number,
    data: InformeActividadesInput,
    signal?: AbortSignal
  ) {
    const response = await api.patch<InformeActividadesResponse>(
      `/informes-actividades/${id}`,
      adaptPayload(data),
      { signal }
    );
    return response.data;
  },

  async remove(id: string | number, signal?: AbortSignal) {
    const response = await api.delete(`/informes-actividades/${id}`, {
      signal,
    });
    return response.data;
  },
};

export default informesActividadesService;
