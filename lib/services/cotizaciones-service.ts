import api from '@/lib/api';
import type {
  CotizacionResponse,
  CreateCotizacionPayload,
} from '@/types/cotizacion-backend';

/**
 * Service para el flujo de Compras y Servicios — Cotizaciones.
 * El token Bearer es inyectado automáticamente por el interceptor de `api`.
 */
export const cotizacionesService = {
  async createCotizacion(payload: CreateCotizacionPayload, signal?: AbortSignal) {
    const response = await api.post<CotizacionResponse>(
      '/cotizaciones',
      payload,
      { signal }
    );
    return response.data;
  },

  async getCotizaciones(signal?: AbortSignal) {
    const response = await api.get<CotizacionResponse[]>('/cotizaciones', { signal });
    return response.data;
  },

  async getCotizacionById(id: string | number, signal?: AbortSignal) {
    const response = await api.get<CotizacionResponse>(`/cotizaciones/${id}`, { signal });
    return response.data;
  },

  async updateCotizacion(
    id: string | number,
    payload: Partial<CreateCotizacionPayload>,
    signal?: AbortSignal
  ) {
    const response = await api.patch<CotizacionResponse>(
      `/cotizaciones/${id}`,
      payload,
      { signal }
    );
    return response.data;
  },

  async deleteCotizacion(id: string | number, signal?: AbortSignal) {
    const response = await api.delete(`/cotizaciones/${id}`, { signal });
    return response.data;
  },

  async downloadPdf(id: string | number, signal?: AbortSignal) {
    const response = await api.get(`/cotizaciones/${id}/pdf`, {
      responseType: 'blob',
      signal,
    });
    return response.data;
  },
};

export default cotizacionesService;
