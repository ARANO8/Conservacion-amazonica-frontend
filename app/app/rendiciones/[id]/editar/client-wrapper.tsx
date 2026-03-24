'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

import { rendicionesService } from '@/lib/services/rendiciones-service';
import { solicitudesService } from '@/lib/services/solicitudes-service';
import { catalogosService } from '@/services/catalogos.service';
import { adaptRendicionResponseToFormData } from '@/lib/adapters/rendicion-adapter';
import { RendicionWizard } from '@/components/rendiciones';
import { useAuthStore } from '@/store/auth-store';
import { CreateRendicionInput } from '@/types/rendicion-schema';
import { SolicitudResponse } from '@/types/solicitud-backend';
import { RendicionResponse, EstadoRendicion } from '@/types/rendicion-backend';
import { Usuario } from '@/types/catalogs';

interface EditarRendicionClientWrapperProps {
  rendicionId: string;
}

/**
 * Client Component: Carga la rendición observada y sus datos
 * para prellenar el wizard en modo edición.
 */
export function EditarRendicionClientWrapper({
  rendicionId,
}: EditarRendicionClientWrapperProps) {
  const router = useRouter();
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [initialData, setInitialData] =
    useState<Partial<CreateRendicionInput> | null>(null);
  const [solicitud, setSolicitud] = useState<SolicitudResponse | null>(null);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);

  useEffect(() => {
    const loadRendicion = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);

        // Cargar rendición, usuarios en paralelo
        const [rendicion, usuariosActivos]: [RendicionResponse, Usuario[]] =
          await Promise.all([
            rendicionesService.getRendicionById(rendicionId),
            catalogosService.getUsuarios(),
          ]);

        // Verificar que la rendición está en estado OBSERVADO
        if (
          rendicion.estado !== EstadoRendicion.OBSERVADO &&
          rendicion.estado !== EstadoRendicion.OBSERVADA
        ) {
          toast.error('Solo se pueden editar rendiciones en estado OBSERVADO');
          router.push('/app/rendiciones');
          return;
        }

        // Verificar que el usuario es el creador de la solicitud
        const solicitudId = rendicion.solicitudId;
        const solicitudData = await solicitudesService.getSolicitudById(
          String(solicitudId)
        );

        const esCreador =
          String(solicitudData.usuarioEmisorId) === String(user.id) ||
          String(solicitudData.usuarioId) === String(user.id) ||
          String(solicitudData.usuario?.id) === String(user.id) ||
          String(solicitudData.usuarioEmisor?.id) === String(user.id);

        if (!esCreador) {
          toast.error(
            'Solo el creador de la solicitud puede editar esta rendición'
          );
          router.push('/app/rendiciones');
          return;
        }

        // Adaptar la respuesta del backend al formato del formulario
        const formData = adaptRendicionResponseToFormData(rendicion);

        setInitialData(formData);
        setSolicitud(solicitudData);
        setUsuarios(usuariosActivos);
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'No se pudo cargar la rendición. Intente nuevamente.';
        toast.error(errorMessage);
        router.push('/app/rendiciones');
      } finally {
        setLoading(false);
      }
    };

    loadRendicion();
  }, [rendicionId, user?.id, router]);

  if (loading || !initialData || !solicitud) {
    return (
      <div className="flex h-[60vh] w-full items-center justify-center">
        <Loader2 className="text-primary size-10 animate-spin" />
        <span className="text-muted-foreground ml-3 text-sm">
          Cargando rendición...
        </span>
      </div>
    );
  }

  return (
    <RendicionWizard
      solicitudes={[solicitud]}
      usuarios={usuarios}
      currentUserId={user?.id ? Number(user.id) : undefined}
      preSelectedSolicitudId={solicitud.id}
      isEditMode={true}
      rendicionId={rendicionId}
      initialValues={initialData}
    />
  );
}
