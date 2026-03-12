'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft } from 'lucide-react';
import type {
  RendicionResponse,
  EstadoRendicion,
} from '@/types/rendicion-backend';
import { formatMoney, formatDate } from '@/lib/utils';
import { RendicionGastosSection } from '@/components/rendiciones/rendicion-gastos-section';
import { RendicionDeclaracionSection } from '@/components/rendiciones/rendicion-declaracion-section';
import { RendicionSolicitudSection } from '@/components/rendiciones/rendicion-solicitud-section';

interface RendicionDetailClientProps {
  rendicion: RendicionResponse;
}

const ESTADO_COLORS: Record<EstadoRendicion, string> = {
  PENDIENTE: 'bg-yellow-100 text-yellow-800',
  APROBADA: 'bg-green-100 text-green-800',
  OBSERVADA: 'bg-orange-100 text-orange-800',
  RECHAZADA: 'bg-red-100 text-red-800',
};

export function RendicionDetailClient({
  rendicion,
}: RendicionDetailClientProps) {
  const router = useRouter();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Rendición de Fondos</h1>
            <p className="text-muted-foreground">ID: {rendicion.id}</p>
          </div>
        </div>
        <Badge className={ESTADO_COLORS[rendicion.estado]}>
          {rendicion.estado}
        </Badge>
      </div>

      {/* Main Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Resumen de Rendición</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div>
            <p className="text-muted-foreground text-sm font-medium">
              Fecha de Rendición
            </p>
            <p className="mt-1 text-lg font-semibold">
              {formatDate(rendicion.fechaRendicion)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-sm font-medium">
              Monto Respaldado
            </p>
            <p className="mt-1 text-lg font-semibold text-green-600">
              {formatMoney(rendicion.montoRespaldado)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-sm font-medium">
              Saldo Líquido
            </p>
            <p
              className={`mt-1 text-lg font-semibold ${
                parseFloat(rendicion.saldoLiquido) > 0
                  ? 'text-blue-600'
                  : 'text-red-600'
              }`}
            >
              {formatMoney(rendicion.saldoLiquido)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Solicitud Section */}
      <RendicionSolicitudSection solicitud={rendicion.solicitud} />

      {/* Gastos Section */}
      {rendicion.gastosRendicion && rendicion.gastosRendicion.length > 0 && (
        <RendicionGastosSection gastos={rendicion.gastosRendicion} />
      )}

      {/* Declaración Jurada Section */}
      {rendicion.declaracionesJuradas &&
        rendicion.declaracionesJuradas.length > 0 && (
          <RendicionDeclaracionSection
            declaraciones={rendicion.declaracionesJuradas}
          />
        )}

      {/* Observaciones */}
      {rendicion.observaciones && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Observaciones</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">
              {rendicion.observaciones}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Footer Actions */}
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => router.back()}>
          Volver
        </Button>
      </div>
    </div>
  );
}
