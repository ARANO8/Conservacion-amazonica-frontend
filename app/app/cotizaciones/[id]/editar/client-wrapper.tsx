'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Skeleton } from '@/components/ui/skeleton';
import { cotizacionesService } from '@/lib/services/cotizaciones-service';
import { adaptCotizacionResponseToForm } from '@/lib/adapters/cotizacion-adapter';
import CotizacionForm from '@/components/cotizaciones/cotizacion-form';
import type { CotizacionFormData } from '@/components/cotizaciones/cotizacion-schema';

interface EditarCotizacionClientWrapperProps {
  cotizacionId: string;
}

export function EditarCotizacionClientWrapper({
  cotizacionId,
}: EditarCotizacionClientWrapperProps) {
  const router = useRouter();
  const [initialData, setInitialData] = useState<CotizacionFormData | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCotizacion = async () => {
      try {
        setLoading(true);
        const cotizacion =
          await cotizacionesService.getCotizacionById(cotizacionId);
        setInitialData(adaptCotizacionResponseToForm(cotizacion));
      } catch {
        toast.error('No se pudo cargar la cotización.');
        router.push('/app/cotizaciones');
      } finally {
        setLoading(false);
      }
    };

    void fetchCotizacion();
  }, [cotizacionId, router]);

  if (loading || !initialData) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-10 w-full max-w-md" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <CotizacionForm
      cotizacionId={Number(cotizacionId)}
      initialData={initialData}
    />
  );
}
