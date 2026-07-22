'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Pencil, FileDown, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDate, formatMoney } from '@/lib/utils';
import { downloadBlob } from '@/lib/utils/download-blob';
import { ordenesCompraService } from '@/lib/services/ordenes-compra-service';
import type { OrdenCompraResponse } from '@/types/orden-compra-backend';

interface Props {
  ordenId: string;
}

export function OrdenDetalleClientWrapper({ ordenId }: Props) {
  const [orden, setOrden] = useState<OrdenCompraResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchOrden = useCallback(async () => {
    try {
      setLoading(true);
      const data = await ordenesCompraService.getOrdenById(ordenId);
      setOrden(data);
    } catch {
      toast.error('No se pudo cargar la orden de compra.');
    } finally {
      setLoading(false);
    }
  }, [ordenId]);

  useEffect(() => {
    void fetchOrden();
  }, [fetchOrden]);

  const handleDownloadPdf = async () => {
    if (!orden) return;
    await downloadBlob(
      () => ordenesCompraService.downloadPdf(orden.id),
      orden.codigoOrden,
      {
        notFoundMessage: 'No se encontró la orden solicitada.',
      }
    );
  };

  if (loading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-10 w-full max-w-md" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (!orden) {
    return (
      <div className="text-muted-foreground p-6">
        No se encontró la orden de compra solicitada.
      </div>
    );
  }

  const haySinCuadro = orden.items.some((it) => it.sinCuadro);

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">{orden.codigoOrden}</h2>
          <p className="text-muted-foreground text-sm">
            {formatDate(orden.fecha)} · {orden.proveedorNombre}
            {orden.cuadroComparativo && (
              <>
                {' '}
                · Ref:{' '}
                <Link
                  href={`/app/cuadros-comparativos/${orden.cuadroComparativoId}`}
                  className="hover:underline"
                >
                  {orden.cuadroComparativo.codigoCuadro}
                </Link>
              </>
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link href={`/app/ordenes-compra/${orden.id}/editar`}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </Link>
          </Button>
          <Button variant="outline" onClick={() => void handleDownloadPdf()}>
            <FileDown className="mr-2 h-4 w-4" />
            Descargar PDF (ANEXO 12)
          </Button>
        </div>
      </div>

      {haySinCuadro && (
        <div className="flex items-start gap-3 rounded-md border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Esta orden contiene ítems marcados con{' '}
            <strong>sin cuadro comparativo</strong>. Dichos ítems no cuentan con
            una cotización de respaldo registrada en el sistema.
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              Proveedor
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p className="font-semibold">{orden.proveedorNombre}</p>
            {orden.proveedorDireccion && <p>{orden.proveedorDireccion}</p>}
            {orden.proveedorTelefono && <p>{orden.proveedorTelefono}</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              Condiciones
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p>
              <span className="text-muted-foreground">Entrega:</span>{' '}
              {orden.lugarEntrega || '—'}
            </p>
            <p>
              <span className="text-muted-foreground">Pago:</span>{' '}
              {orden.formaPago}
            </p>
            <p>
              <span className="text-muted-foreground">Garantía:</span>{' '}
              {orden.garantia}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatMoney(Number(orden.total))}
            </p>
            <p className="text-muted-foreground text-xs">
              {orden.items.length} ítem(s)
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ítems de la orden</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">#</TableHead>
                  <TableHead>Artículo / Servicio</TableHead>
                  <TableHead>Cantidad</TableHead>
                  <TableHead>Unidad</TableHead>
                  <TableHead>Detalle</TableHead>
                  <TableHead className="text-right">
                    Precio Unit. (Bs)
                  </TableHead>
                  <TableHead className="text-right">Total (Bs)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orden.items.map((it) => (
                  <TableRow key={it.id}>
                    <TableCell className="text-muted-foreground text-xs">
                      {it.orden}
                    </TableCell>
                    <TableCell>
                      {it.item}
                      {it.sinCuadro && (
                        <span className="ml-2 rounded bg-amber-100 px-1 text-xs text-amber-800 italic dark:bg-amber-950/60 dark:text-amber-300">
                          sin cuadro
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{Number(it.cantidad)}</TableCell>
                    <TableCell>{it.unidad ?? '—'}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {it.detalle ?? '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatMoney(Number(it.precioUnitario))}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatMoney(Number(it.total))}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/50 font-semibold">
                  <TableCell colSpan={6} className="text-right">
                    TOTAL
                  </TableCell>
                  <TableCell className="text-right">
                    {formatMoney(Number(orden.total))}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {orden.observaciones && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Observaciones</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-line">{orden.observaciones}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
