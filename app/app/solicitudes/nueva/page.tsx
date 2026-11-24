'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import SolicitudForm from '@/components/solicitudes/solicitud-form';

/** Llega con `?planViajeId=` desde el botón "Crear solicitud" del plan. */
function NuevaSolicitud() {
  const planViajeId = Number(useSearchParams().get('planViajeId'));
  return (
    <SolicitudForm
      planViajeIdInicial={planViajeId > 0 ? planViajeId : undefined}
    />
  );
}

export default function SolicitudPage() {
  return (
    <Suspense>
      <NuevaSolicitud />
    </Suspense>
  );
}
