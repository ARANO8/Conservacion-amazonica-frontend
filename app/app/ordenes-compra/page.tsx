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
} from 'lucide-react';
import { toast } from 'sonner';

import { ordenesCompraService } from '@/lib/services/ordenes-compra-service';
import { formatDateShort, formatMoney } from '@/lib/utils';
import type { OrdenCompraResponse } from '@/types/orden-compra-backend';
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
import { Skeleton } from '@/components/ui/skeleton';

async function handleDownloadPdf(id: number, fileName: string): Promise<void> {
  try {
    const blob = await ordenesCompraService.downloadPdf(id);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    toast.success('PDF descargado correctamente.');
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      toast.info('No se encontró la orden solicitada.');
      return;
    }
    toast.error('No se pudo descargar el PDF.');
  }
}

export default function OrdenesCompraPage() {
  const [ordenes, setOrdenes] = useState<OrdenCompraResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingDelete, setPendingDelete] =
    useState<OrdenCompraResponse | null>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const data = await ordenesCompraService.getOrdenes();
        setOrdenes(data);
      } catch {
        toast.error('No se pudieron cargar las órdenes de compra.');
      } finally {
        setLoading(false);
      }
    };
    void fetch();
  }, []);

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      await ordenesCompraService.deleteOrden(pendingDelete.id);
      toast.success('Orden de compra eliminada.');
      setOrdenes((prev) => prev.filter((o) => o.id !== pendingDelete.id));
    } catch {
      toast.error('No se pudo eliminar la orden.');
    } finally {
      setPendingDelete(null);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Órdenes de Compra
          </h1>
          <p className="text-muted-foreground">
            Compras y Servicios — Órdenes de Compra/Servicio (ANEXO 12).
          </p>
        </div>
        <Button asChild>
          <Link href="/app/ordenes-compra/nueva">
            <Plus className="mr-2 h-4 w-4" />
            Nueva Orden
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
                <TableHead>Cuadro Ref.</TableHead>
                <TableHead>Ítems</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ordenes.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-muted-foreground h-24 text-center"
                  >
                    No tienes órdenes de compra registradas.
                  </TableCell>
                </TableRow>
              ) : (
                ordenes.map((orden) => (
                  <TableRow key={orden.id}>
                    <TableCell className="font-semibold">
                      {orden.codigoOrden}
                    </TableCell>
                    <TableCell>{formatDateShort(orden.createdAt)}</TableCell>
                    <TableCell>{orden.proveedorNombre}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {orden.cuadroComparativo?.codigoCuadro ?? '—'}
                    </TableCell>
                    <TableCell>{orden.items.length}</TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatMoney(Number(orden.total))}
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
                            <Link href={`/app/ordenes-compra/${orden.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              Ver detalle
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/app/ordenes-compra/${orden.id}/editar`}
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              Editar
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={(e) => {
                              e.preventDefault();
                              void handleDownloadPdf(
                                orden.id,
                                orden.codigoOrden
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
                              setPendingDelete(orden);
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
            <AlertDialogTitle>Eliminar orden de compra</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Seguro que deseas eliminar {pendingDelete?.codigoOrden}? Esta
              acción no se puede deshacer.
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
