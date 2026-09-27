'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import {
  ArrowLeft,
  CheckCircle,
  FilePlus2,
  Loader2,
  Map as MapIcon,
  MessageSquareWarning,
  Pencil,
  Send,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ObservacionAlert } from '@/components/shared/observacion-alert';
import { Anexo1Viewer } from '@/components/planes-viaje/anexo1-viewer';
import {
  PlanViajeEstadoBadge,
  planDisponible,
  planEditable,
  solicitudVinculada,
} from '@/components/planes-viaje/plan-viaje-estado';
import { planesViajeService } from '@/lib/services/planes-viaje-service';
import { useAuthStore } from '@/store/auth-store';
import type { PlanViajeResponse } from '@/types/plan-viaje-backend';

function mensajeDeError(error: unknown, porDefecto: string): string {
  if (axios.isAxiosError(error) && error.response?.data?.message) {
    const { message } = error.response.data;
    return Array.isArray(message) ? message.join('. ') : String(message);
  }
  return porDefecto;
}

export default function DetallePlanViajePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const usuario = useAuthStore((state) => state.user);
  const [plan, setPlan] = useState<PlanViajeResponse | null>(null);
  const [accion, setAccion] = useState<
    'enviar' | 'aprobar' | 'observar' | null
  >(null);
  const [observarAbierto, setObservarAbierto] = useState(false);
  const [motivo, setMotivo] = useState('');

  const cargar = useCallback(
    async (signal?: AbortSignal) => {
      try {
        setPlan(await planesViajeService.getById(params.id, signal));
      } catch {
        if (signal?.aborted) return;
        toast.error('No se pudo cargar el plan de viaje.');
        router.push('/app/planes-viaje');
      }
    },
    [params.id, router]
  );

  useEffect(() => {
    const controller = new AbortController();
    void cargar(controller.signal);
    return () => controller.abort();
  }, [cargar]);

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

  const miId = String(usuario?.id ?? '');
  const esResponsable = String(plan.usuarioId) === miId;
  const puedeDarVoBo =
    plan.estado === 'ENVIADO' &&
    (String(plan.directorProgramaId) === miId || usuario?.rol === 'ADMIN');
  const solicitud = solicitudVinculada(plan);

  const ejecutar = async (
    tipo: 'enviar' | 'aprobar' | 'observar',
    fn: () => Promise<PlanViajeResponse>,
    exito: string
  ) => {
    setAccion(tipo);
    try {
      setPlan(await fn());
      toast.success(exito);
      return true;
    } catch (error: unknown) {
      toast.error(mensajeDeError(error, 'No se pudo completar la acción.'));
      return false;
    } finally {
      setAccion(null);
    }
  };

  const confirmarObservacion = async () => {
    if (!motivo.trim()) {
      toast.error('Escribe el motivo de la observación.');
      return;
    }
    const ok = await ejecutar(
      'observar',
      () => planesViajeService.observar(plan.id, motivo.trim()),
      'Plan observado. Se notificó al responsable del viaje.'
    );
    if (ok) {
      setObservarAbierto(false);
      setMotivo('');
    }
  };

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
              <PlanViajeEstadoBadge estado={plan.estado} />
            </h1>
            <p className="text-muted-foreground text-xs">
              Planificación de Viaje (ANEXO 1)
              {plan.directorProgramaId && plan.directorPrograma
                ? ` — VoBo: ${plan.directorPrograma.nombreCompleto}`
                : ''}
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
          {esResponsable &&
            (plan.estado === 'BORRADOR' || plan.estado === 'OBSERVADO') && (
              <Button
                size="sm"
                disabled={!!accion}
                onClick={() =>
                  ejecutar(
                    'enviar',
                    () => planesViajeService.enviar(plan.id),
                    'Plan enviado al Director de Programa para su VoBo.'
                  )
                }
              >
                <Send className="mr-2 h-4 w-4" />
                {accion === 'enviar' ? 'Enviando...' : 'Enviar a VoBo'}
              </Button>
            )}
          {puedeDarVoBo && (
            <>
              <Button
                variant="outline"
                size="sm"
                disabled={!!accion}
                onClick={() => setObservarAbierto(true)}
              >
                <MessageSquareWarning className="mr-2 h-4 w-4" />
                Observar
              </Button>
              <Button
                size="sm"
                disabled={!!accion}
                onClick={() =>
                  ejecutar(
                    'aprobar',
                    () => planesViajeService.aprobar(plan.id),
                    'VoBo registrado. El responsable ya puede crear la solicitud.'
                  )
                }
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                {accion === 'aprobar' ? 'Aprobando...' : 'Dar VoBo'}
              </Button>
            </>
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
        <ObservacionAlert
          titulo="Plan observado por el Director de Programa"
          observacion={plan.estado === 'OBSERVADO' ? plan.observacion : null}
        />

        {plan.estado === 'ENVIADO' && esResponsable && (
          <p className="bg-muted rounded-md border px-3 py-2 text-sm">
            El plan está esperando el VoBo de{' '}
            <strong>{plan.directorPrograma?.nombreCompleto}</strong>. Cuando lo
            apruebe podrás crear la solicitud de fondos.
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

      <Dialog open={observarAbierto} onOpenChange={setObservarAbierto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Observar el plan {plan.codigoPlan}</DialogTitle>
            <DialogDescription>
              El plan vuelve al responsable del viaje con tu motivo para que lo
              corrija y lo reenvíe.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Ej: Falta la actividad del retorno a La Paz"
            className="min-h-28"
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setObservarAbierto(false)}
              disabled={accion === 'observar'}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={confirmarObservacion}
              disabled={accion === 'observar'}
            >
              {accion === 'observar' ? 'Enviando...' : 'Observar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
