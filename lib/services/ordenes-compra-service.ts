import api from '@/lib/api';
import type {
  OrdenCompraResponse,
  CreateOrdenCompraPayload,
  PrefillOrdenCompraResponse,
} from '@/types/orden-compra-backend';

export const ordenesCompraService = {
  async prefillFromCuadro(cuadroId: number) {
    const response = await api.get<PrefillOrdenCompraResponse>(
      `/ordenes-compra/prefill/${cuadroId}`
    );
    return response.data;
  },

  async createOrden(payload: CreateOrdenCompraPayload) {
    const response = await api.post<OrdenCompraResponse>(
      '/ordenes-compra',
      payload
    );
    return response.data;
  },

  async getOrdenes() {
    const response = await api.get<OrdenCompraResponse[]>('/ordenes-compra');
    return response.data;
  },

  async getOrdenById(id: string | number) {
    const response = await api.get<OrdenCompraResponse>(
      `/ordenes-compra/${id}`
    );
    return response.data;
  },

  async updateOrden(id: string | number, payload: CreateOrdenCompraPayload) {
    const response = await api.patch<OrdenCompraResponse>(
      `/ordenes-compra/${id}`,
      payload
    );
    return response.data;
  },

  async deleteOrden(id: string | number) {
    const response = await api.delete(`/ordenes-compra/${id}`);
    return response.data;
  },

  async downloadPdf(id: string | number) {
    const response = await api.get(`/ordenes-compra/${id}/pdf`, {
      responseType: 'blob',
    });
    return response.data as Blob;
  },
};

export default ordenesCompraService;
