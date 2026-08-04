'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { ArrowLeft, Calendar, ReceiptText } from 'lucide-react';

import { rendicionesService } from '@/lib/services/rendiciones-service';
import {
  RendicionResponse,
  GastoRendicionResponse,
} from '@/types/rendicion-backend';
import { formatDateShort, formatMoney } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

function parseNumber(value: string | number | undefined): number {
  if (typeof value === 'number') return value;
  if (!value) return 0;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeGasto(gasto: GastoRendicionResponse) {
  const montoBruto =
    parseNumber(gasto.montoBruto) ||
    parseNumber(gasto.montoTotal) ||
    parseNumber(gasto.monto) ||
    0;
  const impuestosRetenciones = parseNumber(gasto.montoImpuestos);
  const montoNeto = parseNumber(gasto.montoNeto);

  const partidaCodigo = gasto.partida?.poa?.codigoPoa;
  const partidaNombre = gasto.partida?.poa?.estructura?.partida?.nombre;
  const partidaLabel =
    partidaCodigo || partidaNombre
      ? `[${partidaCodigo ?? '---'}] ${partidaNombre ?? 'Sin nombre de partida'}`
      : gasto.partidaId
        ? `Partida #${gasto.partidaId}`
        : 'Sin partida';

  return {
    fecha: gasto.fechaDocumento ?? gasto.fecha,
    proveedor: gasto.proveedor,
    concepto: gasto.concepto ?? gasto.detalle,
    partidaLabel,
    tipoDocumento: gasto.tipoDocumento,
    montoBruto,
    impuestosRetenciones,
    montoNeto,
  };
}

export default function RendicionDetalleBySolicitudPage() {
  const params = useParams();
  const router = useRouter();

  const [rendicion, setRendicion] = useState<RendicionResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const solicitudId = params.solicitudId as string;

  useEffect(() => {
    const fetchRendicion = async () => {
      if (!solicitudId) return;

      try {
        setLoading(true);
        const data =
          await rendicionesService.getRendicionBySolicitud(solicitudId);
        setRendicion(data);
      } catch {
        toast.error('No se pudo cargar el detalle de la rendición.');
        router.push('/app/solicitudes');
      } finally {
        setLoading(false);
      }
    };

    void fetchRendicion();
  }, [solicitudId, router]);

  const gastos = useMemo(
    () =>
      (rendicion?.gastos ?? rendicion?.gastosRendicion ?? []).map(
        normalizeGasto
      ),
    [rendicion]
  );

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-52 w-full" />
      </div>
    );
  }

  if (!rendicion) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <p className="text-foreground">No se encontró la rendición.</p>
        <Button asChild variant="link" className="mt-4">
          <Link href="/app/solicitudes">Volver</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Detalle de Rendición
            </h1>
            <p className="text-amzdesk-helper">
              Solicitud #{rendicion.solicitudId}
            </p>
          </div>
        </div>
        <Badge variant="secondary">Estado: {rendicion.estado}</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5" />
            Encabezado Financiero
          </CardTitle>
          <CardDescription className="text-amzdesk-helper">
            Información general de fecha y montos de la rendición.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div>
              <p className="text-amzdesk-label uppercase">Fecha de Rendición</p>
              <p className="text-amzdesk-monto">
                {formatDateShort(rendicion.fechaRendicion)}
              </p>
            </div>

            <div>
              <p className="text-amzdesk-label uppercase">Monto Respaldado</p>
              <p className="text-amzdesk-monto text-emerald-600">
                {formatMoney(rendicion.montoRespaldado)}
              </p>
            </div>

            <div>
              <p className="text-amzdesk-label uppercase">Saldo Líquido</p>
              <p className="text-amzdesk-monto text-blue-600">
                {formatMoney(rendicion.saldoLiquido)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ReceiptText className="h-5 w-5" />
            Detalle de Gastos
          </CardTitle>
          <CardDescription className="text-amzdesk-helper">
            Comprobantes con importes brutos, retenciones y montos netos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {rendicion.comprobanteUrl && (
            <div className="mb-4 flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-900/50 dark:bg-blue-950/20">
              <div>
                <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">
                  Comprobantes Adjuntos
                </p>
                <p className="max-w-[400px] truncate text-xs text-blue-600 dark:text-blue-400">
                  {rendicion.comprobanteUrl}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 border-blue-300 bg-white text-blue-700 hover:bg-blue-100 dark:border-blue-700 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-900/50"
                asChild
              >
                <a
                  href={rendicion.comprobanteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ReceiptText className="mr-1.5 h-4 w-4" />
                  Ver comprobantes
                </a>
              </Button>
            </div>
          )}
          {gastos.length === 0 ? (
            <p className="text-amzdesk-helper">
              No hay gastos registrados en esta rendición.
            </p>
          ) : (
            <div className="w-full overflow-x-auto">
              <Table className="w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-amzdesk-table-header">
                      Fecha
                    </TableHead>
                    <TableHead className="text-amzdesk-table-header">
                      Proveedor
                    </TableHead>
                    <TableHead className="text-amzdesk-table-header">
                      Concepto
                    </TableHead>
                    <TableHead className="text-amzdesk-table-header">
                      Partida
                    </TableHead>
                    <TableHead className="text-amzdesk-table-header text-right">
                      Bruto
                    </TableHead>
                    <TableHead className="text-amzdesk-table-header text-right">
                      Impuestos
                    </TableHead>
                    <TableHead className="text-amzdesk-table-header text-right">
                      Neto
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {gastos.map((gasto, idx) => (
                    <TableRow key={`${gasto.concepto}-${idx}`}>
                      <TableCell>{formatDateShort(gasto.fecha)}</TableCell>
                      <TableCell>
                        {gasto.proveedor || 'Sin proveedor'}
                      </TableCell>
                      <TableCell>{gasto.concepto || '-'}</TableCell>
                      <TableCell>{gasto.partidaLabel}</TableCell>
                      <TableCell className="text-amzdesk-monto text-right">
                        {formatMoney(gasto.montoBruto)}
                      </TableCell>
                      <TableCell className="text-right text-orange-600">
                        {formatMoney(gasto.impuestosRetenciones)}
                      </TableCell>
                      <TableCell className="text-amzdesk-monto text-right text-emerald-600">
                        {formatMoney(gasto.montoNeto)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={() => router.push('/app/solicitudes')}
        >
          Volver a Solicitudes
        </Button>
      </div>
    </div>
  );
}
