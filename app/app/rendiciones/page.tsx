'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { Eye, FileSpreadsheet, MoreHorizontal, Plus } from 'lucide-react';
import { toast } from 'sonner';

import { rendicionesService } from '@/lib/services/rendiciones-service';
import { formatDateShort, formatMoney } from '@/lib/utils';
import { RendicionResponse } from '@/types/rendicion-backend';
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
import { Skeleton } from '@/components/ui/skeleton';

const ESTADO_BADGE_CLASS: Record<string, string> = {
  PENDIENTE: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  OBSERVADO: 'bg-rose-100 text-rose-800 border-rose-200',
  OBSERVADA: 'bg-rose-100 text-rose-800 border-rose-200',
  APROBADO: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  APROBADA: 'bg-emerald-100 text-emerald-800 border-emerald-200',
};

function getEstadoClass(estado: string) {
  return (
    ESTADO_BADGE_CLASS[estado] || 'bg-slate-100 text-slate-800 border-slate-200'
  );
}

async function handleDownloadPdf(
  rendicionId: number,
  fileName: string
): Promise<void> {
  try {
    const blob = await rendicionesService.downloadPdf(rendicionId);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    toast.success('PDF de rendición descargado correctamente.');
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      toast.info('Descarga PDF para rendiciones en preparación.');
      return;
    }

    toast.error('No se pudo descargar el PDF de la rendición.');
  }
}

export default function MisRendicionesPage() {
  const [rendiciones, setRendiciones] = useState<RendicionResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMisRendiciones = async () => {
      try {
        setLoading(true);
        const data = await rendicionesService.getMisRendiciones();
        setRendiciones(data);
      } catch {
        toast.error('No se pudieron cargar tus rendiciones.');
      } finally {
        setLoading(false);
      }
    };

    void fetchMisRendiciones();
  }, []);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mis Rendiciones</h1>
          <p className="text-muted-foreground">
            Haz seguimiento a tus rendiciones, estado actual y aprobador.
          </p>
        </div>
        <Button asChild>
          <Link href="/app/rendiciones/nueva">
            <Plus className="mr-2 h-4 w-4" />
            Nueva Rendición
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
                <TableHead>ID / Código</TableHead>
                <TableHead>Fecha de Creación</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Aprobador Actual</TableHead>
                <TableHead className="text-right">Monto Total</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {rendiciones.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-muted-foreground h-24 text-center"
                  >
                    No tienes rendiciones registradas.
                  </TableCell>
                </TableRow>
              ) : (
                rendiciones.map((rendicion) => {
                  const codigo =
                    rendicion.solicitud?.codigoSolicitud || `R-${rendicion.id}`;
                  const fechaCreacion =
                    rendicion.createdAt || rendicion.fechaRendicion;
                  const aprobadorActual =
                    rendicion.aprobadorActual?.nombreCompleto || 'Finalizado';

                  return (
                    <TableRow key={rendicion.id}>
                      <TableCell>
                        <div className="font-semibold">#{rendicion.id}</div>
                        <div className="text-muted-foreground text-xs">
                          {codigo}
                        </div>
                      </TableCell>

                      <TableCell>{formatDateShort(fechaCreacion)}</TableCell>

                      <TableCell>
                        <Badge
                          variant="outline"
                          className={getEstadoClass(rendicion.estado)}
                        >
                          {rendicion.estado}
                        </Badge>
                      </TableCell>

                      <TableCell>{aprobadorActual}</TableCell>

                      <TableCell className="text-right font-semibold">
                        {formatMoney(rendicion.montoRespaldado)}
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
                              <Link href={`/app/rendiciones/${rendicion.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                Ver Detalle
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onSelect={(event) => {
                                event.preventDefault();
                                void handleDownloadPdf(
                                  rendicion.id,
                                  codigo || `rendicion-${rendicion.id}`
                                );
                              }}
                            >
                              Descargar PDF
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onSelect={(event) => {
                                event.preventDefault();
                                toast.info('Funcionalidad en Proceso');
                              }}
                            >
                              <FileSpreadsheet className="mr-2 h-4 w-4" />
                              Descargar Excel
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
    </div>
  );
}
