'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  dashboardService,
  type DashboardAnaliticaMensual,
  type DashboardAdvancedAnalytics,
} from '@/lib/services/dashboard-service';
import { MonthlyTrendChart } from '@/components/dashboard/monthly-trend-chart';
import { BudgetDistributionChart } from '@/components/dashboard/budget-distribution-chart';

type TimeRangeFilter =
  | 'FULL_YEAR'
  | 'FIRST_SEMESTER'
  | 'SECOND_SEMESTER'
  | 'LAST_QUARTER';

function filterMonthlyTrend(
  data: DashboardAnaliticaMensual[],
  range: TimeRangeFilter
): DashboardAnaliticaMensual[] {
  if (range === 'FULL_YEAR') return data;

  return data.filter((_, index) => {
    if (range === 'FIRST_SEMESTER') {
      return index >= 0 && index <= 5;
    }
    if (range === 'SECOND_SEMESTER') {
      return index >= 6 && index <= 11;
    }
    return index >= 9 && index <= 11;
  });
}

export default function AnaliticaPage() {
  const [analytics, setAnalytics] = useState<DashboardAdvancedAnalytics | null>(
    null
  );
  const [timeRange, setTimeRange] = useState<TimeRangeFilter>('FULL_YEAR');
  const [isLoading, setIsLoading] = useState(true);
  const [isForbidden, setIsForbidden] = useState(false);
  const [hasError, setHasError] = useState(false);

  const filteredMonthlyTrend = analytics
    ? filterMonthlyTrend(analytics.tendenciaMensual, timeRange)
    : [];

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
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Analítica Avanzada</h1>
            <p className="text-amzdesk-helper mt-2 text-sm">
              Explora tendencias mensuales y distribución presupuestaria para la
              toma de decisiones.
            </p>
          </div>

          <div className="min-w-[220px]">
            <Select
              value={timeRange}
              onValueChange={(value) => setTimeRange(value as TimeRangeFilter)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccionar rango" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FULL_YEAR">Año Completo</SelectItem>
                <SelectItem value="FIRST_SEMESTER">Primer Semestre</SelectItem>
                <SelectItem value="SECOND_SEMESTER">
                  Segundo Semestre
                </SelectItem>
                <SelectItem value="LAST_QUARTER">Último Trimestre</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
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
          <MonthlyTrendChart data={filteredMonthlyTrend} />
          <BudgetDistributionChart data={analytics.distribucionPartidas} />
        </section>
      )}
    </div>
  );
}
