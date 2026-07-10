import api from '@/lib/api';
import type {
  OrdenCompraResponse,
  CreateOrdenCompraPayload,
  PrefillOrdenCompraResponse,
} from '@/types/orden-compra-backend';

export const ordenesCompraService = {
  async prefillFromCuadro(cuadroId: number, signal?: AbortSignal) {
    const response = await api.get<PrefillOrdenCompraResponse>(
      `/ordenes-compra/prefill/${cuadroId}`,
      { signal }
    );
    return response.data;
  },

  async createOrden(payload: CreateOrdenCompraPayload, signal?: AbortSignal) {
    const response = await api.post<OrdenCompraResponse>(
      '/ordenes-compra',
      payload,
      { signal }
    );
    return response.data;
  },

  async getOrdenes(signal?: AbortSignal) {
    const response = await api.get<OrdenCompraResponse[]>('/ordenes-compra', { signal });
    return response.data;
  },

  async getOrdenById(id: string | number, signal?: AbortSignal) {
    const response = await api.get<OrdenCompraResponse>(
      `/ordenes-compra/${id}`,
      { signal }
    );
    return response.data;
  },

  async updateOrden(id: string | number, payload: CreateOrdenCompraPayload, signal?: AbortSignal) {
    const response = await api.patch<OrdenCompraResponse>(
      `/ordenes-compra/${id}`,
      payload,
      { signal }
    );
    return response.data;
  },

  async deleteOrden(id: string | number, signal?: AbortSignal) {
    const response = await api.delete(`/ordenes-compra/${id}`, { signal });
    return response.data;
  },

  async downloadPdf(id: string | number, signal?: AbortSignal) {
    const response = await api.get(`/ordenes-compra/${id}/pdf`, {
      responseType: 'blob',
      signal,
    });
    return response.data as Blob;
  },
};

export default ordenesCompraService;
