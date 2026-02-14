'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';
import { columns } from './columns';
import { SolicitudResponse } from '@/types/solicitud-backend';
import { DataTable } from '../requests/data-table';
import { solicitudesService } from '@/lib/services/solicitudes-service';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/auth-store';

export default function InboxPage() {
  const [data, setData] = useState<SolicitudResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();

  useEffect(() => {
    const fetchRequests = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);
        // Traemos todas para filtrar localmente según pedido (Bandeja de Entrada)
        const response = await solicitudesService.getSolicitudes();

        // Filtrado: Solo las que este usuario debe aprobar y NO están observadas
        const incoming = response.filter(
          (s: SolicitudResponse) =>
            (String(s.aprobadorId) === String(user.id) ||
              String(s.aprobador?.id) === String(user.id)) &&
            s.estado !== 'OBSERVADO'
        );

        setData(incoming);
      } catch {
        toast.error(
          'No se pudieron cargar las notificaciones. Intente nuevamente.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();

    // Escuchar cambios desde los modales para recargar la tabla
    window.addEventListener('solicitud-updated', fetchRequests);

    return () => {
      window.removeEventListener('solicitud-updated', fetchRequests);
    };
  }, [user?.id]);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Notificaciones</h1>
        <p className="text-muted-foreground">
          Solicitudes pendientes que requieren tu revisión y aprobación.
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      ) : (
        <DataTable columns={columns} data={data} />
      )}
    </div>
  );
}
