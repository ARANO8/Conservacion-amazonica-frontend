'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { monitorColumns } from './columns';
import { SolicitudResponse } from '@/types/solicitud-backend';
import { DataTable } from './data-table';
import { solicitudesService } from '@/lib/services/solicitudes-service';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Activity } from 'lucide-react';
import { catalogosService } from '@/services/catalogos.service';
import { Partida } from '@/types/catalogs';

export default function MonitorPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [data, setData] = useState<SolicitudResponse[]>([]);
  const [partidas, setPartidas] = useState<Partida[]>([]);
  const [loading, setLoading] = useState(true);

  const partidaIdParam = searchParams.get('partidaId');
  const selectedPartidaId =
    partidaIdParam && !Number.isNaN(Number(partidaIdParam))
      ? Number(partidaIdParam)
      : undefined;

  useEffect(() => {
    const fetchPartidas = async () => {
      try {
        const response = await catalogosService.getPartidas();
        setPartidas(response);
      } catch {
        toast.error('No se pudieron cargar las partidas presupuestarias.');
      }
    };

    fetchPartidas();
  }, []);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        const response = await solicitudesService.getSolicitudes(
          selectedPartidaId !== undefined
            ? { partidaId: selectedPartidaId }
            : undefined
        );
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
  }, [selectedPartidaId]);

  const handlePartidaChange = (partidaId?: number) => {
    const params = new URLSearchParams(searchParams.toString());

    if (partidaId !== undefined) {
      params.set('partidaId', String(partidaId));
    } else {
      params.delete('partidaId');
    }

    const nextUrl = params.toString()
      ? `${pathname}?${params.toString()}`
      : pathname;

    router.replace(nextUrl, { scroll: false });
  };

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
        <DataTable
          columns={monitorColumns}
          data={data}
          partidas={partidas}
          partidaId={selectedPartidaId}
          onPartidaChange={handlePartidaChange}
        />
      )}
    </div>
  );
}
