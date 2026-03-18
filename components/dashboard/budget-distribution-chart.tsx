'use client';

import { Cell, Pie, PieChart } from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { formatMoney } from '@/lib/utils';
import type { DashboardAnaliticaPartida } from '@/lib/services/dashboard-service';

interface BudgetDistributionChartProps {
  data: DashboardAnaliticaPartida[];
}

const CHART_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

const chartConfig = {
  value: {
    label: 'Monto por partida',
    color: 'hsl(var(--chart-1))',
  },
} satisfies ChartConfig;

export function BudgetDistributionChart({
  data,
}: BudgetDistributionChartProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top 5 Partidas con Mayor Gasto</CardTitle>
          <CardDescription className="text-amzdesk-helper">
            Distribución de gasto por partidas presupuestarias.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-amzdesk-helper rounded-lg border border-dashed p-6 text-center text-sm">
            No hay datos de distribución para mostrar.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top 5 Partidas con Mayor Gasto</CardTitle>
        <CardDescription className="text-amzdesk-helper">
          Concentración del gasto en partidas del periodo analizado (Año
          Actual).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={chartConfig}
          className="mx-auto h-[320px] w-full"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  formatter={(value, _name, item) => {
                    const partName =
                      (item?.payload as { name?: string } | undefined)?.name ??
                      'Partida';
                    return `${partName}: ${formatMoney(Number(value) || 0)}`;
                  }}
                />
              }
            />

            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={68}
              outerRadius={110}
              paddingAngle={3}
              strokeWidth={2}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`${entry.name}-${index}`}
                  fill={CHART_COLORS[index % CHART_COLORS.length]}
                />
              ))}
            </Pie>

            <ChartLegend
              content={<ChartLegendContent nameKey="name" />}
              verticalAlign="bottom"
            />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
