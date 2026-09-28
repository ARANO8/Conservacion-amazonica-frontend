'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, ClipboardList } from 'lucide-react';

import { Button } from '@/components/ui/button';
import InformeViajeForm from '@/components/informes-viaje/informe-viaje-form';

/** Llega con `?solicitudId=` desde el aviso de la rendición. */
function NuevoInforme() {
  const solicitudId = Number(useSearchParams().get('solicitudId'));
  return (
    <InformeViajeForm
      solicitudIdInicial={solicitudId > 0 ? solicitudId : undefined}
    />
  );
}

export default function NuevoInformeViajePage() {
  return (
    <div className="flex flex-col gap-0">
      <div className="flex shrink-0 items-center gap-3 border-b px-6 py-4">
        <Button variant="ghost" size="icon" asChild className="shrink-0">
          <Link href="/app/informes-viaje">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Volver a informes de viaje</span>
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <ClipboardList className="text-primary h-5 w-5 shrink-0" />
          <div>
            <h1 className="text-lg leading-tight font-bold">
              Nuevo Informe de Viaje
            </h1>
            <p className="text-muted-foreground text-xs">
              Viajes y Viáticos — lo que se hizo realmente en el viaje (ANEXO
              7).
            </p>
          </div>
        </div>
      </div>

      <Suspense>
        <NuevoInforme />
      </Suspense>
    </div>
  );
}
