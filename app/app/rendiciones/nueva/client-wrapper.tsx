'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

import { solicitudesService } from '@/lib/services/solicitudes-service';
import { SolicitudResponse } from '@/types/solicitud-backend';
import { RendicionWizard } from '@/components/rendiciones';
import { useAuthStore } from '@/store/auth-store';

/**
 * Client Component: Carga las solicitudes desembolsadas del usuario
 * y las pasa al RendicionWizard.
 *
 * Si se proporciona un `solicitudId` en los query params, lo pre-selecciona
 * automáticamente en el wizard.
 */
export function NuevaRendicionClientWrapper() {
  const searchParams = useSearchParams();
  const solicitudIdParam = searchParams.get('solicitudId');

  const [solicitudes, setSolicitudes] = useState<SolicitudResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [preSelectedSolicitudId, setPreSelectedSolicitudId] = useState<
    number | null
  >(null);
  const { user } = useAuthStore();

  useEffect(() => {
    const fetchSolicitudesDesembolsadas = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);
        // Obtener todas las solicitudes sin filtro inicial
        const todas: SolicitudResponse[] =
          await solicitudesService.getSolicitudes();

        // Filtrar: solo las del usuario autenticado que ya fueron desembolsadas
        const desembolsadas = todas.filter((s) => {
          const esDesembolsado = s.estado === 'DESEMBOLSADO';
          const esDelUsuario =
            String(s.usuarioEmisorId) === String(user.id) ||
            String(s.usuarioId) === String(user.id) ||
            String(s.usuario?.id) === String(user.id) ||
            String(s.usuarioEmisor?.id) === String(user.id);

          return esDesembolsado && esDelUsuario;
        });

        setSolicitudes(desembolsadas);

        // Si se proporcionó un solicitudId en los params, pre-seleccionarlo
        if (solicitudIdParam) {
          const idParam = parseInt(solicitudIdParam, 10);
          const solicitudExiste = desembolsadas.some((s) => s.id === idParam);

          if (solicitudExiste) {
            setPreSelectedSolicitudId(idParam);
          } else {
            toast.warning(
              'La solicitud especificada no está disponible o no ha sido desembolsada.'
            );
          }
        }

        if (desembolsadas.length === 0) {
          toast.info(
            'No hay solicitudes desembolsadas para rendir. Verifica que exista una solicitud en estado "Desembolsado".'
          );
        }
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'No se pudieron cargar las solicitudes desembolsadas. Intente nuevamente.';
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchSolicitudesDesembolsadas();
  }, [user?.id, solicitudIdParam]);

  return loading ? (
    <div className="space-y-4 p-6">
      <Skeleton className="h-10 w-full max-w-md" />
      <Skeleton className="h-[300px] w-full" />
    </div>
  ) : (
    <RendicionWizard
      solicitudes={solicitudes}
      preSelectedSolicitudId={preSelectedSolicitudId}
    />
  );
}
