'use client';

import { useState } from 'react';
import { FileDown, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { AnexoViewer } from '@/components/shared/anexo-viewer';
import { planesViajeService } from '@/lib/services/planes-viaje-service';
import { downloadBlob } from '@/lib/utils/download-blob';

interface Anexo1ViewerProps {
  planId: number;
  codigoPlan?: string;
  /** Cambia cuando el plan se edita, para volver a pedir el HTML */
  version?: string;
}

/** ANEXO 1 (Planificación de Viaje), idéntico al PDF. */
export function Anexo1Viewer({
  planId,
  codigoPlan,
  version,
}: Anexo1ViewerProps) {
  const [descargando, setDescargando] = useState(false);

  const descargar = async () => {
    setDescargando(true);
    try {
      await downloadBlob(
        () => planesViajeService.downloadPdf(planId),
        `ANEXO1-${codigoPlan ?? planId}`,
        {
          errorMessage: 'No se pudo descargar el PDF del plan de viaje.',
          successMessage: 'PDF del plan de viaje descargado.',
        }
      );
    } finally {
      setDescargando(false);
    }
  };

  return (
    <AnexoViewer
      titulo="Anexo 1 — Planificación de Viaje"
      cargarHtml={(signal) => planesViajeService.getAnexo1Html(planId, signal)}
      recargarCon={`${planId}-${version ?? ''}`}
      acciones={
        <Button
          variant="outline"
          size="sm"
          onClick={descargar}
          disabled={descargando}
        >
          {descargando ? (
            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
          ) : (
            <FileDown className="mr-1.5 h-4 w-4" />
          )}
          {descargando ? 'Generando...' : 'Descargar PDF'}
        </Button>
      }
    />
  );
}
