'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import OrdenCompraBuilder from '@/components/ordenes-compra/orden-compra-builder';
import { ordenesCompraService } from '@/lib/services/ordenes-compra-service';
import type { OrdenCompraResponse } from '@/types/orden-compra-backend';

interface EditarOrdenPageProps {
  params: Promise<{ id: string }>;
}

export default function EditarOrdenCompraPage({
  params,
}: EditarOrdenPageProps) {
  const { id } = use(params);
  const [orden, setOrden] = useState<OrdenCompraResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await ordenesCompraService.getOrdenById(id);
        setOrden(data);
      } catch {
        toast.error('No se pudo cargar la orden de compra.');
      } finally {
        setLoading(false);
      }
    };
    void fetch();
  }, [id]);

  return (
    <div className="flex flex-col gap-0">
      <div className="flex shrink-0 items-center gap-3 border-b px-6 py-4">
        <Button variant="ghost" size="icon" asChild className="shrink-0">
          <Link href={`/app/ordenes-compra/${id}`}>
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Volver al detalle</span>
          </Link>
        </Button>

        <div className="flex items-center gap-2">
          <ShoppingCart className="text-primary h-5 w-5 shrink-0" />
          <div>
            <h1 className="text-lg leading-tight font-bold">
              Editar Orden de Compra
            </h1>
            <p className="text-muted-foreground text-xs">
              Modifica la orden antes de generar el PDF final.
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4 p-6">
          <Skeleton className="h-10 w-full max-w-md" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      ) : orden ? (
        <OrdenCompraBuilder ordenId={orden.id} initialData={orden} />
      ) : (
        <div className="text-muted-foreground p-6">
          No se encontró la orden de compra solicitada.
        </div>
      )}
    </div>
  );
}
