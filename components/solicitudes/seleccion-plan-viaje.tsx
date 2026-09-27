'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Map as MapIcon, Pencil, Plus } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PlanViajeResumen } from '@/components/planes-viaje/plan-viaje-resumen';
import { planesViajeService } from '@/lib/services/planes-viaje-service';
import { formatFechaAnexo } from '@/lib/declaracion-movilidad';
import { cn } from '@/lib/utils';
import type { PlanViajeResponse } from '@/types/plan-viaje-backend';

interface SeleccionPlanViajeProps {
  /** Plan elegido (o el de la solicitud que se corrige) */
  plan: PlanViajeResponse | null;
  /** Preselección que llega por `?planViajeId=` desde el plan */
  planViajeIdInicial?: number;
  onSeleccionar: (plan: PlanViajeResponse) => void;
  /** Corrección de una solicitud observada: el plan ya está fijado */
  isEditMode?: boolean;
  solicitudId?: number | string;
}

function rangoDelPlan(plan: PlanViajeResponse): string {
  if (plan.actividades.length === 0) return '';
  const inicio = plan.actividades.map((a) => a.fechaInicio).sort()[0];
  const fin =
    plan.actividades
      .map((a) => a.fechaFin)
      .sort()
      .at(-1) ?? inicio;
  const desde = formatFechaAnexo(inicio);
  const hasta = formatFechaAnexo(fin);
  return desde === hasta ? desde : `${desde} al ${hasta}`;
}

/**
 * Paso 1 del wizard: la solicitud de viaje nace de un plan (ANEXO 1) propio,
 * aprobado y libre. El plan se muestra en solo lectura.
 */
export function SeleccionPlanViaje({
  plan,
  planViajeIdInicial,
  onSeleccionar,
  isEditMode = false,
  solicitudId,
}: SeleccionPlanViajeProps) {
  const [disponibles, setDisponibles] = useState<PlanViajeResponse[] | null>(
    isEditMode ? [] : null
  );

  useEffect(() => {
    if (isEditMode) return;
    const controller = new AbortController();
    planesViajeService
      .getDisponibles(controller.signal)
      .then((lista) => {
        setDisponibles(lista);
        if (plan || !planViajeIdInicial) return;
        const inicial = lista.find((p) => p.id === planViajeIdInicial);
        if (inicial) {
          onSeleccionar(inicial);
        } else {
          toast.error(
            'Ese plan de viaje no está disponible: debe ser tuyo, estar aprobado y no respaldar otra solicitud.'
          );
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          toast.error('No se pudieron cargar tus planes de viaje.');
          setDisponibles([]);
        }
      });
    return () => controller.abort();
    // Solo al montar: la preselección se aplica una vez
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode]);

  if (isEditMode) {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="font-semibold">
              Plan de viaje {plan?.codigoPlan ?? ''}
            </h3>
            <p className="text-muted-foreground text-sm">
              La solicitud se valida contra este plan al reenviarla. Si lo
              observado está en el plan, corrígelo primero.
            </p>
          </div>
          {plan && solicitudId && (
            <Button variant="outline" size="sm" asChild>
              <Link
                href={`/app/planes-viaje/${plan.id}/editar?volver=${encodeURIComponent(
                  `/app/solicitudes/${solicitudId}/editar`
                )}`}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Corregir plan
              </Link>
            </Button>
          )}
        </div>
        {plan ? (
          <PlanViajeResumen plan={plan} />
        ) : (
          <p className="text-muted-foreground text-sm">
            Esta solicitud no tiene plan de viaje asociado.
          </p>
        )}
      </div>
    );
  }

  if (disponibles === null) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (disponibles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-14 text-center">
        <div className="bg-muted flex h-14 w-14 items-center justify-center rounded-full">
          <MapIcon className="text-muted-foreground h-7 w-7" />
        </div>
        <h3 className="font-semibold">No tienes planes de viaje aprobados</h3>
        <p className="text-muted-foreground max-w-md text-sm">
          Toda solicitud de viaje nace de un Plan de Viaje (ANEXO 1) con el VoBo
          del Director de Programa. Crea el plan, envíalo a VoBo y vuelve aquí
          cuando esté aprobado.
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/app/planes-viaje">Ver mis planes</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/app/planes-viaje/nueva">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo plan de viaje
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h3 className="font-semibold">Elige el plan de viaje aprobado</h3>
        <p className="text-muted-foreground text-sm">
          Lugares, objetivo, fechas, participantes y Director de Programa se
          toman del plan.
        </p>
      </div>

      <div className="grid gap-2 md:grid-cols-2">
        {disponibles.map((p) => {
          const elegido = plan?.id === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onSeleccionar(p)}
              aria-pressed={elegido}
              className={cn(
                'hover:bg-muted/50 flex items-start gap-3 rounded-lg border p-3 text-left transition-colors',
                elegido && 'border-primary bg-primary/5 ring-primary ring-1'
              )}
            >
              <CheckCircle2
                className={cn(
                  'mt-0.5 h-5 w-5 shrink-0',
                  elegido ? 'text-primary' : 'text-muted-foreground/40'
                )}
              />
              <span className="min-w-0 space-y-0.5">
                <span className="block font-mono text-xs font-semibold">
                  {p.codigoPlan}
                </span>
                <span className="block truncate text-sm font-medium">
                  {p.objetivoViaje}
                </span>
                <span className="text-muted-foreground block text-xs">
                  {p.lugaresViaje} · {rangoDelPlan(p)} · {p.actividades.length}{' '}
                  actividad(es)
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {plan && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Plan elegido</h4>
          <PlanViajeResumen plan={plan} />
        </div>
      )}
    </div>
  );
}
