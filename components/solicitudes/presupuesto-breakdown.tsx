'use client';

import * as React from 'react';
import { PartidaGroup } from '@/types/breakdown';
import { formatMoney } from '@/lib/utils';

interface PresupuestoBreakdownProps {
  partidas: PartidaGroup[];
}

export function PresupuestoBreakdown({ partidas }: PresupuestoBreakdownProps) {
  if (!partidas || partidas.length === 0) {
    return (
      <p className="text-muted-foreground py-4 text-center text-sm italic">
        No se encontraron desgloses de presupuesto para esta solicitud.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {partidas.map((partida, idx) => (
        <div
          key={partida.reservaId || idx}
          className="bg-card overflow-hidden rounded-xl border shadow-sm"
        >
          {/* Header Partida */}
          <div className="bg-muted/30 border-b p-3">
            <p className="text-primary text-base leading-tight font-black uppercase">
              {partida.partidaNombre}
            </p>
            {partida.actividadDescripcion && (
              <p className="text-muted-foreground mt-1 text-xs font-medium uppercase">
                {partida.actividadDescripcion}
              </p>
            )}
          </div>

          <div className="p-3">
            <div className="space-y-3">
              <div className="bg-muted/10 rounded-lg border px-3 py-2">
                {/* Header Columnas */}
                <div className="mb-2 flex items-center justify-between border-b pb-1">
                  <span className="text-muted-foreground text-[10px] font-bold uppercase">
                    {partida.esViatico ? 'Detalle Viático' : 'Detalle Gasto'}
                  </span>
                  <div className="flex gap-8">
                    <span className="text-muted-foreground text-[10px] font-bold uppercase">
                      Líquido
                    </span>
                    <span className="text-muted-foreground text-[10px] font-bold uppercase">
                      Presup.
                    </span>
                  </div>
                </div>

                {/* Lista de Items */}
                <div className="space-y-2">
                  {partida.items.length > 0 ? (
                    partida.items.map((item, iIdx) => (
                      <div
                        key={iIdx}
                        className="flex items-start justify-between text-xs"
                      >
                        <div className="flex flex-col">
                          <span className="font-semibold uppercase">
                            {item.nombre}
                          </span>
                          {item.detalle && (
                            <span className="text-muted-foreground text-[9px] uppercase">
                              {item.detalle}
                            </span>
                          )}
                          {item.tipoDestino && (
                            <span className="text-muted-foreground text-[8px] italic">
                              {item.tipoDestino === 'INSTITUCIONAL'
                                ? 'Institucional'
                                : item.tipoDestino === 'TERCEROS'
                                  ? 'Tercero'
                                  : item.tipoDestino}
                            </span>
                          )}
                        </div>
                        <div className="flex gap-4">
                          <span className="font-medium tabular-nums">
                            {formatMoney(item.montoLiquido)}
                          </span>
                          <span className="font-bold tabular-nums">
                            {formatMoney(item.montoNeto)}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground py-1 text-center text-[10px] italic">
                      {partida.esViatico
                        ? 'Sin viáticos cargados'
                        : 'Sin ítems cargados'}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Footer Subtotales */}
            <div className="mt-4 flex items-center justify-end gap-6 border-t pt-3">
              <div className="text-right">
                <p className="text-muted-foreground text-[10px] font-bold uppercase">
                  Subtotal Líquido
                </p>
                <p className="text-muted-foreground text-sm font-semibold">
                  {formatMoney(partida.totalLiquido)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-primary text-[10px] font-bold uppercase">
                  Subtotal Presupuestado
                </p>
                <p className="text-primary text-sm font-black">
                  {formatMoney(partida.totalPresupuestado)}
                </p>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
