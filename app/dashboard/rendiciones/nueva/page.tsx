'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, ReceiptText } from 'lucide-react';

import { solicitudesService } from '@/lib/services/solicitudes-service';
import { SolicitudResponse } from '@/types/solicitud-backend';
import { RendicionWizard } from '@/components/rendiciones';
import { useAuthStore } from '@/store/auth-store';

/**
 * Página: Nueva Rendición de Fondos
 *
 * Obtiene las solicitudes en estado DESEMBOLSADO del usuario autenticado
 * y las pasa al RendicionWizard para que el usuario elija cuál rendir.
 */
export default function NuevaRendicionPage() {
  const [solicitudes, setSolicitudes] = useState<SolicitudResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();

  useEffect(() => {
    const fetchSolicitudesDesembolsadas = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);
        const todas: SolicitudResponse[] =
          await solicitudesService.getSolicitudes();

        // Filtrar: solo las del usuario autenticado que ya fueron desembolsadas
        const desembolsadas = todas.filter(
          (s) =>
            s.estado === 'DESEMBOLSADO' &&
            (String(s.usuarioEmisorId) === String(user.id) ||
              String(s.usuarioId) === String(user.id) ||
              String(s.usuario?.id) === String(user.id))
        );

        setSolicitudes(desembolsadas);
      } catch {
        toast.error(
          'No se pudieron cargar las solicitudes desembolsadas. Intente nuevamente.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchSolicitudesDesembolsadas();
  }, [user?.id]);

  return (
    <div className="flex flex-col gap-0">
      {/* Barra de título de página */}
      <div className="flex shrink-0 items-center gap-3 border-b px-6 py-4">
        <Button variant="ghost" size="icon" asChild className="shrink-0">
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Volver al dashboard</span>
          </Link>
        </Button>

        <div className="flex items-center gap-2">
          <ReceiptText className="text-primary h-5 w-5 shrink-0" />
          <div>
            <h1 className="text-lg leading-tight font-bold">
              Nueva Rendición de Fondos
            </h1>
            <p className="text-muted-foreground text-xs">
              Selecciona una solicitud desembolsada y registra los gastos
              realizados.
            </p>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      {loading ? (
        <div className="space-y-4 p-6">
          <Skeleton className="h-10 w-full max-w-md" />
          <Skeleton className="h-[300px] w-full" />
        </div>
      ) : (
        <RendicionWizard solicitudes={solicitudes} />
      )}
    </div>
  );
}
