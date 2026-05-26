'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { solicitudesService } from '@/lib/services/solicitudes-service';
import SolicitudCompraForm from '@/components/solicitudes-compra/solicitud-compra-form';
import type { SolicitudCompraFormData } from '@/components/solicitudes-compra/solicitud-compra-schema';
import type { SolicitudResponse } from '@/types/solicitud-backend';

function adaptResponseToCompraFormData(
  solicitud: SolicitudResponse
): Partial<SolicitudCompraFormData> {
  const poaId = solicitud.presupuestos?.[0]?.poa?.id ?? 0;

  const items = (solicitud.gastosCompra ?? []).map((gc) => ({
    descripcion: gc.descripcion,
    cantidad: Number(gc.cantidad),
    uso: gc.uso ?? '',
    costoUnitario: Number(gc.costoUnitario),
  }));

  return {
    aprobadorId:
      typeof solicitud.aprobadorId === 'number' ? solicitud.aprobadorId : 0,
    poaId,
    motivoSolicitud: solicitud.motivoViaje ?? '',
    proyecto: solicitud.proyecto ?? '',
    chequeANombreDe: solicitud.chequeANombreDe ?? '',
    descripcion: solicitud.descripcion ?? '',
    items: items.length > 0 ? items : undefined,
  };
}

export default function EditarSolicitudCompraPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [initialValues, setInitialValues] =
    useState<Partial<SolicitudCompraFormData> | null>(null);
  const [solicitudId, setSolicitudId] = useState<number | null>(null);
  const [initialPoaCode, setInitialPoaCode] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const solicitud = await solicitudesService.getSolicitudById(params.id);

        if (solicitud.estado !== 'OBSERVADO') {
          toast.error('Solo se pueden editar solicitudes observadas.');
          router.push('/app/solicitudes-compra');
          return;
        }

        if (solicitud.tipo !== 'COMPRA_SERVICIO') {
          toast.error('Esta solicitud no es de Compras/Servicios.');
          router.push('/app/solicitudes-compra');
          return;
        }

        setSolicitudId(solicitud.id);
        setInitialPoaCode(solicitud.presupuestos?.[0]?.poa?.codigoPoa ?? '');
        setInitialValues(adaptResponseToCompraFormData(solicitud));
      } catch {
        toast.error('No se pudo cargar la solicitud.');
        router.push('/app/solicitudes-compra');
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, [params.id, router]);

  if (loading || !initialValues || solicitudId === null) {
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
    <SolicitudCompraForm
      solicitudId={solicitudId}
      initialValues={initialValues}
      initialPoaCode={initialPoaCode}
    />
  );
}
