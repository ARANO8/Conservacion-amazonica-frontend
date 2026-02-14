'use client';

import { useEffect, useState } from 'react';
import { monitorColumns } from './columns';
import { SolicitudResponse } from '@/types/solicitud-backend';
import { DataTable } from './data-table';
import { solicitudesService } from '@/lib/services/solicitudes-service';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Activity } from 'lucide-react';

export default function MonitorSolicitudesPage() {
  const [data, setData] = useState<SolicitudResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        // El backend devuelve TODAS las solicitudes para TESORERO/ADMIN
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

    fetchAll();
  }, []);

  return (
    <div className="space-y-6 p-6">
      <div>
        <div className="flex items-center gap-3">
          <Activity className="text-primary h-7 w-7" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Monitor de Solicitudes
            </h1>
            <p className="text-muted-foreground">
              Vista global de todas las solicitudes del sistema (solo lectura).
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
        <DataTable columns={monitorColumns} data={data} />
      )}
    </div>
  );
}
