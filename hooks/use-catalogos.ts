import { useState, useEffect } from 'react';
import { catalogosService } from '@/services/catalogos.service';
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
          catalogosService.getConceptos(),
          catalogosService.getGrupos(),
          catalogosService.getPartidas(),
          catalogosService.getTiposGasto(),
          catalogosService.getUsuarios(),
          catalogosService.getPoaLookup(),
        ]);

        setConceptos(conceptosData);
        setGrupos(gruposData);
        setPartidas(partidasData);
        setTiposGasto(tiposGastoData);
        setUsuarios(usuariosData);
        setPoaCodes(poaCodesData);
      } catch (err) {
        toast.error('Error al cargar los catálogos');
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCatalogos();
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
