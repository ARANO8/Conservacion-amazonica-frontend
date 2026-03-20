import api from '@/lib/api';
import { CreateRendicionInput } from '@/types/rendicion-schema';
import {
  adaptCreateRendicionPayload,
  type CreateRendicionApiPayload,
} from '@/lib/adapters/rendicion-adapter';
import { RendicionResponse } from '@/types/rendicion-backend';

export interface AprobarRendicionPayload {
  comentario?: string;
  derivadoAId?: number;
}

export interface ObservarRendicionPayload {
  comentario: string;
}

/**
 * Service to handle Rendiciones (accountability reports) API calls.
 * El token Bearer es inyectado automáticamente por el interceptor de `api` (lib/api.ts).
 */
export const rendicionesService = {
  /**
   * Envía la rendición ya adaptada al endpoint oficial del backend.
   */
  async submitRendicion(payload: CreateRendicionApiPayload) {
    const response = await api.post('/rendiciones', payload);
    return response.data;
  },

  /**
   * Creates a new rendición (accountability report) for a solicitud.
   * @param payload The form data with all rendición information.
   */
  async createRendicion(payload: CreateRendicionInput) {
    // Adaptar el payload al formato exacto que espera el backend
    const adaptedPayload = adaptCreateRendicionPayload(payload);
    return this.submitRendicion(adaptedPayload);
  },

  /**
   * Fetches a single rendición by ID.
   * @param id The ID of the rendición.
   */
  async getRendicionById(id: string | number) {
    const response = await api.get(`/rendiciones/${id}`);
    return response.data;
  },

  async getMisRendiciones() {
    const response = await api.get<RendicionResponse[]>('/rendiciones');
    return response.data;
  },

  /**
   * Fetches rendiciones by solicitud ID.
   * @param solicitudId The ID of the solicitud.
   */
  async getRendicionesBySolicitud(solicitudId: string | number) {
    const response = await api.get(`/rendiciones`, {
      params: { solicitudId },
    });
    return response.data;
  },

  /**
   * Obtiene una rendición a partir del ID de solicitud.
   */
  async getRendicionBySolicitud(solicitudId: string | number) {
    const response = await api.get(`/rendiciones/solicitud/${solicitudId}`);
    return response.data;
  },

  async aprobarRendicion(
    id: string | number,
    payload: AprobarRendicionPayload
  ) {
    const response = await api.post(`/rendiciones/${id}/aprobar`, payload);
    return response.data;
  },

  async observarRendicion(
    id: string | number,
    payload: ObservarRendicionPayload
  ) {
    const response = await api.post(`/rendiciones/${id}/observar`, payload);
    return response.data;
  },
};

export default rendicionesService;
