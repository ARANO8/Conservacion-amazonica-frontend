import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, ReceiptText } from 'lucide-react';

import { RendicionWizard } from '@/components/rendiciones';
import { NuevaRendicionClientWrapper } from './client-wrapper';

/**
 * Página: Nueva Rendición de Fondos
 *
 * Server Component que obtiene las solicitudes en estado DESEMBOLSADO
 * del usuario autenticado y las pasa al RendicionWizard.
 */
export default function NuevaRendicionPage() {
  return (
    <div className="flex flex-col gap-0">
      {/* Barra de título de página */}
      <div className="flex shrink-0 items-center gap-3 border-b px-6 py-4">
        <Button variant="ghost" size="icon" asChild className="shrink-0">
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Volver al dashboard</span>
          </Link>
        </Button>

        <div className="flex items-center gap-2">
          <ReceiptText className="text-primary h-5 w-5 shrink-0" />
          <div>
            <h1 className="text-lg leading-tight font-bold">
              Nueva Rendición de Fondos
            </h1>
            <p className="text-muted-foreground text-xs">
              Selecciona una solicitud desembolsada y registra los comprobantes
              del gasto realizado.
            </p>
          </div>
        </div>
      </div>

      {/* Contenido principal — Client Component para cargar solicitudes */}
      <NuevaRendicionClientWrapper />
    </div>
  );
}
