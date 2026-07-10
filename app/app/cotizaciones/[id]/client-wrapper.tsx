'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { Pencil, FileDown, Link2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
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
import { formatDateShort, formatMoney } from '@/lib/utils';
import { cotizacionesService } from '@/lib/services/cotizaciones-service';
import type { CotizacionResponse } from '@/types/cotizacion-backend';

interface CotizacionDetalleClientWrapperProps {
  cotizacionId: string;
}

function DatoLinea({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-muted-foreground text-xs uppercase">{label}</p>
      <p className="text-sm">{value && value.trim() ? value : '-'}</p>
    </div>
  );
}

export function CotizacionDetalleClientWrapper({
  cotizacionId,
}: CotizacionDetalleClientWrapperProps) {
  const [cotizacion, setCotizacion] = useState<CotizacionResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCotizacion = async () => {
      try {
        setLoading(true);
        const data = await cotizacionesService.getCotizacionById(cotizacionId);
        setCotizacion(data);
      } catch {
        toast.error('No se pudo cargar la cotización.');
      } finally {
        setLoading(false);
      }
    };

    void fetchCotizacion();
  }, [cotizacionId]);

  const handleDownloadPdf = async () => {
    if (!cotizacion) return;
    try {
      const blob = await cotizacionesService.downloadPdf(cotizacion.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${cotizacion.codigoCotizacion}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('PDF descargado correctamente.');
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        toast.info('No se encontró la cotización solicitada.');
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

  if (!cotizacion) {
    return (
      <div className="text-muted-foreground p-6">
        No se encontró la cotización solicitada.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold">{cotizacion.codigoCotizacion}</h2>
            {cotizacion.tipo === 'EXTERNA' && (
              <Badge
                variant="outline"
                className="border-sky-300 bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300"
              >
                <Link2 className="mr-1 h-3 w-3" />
                Externa
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground text-sm">
            {formatDateShort(cotizacion.fecha)}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/app/cotizaciones/${cotizacion.id}/editar`}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </Link>
          </Button>
          {cotizacion.tipo === 'EXTERNA' && cotizacion.adjuntoUrl ? (
            <Button asChild>
              <a
                href={cotizacion.adjuntoUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Ver documento
              </a>
            </Button>
          ) : (
            <Button onClick={() => void handleDownloadPdf()}>
              <FileDown className="mr-2 h-4 w-4" />
              Descargar PDF
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Datos del Proveedor</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <DatoLinea label="Señor(es)" value={cotizacion.proveedorNombre} />
          {cotizacion.tipo === 'EXTERNA' ? (
            <div className="md:col-span-2">
              <p className="text-muted-foreground text-xs uppercase">
                Documento original
              </p>
              {cotizacion.adjuntoUrl ? (
                <a
                  href={cotizacion.adjuntoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-0.5 flex items-center gap-1 text-sm break-all text-sky-600 hover:text-sky-700 dark:text-sky-400"
                >
                  <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                  {cotizacion.adjuntoUrl}
                </a>
              ) : (
                <p className="text-sm">-</p>
              )}
            </div>
          ) : (
            <>
              <DatoLinea
                label="Teléfono"
                value={cotizacion.proveedorTelefono}
              />
              <DatoLinea
                label="Dirección"
                value={cotizacion.proveedorDireccion}
              />
              <DatoLinea
                label="Correo Electrónico"
                value={cotizacion.proveedorCorreo}
              />
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Detalle de Servicios o Materiales
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cantidad</TableHead>
                  <TableHead>Unidad</TableHead>
                  <TableHead>Detalle</TableHead>
                  <TableHead className="text-right">P/Unit. (Bs)</TableHead>
                  <TableHead className="text-right">Total (Bs)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cotizacion.lineas.map((linea) => (
                  <TableRow key={linea.id}>
                    <TableCell>{linea.cantidad}</TableCell>
                    <TableCell>{linea.unidad ?? '-'}</TableCell>
                    <TableCell>{linea.detalle}</TableCell>
                    <TableCell className="text-right">
                      {formatMoney(linea.precioUnitario)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatMoney(linea.total)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="font-semibold">
                  <TableCell colSpan={4} className="text-right">
                    TOTAL
                  </TableCell>
                  <TableCell className="text-right">
                    {formatMoney(cotizacion.total)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {cotizacion.tipo !== 'EXTERNA' ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Condiciones de la Cotización
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <DatoLinea label="Garantía" value={cotizacion.garantia} />
            <DatoLinea
              label="Disponibilidad"
              value={cotizacion.disponibilidad}
            />
            <DatoLinea
              label="Duración Cotización"
              value={cotizacion.duracionCotizacion}
            />
            <DatoLinea
              label="Emite Factura"
              value={cotizacion.emiteFactura ? 'Sí' : 'No'}
            />
            <div className="md:col-span-2">
              <DatoLinea
                label="Observaciones"
                value={cotizacion.observaciones}
              />
            </div>
          </CardContent>
        </Card>
      ) : cotizacion.observaciones ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Observaciones</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{cotizacion.observaciones}</p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
