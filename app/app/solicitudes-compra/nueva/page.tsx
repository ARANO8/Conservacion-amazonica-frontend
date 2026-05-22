import Link from 'next/link';
import { ArrowLeft, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SolicitudCompraForm from '@/components/solicitudes-compra/solicitud-compra-form';

export default function NuevaSolicitudCompraPage() {
  return (
    <div className="flex flex-col gap-0">
      <div className="flex shrink-0 items-center gap-3 border-b px-6 py-4">
        <Button variant="ghost" size="icon" asChild className="shrink-0">
          <Link href="/app/solicitudes-compra">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Volver</span>
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <ShoppingCart className="text-primary h-5 w-5 shrink-0" />
          <div>
            <h1 className="text-lg leading-tight font-bold">
              Nueva Solicitud de Fondos
            </h1>
            <p className="text-muted-foreground text-xs">
              Compras y Servicios — ANEXO 3
            </p>
          </div>
        </div>
      </div>

      <SolicitudCompraForm />
    </div>
  );
}
