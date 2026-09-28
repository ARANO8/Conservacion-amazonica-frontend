'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Receipt } from 'lucide-react';

import { Button } from '@/components/ui/button';
import LiquidacionViaticosForm from '@/components/liquidaciones-viaticos/liquidacion-viaticos-form';

/** Llega con `?solicitudId=` desde el aviso de la rendición. */
function NuevaLiquidacion() {
  const solicitudId = Number(useSearchParams().get('solicitudId'));
  return (
    <LiquidacionViaticosForm
      solicitudIdInicial={solicitudId > 0 ? solicitudId : undefined}
    />
  );
}

export default function NuevaLiquidacionViaticosPage() {
  return (
    <div className="flex flex-col gap-0">
      <div className="flex shrink-0 items-center gap-3 border-b px-6 py-4">
        <Button variant="ghost" size="icon" asChild className="shrink-0">
          <Link href="/app/liquidaciones-viaticos">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Volver a liquidaciones de viáticos</span>
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <Receipt className="text-primary h-5 w-5 shrink-0" />
          <div>
            <h1 className="text-lg leading-tight font-bold">
              Nueva Liquidación de Viáticos
            </h1>
            <p className="text-muted-foreground text-xs">
              Viajes y Viáticos — una hoja por persona del viaje (ANEXO 5).
            </p>
          </div>
        </div>
      </div>

      <Suspense>
        <NuevaLiquidacion />
      </Suspense>
    </div>
  );
}
