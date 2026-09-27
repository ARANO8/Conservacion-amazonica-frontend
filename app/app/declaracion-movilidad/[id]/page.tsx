'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Pencil, Route } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { DownloadDeclaracionMovilidadPdfButton } from '@/components/declaraciones-movilidad/download-declaracion-movilidad-pdf-button';
import { declaracionesMovilidadService } from '@/lib/services/declaraciones-movilidad-service';
import { DocumentoViewer } from '@/components/shared/documento-viewer';
import type { DeclaracionMovilidadResponse } from '@/types/declaracion-movilidad-backend';

export default function DetalleDeclaracionMovilidadPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [declaracion, setDeclaracion] =
    useState<DeclaracionMovilidadResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargar = async () => {
      try {
        setLoading(true);
        setDeclaracion(await declaracionesMovilidadService.getById(params.id));
      } catch {
        toast.error('No se pudo cargar la declaración de movilidad.');
        router.push('/app/declaracion-movilidad');
      } finally {
        setLoading(false);
      }
    };

    void cargar();
  }, [params.id, router]);

  if (loading || !declaracion) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="text-primary size-10 animate-spin" />
        <span className="text-muted-foreground ml-3 text-sm">
          Cargando declaración...
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0">
      <div className="flex shrink-0 items-center gap-3 border-b px-6 py-4">
        <Button variant="ghost" size="icon" asChild className="shrink-0">
          <Link href="/app/declaracion-movilidad">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Volver a declaraciones de movilidad</span>
          </Link>
        </Button>

        <div className="flex items-center gap-2">
          <Route className="text-primary h-5 w-5 shrink-0" />
          <div>
            <h1 className="text-lg leading-tight font-bold">
              {declaracion.codigoDeclaracion}
            </h1>
            <p className="text-muted-foreground text-xs">
              Declaración Jurada de Movilidad (ANEXO 6).
            </p>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <DownloadDeclaracionMovilidadPdfButton
            declaracionId={declaracion.id}
            fileName={declaracion.codigoDeclaracion}
          />
          <Button variant="outline" size="sm" asChild className="h-8">
            <Link href={`/app/declaracion-movilidad/${declaracion.id}/editar`}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </Link>
          </Button>
        </div>
      </div>

      <div className="p-6">
        <DocumentoViewer
          titulo="Anexo 6 — Declaración Jurada de Movilidad"
          ruta={`/declaraciones-movilidad/${declaracion.id}/documento`}
          recargarCon={declaracion.updatedAt}
        />
      </div>
    </div>
  );
}
