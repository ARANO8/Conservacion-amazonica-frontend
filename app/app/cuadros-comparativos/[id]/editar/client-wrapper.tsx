'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Skeleton } from '@/components/ui/skeleton';
import { cuadrosComparativosService } from '@/lib/services/cuadros-comparativos-service';
import { adaptCuadroResponseToForm } from '@/lib/adapters/cuadro-comparativo-adapter';
import CuadroComparativoBuilder from '@/components/cuadros-comparativos/cuadro-comparativo-builder';
import type { CuadroComparativoFormData } from '@/components/cuadros-comparativos/cuadro-comparativo-schema';

interface Props {
  cuadroId: string;
}

export function EditarCuadroClientWrapper({ cuadroId }: Props) {
  const router = useRouter();
  const [initialData, setInitialData] =
    useState<CuadroComparativoFormData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCuadro = async () => {
      try {
        setLoading(true);
        const cuadro = await cuadrosComparativosService.getCuadroById(cuadroId);
        setInitialData(adaptCuadroResponseToForm(cuadro));
      } catch {
        toast.error('No se pudo cargar el cuadro comparativo.');
        router.push('/app/cuadros-comparativos');
      } finally {
        setLoading(false);
      }
    };
    void fetchCuadro();
  }, [cuadroId, router]);

  if (loading || !initialData) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-10 w-full max-w-md" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <CuadroComparativoBuilder
      cuadroId={Number(cuadroId)}
      initialData={initialData}
    />
  );
}
