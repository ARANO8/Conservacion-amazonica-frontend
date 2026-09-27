import Link from 'next/link';
import { ArrowLeft, Map as MapIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import PlanViajeForm from '@/components/planes-viaje/plan-viaje-form';

export default function NuevoPlanViajePage() {
  return (
    <div className="flex flex-col gap-0">
      <div className="flex shrink-0 items-center gap-3 border-b px-6 py-4">
        <Button variant="ghost" size="icon" asChild className="shrink-0">
          <Link href="/app/planes-viaje">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Volver a planes de viaje</span>
          </Link>
        </Button>

        <div className="flex items-center gap-2">
          <MapIcon className="text-primary h-5 w-5 shrink-0" />
          <div>
            <h1 className="text-lg leading-tight font-bold">
              Nuevo Plan de Viaje
            </h1>
            <p className="text-muted-foreground text-xs">
              Viajes y Viáticos — planificación previa a la solicitud (ANEXO 1).
            </p>
          </div>
        </div>
      </div>

      <PlanViajeForm />
    </div>
  );
}
