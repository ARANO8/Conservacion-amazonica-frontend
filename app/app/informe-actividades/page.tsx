'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ClipboardList,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';

import { informesActividadesService } from '@/lib/services/informes-actividades-service';
import { formatDateShort } from '@/lib/utils';
import type { InformeActividadesResponse } from '@/types/informe-actividades-backend';
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

/** Los primeros lugares visitados, para reconocer el informe de un vistazo. */
function resumenLugares(informe: InformeActividadesResponse): string {
  const lugares = Array.from(
    new Set((informe.actividades ?? []).map((a) => a.lugar).filter(Boolean))
  );
  if (lugares.length === 0) return '—';
  return lugares.slice(0, 3).join(', ') + (lugares.length > 3 ? '...' : '');
}

export default function InformesActividadesPage() {
  const [informes, setInformes] = useState<InformeActividadesResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [aEliminar, setAEliminar] = useState<InformeActividadesResponse | null>(
    null
  );
  const [eliminando, setEliminando] = useState(false);

  const cargar = async () => {
    try {
      setLoading(true);
      const data = await informesActividadesService.getAll();
      setInformes(data);
    } catch {
      toast.error('No se pudieron cargar los informes de actividades.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void cargar();
  }, []);

  const confirmarEliminar = async () => {
    if (!aEliminar) return;
    try {
      setEliminando(true);
      await informesActividadesService.remove(aEliminar.id);
      toast.success(`Informe ${aEliminar.codigoInforme} eliminado.`);
      setAEliminar(null);
      await cargar();
    } catch {
      toast.error('No se pudo eliminar el informe.');
    } finally {
      setEliminando(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <ClipboardList className="text-primary h-7 w-7" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Informe de Actividades
            </h1>
            <p className="text-muted-foreground">
              Bitácora de actividades realizadas en viaje (ANEXO 7).
            </p>
          </div>
        </div>

        <Button asChild>
          <Link href="/app/informe-actividades/nueva">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo informe
          </Link>
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-[300px] w-full" />
        </div>
      ) : informes.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
          <div className="bg-muted flex h-16 w-16 items-center justify-center rounded-full">
            <ClipboardList className="text-muted-foreground h-8 w-8" />
          </div>
          <h2 className="text-lg font-semibold">Sin informes registrados</h2>
          <p className="text-muted-foreground max-w-sm text-sm">
            Registra la bitácora de actividades de un viaje con el botón
            &laquo;Nuevo informe&raquo;.
          </p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[140px]">Código</TableHead>
                <TableHead className="w-[220px]">Periodo</TableHead>
                <TableHead>Lugares</TableHead>
                <TableHead className="w-[110px] text-center">
                  Actividades
                </TableHead>
                <TableHead className="w-[180px]">Autor</TableHead>
                <TableHead className="w-[60px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {informes.map((informe) => (
                <TableRow key={informe.id}>
                  <TableCell className="font-mono text-sm font-medium">
                    {informe.codigoInforme}
                  </TableCell>
                  <TableCell className="text-sm">
                    {formatDateShort(informe.fechaInicio)} —{' '}
                    {formatDateShort(informe.fechaFin)}
                  </TableCell>
                  <TableCell className="text-sm">
                    {resumenLugares(informe)}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary">
                      {informe.actividades?.length ?? 0}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {informe.usuario?.nombreCompleto ?? '—'}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Abrir menú</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link
                            href={`/app/informe-actividades/${informe.id}/editar`}
                            className="flex items-center"
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setAEliminar(informe)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <AlertDialog
        open={!!aEliminar}
        onOpenChange={(open) => !open && setAEliminar(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar el informe?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará el informe {aEliminar?.codigoInforme} con sus{' '}
              {aEliminar?.actividades?.length ?? 0} actividades. Esta acción no
              se puede deshacer desde la interfaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={eliminando}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void confirmarEliminar();
              }}
              disabled={eliminando}
            >
              {eliminando ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
