'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { SolicitudResponse } from '@/types/solicitud-backend';
import { solicitudesService } from '@/lib/services/solicitudes-service';
import { InboxActions } from '@/app/app/aprobaciones/inbox-actions';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EstadoBadge } from '@/components/shared/estado-badge';
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
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  User,
  FileText,
  DollarSign,
  ClipboardList,
  Wallet,
  Users,
  Landmark,
  Banknote,
  ExternalLink,
  Paperclip,
} from 'lucide-react';
import Link from 'next/link';
import { PresupuestoBreakdown } from '@/components/solicitudes/presupuesto-breakdown';
import { mapResponseToBreakdown } from '@/lib/mappers/breakdown-mapper';
import { CuentaBancariaCard } from '@/components/solicitudes/cuenta-bancaria-card';
import { formatMoney, formatDateShort } from '@/lib/utils';

export default function SolicitudDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [solicitud, setSolicitud] = useState<SolicitudResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // Determine source and permissions
  const source = searchParams.get('source') || 'solicitudes';
  const canApprove = source === 'aprobaciones';
  const backUrl =
    source === 'aprobaciones' ? '/app/aprobaciones' : '/app/solicitudes';

  const breakdownPartidas = React.useMemo(() => {
    return solicitud ? mapResponseToBreakdown(solicitud) : [];
  }, [solicitud]);

  const id = params.id as string;

  useEffect(() => {
    const fetchSolicitud = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const data = await solicitudesService.getSolicitudById(id);
        setSolicitud(data);
      } catch {
        toast.error('No se pudo cargar la solicitud.');
        router.push(backUrl);
      } finally {
        setLoading(false);
      }
    };

    fetchSolicitud();

    const handleUpdate = () => {
      router.push(backUrl);
    };

    window.addEventListener('solicitud-updated', handleUpdate);

    return () => {
      window.removeEventListener('solicitud-updated', handleUpdate);
    };
  }, [id, router, backUrl]);

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-[200px] w-full" />
        <Skeleton className="h-[300px] w-full" />
        <Skeleton className="h-[100px] w-full" />
      </div>
    );
  }

  if (!solicitud) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <p className="text-foreground">
          No se encontró la solicitud solicitada.
        </p>
        <Button asChild variant="link" className="mt-4">
          <Link href={backUrl}>Volver</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={backUrl}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">
                {solicitud.codigoSolicitud}
              </h1>
              <EstadoBadge estado={solicitud.estado} />
            </div>
            <p className="text-amzdesk-helper">
              {canApprove
                ? 'Revisa los detalles antes de tomar una decisión.'
                : 'Detalles de tu solicitud.'}
            </p>
          </div>
        </div>
      </div>

      <Separator />

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-amzdesk-label">Solicitante</CardTitle>
            <User className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-amzdesk-monto">
              {solicitud.usuarioEmisor?.nombreCompleto || 'Sin asignar'}
            </div>
            <p className="text-amzdesk-helper">
              {solicitud.usuarioEmisor?.cargo ||
                solicitud.usuarioEmisor?.email ||
                ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-amzdesk-label">
              Periodo del Viaje
            </CardTitle>
            <Calendar className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-amzdesk-monto">
              {solicitud.fechaInicio
                ? `${formatDateShort(solicitud.fechaInicio)} - ${formatDateShort(solicitud.fechaFin || solicitud.fechaInicio)}`
                : formatDateShort(solicitud.fechaSolicitud)}
            </div>
            <p className="text-amzdesk-helper">
              Solicitado: {formatDateShort(solicitud.fechaSolicitud)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-amzdesk-label">Destino</CardTitle>
            <MapPin className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-amzdesk-monto">
              {solicitud.lugarViaje || '-'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-amzdesk-label">Monto Total</CardTitle>
            <DollarSign className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-amzdesk-monto text-emerald-600">
              {formatMoney(solicitud.montoTotalNeto)}
            </div>
            <p className="text-amzdesk-helper">
              Presupuestado: {formatMoney(solicitud.montoTotalPresupuestado)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Motivo y Descripción */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Motivo del Viaje
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="font-medium">{solicitud.motivoViaje}</p>
          {solicitud.descripcion && (
            <div>
              <p className="text-amzdesk-helper mb-1">Descripción adicional:</p>
              <p className="text-amzdesk-helper">{solicitud.descripcion}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Documentos de Respaldo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Paperclip className="h-5 w-5" />
            Documentos de Respaldo
          </CardTitle>
          <CardDescription className="text-amzdesk-helper">
            Enlaces adjuntos por el solicitante para respaldo de la solicitud.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {solicitud.urlCuadroComparativo ? (
            <Button
              asChild
              variant="outline"
              size="sm"
              className="w-full sm:w-fit"
            >
              <a
                href={solicitud.urlCuadroComparativo}
                target="_blank"
                rel="noreferrer"
              >
                <FileText className="mr-2 h-4 w-4" />
                Ver Cuadro Comparativo
                <ExternalLink className="ml-2 h-3.5 w-3.5" />
              </a>
            </Button>
          ) : (
            <p className="text-amzdesk-helper">
              Sin cuadro comparativo adjunto.
            </p>
          )}

          {solicitud.urlCotizaciones && solicitud.urlCotizaciones.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {solicitud.urlCotizaciones.map((url, idx) => (
                <Button
                  key={`${idx}-${url}`}
                  asChild
                  variant="outline"
                  size="sm"
                >
                  <a href={url} target="_blank" rel="noreferrer">
                    <Paperclip className="mr-2 h-4 w-4" />
                    Ver Cotización {idx + 1}
                    <ExternalLink className="ml-2 h-3.5 w-3.5" />
                  </a>
                </Button>
              ))}
            </div>
          ) : (
            <p className="text-amzdesk-helper">Sin cotizaciones adjuntas.</p>
          )}
        </CardContent>
      </Card>

      {/* Planificaciones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Planificación
          </CardTitle>
          <CardDescription className="text-amzdesk-helper">
            Cronograma de actividades programadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {solicitud.planificaciones && solicitud.planificaciones.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-amzdesk-table-header">
                    Actividad
                  </TableHead>
                  <TableHead className="text-amzdesk-table-header">
                    Periodo
                  </TableHead>
                  <TableHead className="text-amzdesk-table-header text-center">
                    Días
                  </TableHead>
                  <TableHead className="text-amzdesk-table-header text-center">
                    Personal Inst.
                  </TableHead>
                  <TableHead className="text-amzdesk-table-header text-center">
                    Terceros
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {solicitud.planificaciones.map((plan, idx) => (
                  <TableRow key={plan.id || idx}>
                    <TableCell className="font-medium">
                      {plan.actividadProgramada}
                    </TableCell>
                    <TableCell>
                      {formatDateShort(plan.fechaInicio)} -{' '}
                      {formatDateShort(plan.fechaFin)}
                    </TableCell>
                    <TableCell className="text-center">
                      {plan.diasCalculados ?? '-'}
                    </TableCell>
                    <TableCell className="text-center">
                      {plan.cantidadPersonasInstitucional}
                    </TableCell>
                    <TableCell className="text-center">
                      {plan.cantidadPersonasTerceros}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-amzdesk-helper py-4 text-center">
              Sin actividades planificadas registradas.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Desglose Financiero por Partida */}
      {solicitud.presupuestos && solicitud.presupuestos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Desglose Financiero por Partida
            </CardTitle>
            <CardDescription className="text-amzdesk-helper">
              Resumen detallado de viáticos y comprobantes agrupados por su
              respectiva partida presupuestaria.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/50 flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-amzdesk-label">
                  {'Código POA: ' + solicitud.presupuestos[0]?.poa?.codigoPoa ||
                    'Sin código POA'}
                </p>
                <p className="text-amzdesk-label">
                  {'Proyecto: ' +
                    solicitud.presupuestos[0]?.poa?.estructura?.proyecto
                      ?.nombre}
                </p>
              </div>
              <Badge variant="outline">POA</Badge>
            </div>
          </CardContent>
          <CardContent>
            <PresupuestoBreakdown partidas={breakdownPartidas} />
          </CardContent>
        </Card>
      )}

      {/* Cuenta Bancaria */}
      {solicitud.presupuestos && solicitud.presupuestos.length > 0 && (
        <Card className="mt-6 rounded-lg border p-4">
          <CardHeader className="mb-4 p-0">
            <CardTitle className="flex items-center gap-2 font-semibold">
              <Landmark className="h-5 w-5" />
              Información Bancaria del Proyecto
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <CuentaBancariaCard
              cuentaBancaria={
                solicitud.presupuestos[0]?.poa?.estructura?.proyecto
                  ?.cuentaBancaria
              }
            />
          </CardContent>
        </Card>
      )}

      {/* Sección de Participantes Externos */}
      <Card className="mt-6 rounded-lg border p-4">
        <CardHeader className="mb-4 p-0">
          <CardTitle className="flex items-center gap-2 font-semibold">
            <Users className="h-5 w-5" />
            Nómina Externos
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {solicitud.personasExternas &&
          solicitud.personasExternas.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-amzdesk-table-header">
                    Nombre Completo
                  </TableHead>
                  <TableHead className="text-amzdesk-table-header">
                    Procedencia / Institución
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {solicitud.personasExternas.map((persona) => (
                  <TableRow key={persona.id}>
                    <TableCell>{persona.nombreCompleto}</TableCell>
                    <TableCell>{persona.procedenciaInstitucion}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-amzdesk-helper py-2 italic">
              No hay participantes externos registrados en esta solicitud.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Datos del Desembolso - solo visible cuando estado es DESEMBOLSADO */}
      {solicitud.estado === 'DESEMBOLSADO' && (
        <Card className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
              <Banknote className="h-5 w-5" />
              Datos del Desembolso
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-col gap-1">
              <p className="text-amzdesk-helper">Código de desembolso</p>
              <p className="text-amzdesk-monto">
                {solicitud.codigoDesembolso || '-'}
              </p>
            </div>
            {solicitud.urlComprobante && (
              <div className="flex flex-col gap-1">
                <p className="text-amzdesk-helper">Comprobante</p>
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="w-fit border-blue-300 text-blue-700 hover:bg-blue-100 dark:border-blue-700 dark:text-blue-400 dark:hover:bg-blue-900"
                >
                  <a
                    href={solicitud.urlComprobante}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Ver Comprobante Adjunto
                  </a>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Totals Summary */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="text-amzdesk-helper">Total liquido</p>
              <p className="text-amzdesk-monto text-2xl text-emerald-600">
                {formatMoney(solicitud.montoTotalNeto)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-amzdesk-helper">
                Total Presupuestado (Incl. Impuestos)
              </p>
              <p className="text-amzdesk-monto text-2xl">
                {formatMoney(solicitud.montoTotalPresupuestado)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Action Buttons - Solo visible desde aprobaciones */}
      {canApprove && (
        <div className="bg-background sticky bottom-0 border-t py-4">
          <div className="mx-auto max-w-2xl">
            <InboxActions request={solicitud} mode="buttons" />
          </div>
        </div>
      )}
    </div>
  );
}
