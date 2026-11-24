'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ClipboardList, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import InformeViajeForm from '@/components/informes-viaje/informe-viaje-form';
import { informeEditable } from '@/components/informes-viaje/informe-viaje-estado';
import { ObservacionAlert } from '@/components/shared/observacion-alert';
import { informesViajeService } from '@/lib/services/informes-viaje-service';
import { informeToForm } from '@/types/informe-viaje-schema';
import type { InformeViajeResponse } from '@/types/informe-viaje-backend';

export default function EditarInformeViajePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [informe, setInforme] = useState<InformeViajeResponse | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    informesViajeService
      .getById(params.id, controller.signal)
      .then((data) => {
        if (!informeEditable(data)) {
          toast.error('Este informe de viaje ya no se puede editar.');
          router.replace(`/app/informes-viaje/${data.id}`);
          return;
        }
        setInforme(data);
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        toast.error('No se pudo cargar el informe de viaje.');
        router.push('/app/informes-viaje');
      });
    return () => controller.abort();
  }, [params.id, router]);

  if (!informe) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="text-primary size-10 animate-spin" />
        <span className="text-muted-foreground ml-3 text-sm">
          Cargando informe...
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0">
      <div className="flex shrink-0 items-center gap-3 border-b px-6 py-4">
        <Button variant="ghost" size="icon" asChild className="shrink-0">
          <Link href={`/app/informes-viaje/${informe.id}`}>
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Volver al informe de viaje</span>
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <ClipboardList className="text-primary h-5 w-5 shrink-0" />
          <div>
            <h1 className="text-lg leading-tight font-bold">
              Editar {informe.codigoInforme}
            </h1>
            <p className="text-muted-foreground text-xs">
              Informe de Viaje (ANEXO 7).
            </p>
          </div>
        </div>
      </div>

      {informe.estado === 'OBSERVADO' && (
        <div className="px-6 pt-6">
          <ObservacionAlert
            titulo="Informe observado por el Director de Programa"
            observacion={informe.observacion}
          />
        </div>
      )}

      <InformeViajeForm
        informeId={informe.id}
        initialValues={informeToForm(informe)}
        codigoSolicitud={informe.solicitud?.codigoSolicitud}
      />
    </div>
  );
}
