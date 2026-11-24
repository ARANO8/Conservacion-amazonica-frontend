import api from '@/lib/api';
import type {
  DeclaracionMovilidadResponse,
  CreateDeclaracionMovilidadPayload,
} from '@/types/declaracion-movilidad-backend';
import type { DeclaracionMovilidadInput } from '@/types/declaracion-movilidad-schema';

/** El backend espera fechas ISO; el formulario trabaja con `yyyy-MM-dd`. */
function toIso(value: string | Date): string {
  if (value instanceof Date) return value.toISOString();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toISOString();
}

function adaptPayload(
  data: DeclaracionMovilidadInput
): CreateDeclaracionMovilidadPayload {
  return {
    cargo: data.cargo.trim(),
    motivoActividad: data.motivoActividad.trim(),
    proyectoPartida: data.proyectoPartida.trim(),
    lugarEmision: data.lugarEmision.trim(),
    fechaEmision: toIso(data.fechaEmision),
    // El monto con impuestos lo calcula el servidor: aquí sólo viaja el gasto.
    detalles: data.detalles.map((detalle) => ({
      fecha: toIso(detalle.fecha),
      origen: detalle.origen.trim(),
      destino: detalle.destino.trim(),
      motivo: detalle.motivo.trim(),
      montoGastado: Number(detalle.montoGastado),
    })),
  };
}

/**
 * Service del módulo Declaración Jurada de Movilidad (ANEXO 6).
 * El token lo inyecta el interceptor de `api` (lib/api.ts).
 */
export const declaracionesMovilidadService = {
  async create(data: DeclaracionMovilidadInput, signal?: AbortSignal) {
    const response = await api.post<DeclaracionMovilidadResponse>(
      '/declaraciones-movilidad',
      adaptPayload(data),
      { signal }
    );
    return response.data;
  },

  async getAll(signal?: AbortSignal) {
    const response = await api.get<DeclaracionMovilidadResponse[]>(
      '/declaraciones-movilidad',
      { signal }
    );
    return response.data;
  },

  async getById(id: string | number, signal?: AbortSignal) {
    const response = await api.get<DeclaracionMovilidadResponse>(
      `/declaraciones-movilidad/${id}`,
      { signal }
    );
    return response.data;
  },

  async update(
    id: string | number,
    data: DeclaracionMovilidadInput,
    signal?: AbortSignal
  ) {
    const response = await api.patch<DeclaracionMovilidadResponse>(
      `/declaraciones-movilidad/${id}`,
      adaptPayload(data),
      { signal }
    );
    return response.data;
  },

  async remove(id: string | number, signal?: AbortSignal) {
    const response = await api.delete(`/declaraciones-movilidad/${id}`, {
      signal,
    });
    return response.data;
  },

  async downloadPdf(id: string | number, signal?: AbortSignal) {
    const response = await api.get(`/declaraciones-movilidad/${id}/pdf`, {
      responseType: 'blob',
      signal,
    });
    return response.data;
  },
};

export default declaracionesMovilidadService;
