import Link from 'next/link';
import { ArrowLeft, Route } from 'lucide-react';

import { Button } from '@/components/ui/button';
import DeclaracionMovilidadForm from '@/components/declaraciones-movilidad/declaracion-movilidad-form';

export default function NuevaDeclaracionMovilidadPage() {
  return (
    <div className="flex flex-col gap-0">
      <div className="flex shrink-0 items-center gap-3 border-b px-6 py-4">
        <Button variant="ghost" size="icon" asChild className="shrink-0">
          <Link href="/app/declaracion-movilidad">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Volver a declaraciones de movilidad</span>
          </Link>
        </Button>

        <div className="flex items-center gap-2">
          <Route className="text-primary h-5 w-5 shrink-0" />
          <div>
            <h1 className="text-lg leading-tight font-bold">
              Nueva Declaración Jurada de Movilidad
            </h1>
            <p className="text-muted-foreground text-xs">
              Viajes y Viáticos — gastos de movilidad declarados (ANEXO 6).
            </p>
          </div>
        </div>
      </div>

      <DeclaracionMovilidadForm />
    </div>
  );
}
