'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Receipt } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import LiquidacionViaticosForm from '@/components/liquidaciones-viaticos/liquidacion-viaticos-form';
import { liquidacionEditable } from '@/components/liquidaciones-viaticos/liquidacion-viaticos-estado';
import { ObservacionAlert } from '@/components/shared/observacion-alert';
import { liquidacionesViaticosService } from '@/lib/services/liquidaciones-viaticos-service';
import { liquidacionToForm } from '@/types/liquidacion-viaticos-schema';
import type { LiquidacionViaticosResponse } from '@/types/liquidacion-viaticos-backend';

export default function EditarLiquidacionViaticosPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [liquidacion, setLiquidacion] =
    useState<LiquidacionViaticosResponse | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    liquidacionesViaticosService
      .getById(params.id, controller.signal)
      .then((data) => {
        if (!liquidacionEditable(data)) {
          toast.error('Esta liquidación ya no se puede editar.');
          router.replace(`/app/liquidaciones-viaticos/${data.id}`);
          return;
        }
        setLiquidacion(data);
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        toast.error('No se pudo cargar la liquidación de viáticos.');
        router.push('/app/liquidaciones-viaticos');
      });
    return () => controller.abort();
  }, [params.id, router]);

  if (!liquidacion) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="text-primary size-10 animate-spin" />
        <span className="text-muted-foreground ml-3 text-sm">
          Cargando liquidación...
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0">
      <div className="flex shrink-0 items-center gap-3 border-b px-6 py-4">
        <Button variant="ghost" size="icon" asChild className="shrink-0">
          <Link href={`/app/liquidaciones-viaticos/${liquidacion.id}`}>
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Volver a la liquidación</span>
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <Receipt className="text-primary h-5 w-5 shrink-0" />
          <div>
            <h1 className="text-lg leading-tight font-bold">
              Editar {liquidacion.codigoLiquidacion}
            </h1>
            <p className="text-muted-foreground text-xs">
              Liquidación de Viáticos (ANEXO 5).
            </p>
          </div>
        </div>
      </div>

      {liquidacion.estado === 'OBSERVADO' && (
        <div className="px-6 pt-6">
          <ObservacionAlert
            titulo="Liquidación observada por el Director de Programa"
            observacion={liquidacion.observacion}
          />
        </div>
      )}

      <LiquidacionViaticosForm
        liquidacionId={liquidacion.id}
        initialValues={liquidacionToForm(liquidacion)}
        codigoSolicitud={liquidacion.solicitud?.codigoSolicitud}
      />
    </div>
  );
}
