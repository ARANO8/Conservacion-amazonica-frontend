'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Eye,
  MoreHorizontal,
  Plus,
  Pencil,
  Trash2,
  FileDown,
} from 'lucide-react';
import { toast } from 'sonner';

import { cuadrosComparativosService } from '@/lib/services/cuadros-comparativos-service';
import { formatDateShort } from '@/lib/utils';
import { downloadBlob } from '@/lib/utils/download-blob';
import type { CuadroComparativoResponse } from '@/types/cuadro-comparativo-backend';
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

async function handleDownloadPdf(id: number, fileName: string): Promise<void> {
  await downloadBlob(
    () => cuadrosComparativosService.downloadPdf(id),
    fileName,
    {
      notFoundMessage: 'No se encontró el cuadro solicitado.',
      errorMessage: 'No se pudo descargar el PDF del cuadro comparativo.',
      successMessage: 'PDF del cuadro comparativo descargado.',
    }
  );
}

export default function CuadrosComparativosPage() {
  const [cuadros, setCuadros] = useState<CuadroComparativoResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingDelete, setPendingDelete] =
    useState<CuadroComparativoResponse | null>(null);

  useEffect(() => {
    const fetchCuadros = async () => {
      try {
        setLoading(true);
        const data = await cuadrosComparativosService.getCuadros();
        setCuadros(data);
      } catch {
        toast.error('No se pudieron cargar los cuadros comparativos.');
      } finally {
        setLoading(false);
      }
    };
    void fetchCuadros();
  }, []);

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      await cuadrosComparativosService.deleteCuadro(pendingDelete.id);
      toast.success('Cuadro comparativo eliminado.');
      setCuadros((prev) => prev.filter((c) => c.id !== pendingDelete.id));
    } catch {
      toast.error('No se pudo eliminar el cuadro comparativo.');
    } finally {
      setPendingDelete(null);
    }
  };

  const recomendado = (cuadro: CuadroComparativoResponse) => {
    const col = cuadro.cotizaciones.find(
      (c) => c.id === cuadro.cotizacionRecomendadaId
    );
    return col?.proveedorNombre ?? '—';
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Cuadros Comparativos
          </h1>
          <p className="text-muted-foreground">
            Compras y Servicios — compara cotizaciones y selecciona la mejor
            opción (ANEXO 11).
          </p>
        </div>
        <Button asChild>
          <Link href="/app/cuadros-comparativos/nueva">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Cuadro
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
                <TableHead>Cotizaciones</TableHead>
                <TableHead>Ítems</TableHead>
                <TableHead>Recomendada</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {cuadros.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-muted-foreground h-24 text-center"
                  >
                    No tienes cuadros comparativos registrados.
                  </TableCell>
                </TableRow>
              ) : (
                cuadros.map((cuadro) => (
                  <TableRow key={cuadro.id}>
                    <TableCell className="font-semibold">
                      {cuadro.codigoCuadro}
                    </TableCell>
                    <TableCell>{formatDateShort(cuadro.createdAt)}</TableCell>
                    <TableCell>{cuadro.cotizaciones.length}</TableCell>
                    <TableCell>{cuadro.items.length}</TableCell>
                    <TableCell>{recomendado(cuadro)}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          {
                            BORRADOR:
                              'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
                            EN_REVISION:
                              'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300',
                            EN_VALIDACION:
                              'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300',
                            REVISADO:
                              'bg-violet-100 text-violet-800 dark:bg-violet-950/60 dark:text-violet-300',
                            EN_APROBACION:
                              'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300',
                            OBSERVADO:
                              'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
                            APROBADO:
                              'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
                          }[cuadro.estado] ?? ''
                        }
                      >
                        {{
                          BORRADOR: 'Borrador',
                          EN_REVISION: 'En revisión',
                          EN_VALIDACION: 'En validación',
                          REVISADO: 'Validado',
                          EN_APROBACION: 'En aprobación',
                          OBSERVADO: 'Observado',
                          APROBADO: 'Aprobado',
                        }[cuadro.estado] ?? cuadro.estado}
                      </Badge>
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
                            <Link
                              href={`/app/cuadros-comparativos/${cuadro.id}`}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              Ver detalle
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/app/cuadros-comparativos/${cuadro.id}/editar`}
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              Editar
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={(event) => {
                              event.preventDefault();
                              void handleDownloadPdf(
                                cuadro.id,
                                cuadro.codigoCuadro
                              );
                            }}
                          >
                            <FileDown className="mr-2 h-4 w-4" />
                            Descargar PDF
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant="destructive"
                            onSelect={(event) => {
                              event.preventDefault();
                              setPendingDelete(cuadro);
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
            <AlertDialogTitle>Eliminar cuadro comparativo</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Seguro que deseas eliminar {pendingDelete?.codigoCuadro}? Esta
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
