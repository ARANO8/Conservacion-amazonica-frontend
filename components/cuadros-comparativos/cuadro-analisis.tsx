'use client';

import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Cell } from 'recharts';
import { Lightbulb, TrendingDown, AlertTriangle } from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { cn, formatMoney } from '@/lib/utils';
import { analizarCuadro, type AnalisisInput } from '@/lib/cuadro-analisis';

interface CuadroAnalisisProps {
  input: AnalisisInput;
  /** Cotización marcada manualmente como recomendada (para señalar divergencia). */
  recomendadaIndex?: number | null;
}

const chartConfig = {
  total: { label: 'Total (Bs)', color: 'hsl(var(--chart-1))' },
} satisfies ChartConfig;

export function CuadroAnalisis({
  input,
  recomendadaIndex,
}: CuadroAnalisisProps) {
  const analisis = useMemo(() => analizarCuadro(input), [input]);

  if (input.columnas.length === 0 || input.items.length === 0) {
    return null;
  }

  const { proveedores, mejorMezcla, recomendacion } = analisis;

  const chartData = proveedores.map((p) => ({
    nombre: p.proveedorNombre,
    total: p.total,
    recomendado: p.index === recomendacion.proveedorIndex,
  }));

  const divergencia =
    recomendadaIndex !== undefined &&
    recomendadaIndex !== null &&
    recomendacion.proveedorIndex !== null &&
    recomendadaIndex !== recomendacion.proveedorIndex;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Lightbulb className="h-4 w-4" />
            Recomendación del sistema
          </CardTitle>
          <CardDescription>
            Análisis automático por cobertura y menor total.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {recomendacion.tipo === 'NINGUNA' ? (
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <AlertTriangle className="h-4 w-4" />
              {recomendacion.razones[0]}
            </div>
          ) : (
            <div
              className={cn(
                'rounded-md border p-4',
                recomendacion.tipo === 'COMPLETA'
                  ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-900/60 dark:bg-emerald-950/40'
                  : 'border-amber-300 bg-amber-50 dark:border-amber-900/60 dark:bg-amber-950/40'
              )}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold">
                  Recomendado: {recomendacion.proveedorNombre}
                </span>
                <Badge variant="outline">
                  {recomendacion.tipo === 'COMPLETA'
                    ? 'Cobertura completa'
                    : 'Cobertura parcial'}
                </Badge>
              </div>
              <ul className="text-muted-foreground mt-2 list-disc space-y-1 pl-5 text-sm">
                {recomendacion.razones.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          )}

          {divergencia && (
            <div className="flex items-start gap-2 rounded-md border border-blue-300 bg-blue-50 p-3 text-sm text-blue-900 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-200">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                La cotización marcada como recomendada difiere de la sugerida
                por el sistema ({recomendacion.proveedorNombre}). Revisa los
                criterios antes de aprobar.
              </span>
            </div>
          )}

          <div className="flex items-center gap-2 rounded-md border p-3 text-sm">
            <TrendingDown className="h-4 w-4 shrink-0" />
            <span>
              Mejor mezcla por ítem (cada ítem al proveedor más barato):{' '}
              <span className="font-semibold">
                {formatMoney(mejorMezcla.total)}
              </span>
              {mejorMezcla.itemsSinCotizar.length > 0 && (
                <span className="text-muted-foreground">
                  {' '}
                  · Sin cotizar: {mejorMezcla.itemsSinCotizar.join(', ')}
                </span>
              )}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Comparación de totales</CardTitle>
          <CardDescription>
            Total cotizado por proveedor (la barra resaltada es la recomendada).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[260px] w-full">
            <BarChart
              data={chartData}
              margin={{ top: 8, right: 8, left: 8, bottom: 8 }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="nombre"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={80}
                tickFormatter={(v: number) => formatMoney(v)}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value) => formatMoney(Number(value))}
                  />
                }
              />
              <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={
                      entry.recomendado
                        ? 'hsl(var(--chart-2))'
                        : 'hsl(var(--chart-1))'
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>

          <div className="mt-4 space-y-2">
            {proveedores.map((p) => (
              <div
                key={p.index}
                className="flex items-center justify-between gap-4 border-b pb-2 text-sm last:border-b-0"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium">{p.proveedorNombre}</span>
                  <Badge
                    variant="outline"
                    className={cn(
                      p.completo
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                    )}
                  >
                    {p.itemsCotizados}/{p.itemsTotal} ítems
                  </Badge>
                </div>
                <span className="font-semibold">{formatMoney(p.total)}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
