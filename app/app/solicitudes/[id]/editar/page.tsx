'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { solicitudesService } from '@/lib/services/solicitudes-service';
import { adaptResponseToFormData } from '@/lib/adapters/solicitud-adapter';
import SolicitudForm from '@/components/solicitudes/solicitud-form';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { FormData } from '@/components/solicitudes/solicitud-schema';

export default function EditSolicitudPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [initialData, setInitialData] = useState<Partial<FormData> | null>(
    null
  );
  const [observacion, setObservacion] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSolicitud = async () => {
      try {
        setLoading(true);
        const solicitud = await solicitudesService.getSolicitudById(id);

        if (solicitud.estado !== 'OBSERVADO') {
          toast.error('Solo se pueden editar solicitudes observadas');
          router.push('/app/solicitudes');
          return;
        }

        const formData = adaptResponseToFormData(solicitud);
        setObservacion(solicitud.observacion ?? null);
        setInitialData(formData);
      } catch {
        toast.error('Error al cargar la solicitud');
        router.push('/app/solicitudes');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadSolicitud();
    }
  }, [id, router]);

  if (loading || !initialData) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="text-primary size-10 animate-spin" />
        <span className="text-muted-foreground ml-3 text-sm">
          Cargando solicitud...
        </span>
      </div>
    );
  }

  return (
    <SolicitudForm
      initialValues={initialData}
      isEditMode={true}
      solicitudId={id}
      observacion={observacion}
    />
  );
}
