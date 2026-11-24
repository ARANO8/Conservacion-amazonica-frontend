'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  FilePlus2,
  Loader2,
  Map as MapIcon,
  Pencil,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Anexo1Viewer } from '@/components/planes-viaje/anexo1-viewer';
import {
  PlanViajeSituacionBadge,
  faltanteDelPlan,
  planDisponible,
  planEditable,
  solicitudVinculada,
} from '@/components/planes-viaje/plan-viaje-estado';
import { planesViajeService } from '@/lib/services/planes-viaje-service';
import { useAuthStore } from '@/store/auth-store';
import type { PlanViajeResponse } from '@/types/plan-viaje-backend';

export default function DetallePlanViajePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const usuario = useAuthStore((state) => state.user);
  const [plan, setPlan] = useState<PlanViajeResponse | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    planesViajeService
      .getById(params.id, controller.signal)
      .then(setPlan)
      .catch(() => {
        if (controller.signal.aborted) return;
        toast.error('No se pudo cargar el plan de viaje.');
        router.push('/app/planes-viaje');
      });
    return () => controller.abort();
  }, [params.id, router]);

  if (!plan) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="text-primary size-10 animate-spin" />
        <span className="text-muted-foreground ml-3 text-sm">
          Cargando plan de viaje...
        </span>
      </div>
    );
  }

  const esResponsable = String(plan.usuarioId) === String(usuario?.id ?? '');
  const solicitud = solicitudVinculada(plan);
  const faltante = solicitud ? null : faltanteDelPlan(plan);

  return (
    <div className="flex flex-col gap-0">
      <div className="flex shrink-0 flex-wrap items-center gap-3 border-b px-6 py-4">
        <Button variant="ghost" size="icon" asChild className="shrink-0">
          <Link href="/app/planes-viaje">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Volver a planes de viaje</span>
          </Link>
        </Button>

        <div className="flex items-center gap-2">
          <MapIcon className="text-primary h-5 w-5 shrink-0" />
          <div>
            <h1 className="flex items-center gap-2 text-lg leading-tight font-bold">
              {plan.codigoPlan}
              <PlanViajeSituacionBadge plan={plan} />
            </h1>
            <p className="text-muted-foreground text-xs">
              Planificación de Viaje (ANEXO 1)
            </p>
          </div>
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          {esResponsable && planEditable(plan) && (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/app/planes-viaje/${plan.id}/editar`}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </Link>
            </Button>
          )}
          {esResponsable && planDisponible(plan) && (
            <Button size="sm" asChild>
              <Link href={`/app/solicitudes/nueva?planViajeId=${plan.id}`}>
                <FilePlus2 className="mr-2 h-4 w-4" />
                Crear solicitud de viaje
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-4 p-6">
        {faltante && esResponsable && (
          <p className="bg-muted rounded-md border px-3 py-2 text-sm">
            Completa el plan para poder iniciar la solicitud de fondos.{' '}
            {faltante}.
          </p>
        )}

        {solicitud && (
          <p className="bg-muted rounded-md border px-3 py-2 text-sm">
            Este plan respalda la solicitud{' '}
            <Link
              href={`/app/solicitudes/${solicitud.id}`}
              className="font-mono font-semibold hover:underline"
            >
              {solicitud.codigoSolicitud}
            </Link>
            .
          </p>
        )}

        <Anexo1Viewer
          planId={plan.id}
          codigoPlan={plan.codigoPlan}
          version={plan.updatedAt}
        />
      </div>
    </div>
  );
}
