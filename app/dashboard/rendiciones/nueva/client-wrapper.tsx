'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

import { solicitudesService } from '@/lib/services/solicitudes-service';
import { SolicitudResponse } from '@/types/solicitud-backend';
import { RendicionWizard } from '@/components/rendiciones';
import { useAuthStore } from '@/store/auth-store';

/**
 * Client Component: Carga las solicitudes desembolsadas del usuario
 * y las pasa al RendicionWizard.
 */
export function NuevaRendicionClientWrapper() {
  const [solicitudes, setSolicitudes] = useState<SolicitudResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();

  useEffect(() => {
    const fetchSolicitudesDesembolsadas = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);
        // Obtener todas las solicitudes sin filtro inicial
        const todas: SolicitudResponse[] =
          await solicitudesService.getSolicitudes();

        console.log('Total solicitudes del backend:', todas.length);
        console.log('ID del usuario autenticado:', user.id);

        // Filtrar: solo las del usuario autenticado que ya fueron desembolsadas
        const desembolsadas = todas.filter((s) => {
          const esDesembolsado = s.estado === 'DESEMBOLSADO';
          const esDelUsuario =
            String(s.usuarioEmisorId) === String(user.id) ||
            String(s.usuarioId) === String(user.id) ||
            String(s.usuario?.id) === String(user.id) ||
            String(s.usuarioEmisor?.id) === String(user.id);

          // Log para debugging
          if (esDesembolsado || esDelUsuario) {
            console.log('Solicitud evaluada:', {
              id: s.id,
              codigo: s.codigoSolicitud,
              estado: s.estado,
              usuarioEmisorId: s.usuarioEmisorId,
              usuarioId: s.usuarioId,
              usuarioEmisornombre: s.usuarioEmisor?.nombreCompleto,
              usuarioNombre: s.usuario?.nombreCompleto,
              cumpleEstado: esDesembolsado,
              cumpleUsuario: esDelUsuario,
            });
          }

          return esDesembolsado && esDelUsuario;
        });

        console.log(
          'Solicitudes desembolsadas filtradas:',
          desembolsadas.length
        );

        setSolicitudes(desembolsadas);

        if (desembolsadas.length === 0) {
          toast.info(
            'No hay solicitudes desembolsadas para rendir. Verifica que exista una solicitud en estado "Desembolsado".'
          );
        }
      } catch (error: unknown) {
        console.error('Error al cargar solicitudes:', error);
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
  }, [user?.id]);

  return loading ? (
    <div className="space-y-4 p-6">
      <Skeleton className="h-10 w-full max-w-md" />
      <Skeleton className="h-[300px] w-full" />
    </div>
  ) : (
    <RendicionWizard solicitudes={solicitudes} />
  );
}
