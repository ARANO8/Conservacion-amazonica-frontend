'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  dashboardService,
  type DashboardAdvancedAnalytics,
} from '@/lib/services/dashboard-service';
import { MonthlyTrendChart } from '@/components/dashboard/monthly-trend-chart';
import { BudgetDistributionChart } from '@/components/dashboard/budget-distribution-chart';

export default function AnaliticaPage() {
  const [analytics, setAnalytics] = useState<DashboardAdvancedAnalytics | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isForbidden, setIsForbidden] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let mounted = true;

    const fetchAnalytics = async () => {
      try {
        const data = await dashboardService.getAdvancedAnalytics();
        if (mounted) {
          setAnalytics(data);
        }
      } catch (error: unknown) {
        const status =
          typeof error === 'object' &&
          error !== null &&
          'response' in error &&
          typeof error.response === 'object' &&
          error.response !== null &&
          'status' in error.response
            ? Number((error.response as { status?: unknown }).status)
            : undefined;

        if (mounted) {
          if (status === 403) {
            setIsForbidden(true);
          } else {
            setHasError(true);
          }
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    void fetchAnalytics();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
      <section className="bg-card rounded-xl border p-6 shadow-sm">
        <h1 className="text-2xl font-semibold">Analítica Avanzada</h1>
        <p className="text-amzdesk-helper mt-2 text-sm">
          Explora tendencias mensuales y distribución presupuestaria para la
          toma de decisiones.
        </p>
      </section>

      {isLoading ? (
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Skeleton className="h-[380px] w-full" />
          <Skeleton className="h-[380px] w-full" />
        </section>
      ) : isForbidden ? (
        <section>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-700">
                <AlertTriangle className="h-5 w-5" />
                Acceso Denegado
              </CardTitle>
              <CardDescription className="text-amzdesk-helper">
                Esta sección está disponible solo para perfiles gerenciales.
              </CardDescription>
            </CardHeader>
          </Card>
        </section>
      ) : hasError || !analytics ? (
        <section>
          <Card>
            <CardHeader>
              <CardTitle>No se pudo cargar la analítica</CardTitle>
              <CardDescription className="text-amzdesk-helper">
                Ocurrió un problema al cargar los datos. Intenta nuevamente en
                unos minutos.
              </CardDescription>
            </CardHeader>
          </Card>
        </section>
      ) : (
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <MonthlyTrendChart data={analytics.tendenciaMensual} />
          <BudgetDistributionChart data={analytics.distribucionPartidas} />
        </section>
      )}
    </div>
  );
}
