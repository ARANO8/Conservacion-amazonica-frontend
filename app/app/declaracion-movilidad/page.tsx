'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Eye, MoreHorizontal, Pencil, Plus, Route, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { declaracionesMovilidadService } from '@/lib/services/declaraciones-movilidad-service';
import { formatMoney } from '@/lib/utils';
import { formatFechaAnexo } from '@/lib/declaracion-movilidad';
import type { DeclaracionMovilidadResponse } from '@/types/declaracion-movilidad-backend';
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

export default function DeclaracionesMovilidadPage() {
  const [declaraciones, setDeclaraciones] = useState<
    DeclaracionMovilidadResponse[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [aEliminar, setAEliminar] =
    useState<DeclaracionMovilidadResponse | null>(null);
  const [eliminando, setEliminando] = useState(false);

  const cargar = async () => {
    try {
      setLoading(true);
      setDeclaraciones(await declaracionesMovilidadService.getAll());
    } catch {
      toast.error('No se pudieron cargar las declaraciones de movilidad.');
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
      await declaracionesMovilidadService.remove(aEliminar.id);
      toast.success(`Declaración ${aEliminar.codigoDeclaracion} eliminada.`);
      setAEliminar(null);
      await cargar();
    } catch {
      toast.error('No se pudo eliminar la declaración.');
    } finally {
      setEliminando(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Route className="text-primary h-7 w-7" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Declaración de Movilidad
            </h1>
            <p className="text-muted-foreground">
              Gastos de movilidad declarados bajo juramento (ANEXO 6).
            </p>
          </div>
        </div>

        <Button asChild>
          <Link href="/app/declaracion-movilidad/nueva">
            <Plus className="mr-2 h-4 w-4" />
            Nueva declaración
          </Link>
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-[300px] w-full" />
        </div>
      ) : declaraciones.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
          <div className="bg-muted flex h-16 w-16 items-center justify-center rounded-full">
            <Route className="text-muted-foreground h-8 w-8" />
          </div>
          <h2 className="text-lg font-semibold">
            Sin declaraciones registradas
          </h2>
          <p className="text-muted-foreground max-w-sm text-sm">
            Registra tus gastos de movilidad con el botón &laquo;Nueva
            declaración&raquo;.
          </p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[140px]">Código</TableHead>
                <TableHead className="w-[120px]">Fecha</TableHead>
                <TableHead>Motivo/Actividad</TableHead>
                <TableHead className="w-[90px] text-center">Tramos</TableHead>
                <TableHead className="w-[130px] text-right">
                  Total líquido
                </TableHead>
                <TableHead className="w-[180px]">Autor</TableHead>
                <TableHead className="w-[60px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {declaraciones.map((declaracion) => (
                <TableRow key={declaracion.id}>
                  <TableCell className="font-mono text-sm font-medium">
                    {declaracion.codigoDeclaracion}
                  </TableCell>
                  <TableCell className="text-sm">
                    {formatFechaAnexo(declaracion.fechaEmision)}
                  </TableCell>
                  <TableCell className="text-sm">
                    {declaracion.motivoActividad}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary">
                      {declaracion.detalles?.length ?? 0}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-sm font-semibold tabular-nums">
                    {formatMoney(Number(declaracion.totalLiquido))}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {declaracion.usuario?.nombreCompleto ?? '—'}
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
                            href={`/app/declaracion-movilidad/${declaracion.id}`}
                            className="flex items-center"
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            Ver detalle
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link
                            href={`/app/declaracion-movilidad/${declaracion.id}/editar`}
                            className="flex items-center"
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setAEliminar(declaracion)}
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
            <AlertDialogTitle>¿Eliminar la declaración?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará la declaración {aEliminar?.codigoDeclaracion} con sus{' '}
              {aEliminar?.detalles?.length ?? 0} tramos. Esta acción no se puede
              deshacer desde la interfaz.
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
