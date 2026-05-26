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
  Link2,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';

import { cotizacionesService } from '@/lib/services/cotizaciones-service';
import { formatDateShort, formatMoney } from '@/lib/utils';
import type { CotizacionResponse } from '@/types/cotizacion-backend';
import { Button } from '@/components/ui/button';
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
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

async function handleDownloadPdf(id: number, fileName: string): Promise<void> {
  try {
    const blob = await cotizacionesService.downloadPdf(id);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    toast.success('PDF de cotización descargado correctamente.');
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      toast.info('No se encontró la cotización solicitada.');
      return;
    }
    toast.error('No se pudo descargar el PDF de la cotización.');
  }
}

export default function MisCotizacionesPage() {
  const [cotizaciones, setCotizaciones] = useState<CotizacionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingDelete, setPendingDelete] = useState<CotizacionResponse | null>(
    null
  );

  const fetchCotizaciones = async () => {
    try {
      setLoading(true);
      const data = await cotizacionesService.getCotizaciones();
      setCotizaciones(data);
    } catch {
      toast.error('No se pudieron cargar las cotizaciones.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchCotizaciones();
  }, []);

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      await cotizacionesService.deleteCotizacion(pendingDelete.id);
      toast.success('Cotización eliminada.');
      setCotizaciones((prev) => prev.filter((c) => c.id !== pendingDelete.id));
    } catch {
      toast.error('No se pudo eliminar la cotización.');
    } finally {
      setPendingDelete(null);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Mis Cotizaciones
          </h1>
          <p className="text-muted-foreground">
            Compras y Servicios — cotizaciones registradas para armar tu cuadro
            comparativo.
          </p>
        </div>
        <Button asChild>
          <Link href="/app/cotizaciones/nueva">
            <Plus className="mr-2 h-4 w-4" />
            Nueva Cotización
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
                <TableHead>Proveedor</TableHead>
                <TableHead className="w-[110px]">Tipo</TableHead>
                <TableHead>Ítems</TableHead>
                <TableHead className="text-right">Total (Bs)</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {cotizaciones.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-muted-foreground h-24 text-center"
                  >
                    No tienes cotizaciones registradas.
                  </TableCell>
                </TableRow>
              ) : (
                cotizaciones.map((cotizacion) => (
                  <TableRow key={cotizacion.id}>
                    <TableCell className="font-semibold">
                      {cotizacion.codigoCotizacion}
                    </TableCell>
                    <TableCell>{formatDateShort(cotizacion.fecha)}</TableCell>
                    <TableCell>{cotizacion.proveedorNombre}</TableCell>
                    <TableCell>
                      {cotizacion.tipo === 'EXTERNA' ? (
                        <Badge
                          variant="outline"
                          className="border-sky-300 bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300"
                        >
                          <Link2 className="mr-1 h-3 w-3" />
                          Externa
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">
                          Propia
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{cotizacion.lineas?.length ?? 0}</TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatMoney(cotizacion.total)}
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
                            <Link href={`/app/cotizaciones/${cotizacion.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              Ver detalle
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/app/cotizaciones/${cotizacion.id}/editar`}
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              Editar
                            </Link>
                          </DropdownMenuItem>
                          {cotizacion.tipo === 'EXTERNA' &&
                          cotizacion.adjuntoUrl ? (
                            <DropdownMenuItem asChild>
                              <a
                                href={cotizacion.adjuntoUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <ExternalLink className="mr-2 h-4 w-4" />
                                Ver documento
                              </a>
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onSelect={(event) => {
                                event.preventDefault();
                                void handleDownloadPdf(
                                  cotizacion.id,
                                  cotizacion.codigoCotizacion
                                );
                              }}
                            >
                              <FileDown className="mr-2 h-4 w-4" />
                              Descargar PDF
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant="destructive"
                            onSelect={(event) => {
                              event.preventDefault();
                              setPendingDelete(cotizacion);
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
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
            <AlertDialogTitle>Eliminar cotización</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Seguro que deseas eliminar la cotización{' '}
              {pendingDelete?.codigoCotizacion}? Esta acción no se puede
              deshacer.
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
