'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import axios from 'axios';
import { FileText } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface AnexoViewerProps {
  titulo: string;
  /** Trae el HTML del anexo desde el backend (misma plantilla que el PDF). */
  cargarHtml: (signal: AbortSignal) => Promise<string>;
  /** Clave que dispara la recarga, p. ej. el id del documento. */
  recargarCon: string | number;
  /** Botones de descarga u otras acciones junto al título. */
  acciones?: ReactNode;
  /** Ancho mínimo de la hoja antes de desplazarse horizontalmente. */
  anchoMinimo?: number;
}

/**
 * Muestra un ANEXO tal como lo genera el backend para el PDF. Se aísla en un
 * iframe para que sus estilos de hoja impresa no choquen con los de la app
 * (tema oscuro incluido: el documento siempre se ve como papel).
 */
export function AnexoViewer({
  titulo,
  cargarHtml,
  recargarCon,
  acciones,
  anchoMinimo = 640,
}: AnexoViewerProps) {
  const [html, setHtml] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [altura, setAltura] = useState(1100);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    setHtml(null);
    setError(false);

    cargarHtml(controller.signal)
      .then(setHtml)
      .catch((err) => {
        if (!axios.isCancel(err)) setError(true);
      });

    return () => controller.abort();
    // cargarHtml suele ser una función inline: se recarga solo por la clave
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recargarCon]);

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
          {titulo}
        </h2>
        {acciones}
      </div>

      <div className="overflow-x-auto rounded-lg border bg-white shadow-sm">
        {error ? (
          <p className="text-muted-foreground p-6 text-center text-sm">
            No se pudo cargar el documento. Intenta descargar el PDF.
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
            title={titulo}
            srcDoc={html}
            // Sin scripts: solo se permite leer su altura desde la página
            sandbox="allow-same-origin"
            onLoad={ajustarAltura}
            className="block w-full border-0"
            style={{ height: altura, minWidth: anchoMinimo }}
          />
        )}
      </div>
    </section>
  );
}
