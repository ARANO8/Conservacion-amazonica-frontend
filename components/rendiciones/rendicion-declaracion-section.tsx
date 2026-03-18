'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatMoney, formatDate } from '@/lib/utils';
import type { DeclaracionJuradaResponse } from '@/types/rendicion-backend';

interface RendicionDeclaracionSectionProps {
  declaraciones: DeclaracionJuradaResponse[];
}

export function RendicionDeclaracionSection({
  declaraciones,
}: RendicionDeclaracionSectionProps) {
  if (!declaraciones || declaraciones.length === 0) return null;

  // Usually there's only one per rendición, but handle multiple
  const declaracion = declaraciones[0];

  const tipoDeclaracionLabels: Record<string, string> = {
    COMPLETA: 'Declaración Completa',
    PARCIAL: 'Declaración Parcial',
    NEGATIVA: 'Declaración Negativa',
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Declaración Jurada</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <p className="text-muted-foreground text-sm font-medium">
              Tipo de Declaración
            </p>
            <p className="mt-1 text-sm font-semibold">
              {declaracion.tipoDeclaracion
                ? tipoDeclaracionLabels[declaracion.tipoDeclaracion] ||
                  declaracion.tipoDeclaracion
                : 'No especificada'}
            </p>
          </div>

          {declaracion.montoADevolver && (
            <div>
              <p className="text-muted-foreground text-sm font-medium">
                Monto a Devolver
              </p>
              <p className="mt-1 text-sm font-semibold text-blue-600">
                {formatMoney(declaracion.montoADevolver)}
              </p>
            </div>
          )}
        </div>

        <div className="rounded-lg border bg-blue-50 p-3">
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                checked={declaracion.confirmaDatosVeridicos}
                disabled
                className="mt-0.5"
              />
              <label className="text-muted-foreground">
                Confirma que los datos declarados son verídicos
              </label>
            </div>
            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                checked={declaracion.aceptaPoliticaDevolucion}
                disabled
                className="mt-0.5"
              />
              <label className="text-muted-foreground">
                Acepta la política de devolución de saldos
              </label>
            </div>
          </div>
        </div>

        {declaracion.observaciones && (
          <div>
            <p className="text-muted-foreground text-sm font-medium">
              Observaciones
            </p>
            <p className="mt-1 text-sm whitespace-pre-wrap">
              {declaracion.observaciones}
            </p>
          </div>
        )}

        <div className="text-muted-foreground text-xs">
          {declaracion.createdAt ? (
            <>Registrada el {formatDate(declaracion.createdAt)}</>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
