'use client';

import type { ReactNode } from 'react';
import api from '@/lib/api';
import { AnexoViewer } from '@/components/shared/anexo-viewer';

interface DocumentoViewerProps {
  titulo: string;
  /** Endpoint que devuelve el HTML del documento, p. ej. `/cotizaciones/5/documento` */
  ruta: string;
  /** Clave que fuerza la recarga (p. ej. `updatedAt` tras editar) */
  recargarCon?: string | number;
  acciones?: ReactNode;
  /** Los documentos apaisados (cuadro comparativo) necesitan más ancho */
  anchoMinimo?: number;
}

/**
 * Muestra cualquier documento del sistema tal como sale en el PDF: pide al
 * backend el HTML de la misma plantilla y lo aísla en el visor de anexos.
 */
export function DocumentoViewer({
  titulo,
  ruta,
  recargarCon,
  acciones,
  anchoMinimo,
}: DocumentoViewerProps) {
  return (
    <AnexoViewer
      titulo={titulo}
      cargarHtml={async (signal) => {
        const response = await api.get<string>(ruta, {
          responseType: 'text',
          signal,
        });
        return response.data;
      }}
      recargarCon={`${ruta}-${recargarCon ?? ''}`}
      acciones={acciones}
      anchoMinimo={anchoMinimo}
    />
  );
}
