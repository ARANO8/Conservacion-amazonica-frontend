import { useState, useEffect } from 'react';
import axios from 'axios';
import { catalogosService } from '@/lib/services/catalogos-service';
import {
  Concepto,
  Grupo,
  Partida,
  TipoGasto,
  Usuario,
  PoaLookup,
} from '@/types/catalogs';
import { toast } from 'sonner';

interface UseCatalogosReturn {
  conceptos: Concepto[];
  grupos: Grupo[];
  partidas: Partida[];
  tiposGasto: TipoGasto[];
  usuarios: Usuario[];
  poaCodes: PoaLookup[];
  isLoading: boolean;
  error: unknown;
}

export function useCatalogos(): UseCatalogosReturn {
  const [conceptos, setConceptos] = useState<Concepto[]>([]);
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [partidas, setPartidas] = useState<Partida[]>([]);
  const [tiposGasto, setTiposGasto] = useState<TipoGasto[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [poaCodes, setPoaCodes] = useState<PoaLookup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    const controller = new AbortController();
    const fetchCatalogos = async () => {
      try {
        setIsLoading(true);
        const [
          conceptosData,
          gruposData,
          partidasData,
          tiposGastoData,
          usuariosData,
          poaCodesData,
        ] = await Promise.all([
          catalogosService.getConceptos(controller.signal),
          catalogosService.getGrupos(controller.signal),
          catalogosService.getPartidas(controller.signal),
          catalogosService.getTiposGasto(controller.signal),
          catalogosService.getUsuarios(controller.signal),
          catalogosService.getPoaLookup(controller.signal),
        ]);

        setConceptos(conceptosData);
        setGrupos(gruposData);
        setPartidas(partidasData);
        setTiposGasto(tiposGastoData);
        setUsuarios(usuariosData);
        setPoaCodes(poaCodesData);
      } catch (err) {
        if (axios.isCancel(err)) {
          return;
        }
        console.error('🔥 Error cargando catálogos en Detalle:', err);
        toast.error('Error al cargar los catálogos');
        setError(err);
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    fetchCatalogos();

    return () => {
      controller.abort();
    };
  }, []);

  return {
    conceptos,
    grupos,
    partidas,
    tiposGasto,
    usuarios,
    poaCodes,
    isLoading,
    error,
  };
}
