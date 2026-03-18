'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ExternalLink,
  FileText,
  Link2,
  NotebookPen,
  ReceiptText,
} from 'lucide-react';

import { rendicionesService } from '@/lib/services/rendiciones-service';
import {
  RendicionResponse,
  GastoRendicionResponse,
  DeclaracionJuradaResponse,
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
import { Separator } from '@/components/ui/separator';
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
    urlComprobante: gasto.urlComprobante,
  };
}

function normalizeDeclaracion(declaracion: DeclaracionJuradaResponse) {
  return {
    fecha: declaracion.fecha,
    detalle: declaracion.detalle,
    monto: parseNumber(declaracion.monto),
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

  const gastosMenores = useMemo(
    () => (rendicion?.declaracionesJuradas ?? []).map(normalizeDeclaracion),
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
        <p className="text-muted-foreground">No se encontró la rendición.</p>
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
            <p className="text-muted-foreground text-sm">
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
          <CardDescription>
            Información general de fecha y respaldos documentales.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div>
              <p className="text-muted-foreground text-xs font-semibold uppercase">
                Fecha de Rendición
              </p>
              <p className="text-base font-bold">
                {formatDateShort(rendicion.fechaRendicion)}
              </p>
            </div>

            <div>
              <p className="text-muted-foreground text-xs font-semibold uppercase">
                Monto Respaldado
              </p>
              <p className="text-base font-bold text-emerald-600">
                {formatMoney(rendicion.montoRespaldado)}
              </p>
            </div>

            <div>
              <p className="text-muted-foreground text-xs font-semibold uppercase">
                Saldo Líquido
              </p>
              <p className="text-base font-bold text-blue-600">
                {formatMoney(rendicion.saldoLiquido)}
              </p>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-md border p-3">
              <p className="text-muted-foreground mb-2 text-xs font-semibold uppercase">
                Cuadro Comparativo
              </p>
              {rendicion.urlCuadroComparativo ? (
                <Button asChild variant="outline" size="sm" className="w-full">
                  <a
                    href={rendicion.urlCuadroComparativo}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Link2 className="mr-2 h-4 w-4" />
                    Abrir Cuadro
                    <ExternalLink className="ml-2 h-3.5 w-3.5" />
                  </a>
                </Button>
              ) : (
                <p className="text-muted-foreground text-sm">No adjunto</p>
              )}
            </div>

            <div className="rounded-md border p-3">
              <p className="text-muted-foreground mb-2 text-xs font-semibold uppercase">
                Cotizaciones
              </p>
              {rendicion.urlCotizaciones &&
              rendicion.urlCotizaciones.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {rendicion.urlCotizaciones.map((url, idx) => (
                    <Button
                      key={`${idx}-${url}`}
                      asChild
                      variant="outline"
                      size="sm"
                    >
                      <a href={url} target="_blank" rel="noreferrer">
                        Cotización {idx + 1}
                        <ExternalLink className="ml-2 h-3.5 w-3.5" />
                      </a>
                    </Button>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No adjuntas</p>
              )}
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
          <CardDescription>
            Comprobantes con importes brutos, retenciones y montos netos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {gastos.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No hay gastos registrados en esta rendición.
            </p>
          ) : (
            <div className="w-full overflow-x-auto">
              <Table className="w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Proveedor</TableHead>
                    <TableHead>Concepto</TableHead>
                    <TableHead>Partida</TableHead>
                    <TableHead className="text-right">Bruto</TableHead>
                    <TableHead className="text-right">Impuestos</TableHead>
                    <TableHead className="text-right">Neto</TableHead>
                    <TableHead>Respaldo</TableHead>
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
                      <TableCell className="text-right font-medium">
                        {formatMoney(gasto.montoBruto)}
                      </TableCell>
                      <TableCell className="text-right text-orange-600">
                        {formatMoney(gasto.impuestosRetenciones)}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-emerald-600">
                        {formatMoney(gasto.montoNeto)}
                      </TableCell>
                      <TableCell>
                        {gasto.urlComprobante ? (
                          <Button variant="ghost" size="icon" asChild>
                            <a
                              href={gasto.urlComprobante}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        ) : (
                          <span className="text-muted-foreground text-xs">
                            Sin enlace
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Gastos Menores</CardTitle>
          <CardDescription>
            Registros sin respaldo formal (si aplica).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {gastosMenores.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No se registraron gastos menores en esta rendición.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Detalle</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {gastosMenores.map((item, idx) => (
                  <TableRow key={`${item.detalle}-${idx}`}>
                    <TableCell>{formatDateShort(item.fecha)}</TableCell>
                    <TableCell>{item.detalle || '-'}</TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatMoney(item.monto)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <NotebookPen className="h-5 w-5" />
            Informe de Gastos (Anexo 7)
          </CardTitle>
          <CardDescription>
            Rango de viaje y actividades realizadas durante la comisión.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {rendicion.informeGastos ? (
            <>
              <div className="bg-muted/40 rounded-md p-3 text-sm">
                <span className="font-semibold">Periodo: </span>
                {formatDateShort(rendicion.informeGastos.fechaInicio)} al{' '}
                {formatDateShort(rendicion.informeGastos.fechaFin)}
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Lugar</TableHead>
                    <TableHead>Persona / Institución</TableHead>
                    <TableHead>Actividades Realizadas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rendicion.informeGastos.actividades.map((actividad) => (
                    <TableRow key={actividad.id}>
                      <TableCell>{formatDateShort(actividad.fecha)}</TableCell>
                      <TableCell>{actividad.lugar}</TableCell>
                      <TableCell>{actividad.personaInstitucion}</TableCell>
                      <TableCell className="max-w-[520px] whitespace-pre-wrap">
                        {actividad.actividadesRealizadas}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          ) : (
            <p className="text-muted-foreground text-sm">
              Esta rendición no incluye informe de gastos.
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="border-emerald-300 bg-emerald-50/70 dark:border-emerald-900 dark:bg-emerald-950/25">
        <CardContent className="flex items-center gap-3 pt-6">
          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          <div>
            <p className="font-semibold text-emerald-700 dark:text-emerald-300">
              Declaración Jurada Firmada
            </p>
            <p className="text-sm text-emerald-700/80 dark:text-emerald-300/80">
              La rendición fue registrada con conformidad del responsable.
            </p>
          </div>
          <Badge className="ml-auto bg-emerald-600 text-white hover:bg-emerald-600">
            Validada
          </Badge>
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
