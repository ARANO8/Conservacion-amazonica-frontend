'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
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
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { formatMoney } from '@/lib/utils';
import type { DashboardAnaliticaMensual } from '@/lib/services/dashboard-service';

interface MonthlyTrendChartProps {
  data: DashboardAnaliticaMensual[];
}

const chartConfig = {
  total: {
    label: 'Monto mensual',
    color: 'hsl(var(--chart-1))',
  },
} satisfies ChartConfig;

export function MonthlyTrendChart({ data }: MonthlyTrendChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tendencia de Gastos Mensuales</CardTitle>
        <CardDescription className="text-amzdesk-helper">
          Evolución de solicitudes desembolsadas y ejecutadas por mes.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[320px] w-full">
          <BarChart data={data} margin={{ left: 4, right: 4, top: 8 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="name" tickLine={false} axisLine={false} />
            <YAxis
              tickFormatter={(value) => {
                const n = Number(value) || 0;
                if (n >= 1000) return `${Math.round(n / 1000)}k`;
                return `${n}`;
              }}
              tickLine={false}
              axisLine={false}
              width={36}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  formatter={(value) => formatMoney(Number(value) || 0)}
                />
              }
            />
            <Bar dataKey="total" fill="var(--color-total)" radius={6} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
