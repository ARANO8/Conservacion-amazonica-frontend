'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { formatMoney, formatDate } from '@/lib/utils';
import type { SolicitudResponse } from '@/types/solicitud-backend';

interface RendicionSolicitudSectionProps {
  solicitud: SolicitudResponse;
}

export function RendicionSolicitudSection({
  solicitud,
}: RendicionSolicitudSectionProps) {
  const router = useRouter();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Solicitud Asociada</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/dashboard/solicitud/${solicitud.id}`)}
          >
            Ver detalles
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div>
          <p className="text-muted-foreground text-sm font-medium">
            ID de Solicitud
          </p>
          <p className="mt-1 font-semibold">{solicitud.id}</p>
        </div>

        <div>
          <p className="text-muted-foreground text-sm font-medium">
            Código de Solicitud
          </p>
          <p className="mt-1 font-semibold">{solicitud.codigoSolicitud}</p>
        </div>

        <div>
          <p className="text-muted-foreground text-sm font-medium">
            Fecha de Solicitud
          </p>
          <p className="mt-1 font-semibold">
            {formatDate(solicitud.fechaCreacion)}
          </p>
        </div>

        <div>
          <p className="text-muted-foreground text-sm font-medium">Estado</p>
          <p className="mt-1 font-semibold text-blue-600">{solicitud.estado}</p>
        </div>

        <div>
          <p className="text-muted-foreground text-sm font-medium">
            Monto Total Presupuestado
          </p>
          <p className="mt-1 text-lg font-semibold text-green-600">
            {formatMoney(solicitud.montoTotalPresupuestado)}
          </p>
        </div>

        <div>
          <p className="text-muted-foreground text-sm font-medium">
            Monto Total Neto
          </p>
          <p className="mt-1 text-lg font-semibold text-blue-600">
            {formatMoney(solicitud.montoTotalNeto)}
          </p>
        </div>

        {solicitud.motivoViaje && (
          <div className="md:col-span-3">
            <p className="text-muted-foreground text-sm font-medium">
              Motivo del Viaje
            </p>
            <p className="mt-1 text-sm">{solicitud.motivoViaje}</p>
          </div>
        )}

        {solicitud.lugarViaje && (
          <div className="md:col-span-3">
            <p className="text-muted-foreground text-sm font-medium">
              Lugar del Viaje
            </p>
            <p className="mt-1 text-sm">{solicitud.lugarViaje}</p>
          </div>
        )}

        {solicitud.descripcion && (
          <div className="md:col-span-3">
            <p className="text-muted-foreground text-sm font-medium">
              Descripción
            </p>
            <p className="mt-1 text-sm whitespace-pre-wrap">
              {solicitud.descripcion}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
