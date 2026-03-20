'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { RendicionResponse } from '@/types/rendicion-backend';
import { rendicionesService } from '@/lib/services/rendiciones-service';
import { RendicionDetailClient } from './client-wrapper';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { toast } from 'sonner';

export default function RendicionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [rendicion, setRendicion] = useState<RendicionResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const id = params.id as string;

  useEffect(() => {
    const fetchRendicion = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const data = await rendicionesService.getRendicionById(id);
        setRendicion(data);
      } catch (error) {
        void error;
        toast.error('No se pudo cargar la rendición.');
        router.push('/app/solicitudes');
      } finally {
        setLoading(false);
      }
    };

    fetchRendicion();
  }, [id, router]);

  useEffect(() => {
    const handleRendicionUpdated = () => {
      if (!id) return;

      const fetchUpdated = async () => {
        try {
          setLoading(true);
          const data = await rendicionesService.getRendicionById(id);
          setRendicion(data);
        } catch {
          toast.error('No se pudo refrescar la rendición.');
        } finally {
          setLoading(false);
        }
      };

      void fetchUpdated();
    };

    window.addEventListener('rendicion-updated', handleRendicionUpdated);

    return () => {
      window.removeEventListener('rendicion-updated', handleRendicionUpdated);
    };
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-[200px] w-full" />
        <Skeleton className="h-[300px] w-full" />
        <Skeleton className="h-[100px] w-full" />
      </div>
    );
  }

  if (!rendicion) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <p className="text-muted-foreground">
          No se encontró la rendición solicitada.
        </p>
        <Button asChild variant="link" className="mt-4">
          <Link href="/app/solicitudes">Volver</Link>
        </Button>
      </div>
    );
  }

  return <RendicionDetailClient rendicion={rendicion} />;
}
