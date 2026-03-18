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
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const { data } = await api.get<DashboardMetrics>('/dashboard/metrics');
    return data;
  },
};

export default dashboardService;
