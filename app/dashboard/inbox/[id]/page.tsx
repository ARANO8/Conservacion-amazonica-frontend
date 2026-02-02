'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { SolicitudResponse } from '@/types/solicitud-backend';
import { solicitudesService } from '@/lib/services/solicitudes-service';
import { InboxActions } from '../inbox-actions';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
} from 'lucide-react';
import Link from 'next/link';

export default function InboxDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [solicitud, setSolicitud] = useState<SolicitudResponse | null>(null);
  const [loading, setLoading] = useState(true);

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
        router.push('/dashboard/inbox');
      } finally {
        setLoading(false);
      }
    };

    fetchSolicitud();

    // Listen for updates from the action modals
    window.addEventListener('solicitud-updated', () => {
      router.push('/dashboard/inbox');
    });

    return () => {
      window.removeEventListener('solicitud-updated', () => {
        router.push('/dashboard/inbox');
      });
    };
  }, [id, router]);

  const formatCurrency = (value: number | string) => {
    return new Intl.NumberFormat('es-BO', {
      style: 'currency',
      currency: 'BOB',
    }).format(Number(value));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    return new Intl.DateTimeFormat('es-BO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  };

  const getEstadoBadge = (estado: string) => {
    const variants: Record<string, string> = {
      PENDIENTE:
        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      APROBADO:
        'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
      RECHAZADO: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      OBSERVADO:
        'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
    };

    return (
      <Badge
        variant="outline"
        className={
          variants[estado] ||
          'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400'
        }
      >
        {estado}
      </Badge>
    );
  };

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
        <p className="text-muted-foreground">
          No se encontró la solicitud solicitada.
        </p>
        <Button asChild variant="link" className="mt-4">
          <Link href="/dashboard/inbox">Volver a Notificaciones</Link>
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
            <Link href="/dashboard/inbox">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">
                {solicitud.codigoSolicitud}
              </h1>
              {getEstadoBadge(solicitud.estado)}
            </div>
            <p className="text-muted-foreground">
              Revisa los detalles antes de tomar una decisión.
            </p>
          </div>
        </div>
      </div>

      <Separator />

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Solicitante</CardTitle>
            <User className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">
              {solicitud.usuarioEmisor?.nombreCompleto || 'Sin asignar'}
            </div>
            <p className="text-muted-foreground text-xs">
              {solicitud.usuarioEmisor?.cargo ||
                solicitud.usuarioEmisor?.email ||
                ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Periodo del Viaje
            </CardTitle>
            <Calendar className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">
              {solicitud.fechaInicio
                ? `${formatDate(solicitud.fechaInicio)} - ${formatDate(solicitud.fechaFin || solicitud.fechaInicio)}`
                : formatDate(solicitud.fechaSolicitud)}
            </div>
            <p className="text-muted-foreground text-xs">
              Solicitado: {formatDate(solicitud.fechaSolicitud)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Destino</CardTitle>
            <MapPin className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">
              {solicitud.lugarViaje || '-'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monto Total</CardTitle>
            <DollarSign className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold text-emerald-600">
              {formatCurrency(solicitud.montoTotalNeto)}
            </div>
            <p className="text-muted-foreground text-xs">
              Presupuestado: {formatCurrency(solicitud.montoTotalPresupuestado)}
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
              <p className="text-muted-foreground mb-1 text-sm">
                Descripción adicional:
              </p>
              <p className="text-sm">{solicitud.descripcion}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Fuentes de Financiamiento */}
      {solicitud.presupuestos && solicitud.presupuestos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Fuentes de Financiamiento
            </CardTitle>
            <CardDescription>
              POAs y proyectos que financian esta solicitud
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {solicitud.presupuestos.map((pres) => (
                <div
                  key={pres.id}
                  className="bg-muted/50 flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="font-medium">
                      {pres.poa?.codigo || `Presupuesto #${pres.id}`}
                    </p>
                    {pres.poa?.proyecto?.nombre && (
                      <p className="text-muted-foreground text-sm">
                        {pres.poa.proyecto.nombre}
                      </p>
                    )}
                  </div>
                  <Badge variant="outline">POA</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Planificaciones - Siempre visible */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Planificación de Actividades
          </CardTitle>
          <CardDescription>
            Cronograma de actividades programadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {solicitud.planificaciones && solicitud.planificaciones.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Actividad</TableHead>
                  <TableHead>Periodo</TableHead>
                  <TableHead className="text-center">Días</TableHead>
                  <TableHead className="text-center">Personal Inst.</TableHead>
                  <TableHead className="text-center">Terceros</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {solicitud.planificaciones.map((plan, idx) => (
                  <TableRow key={plan.id || idx}>
                    <TableCell className="font-medium">
                      {plan.actividadProgramada}
                    </TableCell>
                    <TableCell>
                      {formatDate(plan.fechaInicio)} -{' '}
                      {formatDate(plan.fechaFin)}
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
            <p className="text-muted-foreground py-4 text-center">
              Sin actividades planificadas registradas.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Nómina de Terceros - Siempre visible */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Nómina de Terceros
          </CardTitle>
          <CardDescription>
            Participantes externos a la institución
          </CardDescription>
        </CardHeader>
        <CardContent>
          {(solicitud.nominasTerceros &&
            solicitud.nominasTerceros.length > 0) ||
          (solicitud.personasExternas &&
            solicitud.personasExternas.length > 0) ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre Completo</TableHead>
                  <TableHead>CI / Documento</TableHead>
                  <TableHead>Procedencia / Institución</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(
                  solicitud.nominasTerceros ||
                  solicitud.personasExternas ||
                  []
                ).map((persona, idx) => (
                  <TableRow key={persona.id || idx}>
                    <TableCell className="font-medium">
                      {persona.nombreCompleto}
                    </TableCell>
                    <TableCell>{persona.ci || '-'}</TableCell>
                    <TableCell>
                      {persona.procedenciaInstitucion || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground py-4 text-center">
              No se han agregado personas externas a esta solicitud.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Viáticos */}
      {solicitud.viaticos && solicitud.viaticos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Viáticos</CardTitle>
            <CardDescription>Detalle de viáticos solicitados</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Concepto</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-center">Días</TableHead>
                  <TableHead className="text-center">Personas</TableHead>
                  <TableHead className="text-right">Monto Neto</TableHead>
                  <TableHead className="text-right">Presupuestado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {solicitud.viaticos.map((viatico, idx) => (
                  <TableRow key={viatico.id || idx}>
                    <TableCell className="font-medium">
                      {viatico.concepto?.nombre || '-'}
                    </TableCell>
                    <TableCell>{viatico.tipoDestino}</TableCell>
                    <TableCell className="text-center">
                      {viatico.dias}
                    </TableCell>
                    <TableCell className="text-center">
                      {viatico.cantidadPersonas}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(viatico.montoNeto)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(viatico.montoPresupuestado)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Gastos */}
      {solicitud.gastos && solicitud.gastos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Gastos</CardTitle>
            <CardDescription>Detalle de gastos solicitados</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo de Gasto</TableHead>
                  <TableHead>Detalle</TableHead>
                  <TableHead>Documento</TableHead>
                  <TableHead className="text-center">Cantidad</TableHead>
                  <TableHead className="text-right">Monto Neto</TableHead>
                  <TableHead className="text-right">Presupuestado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {solicitud.gastos.map((gasto, idx) => (
                  <TableRow key={gasto.id || idx}>
                    <TableCell className="font-medium">
                      {gasto.tipoGasto?.nombre || '-'}
                    </TableCell>
                    <TableCell>{gasto.detalle}</TableCell>
                    <TableCell>{gasto.tipoDocumento}</TableCell>
                    <TableCell className="text-center">
                      {gasto.cantidad}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(gasto.montoNeto)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(gasto.montoPresupuestado)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Totals Summary */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="text-muted-foreground text-sm">
                Monto Neto a Recibir
              </p>
              <p className="text-2xl font-bold text-emerald-600">
                {formatCurrency(solicitud.montoTotalNeto)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-muted-foreground text-sm">
                Impacto Presupuestario Total
              </p>
              <p className="text-2xl font-bold">
                {formatCurrency(solicitud.montoTotalPresupuestado)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Action Buttons */}
      <div className="bg-background sticky bottom-0 border-t py-4">
        <div className="mx-auto max-w-2xl">
          <InboxActions request={solicitud} mode="buttons" />
        </div>
      </div>
    </div>
  );
}
