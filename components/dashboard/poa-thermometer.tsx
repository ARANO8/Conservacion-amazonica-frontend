'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { formatMoney } from '@/lib/utils';
import type { DashboardMetricaGerencial } from '@/lib/services/dashboard-service';

interface PoaThermometerProps {
  data: DashboardMetricaGerencial;
}

export function PoaThermometer({ data }: PoaThermometerProps) {
  const consumido = data.montoComprometido + data.montoEjecutado;
  const saldoDisponible = data.montoTotal - consumido;
  const porcentajeRaw =
    data.montoTotal > 0 ? (consumido / data.montoTotal) * 100 : 0;
  const porcentaje = Math.min(Math.max(porcentajeRaw, 0), 100);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Salud Financiera del POA Global</CardTitle>
        <CardDescription className="text-amzdesk-helper">
          Termómetro de consumo entre montos comprometidos y ejecutados.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Progress value={porcentaje} className="h-2" />
          <p className="text-amzdesk-helper text-xs">
            {porcentaje.toFixed(2)}% consumido
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <p className="text-amzdesk-helper text-xs">Presupuesto Total</p>
            <p className="text-amzdesk-monto">{formatMoney(data.montoTotal)}</p>
          </div>
          <div>
            <p className="text-amzdesk-helper text-xs">Consumido</p>
            <p className="text-amzdesk-monto">{formatMoney(consumido)}</p>
          </div>
          <div>
            <p className="text-amzdesk-helper text-xs">Saldo Disponible</p>
            <p className="text-amzdesk-monto">{formatMoney(saldoDisponible)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
