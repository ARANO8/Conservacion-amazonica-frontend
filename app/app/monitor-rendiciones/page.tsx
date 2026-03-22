'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Activity } from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { rendicionesService } from '@/lib/services/rendiciones-service';
import type { RendicionResponse } from '@/types/rendicion-backend';
import { monitorRendicionesColumns, type RendicionMonitorRow } from './columns';
import { DataTable } from './data-table';
import { useAuthStore } from '@/store/auth-store';

const MONITOR_ALLOWED_ROLES = new Set([
  'ADMIN',
  'EJECUTIVO',
  'TESORERO',
  'CONTADOR',
]);

function toNumber(value: string | number | null | undefined): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

export default function MonitorRendicionesPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [data, setData] = useState<RendicionResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const canAccessMonitor = user ? MONITOR_ALLOWED_ROLES.has(user.rol) : false;

  useEffect(() => {
    if (user && !canAccessMonitor) {
      router.replace('/app/inicio');
    }
  }, [canAccessMonitor, router, user]);

  useEffect(() => {
    if (!canAccessMonitor) {
      return;
    }

    const fetchRendiciones = async () => {
      try {
        setLoading(true);
        const response = await rendicionesService.getRendiciones();
        setData(response ?? []);
      } catch {
        toast.error(
          'No se pudieron cargar las rendiciones. Intente nuevamente.'
        );
      } finally {
        setLoading(false);
      }
    };

    void fetchRendiciones();
  }, [canAccessMonitor]);

  const monitorRows = useMemo<RendicionMonitorRow[]>(() => {
    if (!canAccessMonitor) {
      return [];
    }

    return data.map((rendicion) => {
      const gastos = rendicion.gastosRendicion ?? rendicion.gastos ?? [];
      const totalEfectivoPagado = gastos.reduce(
        (acc, gasto) => acc + toNumber(gasto.montoNeto ?? gasto.monto),
        0
      );
      const montoRecibido = toNumber(rendicion.solicitud?.montoTotalNeto);

      return {
        ...rendicion,
        codigoMonitor:
          rendicion.solicitud?.codigoSolicitud || `REND-${rendicion.id}`,
        emisorNombre:
          rendicion.solicitud?.usuarioEmisor?.nombreCompleto || 'Sin asignar',
        fechaRegistro: rendicion.createdAt || rendicion.fechaRendicion,
        montoRecibido,
        saldoLiquidoCalculado: montoRecibido - totalEfectivoPagado,
      };
    });
  }, [canAccessMonitor, data]);

  if (!canAccessMonitor) {
    return null;
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <div className="flex items-center gap-3">
          <Activity className="text-primary h-7 w-7" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Monitor de Rendiciones
            </h1>
            <p className="text-muted-foreground">
              Vista global de todas las rendiciones del sistema (solo lectura).
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      ) : (
        <DataTable columns={monitorRendicionesColumns} data={monitorRows} />
      )}
    </div>
  );
}
