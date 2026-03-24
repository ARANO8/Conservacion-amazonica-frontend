'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { History, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AuditTimeline,
  type AuditTimelineEvent,
} from '@/components/shared/audit-timeline';
import { solicitudesService } from '@/lib/services/solicitudes-service';
import { rendicionesService } from '@/lib/services/rendiciones-service';
import { useAuthStore } from '@/store/auth-store';
import type {
  SolicitudResponse,
  HistorialAprobacionSolicitudResponse,
} from '@/types/solicitud-backend';
import type {
  RendicionResponse,
  HistorialAprobacionResponse,
} from '@/types/rendicion-backend';

type ModuloAuditoria = 'SOLICITUDES' | 'RENDICIONES';

function normalizeSolicitudHistorial(
  historial: HistorialAprobacionSolicitudResponse[] | undefined
): AuditTimelineEvent[] {
  return (historial ?? []).map((evento) => ({
    id: evento.id,
    accion: evento.accion,
    comentario: evento.comentario,
    fecha: evento.fecha,
    usuarioId: evento.usuarioId,
    derivadoAId: evento.derivadoAId,
    solicitudId: evento.solicitudId,
    rendicionId: evento.rendicionId,
    usuario: evento.usuario,
    derivadoA: evento.derivadoA,
  }));
}

function normalizeRendicionHistorial(
  historial: HistorialAprobacionResponse[] | undefined
): AuditTimelineEvent[] {
  return (historial ?? []).map((evento) => ({
    id: evento.id,
    accion: evento.accion,
    comentario: evento.comentario,
    fecha: evento.fecha,
    usuarioId: evento.usuarioId,
    derivadoAId: evento.derivadoAId,
    solicitudId: evento.solicitudId,
    rendicionId: evento.rendicionId,
    usuario: evento.usuario,
    derivadoA: evento.derivadoA,
  }));
}

