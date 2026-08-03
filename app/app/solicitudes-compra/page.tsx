'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import axios from 'axios';
import {
  Eye,
  MoreHorizontal,
  Plus,
  Pencil,
  Trash2,
  FileDown,
  ShoppingCart,
} from 'lucide-react';
import { toast } from 'sonner';

import { solicitudesService } from '@/lib/services/solicitudes-service';
import { formatDateShort, formatMoney } from '@/lib/utils';
import { downloadBlob } from '@/lib/utils/download-blob';
import type { SolicitudResponse } from '@/types/solicitud-backend';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';

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

export default function SolicitudesCompraPage() {
  const [solicitudes, setSolicitudes] = useState<SolicitudResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingDelete, setPendingDelete] = useState<SolicitudResponse | null>(
    null
  );

  const fetchData = async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      const data = await solicitudesService.getSolicitudesCompra(signal);
      setSolicitudes(data);
    } catch (err) {
      if (axios.isCancel(err)) return;
      toast.error('No se pudieron cargar las solicitudes de compras.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    void fetchData(controller.signal);
    return () => {
      controller.abort();
    };
  }, []);

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      await solicitudesService.getSolicitudById(pendingDelete.id);
      // TODO: wire up delete endpoint when available
      toast.info('Eliminar desde el detalle de la solicitud.');
    } catch {
      toast.error('No se pudo eliminar la solicitud.');
    } finally {
      setPendingDelete(null);
    }
  };

  const handleDownloadPdf = async (id: number, codigo: string) => {
    await downloadBlob(() => solicitudesService.downloadPdf(id), codigo, {
      notFoundMessage: 'No se encontró el PDF de la solicitud.',
      errorMessage: 'No se pudo descargar el PDF.',
    });
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Solicitudes de Fondos
          </h1>
          <p className="text-muted-foreground">
            Compras y Servicios — solicitudes de fondos en avance (ANEXO 3).
          </p>
        </div>
        <Button asChild>
          <Link href="/app/solicitudes-compra/nueva">
            <Plus className="mr-2 h-4 w-4" />
            Nueva Solicitud
          </Link>
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-[420px] w-full" />
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Motivo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Cód. Desembolso</TableHead>
                <TableHead className="text-right">Total (Bs)</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {solicitudes.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-muted-foreground h-24 text-center"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <ShoppingCart className="h-8 w-8 opacity-30" />
                      No tienes solicitudes de compras registradas.
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                solicitudes.map((sol) => {
                  const badge = ESTADO_BADGE[sol.estado] ?? {
                    label: sol.estado,
                    className: '',
                  };
                  return (
                    <TableRow key={sol.id}>
                      <TableCell className="font-semibold">
                        {sol.codigoSolicitud}
                      </TableCell>
                      <TableCell>
                        {formatDateShort(sol.fechaSolicitud)}
                      </TableCell>
                      <TableCell className="max-w-[220px] truncate">
                        {sol.motivoViaje ?? '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={badge.className}>
                          {badge.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {sol.estado === 'DESEMBOLSADO' &&
                        sol.codigoDesembolso ? (
                          <Badge
                            variant="outline"
                            className="border-blue-300 bg-blue-50 font-mono text-xs text-blue-700 dark:border-blue-700 dark:bg-blue-950/40 dark:text-blue-400"
                          >
                            {sol.codigoDesembolso}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">
                            -
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatMoney(Number(sol.montoTotalNeto))}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label="Acciones"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                              <Link href={`/app/solicitudes-compra/${sol.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                Ver detalle
                              </Link>
                            </DropdownMenuItem>
                            {sol.estado === 'OBSERVADO' && (
                              <DropdownMenuItem asChild>
                                <Link
                                  href={`/app/solicitudes-compra/${sol.id}/editar`}
                                >
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Editar
                                </Link>
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onSelect={(e) => {
                                e.preventDefault();
                                void handleDownloadPdf(
                                  sol.id,
                                  sol.codigoSolicitud
                                );
                              }}
                            >
                              <FileDown className="mr-2 h-4 w-4" />
                              Descargar PDF
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              variant="destructive"
                              onSelect={(e) => {
                                e.preventDefault();
                                setPendingDelete(sol);
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar solicitud</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Seguro que deseas eliminar la solicitud{' '}
              <strong>{pendingDelete?.codigoSolicitud}</strong>? Esta acción no
              se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => void confirmDelete()}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
