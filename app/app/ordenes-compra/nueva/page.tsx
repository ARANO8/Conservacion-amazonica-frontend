import Link from 'next/link';
import { ArrowLeft, ShoppingCart } from 'lucide-react';

import { Button } from '@/components/ui/button';
import OrdenCompraBuilder from '@/components/ordenes-compra/orden-compra-builder';

interface NuevaOrdenPageProps {
  searchParams: Promise<{ cuadroId?: string }>;
}

export default async function NuevaOrdenCompraPage({
  searchParams,
}: NuevaOrdenPageProps) {
  const { cuadroId } = await searchParams;
  const prefillCuadroId = cuadroId ? parseInt(cuadroId, 10) : undefined;

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
              Nueva Orden de Compra / Servicio
            </h1>
            <p className="text-muted-foreground text-xs">
              Compras y Servicios — Genera la orden de compra/servicio (ANEXO
              12).
            </p>
          </div>
        </div>
      </div>

      <OrdenCompraBuilder prefillCuadroId={prefillCuadroId} />
    </div>
  );
}
