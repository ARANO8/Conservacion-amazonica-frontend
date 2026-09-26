'use client';

import { solicitudesService } from '@/lib/services/solicitudes-service';
import { DownloadPdfButton } from '@/components/solicitudes/download-pdf-button';
import { AnexoViewer } from '@/components/shared/anexo-viewer';

interface Anexo2ViewerProps {
  solicitudId: number;
  codigoSolicitud?: string;
}

/** ANEXO 2 (Solicitud de Fondos para Viajes), idéntico al PDF. */
export function Anexo2Viewer({
  solicitudId,
  codigoSolicitud,
}: Anexo2ViewerProps) {
  return (
    <AnexoViewer
      titulo="Anexo 2 — Solicitud de Fondos para Viajes"
      cargarHtml={(signal) =>
        solicitudesService.getAnexo2Html(solicitudId, signal)
      }
      recargarCon={solicitudId}
      acciones={
        <DownloadPdfButton
          solicitudId={solicitudId}
          codigoSolicitud={codigoSolicitud}
        />
      }
    />
  );
}
