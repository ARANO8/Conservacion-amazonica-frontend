'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { EstadoBadge } from '@/components/shared/estado-badge';
import { formatDateShort, formatMoney } from '@/lib/utils';
import type { DashboardMovimiento } from '@/lib/services/dashboard-service';

interface RecentMovementsProps {
  data: DashboardMovimiento[];
}

export function RecentMovements({ data }: RecentMovementsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Últimas Solicitudes</CardTitle>
        <CardDescription className="text-amzdesk-helper">
          Movimientos recientes de tus solicitudes registradas.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="text-amzdesk-helper rounded-lg border border-dashed p-6 text-center text-sm">
            No hay movimientos recientes.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-amzdesk-table-header">
                  Fecha
                </TableHead>
                <TableHead className="text-amzdesk-table-header">
                  Código
                </TableHead>
                <TableHead className="text-amzdesk-table-header">
                  Estado
                </TableHead>
                <TableHead className="text-amzdesk-table-header text-right">
                  Costo Total
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((movimiento) => (
                <TableRow key={movimiento.id}>
                  <TableCell className="text-amzdesk-helper">
                    {formatDateShort(movimiento.createdAt)}
                  </TableCell>
                  <TableCell className="font-medium">
                    {movimiento.codigo}
                  </TableCell>
                  <TableCell>
                    <EstadoBadge estado={movimiento.estado} />
                  </TableCell>
                  <TableCell className="text-amzdesk-monto text-right">
                    {formatMoney(movimiento.costoTotal)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
