import Link from 'next/link';
import { ExternalLink } from 'lucide-react';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatFechaAnexo } from '@/lib/declaracion-movilidad';
import type { PlanViajeResponse } from '@/types/plan-viaje-backend';

function rango(inicio: string, fin: string): string {
  const desde = formatFechaAnexo(inicio);
  const hasta = formatFechaAnexo(fin);
  return desde === hasta ? desde : `${desde} al ${hasta}`;
}

/**
 * Vista compacta y de solo lectura del plan de viaje: la que ve el emisor en
 * el Paso 1 de la solicitud y el revisor en el detalle.
 */
export function PlanViajeResumen({ plan }: { plan: PlanViajeResponse }) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <dl className="grid flex-1 gap-x-4 gap-y-1 text-sm sm:grid-cols-[160px_1fr]">
          <dt className="text-muted-foreground text-xs font-bold tracking-wider uppercase">
            Lugar(es) de viaje
          </dt>
          <dd>{plan.lugaresViaje}</dd>
          <dt className="text-muted-foreground text-xs font-bold tracking-wider uppercase">
            Objetivo del viaje
          </dt>
          <dd>{plan.objetivoViaje}</dd>
          {plan.directorPrograma && (
            <>
              <dt className="text-muted-foreground text-xs font-bold tracking-wider uppercase">
                VoBo
              </dt>
              <dd>{plan.directorPrograma.nombreCompleto}</dd>
            </>
          )}
        </dl>
        <Link
          href={`/app/planes-viaje/${plan.id}`}
          target="_blank"
          className="text-primary inline-flex items-center gap-1 text-xs font-medium hover:underline"
        >
          Ver ANEXO 1 <ExternalLink className="h-3 w-3" />
        </Link>
      </div>

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[150px]">Fechas</TableHead>
              <TableHead className="w-[60px] text-center">Días</TableHead>
              <TableHead className="min-w-[160px]">Salida → Llegada</TableHead>
              <TableHead className="min-w-[180px]">Actividad</TableHead>
              <TableHead className="min-w-[180px]">Personal ACEAA</TableHead>
              <TableHead className="w-[80px] text-center">Terceros</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {plan.actividades.map((a) => (
              <TableRow key={a.id}>
                <TableCell className="text-xs">
                  {rango(a.fechaInicio, a.fechaFin)}
                </TableCell>
                <TableCell className="text-center text-xs tabular-nums">
                  {Number(a.diasCalculados)}
                </TableCell>
                <TableCell className="text-xs">
                  {a.lugarSalida || a.lugarLlegada
                    ? `${a.lugarSalida ?? '—'} → ${a.lugarLlegada ?? '—'}`
                    : '—'}
                </TableCell>
                <TableCell className="text-xs">
                  {a.actividadProgramada}
                </TableCell>
                <TableCell className="text-xs">
                  {a.participantesInstitucionales
                    .map((p) => p.nombreCompleto)
                    .join(', ') || '—'}
                </TableCell>
                <TableCell className="text-center text-xs tabular-nums">
                  {a.cantidadPersonasTerceros}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
