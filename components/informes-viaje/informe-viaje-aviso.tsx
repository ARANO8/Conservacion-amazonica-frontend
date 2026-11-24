import Link from 'next/link';
import { AlertTriangle, ClipboardList } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { InformeViajeEstadoBadge } from '@/components/informes-viaje/informe-viaje-estado';
import type { SolicitudResponse } from '@/types/solicitud-backend';

interface InformeViajeAvisoProps {
  solicitud: Pick<
    SolicitudResponse,
    'id' | 'tipo' | 'codigoSolicitud' | 'informeViaje'
  > | null;
  /** Solo el emisor puede crear el informe que falta */
  puedeCrear?: boolean;
}

/**
 * El Informe de Viaje (ANEXO 7) del viaje que se rinde: su estado y enlace,
 * o un aviso de que falta. No bloquea nada: el manual lo pide, pero la
 * rendición puede enviarse y aprobarse sin él.
 */
export function InformeViajeAviso({
  solicitud,
  puedeCrear = false,
}: InformeViajeAvisoProps) {
  // Compras no llevan informe; `undefined` significa que la API no lo trajo
  if (!solicitud || solicitud.tipo === 'COMPRA_SERVICIO') return null;
  if (solicitud.informeViaje === undefined) return null;

  const informe =
    solicitud.informeViaje && !solicitud.informeViaje.deletedAt
      ? solicitud.informeViaje
      : null;

  if (informe) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border px-4 py-3 text-sm">
        <div className="flex items-center gap-2">
          <ClipboardList className="text-primary h-4 w-4 shrink-0" />
          <span>
            Informe de viaje{' '}
            <span className="font-mono font-semibold">
              {informe.codigoInforme}
            </span>
          </span>
          <InformeViajeEstadoBadge estado={informe.estado} />
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/app/informes-viaje/${informe.id}`}>Ver ANEXO 7</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
      <div className="flex items-start gap-2">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <span>
          Falta el <strong>informe de viaje</strong> (ANEXO 7) de la solicitud{' '}
          {solicitud.codigoSolicitud}. La rendición puede enviarse igual, pero
          el manual lo pide como respaldo.
        </span>
      </div>
      {puedeCrear && (
        <Button variant="outline" size="sm" asChild>
          <Link href={`/app/informes-viaje/nueva?solicitudId=${solicitud.id}`}>
            Crear informe de viaje
          </Link>
        </Button>
      )}
    </div>
  );
}
