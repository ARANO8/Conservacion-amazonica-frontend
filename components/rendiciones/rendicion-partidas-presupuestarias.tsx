'use client'

import { Layers, BookOpen, Banknote } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { formatMoney } from '@/lib/utils'
import type { SolicitudResponse } from '@/types/solicitud-backend'
import type { GastoRendicionResponse } from '@/types/rendicion-backend'

function toNumber(value: string | number | null | undefined): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

function round2(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Number.parseFloat(value.toFixed(2))
}

interface RendicionPartidasPresupuestariasProps {
  solicitud: SolicitudResponse | null
  gastosRendicion: GastoRendicionResponse[]
}

export function RendicionPartidasPresupuestarias({
  solicitud,
  gastosRendicion,
}: RendicionPartidasPresupuestariasProps) {
  const presupuestos = solicitud?.presupuestos ?? []

  const partidas = presupuestos.filter((p) => p.poa?.codigoPoa)

  if (!solicitud) return null

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
    )
  }

  return (
    <div className="mb-6 space-y-3">
      <div className="flex items-center gap-2">
        <BookOpen className="text-primary h-4 w-4 shrink-0" />
        <h3 className="text-sm font-bold tracking-wide uppercase">
          Partidas Presupuestarias
        </h3>
      </div>
      <p className="text-foreground text-sm">
        Partidas presupuestarias aprobadas en la solicitud y montos rendidos
        por cada una.
      </p>

      <div className="flex w-full flex-wrap gap-4">
        {partidas.map((p) => {
          const codigo = p.poa?.codigoPoa ?? '—'
          const partida = p.poa?.estructura?.partida?.nombre ?? 'Sin partida'
          const proyecto = p.poa?.estructura?.proyecto?.nombre
          const grupo = p.poa?.estructura?.grupo?.nombre
          const montoAprobado = toNumber(
            p.subtotalPresupuestado ?? p.poa?.costoTotal ?? 0,
          )

          const montoRendido = gastosRendicion.reduce((sum, gasto) => {
            if (Number(gasto.partidaId) !== p.id) return sum
            return sum + toNumber(gasto.montoBruto ?? gasto.monto ?? gasto.montoTotal ?? 0)
          }, 0)

          const saldo = round2(montoAprobado - montoRendido)

          const saldoUi =
            saldo > 0
              ? {
                  label: `Saldo pendiente: ${formatMoney(saldo)} Bs.`,
                  className:
                    'text-amber-600 border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/40',
                }
              : saldo < 0
                ? {
                    label: `Excedido: ${formatMoney(Math.abs(saldo))} Bs.`,
                    className:
                      'text-red-600 border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-950/40',
                  }
                : {
                    label: 'Rendición exacta',
                    className:
                      'text-emerald-600 border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/40',
                  }

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
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Banknote className="text-muted-foreground h-3.5 w-3.5" />
                      <span className="text-foreground text-sm font-bold tracking-wider uppercase">
                        Aprobado
                      </span>
                    </div>
                    <span className="text-primary text-sm font-black tracking-tight">
                      {formatMoney(montoAprobado)}{' '}
                      <span className="text-foreground text-sm font-normal">
                        Bs.
                      </span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-foreground text-sm font-bold tracking-wider uppercase">
                      Rendido
                    </span>
                    <span className="text-sm font-bold tracking-tight">
                      {formatMoney(montoRendido)}{' '}
                      <span className="text-foreground text-sm font-normal">
                        Bs.
                      </span>
                    </span>
                  </div>
                  <Badge
                    variant="outline"
                    className={`mt-1 w-full justify-center text-sm font-extrabold tracking-wide ${saldoUi.className}`}
                  >
                    {saldoUi.label}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Separator className="mt-4" />
    </div>
  )
}