export default function AuditoriaPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [modulo, setModulo] = useState<ModuloAuditoria>('SOLICITUDES');
  const [loadingSolicitudes, setLoadingSolicitudes] = useState(false);
  const [loadingRendiciones, setLoadingRendiciones] = useState(false);
  const [loadingDetalle, setLoadingDetalle] = useState(false);

  const [searchSolicitudes, setSearchSolicitudes] = useState('');
  const [searchRendiciones, setSearchRendiciones] = useState('');

  const [solicitudes, setSolicitudes] = useState<SolicitudResponse[]>([]);
  const [rendiciones, setRendiciones] = useState<RendicionResponse[]>([]);

  const [selectedSolicitudId, setSelectedSolicitudId] = useState<number | null>(
    null
  );
  const [selectedRendicionId, setSelectedRendicionId] = useState<number | null>(
    null
  );

  const [historial, setHistorial] = useState<AuditTimelineEvent[]>([]);

  const canAccessAuditCenter =
    user?.rol === 'ADMIN' ||
    user?.rol === 'EJECUTIVO' ||
    user?.rol === 'CONTADOR' ||
    user?.rol === 'TESORERO';

  useEffect(() => {
    if (user && !canAccessAuditCenter) {
      router.replace('/app/inicio');
    }
  }, [canAccessAuditCenter, router, user]);

  useEffect(() => {
    if (!canAccessAuditCenter) {
      return;
    }

    const fetchSolicitudes = async () => {
      try {
        setLoadingSolicitudes(true);
        const data: SolicitudResponse[] | undefined =
          await solicitudesService.getSolicitudes();
        setSolicitudes(data ?? []);
      } catch {
        toast.error('No se pudieron cargar las solicitudes para auditoria.');
      } finally {
        setLoadingSolicitudes(false);
      }
    };

    void fetchSolicitudes();
  }, [canAccessAuditCenter]);

  useEffect(() => {
    if (!canAccessAuditCenter) {
      return;
    }

    const fetchRendiciones = async () => {
      try {
        setLoadingRendiciones(true);
        const data = await rendicionesService.getRendiciones();
        setRendiciones(data ?? []);
      } catch {
        toast.error('No se pudieron cargar las rendiciones para auditoria.');
      } finally {
        setLoadingRendiciones(false);
      }
    };

    void fetchRendiciones();
  }, [canAccessAuditCenter]);

  useEffect(() => {
    setHistorial([]);
    if (modulo === 'SOLICITUDES') {
      setSelectedRendicionId(null);
    } else {
      setSelectedSolicitudId(null);
    }
  }, [modulo]);

  const solicitudesFiltradas = useMemo(() => {
    const query = searchSolicitudes.trim().toLowerCase();
    if (!query) return solicitudes;

    return solicitudes.filter((solicitud) => {
      const codigo = (solicitud.codigoSolicitud ?? '').toLowerCase();
      const emisor = (
        solicitud.usuarioEmisor?.nombreCompleto ?? ''
      ).toLowerCase();
      const estado = (solicitud.estado ?? '').toLowerCase();
      return (
        codigo.includes(query) ||
        emisor.includes(query) ||
        estado.includes(query)
      );
    });
  }, [searchSolicitudes, solicitudes]);

  const rendicionesFiltradas = useMemo(() => {
    const query = searchRendiciones.trim().toLowerCase();
    if (!query) return rendiciones;

    return rendiciones.filter((rendicion) => {
      const codigoSolicitud = (
        rendicion.solicitud?.codigoSolicitud ?? `R-${rendicion.id}`
      ).toLowerCase();
      const estado = (rendicion.estado ?? '').toLowerCase();
      const aprobador = (
        rendicion.aprobadorActual?.nombreCompleto ?? ''
      ).toLowerCase();

      return (
        codigoSolicitud.includes(query) ||
        estado.includes(query) ||
        aprobador.includes(query)
      );
    });
  }, [searchRendiciones, rendiciones]);

  const handleSelectSolicitud = async (solicitudId: number) => {
    try {
      setLoadingDetalle(true);
      setSelectedSolicitudId(solicitudId);
      const detalle: SolicitudResponse =
        await solicitudesService.getSolicitudById(solicitudId);
      setHistorial(normalizeSolicitudHistorial(detalle.historialAprobaciones));
    } catch {
      toast.error(
        'No se pudo cargar el historial de la solicitud seleccionada.'
      );
    } finally {
      setLoadingDetalle(false);
    }
  };

  const handleSelectRendicion = async (rendicionId: number) => {
    try {
      setLoadingDetalle(true);
      setSelectedRendicionId(rendicionId);
      const detalle = await rendicionesService.getRendicionById(rendicionId);
      setHistorial(normalizeRendicionHistorial(detalle.historialAprobaciones));
    } catch {
      toast.error(
        'No se pudo cargar el historial de la rendicion seleccionada.'
      );
    } finally {
      setLoadingDetalle(false);
    }
  };

  if (!canAccessAuditCenter) {
    return null;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <History className="text-primary h-7 w-7" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Centro de Auditoria
          </h1>
          <p className="text-muted-foreground">
            Consulta trazabilidad completa de Solicitudes y Rendiciones con
            fecha y hora exactas.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Modulo a Auditar</CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={modulo}
            onValueChange={(value) => setModulo(value as ModuloAuditoria)}
          >
            <SelectTrigger className="w-full max-w-xs">
              <SelectValue placeholder="Selecciona un modulo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="SOLICITUDES">Solicitudes</SelectItem>
              <SelectItem value="RENDICIONES">Rendiciones</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {modulo === 'SOLICITUDES' ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Seleccionar Solicitud</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="text-muted-foreground pointer-events-none absolute top-2.5 left-3 h-4 w-4" />
              <Input
                value={searchSolicitudes}
                onChange={(e) => setSearchSolicitudes(e.target.value)}
                placeholder="Buscar por codigo, emisor o estado..."
                className="pl-9"
              />
            </div>

            {loadingSolicitudes ? (
              <div className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <div className="max-h-80 overflow-y-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Codigo</TableHead>
                      <TableHead>Emisor</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Accion</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {solicitudesFiltradas.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center">
                          Sin resultados
                        </TableCell>
                      </TableRow>
                    ) : (
                      solicitudesFiltradas.map((solicitud) => (
                        <TableRow key={solicitud.id}>
                          <TableCell>
                            {solicitud.codigoSolicitud || `SOL-${solicitud.id}`}
                          </TableCell>
                          <TableCell>
                            {solicitud.usuarioEmisor?.nombreCompleto ||
                              'Sin emisor'}
                          </TableCell>
                          <TableCell>{solicitud.estado}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant={
                                selectedSolicitudId === solicitud.id
                                  ? 'default'
                                  : 'outline'
                              }
                              onClick={() =>
                                void handleSelectSolicitud(solicitud.id)
                              }
                            >
                              Ver historial
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Seleccionar Rendicion</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="text-muted-foreground pointer-events-none absolute top-2.5 left-3 h-4 w-4" />
              <Input
                value={searchRendiciones}
                onChange={(e) => setSearchRendiciones(e.target.value)}
                placeholder="Buscar por codigo de solicitud, estado o aprobador..."
                className="pl-9"
              />
            </div>

            {loadingRendiciones ? (
              <div className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <div className="max-h-80 overflow-y-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Codigo Solicitud</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Accion</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rendicionesFiltradas.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center">
                          Sin resultados
                        </TableCell>
                      </TableRow>
                    ) : (
                      rendicionesFiltradas.map((rendicion) => (
                        <TableRow key={rendicion.id}>
                          <TableCell>#{rendicion.id}</TableCell>
                          <TableCell>
                            {rendicion.solicitud?.codigoSolicitud || '-'}
                          </TableCell>
                          <TableCell>{rendicion.estado}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant={
                                selectedRendicionId === rendicion.id
                                  ? 'default'
                                  : 'outline'
                              }
                              onClick={() =>
                                void handleSelectRendicion(rendicion.id)
                              }
                            >
                              Ver historial
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Linea de Tiempo de Aprobaciones
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingDetalle ? (
            <div className="space-y-3">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : (
            <AuditTimeline historial={historial} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
