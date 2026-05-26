import Link from 'next/link';
import { ArrowLeft, FileText } from 'lucide-react';

import { Button } from '@/components/ui/button';
import CotizacionForm from '@/components/cotizaciones/cotizacion-form';

export default function NuevaCotizacionPage() {
  return (
    <div className="flex flex-col gap-0">
      <div className="flex shrink-0 items-center gap-3 border-b px-6 py-4">
        <Button variant="ghost" size="icon" asChild className="shrink-0">
          <Link href="/app/cotizaciones">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Volver a cotizaciones</span>
          </Link>
        </Button>

        <div className="flex items-center gap-2">
          <FileText className="text-primary h-5 w-5 shrink-0" />
          <div>
            <h1 className="text-lg leading-tight font-bold">
              Formulario de Solicitud de Cotizaciones
            </h1>
            <p className="text-muted-foreground text-xs">
              Compras y Servicios — registra la cotización de un proveedor
              (expresado en bolivianos).
            </p>
          </div>
        </div>
      </div>

      <CotizacionForm />
    </div>
  );
}
