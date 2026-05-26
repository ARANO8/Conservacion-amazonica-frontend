import Link from 'next/link';
import { ArrowLeft, Table2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { CuadroDetalleClientWrapper } from './client-wrapper';

interface CuadroDetallePageProps {
  params: Promise<{ id: string }>;
}

export default async function CuadroDetallePage({
  params,
}: CuadroDetallePageProps) {
  const { id } = await params;

  return (
    <div className="flex flex-col gap-0">
      <div className="flex shrink-0 items-center gap-3 border-b px-6 py-4">
        <Button variant="ghost" size="icon" asChild className="shrink-0">
          <Link href="/app/cuadros-comparativos">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Volver a cuadros comparativos</span>
          </Link>
        </Button>

        <div className="flex items-center gap-2">
          <Table2 className="text-primary h-5 w-5 shrink-0" />
          <div>
            <h1 className="text-lg leading-tight font-bold">
              Detalle de Cuadro Comparativo
            </h1>
            <p className="text-muted-foreground text-xs">
              Compras y Servicios — comparación de cotizaciones (ANEXO 11).
            </p>
          </div>
        </div>
      </div>

      <CuadroDetalleClientWrapper cuadroId={id} />
    </div>
  );
}
