import Link from 'next/link';
import { ArrowLeft, ShoppingCart } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { OrdenDetalleClientWrapper } from './client-wrapper';

interface OrdenDetallePageProps {
  params: Promise<{ id: string }>;
}

export default async function OrdenDetallePage({
  params,
}: OrdenDetallePageProps) {
  const { id } = await params;

  return (
    <div className="flex flex-col gap-0">
      <div className="flex shrink-0 items-center gap-3 border-b px-6 py-4">
        <Button variant="ghost" size="icon" asChild className="shrink-0">
          <Link href="/app/ordenes-compra">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Volver a órdenes de compra</span>
          </Link>
        </Button>

        <div className="flex items-center gap-2">
          <ShoppingCart className="text-primary h-5 w-5 shrink-0" />
          <div>
            <h1 className="text-lg leading-tight font-bold">
              Detalle de Orden de Compra
            </h1>
            <p className="text-muted-foreground text-xs">
              Compras y Servicios — Orden de Compra/Servicio (ANEXO 12).
            </p>
          </div>
        </div>
      </div>

      <OrdenDetalleClientWrapper ordenId={id} />
    </div>
  );
}
