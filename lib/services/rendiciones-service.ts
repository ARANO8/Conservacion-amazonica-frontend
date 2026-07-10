import api from '@/lib/api';
import { CreateRendicionInput } from '@/types/rendicion-schema';
import {
  adaptCreateRendicionPayload,
  adaptUpdateRendicionPayload,
  type CreateRendicionApiPayload,
  type UpdateRendicionApiPayload,
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
  async submitRendicion(payload: CreateRendicionApiPayload, signal?: AbortSignal) {
    const response = await api.post('/rendiciones', payload, { signal });
    return response.data;
  },

  /**
   * Creates a new rendición (accountability report) for a solicitud.
   * @param payload The form data with all rendición information.
   */
  async createRendicion(payload: CreateRendicionInput, signal?: AbortSignal) {
    // Adaptar el payload al formato exacto que espera el backend
    const adaptedPayload = adaptCreateRendicionPayload(payload);
    return this.submitRendicion(adaptedPayload, signal);
  },

  /**
   * Actualiza una rendición observada y la reenvía a revisión.
   * Solo se puede usar para rendiciones en estado OBSERVADO.
   * @param id El ID de la rendición a actualizar.
   * @param payload El payload ya adaptado para el backend.
   */
  async submitUpdateRendicion(
    id: string | number,
    payload: UpdateRendicionApiPayload,
    signal?: AbortSignal
  ) {
    const response = await api.patch(`/rendiciones/${id}`, payload, { signal });
    return response.data;
  },

  /**
   * Actualiza una rendición observada usando los datos del formulario.
   * Adapta automáticamente el payload al formato del backend.
   * @param id El ID de la rendición a actualizar.
   * @param payload Los datos del formulario de rendición.
   */
  async updateRendicion(id: string | number, payload: CreateRendicionInput, signal?: AbortSignal) {
    const adaptedPayload = adaptUpdateRendicionPayload(payload);
    return this.submitUpdateRendicion(id, adaptedPayload, signal);
  },

  /**
   * Fetches a single rendición by ID.
   * @param id The ID of the rendición.
   */
  async getRendicionById(id: string | number, signal?: AbortSignal) {
    const response = await api.get(`/rendiciones/${id}`, { signal });
    return response.data;
  },

  async getRendiciones(signal?: AbortSignal) {
    const response = await api.get<RendicionResponse[]>('/rendiciones', { signal });
    return response.data;
  },

  /**
   * Obtiene únicamente las rendiciones creadas por el usuario actual.
   * (Para "Mis Trámites > Rendiciones")
   */
  async getMisRendiciones(signal?: AbortSignal) {
    const response = await api.get<RendicionResponse[]>(
      '/rendiciones/mis-rendiciones',
      { signal }
    );
    return response.data;
  },

  /**
   * Fetches rendiciones by solicitud ID.
   * @param solicitudId The ID of the solicitud.
   */
  async getRendicionesBySolicitud(solicitudId: string | number, signal?: AbortSignal) {
    const response = await api.get(`/rendiciones`, {
      params: { solicitudId },
      signal,
    });
    return response.data;
  },

  /**
   * Obtiene una rendición a partir del ID de solicitud.
   */
  async getRendicionBySolicitud(solicitudId: string | number, signal?: AbortSignal) {
    const response = await api.get(`/rendiciones/solicitud/${solicitudId}`, { signal });
    return response.data;
  },

  async aprobarRendicion(
    id: string | number,
    payload: AprobarRendicionPayload,
    signal?: AbortSignal
  ) {
    const response = await api.post(`/rendiciones/${id}/aprobar`, payload, { signal });
    return response.data;
  },

  async observarRendicion(
    id: string | number,
    payload: ObservarRendicionPayload,
    signal?: AbortSignal
  ) {
    const response = await api.post(`/rendiciones/${id}/observar`, payload, { signal });
    return response.data;
  },

  async updateGastoPartidaPresupuestaria(
    gastoId: number,
    partidaId: number | null,
    signal?: AbortSignal
  ) {
    const response = await api.patch(
      `/rendiciones/gastos/${gastoId}/partida-presupuestaria`,
      { partidaId },
      { signal }
    );
    return response.data;
  },

  async updateGastoPartidaContable(
    gastoId: number,
    codigo: string | null,
    signal?: AbortSignal
  ) {
    const response = await api.patch(
      `/rendiciones/gastos/${gastoId}/partida-contable`,
      { codigo },
      { signal }
    );
    return response.data;
  },

  async downloadPdf(id: string | number, signal?: AbortSignal) {
    const response = await api.get(`/rendiciones/${id}/pdf`, {
      responseType: 'blob',
      signal,
    });
    return response.data;
  },
};

export default rendicionesService;
