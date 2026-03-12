'use client';

import { useEffect, useState } from 'react';
import { columns } from './columns';
import { SolicitudResponse } from '@/types/solicitud-backend';
import { DataTable } from '@/app/dashboard/monitor-solicitudes/data-table';
import { solicitudesService } from '@/lib/services/solicitudes-service';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Inbox } from 'lucide-react';

export default function InboxPage() {
  const [data, setData] = useState<SolicitudResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSolicitudes = async () => {
      try {
        setLoading(true);
        const response = await solicitudesService.getSolicitudes();
        setData(response);
      } catch {
        toast.error(
          'No se pudieron cargar las solicitudes. Intente nuevamente.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchSolicitudes();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Inbox className="text-primary h-7 w-7" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Bandeja de Entrada
          </h1>
          <p className="text-muted-foreground">
            Solicitudes pendientes de tu revisión y aprobación.
          </p>
        </div>
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
