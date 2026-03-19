'use client';

import { AlertCircle, FileText, Wallet } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatMoney } from '@/lib/utils';
import type { DashboardMetrics } from '@/lib/services/dashboard-service';

interface KpiCardsProps {
  data: DashboardMetrics;
}

export function KpiCards({ data }: KpiCardsProps) {
  const hasPendientes = data.rendicionesPendientes > 0;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-amzdesk-label text-sm">
            Solicitudes Activas
          </CardTitle>
          <FileText className="text-muted-foreground h-4 w-4" />
        </CardHeader>
        <CardContent>
          <p className="text-amzdesk-monto text-3xl">
            {data.solicitudesActivas}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-amzdesk-label text-sm">
            Rendiciones Pendientes
          </CardTitle>
          <AlertCircle
            className={`h-4 w-4 ${hasPendientes ? 'text-amber-600' : 'text-muted-foreground'}`}
          />
        </CardHeader>
        <CardContent>
          <p
            className={`text-amzdesk-monto text-3xl ${hasPendientes ? 'text-amber-600' : ''}`}
          >
            {data.rendicionesPendientes}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-amzdesk-label text-sm">
            Monto por Rendir
          </CardTitle>
          <Wallet className="text-muted-foreground h-4 w-4" />
        </CardHeader>
        <CardContent>
          <p className="text-amzdesk-monto text-2xl">
            {formatMoney(data.montoPorRendir)}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
