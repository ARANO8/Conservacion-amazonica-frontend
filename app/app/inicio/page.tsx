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
import { useSearchParams } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import {
  dashboardService,
  type DashboardMetrics,
} from '@/lib/services/dashboard-service';
import { KpiCards } from '@/components/dashboard/kpi-cards';

export default function Page() {
  const searchParams = useSearchParams();
  const isApprover = searchParams.get('role') === 'approver';
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(true);

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
                  <Link href="/app/aprobaciones?role=approver">
                    Ir a Revisión
                  </Link>
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
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-28 w-full" />
            </div>
          ) : metrics ? (
            <KpiCards data={metrics} />
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
