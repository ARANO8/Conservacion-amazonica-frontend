'use client';

import { Layers, BookOpen, Banknote } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { formatMoney } from '@/lib/utils';
import type { SolicitudResponse } from '@/types/solicitud-backend';
import type { CreateRendicionInput } from '@/types/rendicion-schema';

function round2(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Number.parseFloat(value.toFixed(2));
}

function toNumber(value: number | string | null | undefined): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

/** Margen para que los redondeos a dos decimales no delaten una rendición exacta. */
const TOLERANCIA = 0.01;

const GRID_COMPARATIVO =
  'grid grid-cols-[minmax(0,1fr)_minmax(64px,auto)_minmax(64px,auto)] items-center gap-x-3';

interface FilaComparativaProps {
  label: string;
  aprobado: string;
  rendido: string;
  /** La fila del monto presupuestado, que es la que manda para el saldo. */
  destacada?: boolean;
}

function FilaComparativa({
  label,
  aprobado,
  rendido,
  destacada = false,
}: FilaComparativaProps) {
  return (
    <div className={GRID_COMPARATIVO}>
      <span
        className={`text-foreground text-sm tracking-wider uppercase ${destacada ? 'font-bold' : ''}`}
      >
        {label}
      </span>
      <span
        className={`text-right text-sm tracking-tight ${destacada ? 'text-primary font-black' : 'font-semibold'}`}
      >
        {aprobado}
      </span>
      <span
        className={`text-right text-sm tracking-tight ${destacada ? 'font-black' : 'font-semibold'}`}
      >
        {rendido}
      </span>
    </div>
  );
}

interface PartidasAprobadasProps {
  solicitud: SolicitudResponse | null;
  gastos: CreateRendicionInput['gastos'];
}

