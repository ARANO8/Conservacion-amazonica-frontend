import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, ReceiptText } from 'lucide-react';

import { EditarRendicionClientWrapper } from './client-wrapper';

interface EditarRendicionPageProps {
  params: Promise<{ id: string }>;
}

/**
 * Página: Editar Rendición Observada
 *
 * Server Component que muestra la página de edición de una rendición
 * que ha sido observada y devuelta al creador para correcciones.
 */
export default async function EditarRendicionPage({
  params,
}: EditarRendicionPageProps) {
  const { id } = await params;

  return (
    <div className="flex flex-col gap-0">
      {/* Barra de título de página */}
      <div className="flex shrink-0 items-center gap-3 border-b px-6 py-4">
        <Button variant="ghost" size="icon" asChild className="shrink-0">
          <Link href="/app/inicio">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Volver al inicio</span>
          </Link>
        </Button>

        <div className="flex items-center gap-2">
          <ReceiptText className="text-primary h-5 w-5 shrink-0" />
          <div>
            <h1 className="text-lg leading-tight font-bold">
              Corregir Rendición Observada
            </h1>
            <p className="text-muted-foreground text-xs">
              Tu rendición fue observada. Corrige los datos necesarios y
              selecciona un aprobador para reenviar.
            </p>
          </div>
        </div>
      </div>

      {/* Contenido principal — Client Component para cargar la rendición */}
      <EditarRendicionClientWrapper rendicionId={id} />
    </div>
  );
}
