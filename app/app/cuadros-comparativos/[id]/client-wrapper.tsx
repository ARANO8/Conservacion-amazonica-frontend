'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { Pencil, FileDown } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { cn, formatMoney } from '@/lib/utils';
import { cuadrosComparativosService } from '@/lib/services/cuadros-comparativos-service';
import type { CuadroComparativoResponse } from '@/types/cuadro-comparativo-backend';

interface Props {
  cuadroId: string;
}

export function CuadroDetalleClientWrapper({ cuadroId }: Props) {
  const [cuadro, setCuadro] = useState<CuadroComparativoResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCuadro = async () => {
      try {
        setLoading(true);
        const data = await cuadrosComparativosService.getCuadroById(cuadroId);
        setCuadro(data);
      } catch {
        toast.error('No se pudo cargar el cuadro comparativo.');
      } finally {
        setLoading(false);
      }
    };
    void fetchCuadro();
  }, [cuadroId]);

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

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">{cuadro.codigoCuadro}</h2>
          <p className="text-muted-foreground text-sm">
            {cuadro.lugarFecha || 'Sin lugar y fecha'} ·{' '}
            <Badge variant="outline">{cuadro.estado}</Badge>
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/app/cuadros-comparativos/${cuadro.id}/editar`}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </Link>
          </Button>
          <Button onClick={() => void handleDownloadPdf()}>
            <FileDown className="mr-2 h-4 w-4" />
            Descargar PDF
          </Button>
        </div>
      </div>

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
    </div>
  );
}
