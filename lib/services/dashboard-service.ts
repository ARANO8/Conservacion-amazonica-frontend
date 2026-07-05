import api from '@/lib/api';

export interface DashboardMovimiento {
  id: number;
  codigo: string;
  estado: string;
  costoTotal: number;
  createdAt: string;
}

export interface DashboardMetricaGerencial {
  montoTotal: number;
  montoComprometido: number;
  montoEjecutado: number;
}

export interface DashboardAnaliticaMensual {
  name: string;
  total: number;
}

export interface DashboardAnaliticaPartida {
  name: string;
  value: number;
}

export interface DashboardAdvancedAnalytics {
  tendenciaMensual: DashboardAnaliticaMensual[];
  distribucionPartidas: DashboardAnaliticaPartida[];
}

export interface DashboardMetrics {
  solicitudesActivas: number;
  rendicionesPendientes: number;
  montoPorRendir: number;
  ultimosMovimientos: DashboardMovimiento[];
  metricaGerencial: DashboardMetricaGerencial | null;
}

export const dashboardService = {
  /**
   * Obtiene métricas consolidadas del dashboard para el usuario autenticado.
   */
  async getDashboardMetrics(signal?: AbortSignal): Promise<DashboardMetrics> {
    const { data } = await api.get<DashboardMetrics>('/dashboard/metrics', { signal });
    return data;
  },

  /**
   * Obtiene analítica avanzada para perfiles gerenciales.
   */
  async getAdvancedAnalytics(signal?: AbortSignal): Promise<DashboardAdvancedAnalytics> {
    const { data } = await api.get<DashboardAdvancedAnalytics>(
      '/dashboard/analytics',
      { signal }
    );
    return data;
  },
};

export default dashboardService;
