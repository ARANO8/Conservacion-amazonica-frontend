'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import axios from 'axios';
import {
  Pencil,
  FileDown,
  Send,
  Check,
  X,
  AlertTriangle,
  ShoppingCart,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn, formatDate, formatMoney } from '@/lib/utils';
import { cuadrosComparativosService } from '@/lib/services/cuadros-comparativos-service';
import { CuadroAnalisis } from '@/components/cuadros-comparativos/cuadro-analisis';
import type { AnalisisInput } from '@/lib/cuadro-analisis';
import { useAuthStore } from '@/store/auth-store';
import type { CuadroComparativoResponse } from '@/types/cuadro-comparativo-backend';

interface Props {
  cuadroId: string;
}

const ESTADO_BADGE: Record<string, string> = {
  BORRADOR: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200',
  EN_VALIDACION:
    'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300',
  EN_REVISION:
    'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300',
  OBSERVADO:
    'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
  APROBADO:
    'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
};

export function CuadroDetalleClientWrapper({ cuadroId }: Props) {
  const { user } = useAuthStore();
  const [cuadro, setCuadro] = useState<CuadroComparativoResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [observeOpen, setObserveOpen] = useState(false);
  const [motivo, setMotivo] = useState('');

  const fetchCuadro = useCallback(async () => {
    try {
      setLoading(true);
      const data = await cuadrosComparativosService.getCuadroById(cuadroId);
      setCuadro(data);
    } catch {
      toast.error('No se pudo cargar el cuadro comparativo.');
    } finally {
      setLoading(false);
    }
  }, [cuadroId]);

  useEffect(() => {
    void fetchCuadro();
  }, [fetchCuadro]);

  const handleDownloadPdf = async () => {
    if (!cuadro) return;
    try {
      const blob = await cuadrosComparativosService.downloadPdf(cuadro.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${cuadro.codigoCuadro}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('PDF descargado correctamente.');
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        toast.info('No se encontró el cuadro solicitado.');
        return;
      }
      toast.error('No se pudo descargar el PDF.');
    }
  };

  const runAction = async (fn: () => Promise<unknown>, successMsg: string) => {
    try {
      setActionLoading(true);
      await fn();
      toast.success(successMsg);
      await fetchCuadro();
    } catch (error: unknown) {
      const mensaje =
        axios.isAxiosError(error) && error.response?.data?.message
          ? String(error.response.data.message)
          : 'No se pudo completar la acción.';
      toast.error(mensaje);
    } finally {
      setActionLoading(false);
    }
  };

  const analisisInput = useMemo<AnalisisInput>(() => {
    if (!cuadro) return { columnas: [], items: [] };
    const cols = [...cuadro.cotizaciones].sort((a, b) => a.orden - b.orden);
    return {
      columnas: cols.map((c) => ({ proveedorNombre: c.proveedorNombre })),
      items: [...cuadro.items]
        .sort((a, b) => a.orden - b.orden)
        .map((item) => {
          const byCol = new Map(
            item.precios.map((p) => [p.cuadroCotizacionId, p])
          );
          return {
            descripcion: item.descripcion,
            cantidad: Number(item.cantidad) || 0,
            precios: cols.map((c) => {
              const p = byCol.get(c.id);
              return {
                precioUnitario: Number(p?.precioUnitario ?? 0),
                noMenciona: p?.noMenciona ?? true,
              };
            }),
          };
        }),
    };
  }, [cuadro]);

  const recomendadaIndex = useMemo(() => {
    if (!cuadro || cuadro.cotizacionRecomendadaId == null) return null;
    const cols = [...cuadro.cotizaciones].sort((a, b) => a.orden - b.orden);
    const idx = cols.findIndex((c) => c.id === cuadro.cotizacionRecomendadaId);
    return idx >= 0 ? idx : null;
  }, [cuadro]);

  if (loading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-10 w-full max-w-md" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (!cuadro) {
    return (
      <div className="text-muted-foreground p-6">
        No se encontró el cuadro comparativo solicitado.
      </div>
    );
  }

  const columnas = [...cuadro.cotizaciones].sort((a, b) => a.orden - b.orden);
  const items = [...cuadro.items].sort((a, b) => a.orden - b.orden);

  const rol = user?.rol;
  const esEmisor = String(cuadro.usuarioEmisorId) === String(user?.id ?? '');
  const editable =
    esEmisor && (cuadro.estado === 'BORRADOR' || cuadro.estado === 'OBSERVADO');
  const puedeEnviar = editable;
  const puedeValidar =
    cuadro.estado === 'EN_VALIDACION' &&
    (rol === 'VALIDADOR_COMPRAS' || rol === 'ADMIN');
  const puedeAprobar =
    cuadro.estado === 'EN_REVISION' && (rol === 'TESORERO' || rol === 'ADMIN');
  const puedeObservar = puedeValidar || puedeAprobar;

  const confirmObservar = async () => {
    if (motivo.trim().length === 0) {
      toast.error('Ingresa el motivo de la observación.');
      return;
    }
    await runAction(
      () => cuadrosComparativosService.observar(cuadro.id, motivo.trim()),
      'Cuadro observado y devuelto al emisor.'
    );
    setObserveOpen(false);
    setMotivo('');
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">{cuadro.codigoCuadro}</h2>
          <p className="text-muted-foreground flex items-center gap-2 text-sm">
            {cuadro.lugarFecha || 'Sin lugar y fecha'} ·
            <Badge
              variant="outline"
              className={cn(ESTADO_BADGE[cuadro.estado])}
            >
              {cuadro.estado}
            </Badge>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {editable && (
            <Button variant="outline" asChild>
              <Link href={`/app/cuadros-comparativos/${cuadro.id}/editar`}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </Link>
            </Button>
          )}
          {puedeEnviar && (
            <Button
              disabled={actionLoading}
              onClick={() =>
                void runAction(
                  () => cuadrosComparativosService.enviarValidacion(cuadro.id),
                  'Cuadro enviado a validación.'
                )
              }
            >
              <Send className="mr-2 h-4 w-4" />
              Enviar a validación
            </Button>
          )}
          {puedeValidar && (
            <Button
              disabled={actionLoading}
              onClick={() =>
                void runAction(
                  () => cuadrosComparativosService.validar(cuadro.id),
                  'Cuadro validado. Enviado a revisión.'
                )
              }
            >
              <Check className="mr-2 h-4 w-4" />
              Validar
            </Button>
          )}
          {puedeAprobar && (
            <Button
              disabled={actionLoading}
              onClick={() =>
                void runAction(
                  () => cuadrosComparativosService.aprobar(cuadro.id),
                  'Cuadro aprobado.'
                )
              }
            >
              <Check className="mr-2 h-4 w-4" />
              Aprobar
            </Button>
          )}
          {puedeObservar && (
            <Button
              variant="destructive"
              disabled={actionLoading}
              onClick={() => setObserveOpen(true)}
            >
              <X className="mr-2 h-4 w-4" />
              Observar
            </Button>
          )}
          {cuadro.estado === 'APROBADO' && (
            <Button asChild>
              <Link href={`/app/ordenes-compra/nueva?cuadroId=${cuadro.id}`}>
                <ShoppingCart className="mr-2 h-4 w-4" />
                Crear Orden de Compra
              </Link>
            </Button>
          )}
          <Button variant="outline" onClick={() => void handleDownloadPdf()}>
            <FileDown className="mr-2 h-4 w-4" />
            Descargar PDF
          </Button>
        </div>
      </div>

      {cuadro.estado === 'OBSERVADO' && cuadro.motivoObservacion && (
        <div className="flex items-start gap-3 rounded-md border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-semibold">Cuadro observado</p>
            <p>{cuadro.motivoObservacion}</p>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Comparativo de cotizaciones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]">#</TableHead>
                  <TableHead className="min-w-[200px]">Descripción</TableHead>
                  <TableHead>Cant.</TableHead>
                  <TableHead>Unid.</TableHead>
                  {columnas.map((c) => (
                    <TableHead
                      key={c.id}
                      className={cn(
                        'text-center',
                        c.id === cuadro.cotizacionRecomendadaId &&
                          'bg-emerald-50 dark:bg-emerald-950/50'
                      )}
                    >
                      {c.proveedorNombre}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => {
                  const precioByCol = new Map(
                    item.precios.map((p) => [p.cuadroCotizacionId, p])
                  );
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="text-muted-foreground text-xs">
                        {item.orden}
                      </TableCell>
                      <TableCell>{item.descripcion}</TableCell>
                      <TableCell>{Number(item.cantidad)}</TableCell>
                      <TableCell>{item.unidad ?? '-'}</TableCell>
                      {columnas.map((c) => {
                        const p = precioByCol.get(c.id);
                        const noMenciona = p?.noMenciona ?? true;
                        const ganadora = item.cotizacionGanadoraId === c.id;
                        return (
                          <TableCell
                            key={c.id}
                            className={cn(
                              'text-right',
                              ganadora &&
                                'bg-emerald-50 font-medium dark:bg-emerald-950/50'
                            )}
                          >
                            {noMenciona ? (
                              <span className="rounded bg-amber-100 px-1 text-xs text-amber-800 italic dark:bg-amber-950/60 dark:text-amber-300">
                                No menciona
                              </span>
                            ) : (
                              <>
                                <div>{formatMoney(p?.precioUnitario ?? 0)}</div>
                                <div className="text-muted-foreground text-xs">
                                  {formatMoney(p?.total ?? 0)}
                                </div>
                              </>
                            )}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  );
                })}
                <TableRow className="bg-muted/50 font-semibold">
                  <TableCell colSpan={4} className="text-right">
                    TOTALES
                  </TableCell>
                  {columnas.map((c) => (
                    <TableCell
                      key={c.id}
                      className={cn(
                        'text-right',
                        c.id === cuadro.cotizacionRecomendadaId &&
                          'bg-emerald-100 dark:bg-emerald-900/50'
                      )}
                    >
                      {formatMoney(c.total)}
                    </TableCell>
                  ))}
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <CuadroAnalisis
        input={analisisInput}
        recomendadaIndex={recomendadaIndex}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Observaciones</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm whitespace-pre-line">
            {cuadro.observaciones?.trim() || 'Sin observaciones.'}
          </p>
        </CardContent>
      </Card>

      {cuadro.historialAprobaciones &&
        cuadro.historialAprobaciones.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Historial</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {cuadro.historialAprobaciones.map((h) => (
                  <li
                    key={h.id}
                    className="flex items-start justify-between gap-4 border-b pb-2 text-sm last:border-b-0"
                  >
                    <div>
                      <span className="font-medium">{h.accion}</span>
                      {h.comentario && (
                        <span className="text-muted-foreground">
                          {' '}
                          — {h.comentario}
                        </span>
                      )}
                      <div className="text-muted-foreground text-xs">
                        {h.usuario?.nombreCompleto ?? 'Sistema'}
                      </div>
                    </div>
                    <span className="text-muted-foreground text-xs">
                      {formatDate(h.fecha)}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

      <Dialog open={observeOpen} onOpenChange={setObserveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Observar cuadro comparativo</DialogTitle>
            <DialogDescription>
              El cuadro se devolverá al emisor para su corrección. Indica el
              motivo de la observación.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            rows={4}
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Motivo de la observación"
          />
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={() => setObserveOpen(false)}
              disabled={actionLoading}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => void confirmObservar()}
              disabled={actionLoading}
            >
              Observar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
