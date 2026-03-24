'use client';

import { useEffect, useState } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import {
  dashboardService,
  type DashboardMetrics,
} from '@/lib/services/dashboard-service';
import { notificacionesService } from '@/lib/services/notificaciones-service';
import { KpiCards } from '@/components/dashboard/kpi-cards';
import { RecentMovements } from '@/components/dashboard/recent-movements';
import { PoaThermometer } from '@/components/dashboard/poa-thermometer';
import { useAuthStore } from '@/store/auth-store';

const APPROVER_ROLES = new Set(['ADMIN', 'EJECUTIVO', 'TESORERO', 'CONTADOR']);

export default function Page() {
  const { user } = useAuthStore();

  const [isCurrentApprover, setIsCurrentApprover] = useState(false);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(true);

  const isApproverByRole = user ? APPROVER_ROLES.has(user.rol) : false;
  const isApprover = isApproverByRole || isCurrentApprover;

  useEffect(() => {
    let mounted = true;

    if (!user) {
      setIsCurrentApprover(false);
      return;
    }

    if (APPROVER_ROLES.has(user.rol)) {
      setIsCurrentApprover(false);
      return;
    }

    const fetchApprovalAssignments = async () => {
      try {
        const notificaciones =
          await notificacionesService.getMisNotificaciones();
        if (!mounted) {
          return;
        }

        const hasPendingAssignments = notificaciones.some(
          (notificacion) =>
            notificacion.tipo === 'SOLICITUD_ASIGNADA' ||
            notificacion.tipo === 'SOLICITUD_DERIVADA' ||
            notificacion.tipo === 'RENDICION_PENDIENTE'
        );

        setIsCurrentApprover(hasPendingAssignments);
      } catch {
        if (mounted) {
          setIsCurrentApprover(false);
        }
      }
    };

    void fetchApprovalAssignments();

    return () => {
      mounted = false;
    };
  }, [user]);

  useEffect(() => {
    let mounted = true;

    const fetchMetrics = async () => {
      try {
        const data = await dashboardService.getDashboardMetrics();
        if (mounted) {
          setMetrics(data);
        }
      } finally {
        if (mounted) {
          setIsLoadingMetrics(false);
        }
      }
    };

    void fetchMetrics();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
      <section className="bg-card rounded-xl border p-6 shadow-sm">
        <h1 className="text-2xl font-semibold">Bienvenidos AMZ desk</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Este panel es el punto de partida para gestionar solicitudes y
          rendiciones y mucho más.
        </p>
      </section>

      <section>
        {isApprover ? (
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Revisión de Solicitudes</CardTitle>
                <CardDescription>
                  Accede a las solicitudes pendientes para aprobar o rechazar.
                </CardDescription>
              </CardHeader>
              <CardFooter>
                <Button asChild>
                  <Link href="/app/aprobaciones">Ir a Revisión</Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Nueva Solicitud de Fondos</CardTitle>
                <CardDescription>
                  Inicia una nueva solicitud para actividades institucionales.
                </CardDescription>
              </CardHeader>
              <CardFooter>
                <Button asChild>
                  <Link href="/app/solicitudes/nueva">Crear solicitud</Link>
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Rendición de Fondos</CardTitle>
                <CardDescription>
                  Carga la rendición de fondos para tus solicitudes.
                </CardDescription>
              </CardHeader>
              <CardFooter>
                <Button asChild>
                  <Link href="/app/rendiciones/nueva">Cargar rendición</Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}
      </section>

      <section>
        <div className="space-y-3">
          <div>
            <CardTitle className="text-lg">Dashboard de Métricas</CardTitle>
            <CardDescription className="text-amzdesk-helper mt-1">
              Resumen actualizado de solicitudes, rendiciones y montos.
            </CardDescription>
          </div>

          {isLoadingMetrics ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <Skeleton className="h-28 w-full" />
                <Skeleton className="h-28 w-full" />
                <Skeleton className="h-28 w-full" />
              </div>

              <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
                <Skeleton className="h-72 w-full" />
                <Skeleton className="h-72 w-full" />
              </div>
            </div>
          ) : metrics ? (
            <>
              <KpiCards data={metrics} />

              <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
                <RecentMovements data={metrics.ultimosMovimientos} />
                {metrics.metricaGerencial ? (
                  <PoaThermometer data={metrics.metricaGerencial} />
                ) : null}
              </div>
            </>
          ) : (
            <div className="text-amzdesk-helper rounded-md border p-4 text-sm">
              No se pudieron cargar las métricas del dashboard.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
