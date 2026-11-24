'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import axios from 'axios';
import { ArrowLeft, FileDown, ShoppingCart, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

import { solicitudesService } from '@/lib/services/solicitudes-service';
import { formatDateShort } from '@/lib/utils';
import { downloadBlob } from '@/lib/utils/download-blob';
import type { SolicitudResponse } from '@/types/solicitud-backend';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CronogramaPagos } from '@/components/solicitudes-compra/cronograma-pagos';
import { ObservacionAlert } from '@/components/shared/observacion-alert';
import { DocumentoViewer } from '@/components/shared/documento-viewer';

const ESTADO_BADGE: Record<string, { label: string; className: string }> = {
  PENDIENTE: {
    label: 'Pendiente',
    className:
      'border-yellow-300 bg-yellow-50 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-300',
  },
  OBSERVADO: {
    label: 'Observado',
    className:
      'border-orange-300 bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300',
  },
  DESEMBOLSADO: {
    label: 'Desembolsado',
    className:
      'border-green-300 bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300',
  },
  EN_EJECUCION: {
    label: 'En ejecución',
    className:
      'border-indigo-300 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300',
  },
  EJECUTADO: {
    label: 'Ejecutado',
    className:
      'border-blue-300 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
  },
};

function DatoLinea({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-muted-foreground text-xs uppercase">{label}</p>
      <p className="text-sm">{value?.trim() ? value : '-'}</p>
    </div>
  );
}

export default function DetalleSolicitudCompraPage() {
  const params = useParams<{ id: string }>();
  const [solicitud, setSolicitud] = useState<SolicitudResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(
    async (conSpinner = true) => {
      try {
        if (conSpinner) setLoading(true);
        const data = await solicitudesService.getSolicitudById(params.id);
        setSolicitud(data);
      } catch {
        toast.error('No se pudo cargar la solicitud.');
      } finally {
        if (conSpinner) setLoading(false);
      }
    },
    [params.id]
  );

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  // Un contrato de consultoría es el gasto de compra que trae cronograma
  const contrato = (solicitud?.gastosCompra ?? []).find(
    (gc) => (gc.pagos ?? []).length > 0
  );

  const handleDownloadPdf = async () => {
    if (!solicitud) return;
    await downloadBlob(
      () => solicitudesService.downloadPdf(solicitud.id),
      solicitud.codigoSolicitud,
      {
        notFoundMessage: 'No se encontró el PDF.',
      }
    );
  };

  return (
    <div className="flex flex-col gap-0">
      {/* Header bar */}
      <div className="flex shrink-0 items-center gap-3 border-b px-6 py-4">
        <Button variant="ghost" size="icon" asChild className="shrink-0">
          <Link href="/app/solicitudes-compra">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Volver</span>
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <ShoppingCart className="text-primary h-5 w-5 shrink-0" />
          <div>
            <h1 className="text-lg leading-tight font-bold">
              Detalle de Solicitud de Fondos
            </h1>
            <p className="text-muted-foreground text-xs">
              Compras y Servicios — ANEXO 3
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4 p-6">
          <Skeleton className="h-10 w-full max-w-md" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      ) : !solicitud ? (
        <div className="text-muted-foreground p-6">
          No se encontró la solicitud solicitada.
        </div>
      ) : (
        <div className="mx-auto max-w-5xl space-y-6 p-6">
          {/* Code + state + actions */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold">
                  {solicitud.codigoSolicitud}
                </h2>
                <Badge
                  variant="outline"
                  className={ESTADO_BADGE[solicitud.estado]?.className ?? ''}
                >
                  {ESTADO_BADGE[solicitud.estado]?.label ?? solicitud.estado}
                </Badge>
              </div>
              <p className="text-muted-foreground text-sm">
                {formatDateShort(solicitud.fechaSolicitud)}
              </p>
            </div>
            <Button variant="outline" onClick={() => void handleDownloadPdf()}>
              <FileDown className="mr-2 h-4 w-4" />
              Descargar PDF
            </Button>
          </div>

          <ObservacionAlert observacion={solicitud.observacion} />

          {/* La solicitud tal como sale en el PDF (ANEXO 3) */}
          <DocumentoViewer
            titulo="Anexo 3 — Solicitud de Fondos en Avance"
            ruta={`/solicitudes/${solicitud.id}/documento`}
            recargarCon={solicitud.estado}
          />

          {/* Cronograma de pagos (contratos de consultoría) */}
          {contrato && (
            <CronogramaPagos
              solicitudId={solicitud.id}
              pagos={contrato.pagos ?? []}
              onActualizado={() => fetchData(false)}
            />
          )}

          {/* Texto libre del emisor — no confundir con el motivo de una devolución */}
          {solicitud.descripcion && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Descripción adicional
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{solicitud.descripcion}</p>
              </CardContent>
            </Card>
          )}

          {/* Datos del cheque (visible cuando está DESEMBOLSADO) */}
          {solicitud.estado === 'DESEMBOLSADO' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Datos del Desembolso
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <DatoLinea
                  label="Cheque #"
                  value={solicitud.codigoDesembolso}
                />
                <DatoLinea label="Banco" value={solicitud.banco} />
                <DatoLinea
                  label="Fecha de emisión"
                  value={
                    solicitud.fechaDesembolso
                      ? formatDateShort(solicitud.fechaDesembolso)
                      : null
                  }
                />
                {solicitud.urlComprobante && (
                  <div className="md:col-span-3">
                    <p className="text-muted-foreground text-xs uppercase">
                      Comprobante
                    </p>
                    <a
                      href={solicitud.urlComprobante}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary flex items-center gap-1 text-sm hover:underline"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Ver comprobante
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Separator />

          {/* Historial */}
          {(solicitud.historialAprobaciones ?? []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Historial de aprobaciones
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="border-muted relative ml-3 space-y-4 border-l">
                  {solicitud.historialAprobaciones!.map((h) => (
                    <li key={h.id} className="ml-4">
                      <div className="bg-background absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border" />
                      <p className="text-sm font-medium">{h.accion}</p>
                      <p className="text-muted-foreground text-xs">
                        {h.usuario?.nombreCompleto} · {formatDateShort(h.fecha)}
                      </p>
                      {h.comentario && (
                        <p className="text-muted-foreground text-xs italic">
                          {h.comentario}
                        </p>
                      )}
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
