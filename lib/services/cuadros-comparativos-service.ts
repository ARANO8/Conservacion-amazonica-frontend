import api from '@/lib/api';
import type {
  CuadroComparativoResponse,
  CreateCuadroComparativoPayload,
} from '@/types/cuadro-comparativo-backend';

/**
 * Service para el flujo de Compras y Servicios — Cuadros Comparativos.
 * El token Bearer es inyectado automáticamente por el interceptor de `api`.
 */
export const cuadrosComparativosService = {
  async createCuadro(payload: CreateCuadroComparativoPayload, signal?: AbortSignal) {
    const response = await api.post<CuadroComparativoResponse>(
      '/cuadros-comparativos',
      payload,
      { signal }
    );
    return response.data;
  },

  async getCuadros(signal?: AbortSignal) {
    const response = await api.get<CuadroComparativoResponse[]>(
      '/cuadros-comparativos',
      { signal }
    );
    return response.data;
  },

  async getCuadroById(id: string | number, signal?: AbortSignal) {
    const response = await api.get<CuadroComparativoResponse>(
      `/cuadros-comparativos/${id}`,
      { signal }
    );
    return response.data;
  },

  async updateCuadro(
    id: string | number,
    payload: Partial<CreateCuadroComparativoPayload>,
    signal?: AbortSignal
  ) {
    const response = await api.patch<CuadroComparativoResponse>(
      `/cuadros-comparativos/${id}`,
      payload,
      { signal }
    );
    return response.data;
  },

  async deleteCuadro(id: string | number, signal?: AbortSignal) {
    const response = await api.delete(`/cuadros-comparativos/${id}`, { signal });
    return response.data;
  },

  /** PASO 1: Emisor → CONTADOR */
  async enviarRevision(id: string | number, signal?: AbortSignal) {
    const response = await api.patch<CuadroComparativoResponse>(
      `/cuadros-comparativos/${id}/enviar-revision`,
      null,
      { signal }
    );
    return response.data;
  },

  /** PASO 2: CONTADOR → Denis (VALIDADOR_COMPRAS) */
  async enviarValidacion(id: string | number, signal?: AbortSignal) {
    const response = await api.patch<CuadroComparativoResponse>(
      `/cuadros-comparativos/${id}/enviar-validacion`,
      null,
      { signal }
    );
    return response.data;
  },

  /** PASO 3: Denis valida → devuelve al CONTADOR */
  async validar(id: string | number, signal?: AbortSignal) {
    const response = await api.patch<CuadroComparativoResponse>(
      `/cuadros-comparativos/${id}/validar`,
      null,
      { signal }
    );
    return response.data;
  },

  /** PASO 4: CONTADOR → Shirley (EJECUTIVO) */
  async enviarAprobacion(id: string | number, signal?: AbortSignal) {
    const response = await api.patch<CuadroComparativoResponse>(
      `/cuadros-comparativos/${id}/enviar-aprobacion`,
      null,
      { signal }
    );
    return response.data;
  },

  /** PASO 5: Shirley aprueba → APROBADO */
  async aprobar(id: string | number, signal?: AbortSignal) {
    const response = await api.patch<CuadroComparativoResponse>(
      `/cuadros-comparativos/${id}/aprobar`,
      null,
      { signal }
    );
    return response.data;
  },

  async observar(id: string | number, motivo: string, signal?: AbortSignal) {
    const response = await api.patch<CuadroComparativoResponse>(
      `/cuadros-comparativos/${id}/observar`,
      { motivo },
      { signal }
    );
    return response.data;
  },

  async downloadPdf(id: string | number, signal?: AbortSignal) {
    const response = await api.get(`/cuadros-comparativos/${id}/pdf`, {
      responseType: 'blob',
      signal,
    });
    return response.data;
  },
};

export default cuadrosComparativosService;
