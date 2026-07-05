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
  PartidaContable,
} from '@/types/catalogs';

export const catalogosService = {
  getPartidasContables: async (signal?: AbortSignal): Promise<PartidaContable[]> => {
    const { data } = await api.get<PartidaContable[]>('/catalogos/partidas-contables', { signal });
    return data;
  },

  getConceptos: async (signal?: AbortSignal): Promise<Concepto[]> => {
    const { data } = await api.get<Concepto[]>('/conceptos', { signal });
    return data;
  },

  getGrupos: async (signal?: AbortSignal): Promise<Grupo[]> => {
    const { data } = await api.get<Grupo[]>('/grupos', { signal });
    return data;
  },

  getPartidas: async (signal?: AbortSignal): Promise<Partida[]> => {
    const { data } = await api.get<Partida[]>('/partidas', { signal });
    return data;
  },

  getTiposGasto: async (signal?: AbortSignal): Promise<TipoGasto[]> => {
    const { data } = await api.get<TipoGasto[]>('/tipo-gastos', { signal });
    return data;
  },

  getUsuarios: async (signal?: AbortSignal): Promise<Usuario[]> => {
    const { data } = await api.get<Usuario[]>('/usuarios/lookup/activos', { signal });
    return data;
  },

  getPoaLookup: async (signal?: AbortSignal): Promise<PoaLookup[]> => {
    const { data } = await api.get<PoaLookup[]>('/poa/lookup', { signal });
    return data;
  },

  getProyectosByPoa: async (codigo: string, signal?: AbortSignal): Promise<Proyecto[]> => {
    const { data } = await api.get<Proyecto[]>(`/proyectos/by-poa/${codigo}`, { signal });
    return data;
  },

  getGruposByProyecto: async (proyectoId: number, signal?: AbortSignal): Promise<Grupo[]> => {
    const { data } = await api.get<Grupo[]>(
      `/grupos/by-proyecto/${proyectoId}`,
      { signal }
    );
    return data;
  },

  getPartidasByGrupo: async (grupoId: number, signal?: AbortSignal): Promise<Partida[]> => {
    const { data } = await api.get<Partida[]>(`/partidas/by-grupo/${grupoId}`, { signal });
    return data;
  },

  getCodigosPresupuestariosFilter: async (
    poa: string,
    proyectoId: number,
    grupoId: number,
    partidaId: number,
    signal?: AbortSignal
  ): Promise<CodigoPresupuestario[]> => {
    const { data } = await api.get<CodigoPresupuestario[]>(
      '/codigos-presupuestarios/filter',
      {
        params: { poa, proyectoId, grupoId, partidaId },
        signal,
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
  }, signal?: AbortSignal): Promise<{ costoTotal: number }> => {
    const { data } = await api.get<{ costoTotal: number }>('/poa/detail', {
      params,
      signal,
    });
    return data;
  },

  getEstructuraByPoa: async (
    codigoPoa: string,
    signal?: AbortSignal
  ): Promise<PoaStructureItem[]> => {
    const { data } = await api.get<PoaStructureItem[]>('/poa/structure', {
      params: { codigoPoa },
      signal,
    });
    return data;
  },
};