export function PartidasAprobadas({
  solicitud,
  gastos,
}: PartidasAprobadasProps) {
  const presupuestos = solicitud?.presupuestos ?? [];

  // Filtrar entradas que tengan al menos código POA para que la card tenga sentido
  const partidas = presupuestos.filter((p) => p.poa?.codigoPoa);

  if (!solicitud) return null;

  if (partidas.length === 0) {
    return (
      <div className="bg-muted/40 mb-6 rounded-lg border border-dashed p-4">
        <div className="flex items-center gap-2">
          <Layers className="text-muted-foreground h-4 w-4 shrink-0" />
          <p className="text-foreground text-sm">
            No se encontraron partidas presupuestarias para esta solicitud.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6 space-y-3">
      {/* Encabezado de sección */}
      <div className="flex items-center gap-2">
        <BookOpen className="text-primary h-4 w-4 shrink-0" />
        <h3 className="text-sm font-bold tracking-wide uppercase">
          Partidas Aprobadas para esta Rendición
        </h3>
      </div>
      <p className="text-foreground text-sm">
        Cada gasto registrado debe imputarse a una de estas partidas. El saldo
        se calcula sobre el monto presupuestado —el líquido más sus impuestos—,
        que es lo que se aprobó contra el POA. Importes en Bs.
      </p>

      {/* Grid de tarjetas */}
      <div className="flex w-full flex-wrap gap-4">
        {partidas.map((p) => {
          const codigo = p.poa?.codigoPoa ?? '—';
          const partida = p.poa?.estructura?.partida?.nombre ?? 'Sin partida';
          const proyecto = p.poa?.estructura?.proyecto?.nombre;
          const grupo = p.poa?.estructura?.grupo?.nombre;
          const aprobadoPresupuestado = round2(
            toNumber(p.subtotalPresupuestado ?? p.poa?.montoPresupuestado)
          );
          const tieneLiquidoAprobado =
            p.subtotalNeto !== undefined && p.subtotalNeto !== null;
          const aprobadoLiquido = round2(toNumber(p.subtotalNeto));

          // El usuario teclea el líquido; el presupuestado le suma las
          // retenciones. Comparar el presupuestado aprobado contra el líquido
          // rendido es lo que hacía parecer que faltaba plata por rendir.
          const rendido = (gastos ?? []).reduce(
            (acc, gasto) => {
              if (!gasto || Number(gasto.partidaId) !== p.id) return acc;
              const liquido = toNumber(gasto.montoTotal);
              const presupuestado = toNumber(gasto.montoBruto) || liquido;
              return {
                liquido: acc.liquido + liquido,
                presupuestado: acc.presupuestado + presupuestado,
              };
            },
            { liquido: 0, presupuestado: 0 }
          );

          const rendidoLiquido = round2(rendido.liquido);
          const rendidoPresupuestado = round2(rendido.presupuestado);
          const saldo = round2(aprobadoPresupuestado - rendidoPresupuestado);

          const saldoUi =
            saldo > TOLERANCIA
              ? {
                  label: `A DEVOLVER: ${formatMoney(saldo)} Bs.`,
                  className:
                    'text-amber-600 border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/40',
                }
              : saldo < -TOLERANCIA
                ? {
                    label: `A REEMBOLSAR: ${formatMoney(Math.abs(saldo))} Bs.`,
                    className:
                      'text-blue-600 border-blue-300 bg-blue-50 dark:border-blue-700 dark:bg-blue-950/40',
                  }
                : {
                    label: 'RENDICIÓN EXACTA',
                    className:
                      'text-emerald-600 border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/40',
                  };

          return (
            <Card
              key={p.id}
              className="bg-muted/40 w-full min-w-[280px] flex-1 border shadow-none transition-shadow hover:shadow-sm"
            >
              <CardHeader className="pt-3 pb-2">
                <div className="flex items-start justify-between gap-2">
                  <Badge
                    variant="secondary"
                    className="text-primary bg-primary/10 border-primary/20 shrink-0 border font-mono text-[10px] font-bold"
                  >
                    {codigo}
                  </Badge>
                </div>
                <CardTitle className="text-foreground mt-1 text-xs leading-snug font-semibold">
                  {partida}
                </CardTitle>
                {(proyecto || grupo) && (
                  <p className="text-foreground truncate text-sm">
                    {[proyecto, grupo].filter(Boolean).join(' / ')}
                  </p>
                )}
              </CardHeader>

              <CardContent className="pb-3">
                <Separator className="mb-2" />
                <div className="space-y-1.5">
                  {/* Encabezado de las dos columnas que se comparan */}
                  <div className={GRID_COMPARATIVO}>
                    <div className="flex items-center gap-1">
                      <Banknote className="text-muted-foreground h-3.5 w-3.5" />
                    </div>
                    <span className="text-muted-foreground text-right text-[10px] font-bold tracking-tight uppercase">
                      Aprobado
                    </span>
                    <span className="text-muted-foreground text-right text-[10px] font-bold tracking-tight uppercase">
                      Rendido
                    </span>
                  </div>

                  <FilaComparativa
                    label="Líquido"
                    aprobado={
                      tieneLiquidoAprobado ? formatMoney(aprobadoLiquido) : '—'
                    }
                    rendido={formatMoney(rendidoLiquido)}
                  />
                  <FilaComparativa
                    label="Presupuestado"
                    aprobado={formatMoney(aprobadoPresupuestado)}
                    rendido={formatMoney(rendidoPresupuestado)}
                    destacada
                  />
                  <FilaComparativa
                    label="Impuestos"
                    aprobado={
                      tieneLiquidoAprobado
                        ? formatMoney(
                            round2(aprobadoPresupuestado - aprobadoLiquido)
                          )
                        : '—'
                    }
                    rendido={formatMoney(
                      round2(rendidoPresupuestado - rendidoLiquido)
                    )}
                  />

                  <Badge
                    variant="outline"
                    className={`mt-1 w-full justify-center text-sm font-extrabold tracking-wide ${saldoUi.className}`}
                  >
                    {saldoUi.label}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Separator className="mt-4" />
    </div>
  );
}
