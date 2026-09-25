'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { FileText } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { solicitudesService } from '@/lib/services/solicitudes-service';
import { DownloadPdfButton } from '@/components/solicitudes/download-pdf-button';

interface Anexo2ViewerProps {
  solicitudId: number;
  codigoSolicitud?: string;
}

/**
 * Muestra el ANEXO 2 tal como lo genera el backend para el PDF. Se aísla en un
 * iframe para que sus estilos de hoja impresa no choquen con los de la app
 * (tema oscuro incluido: el documento siempre se ve como papel).
 */
export function Anexo2Viewer({
  solicitudId,
  codigoSolicitud,
}: Anexo2ViewerProps) {
  const [html, setHtml] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [altura, setAltura] = useState(1100);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const controller = new AbortController();

    solicitudesService
      .getAnexo2Html(solicitudId, controller.signal)
      .then(setHtml)
      .catch((err) => {
        if (!axios.isCancel(err)) setError(true);
      });

    return () => controller.abort();
  }, [solicitudId]);

  // El iframe no crece solo: se ajusta a la altura real de la hoja
  const ajustarAltura = useCallback(() => {
    const documento = iframeRef.current?.contentDocument;
    if (documento?.body) {
      setAltura(documento.documentElement.scrollHeight);
    }
  }, []);

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <FileText className="h-5 w-5" />
          Anexo 2 — Solicitud de Fondos para Viajes
        </h2>
        <DownloadPdfButton
          solicitudId={solicitudId}
          codigoSolicitud={codigoSolicitud}
        />
      </div>

      <div className="overflow-x-auto rounded-lg border bg-white shadow-sm">
        {error ? (
          <p className="text-muted-foreground p-6 text-center text-sm">
            No se pudo cargar el Anexo 2. Intenta descargar el PDF.
          </p>
        ) : html === null ? (
          <div className="space-y-3 p-6">
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : (
          <iframe
            ref={iframeRef}
            title={`Anexo 2 ${codigoSolicitud ?? ''}`.trim()}
            srcDoc={html}
            // Sin scripts: solo se permite leer su altura desde la página
            sandbox="allow-same-origin"
            onLoad={ajustarAltura}
            className="block w-full min-w-[640px] border-0"
            style={{ height: altura }}
          />
        )}
      </div>
    </section>
  );
}
