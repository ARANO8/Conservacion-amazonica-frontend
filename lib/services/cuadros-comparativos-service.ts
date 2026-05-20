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
  async createCuadro(payload: CreateCuadroComparativoPayload) {
    const response = await api.post<CuadroComparativoResponse>(
      '/cuadros-comparativos',
      payload
    );
    return response.data;
  },

  async getCuadros() {
    const response = await api.get<CuadroComparativoResponse[]>(
      '/cuadros-comparativos'
    );
    return response.data;
  },

  async getCuadroById(id: string | number) {
    const response = await api.get<CuadroComparativoResponse>(
      `/cuadros-comparativos/${id}`
    );
    return response.data;
  },

  async updateCuadro(
    id: string | number,
    payload: Partial<CreateCuadroComparativoPayload>
  ) {
    const response = await api.patch<CuadroComparativoResponse>(
      `/cuadros-comparativos/${id}`,
      payload
    );
    return response.data;
  },

  async deleteCuadro(id: string | number) {
    const response = await api.delete(`/cuadros-comparativos/${id}`);
    return response.data;
  },

  /** PASO 1: Emisor → CONTADOR */
  async enviarRevision(id: string | number) {
    const response = await api.patch<CuadroComparativoResponse>(
      `/cuadros-comparativos/${id}/enviar-revision`
    );
    return response.data;
  },

  /** PASO 2: CONTADOR → Denis (VALIDADOR_COMPRAS) */
  async enviarValidacion(id: string | number) {
    const response = await api.patch<CuadroComparativoResponse>(
      `/cuadros-comparativos/${id}/enviar-validacion`
    );
    return response.data;
  },

  /** PASO 3: Denis valida → devuelve al CONTADOR */
  async validar(id: string | number) {
    const response = await api.patch<CuadroComparativoResponse>(
      `/cuadros-comparativos/${id}/validar`
    );
    return response.data;
  },

  /** PASO 4: CONTADOR → Shirley (EJECUTIVO) */
  async enviarAprobacion(id: string | number) {
    const response = await api.patch<CuadroComparativoResponse>(
      `/cuadros-comparativos/${id}/enviar-aprobacion`
    );
    return response.data;
  },

  /** PASO 5: Shirley aprueba → APROBADO */
  async aprobar(id: string | number) {
    const response = await api.patch<CuadroComparativoResponse>(
      `/cuadros-comparativos/${id}/aprobar`
    );
    return response.data;
  },

  async observar(id: string | number, motivo: string) {
    const response = await api.patch<CuadroComparativoResponse>(
      `/cuadros-comparativos/${id}/observar`,
      { motivo }
    );
    return response.data;
  },

  async downloadPdf(id: string | number) {
    const response = await api.get(`/cuadros-comparativos/${id}/pdf`, {
      responseType: 'blob',
    });
    return response.data;
  },
};

export default cuadrosComparativosService;
