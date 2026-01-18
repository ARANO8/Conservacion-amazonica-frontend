import api from '@/lib/api';
import {
  Proyecto,
  GrupoContable,
  PartidaPresupuestaria,
  ConceptoViatico,
  TipoGasto,
  CodigoPresupuestario,
  Banco,
} from '@/types/backend';

/**
 * Servicio para obtener catálogos y datos maestros del sistema.
 */
export const catalogosService = {
  /**
   * Obtener lista de proyectos activos.
   */
  getProyectos: async (): Promise<Proyecto[]> => {
    const { data } = await api.get<Proyecto[]>('/proyectos');
    return data;
  },

  /**
   * Obtener grupos contables filtrados por proyecto.
   * Según spec, usa path parameters en /poa/grupos/{proyectoId}
   */
  getGrupos: async (proyectoId: number): Promise<GrupoContable[]> => {
    const { data } = await api.get<GrupoContable[]>(
      `/poa/grupos/${proyectoId}`
    );
    return data;
  },

  /**
   * Obtener partidas presupuestarias con saldo filtradas por proyecto y grupo.
   * Según spec, usa path parameters en /poa/partidas/{proyectoId}/{grupoId}
   */
  getPartidas: async (
    proyectoId: number,
    grupoId: number
  ): Promise<PartidaPresupuestaria[]> => {
    const { data } = await api.get<PartidaPresupuestaria[]>(
      `/poa/partidas/${proyectoId}/${grupoId}`
    );
    return data;
  },

  /**
   * Obtener fuentes de financiamiento (Códigos Presupuestarios).
   */
  getFuentes: async (): Promise<CodigoPresupuestario[]> => {
    const { data } = await api.get<CodigoPresupuestario[]>(
      '/codigos-presupuestarios'
    );
    return data;
  },

  /**
   * Obtener lista de bancos.
   * NOTA: Este endpoint no fue encontrado en el backend-spec.json,
   * se implementa por requerimiento del usuario.
   */
  getBancos: async (): Promise<Banco[]> => {
    const { data } = await api.get<Banco[]>('/bancos');
    return data;
  },

  /**
   * Obtener conceptos de viáticos.
   */
  getConceptos: async (): Promise<ConceptoViatico[]> => {
    const { data } = await api.get<ConceptoViatico[]>('/conceptos');
    return data;
  },

  /**
   * Obtener tipos de gasto.
   */
  getTipoGastos: async (): Promise<TipoGasto[]> => {
    const { data } = await api.get<TipoGasto[]>('/tipo-gastos');
    return data;
  },
};
