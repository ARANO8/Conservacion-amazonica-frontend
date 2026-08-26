'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Pencil, Route } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { MovilidadTablePreview } from '@/components/declaraciones-movilidad/movilidad-table';
import { DownloadDeclaracionMovilidadPdfButton } from '@/components/declaraciones-movilidad/download-declaracion-movilidad-pdf-button';
import { declaracionesMovilidadService } from '@/lib/services/declaraciones-movilidad-service';
import { formatFechaAnexo } from '@/lib/declaracion-movilidad';
import type { DeclaracionMovilidadResponse } from '@/types/declaracion-movilidad-backend';

function CampoCabecera({
  etiqueta,
  valor,
}: {
  etiqueta: string;
  valor: string;
}) {
  return (
    <div className="flex items-baseline gap-3">
      <span className="w-[190px] shrink-0 text-xs font-bold tracking-wider uppercase">
        {etiqueta}
      </span>
      <span className="border-border flex-1 border-b pb-0.5 text-sm">
        {valor || '—'}
      </span>
    </div>
  );
}

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

      <div className="space-y-6 p-6">
        <header className="space-y-1">
          <p className="text-muted-foreground text-center text-xs font-bold tracking-widest uppercase">
            Anexo 6
          </p>
          <h2 className="text-center text-lg font-bold tracking-wide uppercase">
            Declaración Jurada de Movilidad
          </h2>
          <p className="text-muted-foreground text-center text-xs font-semibold">
            (Expresado en Bolivianos)
          </p>
        </header>

        <section className="space-y-2">
          <CampoCabecera
            etiqueta="Nombre"
            valor={declaracion.usuario?.nombreCompleto ?? ''}
          />
          <CampoCabecera etiqueta="Cargo" valor={declaracion.cargo} />
          <CampoCabecera
            etiqueta="Motivo/Actividad"
            valor={declaracion.motivoActividad}
          />
          <CampoCabecera
            etiqueta="Proyecto/Partida Pptal"
            valor={declaracion.proyectoPartida}
          />
        </section>

        <p className="text-sm">
          De conformidad a las instrucciones impartidas por la institución{' '}
          <strong className="italic">DECLARO BAJO JURAMENTO</strong> haber
          realizado los gastos de movilidad que a continuación detallo:
        </p>

        <MovilidadTablePreview
          detalles={(declaracion.detalles ?? []).map((detalle) => ({
            fecha: formatFechaAnexo(detalle.fecha),
            origen: detalle.origen,
            destino: detalle.destino,
            motivo: detalle.motivo,
            monto: Number(detalle.monto),
          }))}
          totalBruto={Number(declaracion.totalBruto)}
          retencion={Number(declaracion.retencion)}
          totalLiquido={Number(declaracion.totalLiquido)}
        />

        <Separator />

        <p className="text-center text-sm italic">
          {declaracion.lugarEmision},{' '}
          {formatFechaAnexo(declaracion.fechaEmision)}
        </p>

        <div className="grid grid-cols-1 gap-8 pt-10 text-center text-xs sm:grid-cols-3">
          <div>
            <div className="border-border mx-auto w-44 border-b" />
            <p className="mt-1 font-bold tracking-wider uppercase">
              Preparado por
            </p>
            <p className="text-muted-foreground">
              {declaracion.usuario?.nombreCompleto ?? '—'}
            </p>
          </div>
          <div>
            <div className="border-border mx-auto w-44 border-b" />
            <p className="mt-1 font-bold tracking-wider uppercase">
              Revisado por
            </p>
          </div>
          <div>
            <div className="border-border mx-auto w-44 border-b" />
            <p className="mt-1 font-bold tracking-wider uppercase">
              Aprobado por
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
