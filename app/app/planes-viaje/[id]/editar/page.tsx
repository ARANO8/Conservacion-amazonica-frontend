'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Map as MapIcon } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import PlanViajeForm from '@/components/planes-viaje/plan-viaje-form';
import {
  planEditable,
  solicitudVinculada,
} from '@/components/planes-viaje/plan-viaje-estado';
import {
  planViajeToForm,
  type PlanViajeFormData,
} from '@/components/planes-viaje/plan-viaje-schema';
import { ObservacionAlert } from '@/components/shared/observacion-alert';
import { planesViajeService } from '@/lib/services/planes-viaje-service';
import type { PlanViajeResponse } from '@/types/plan-viaje-backend';

export default function EditarPlanViajePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  // Solo rutas internas: evita redirigir fuera de la app
  const volver = useSearchParams().get('volver');
  const destino = volver?.startsWith('/app/') ? volver : undefined;
  const [plan, setPlan] = useState<PlanViajeResponse | null>(null);
  const [valores, setValores] = useState<PlanViajeFormData | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    planesViajeService
      .getById(params.id, controller.signal)
      .then((data) => {
        if (!planEditable(data)) {
          toast.error('Este plan de viaje ya no se puede editar.');
          router.replace(`/app/planes-viaje/${data.id}`);
          return;
        }
        setPlan(data);
        setValores(planViajeToForm(data));
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        toast.error('No se pudo cargar el plan de viaje.');
        router.push('/app/planes-viaje');
      });
    return () => controller.abort();
  }, [params.id, router]);

  if (!plan || !valores) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="text-primary size-10 animate-spin" />
        <span className="text-muted-foreground ml-3 text-sm">
          Cargando plan de viaje...
        </span>
      </div>
    );
  }

  const solicitud = solicitudVinculada(plan);

  return (
    <div className="flex flex-col gap-0">
      <div className="flex shrink-0 items-center gap-3 border-b px-6 py-4">
        <Button variant="ghost" size="icon" asChild className="shrink-0">
          <Link href={`/app/planes-viaje/${plan.id}`}>
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Volver al plan de viaje</span>
          </Link>
        </Button>

        <div className="flex items-center gap-2">
          <MapIcon className="text-primary h-5 w-5 shrink-0" />
          <div>
            <h1 className="text-lg leading-tight font-bold">
              Editar {plan.codigoPlan}
            </h1>
            <p className="text-muted-foreground text-xs">
              Planificación de Viaje (ANEXO 1).
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3 px-6 pt-6">
        <ObservacionAlert
          titulo="Plan observado por el Director de Programa"
          observacion={plan.estado === 'OBSERVADO' ? plan.observacion : null}
        />
        {solicitud && (
          <p className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
            Este plan respalda la solicitud {solicitud.codigoSolicitud}, que fue
            observada. Al guardar, vuelve a la solicitud y reenvíala: los
            viáticos y la nómina se validan contra el plan corregido.
          </p>
        )}
      </div>

      <PlanViajeForm
        planId={plan.id}
        initialValues={valores}
        directorFijo={!!solicitud}
        destino={destino}
      />
    </div>
  );
}
