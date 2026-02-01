import api from '@/lib/api';
import { PoaStructureItem } from '@/types/backend';
import {
  Concepto,
  Grupo,
  Partida,
  TipoGasto,
  Usuario,
  PoaLookup,
  Proyecto,
  CodigoPresupuestario,
} from '@/types/catalogs';

export const catalogosService = {
  getConceptos: async (): Promise<Concepto[]> => {
    const { data } = await api.get<Concepto[]>('/conceptos');
    return data;
  },

  getGrupos: async (): Promise<Grupo[]> => {
    const { data } = await api.get<Grupo[]>('/grupos');
    return data;
  },

  getPartidas: async (): Promise<Partida[]> => {
    const { data } = await api.get<Partida[]>('/partidas');
    return data;
  },

  getTiposGasto: async (): Promise<TipoGasto[]> => {
    const { data } = await api.get<TipoGasto[]>('/tipo-gastos');
    return data;
  },

  getUsuarios: async (): Promise<Usuario[]> => {
    const { data } = await api.get<Usuario[]>('/usuarios');
    return data;
  },

  getPoaLookup: async (): Promise<PoaLookup[]> => {
    const { data } = await api.get<PoaLookup[]>('/poa/lookup');
    return data;
  },

  getProyectosByPoa: async (codigo: string): Promise<Proyecto[]> => {
    const { data } = await api.get<Proyecto[]>(`/proyectos/by-poa/${codigo}`);
    return data;
  },

  getGruposByProyecto: async (proyectoId: number): Promise<Grupo[]> => {
    const { data } = await api.get<Grupo[]>(
      `/grupos/by-proyecto/${proyectoId}`
    );
    return data;
  },

  getPartidasByGrupo: async (grupoId: number): Promise<Partida[]> => {
    const { data } = await api.get<Partida[]>(`/partidas/by-grupo/${grupoId}`);
    return data;
  },

  getCodigosPresupuestariosFilter: async (
    poa: string,
    proyectoId: number,
    grupoId: number,
    partidaId: number
  ): Promise<CodigoPresupuestario[]> => {
    const { data } = await api.get<CodigoPresupuestario[]>(
      '/codigos-presupuestarios/filter',
      {
        params: { poa, proyectoId, grupoId, partidaId },
      }
    );
    return data;
  },

  getPoaDetail: async (params: {
    codigoPoa: string;
    proyectoId: number;
    grupoId: number;
    partidaId: number;
    codigoPresupuestarioId: string | number;
  }): Promise<{ costoTotal: number }> => {
    const { data } = await api.get<{ costoTotal: number }>('/poa/detail', {
      params,
    });
    return data;
  },

  getEstructuraByPoa: async (
    codigoPoa: string
  ): Promise<PoaStructureItem[]> => {
    const { data } = await api.get<PoaStructureItem[]>('/poa/structure', {
      params: { codigoPoa },
    });
    return data;
  },
};
