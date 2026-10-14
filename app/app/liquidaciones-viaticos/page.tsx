'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import axios from 'axios';
import {
  Receipt,
  Eye,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';

import { liquidacionesViaticosService } from '@/lib/services/liquidaciones-viaticos-service';
import { useAuthStore } from '@/store/auth-store';
import type { LiquidacionViaticosResponse } from '@/types/liquidacion-viaticos-backend';
import {
  LiquidacionViaticosEstadoBadge,
  liquidacionEditable,
} from '@/components/liquidaciones-viaticos/liquidacion-viaticos-estado';
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
import { cn, formatMoney } from '@/lib/utils';

type Vista = 'mios' | 'por-revisar';

function totalAPagar(liquidacion: LiquidacionViaticosResponse): number {
  return liquidacion.hojas.reduce((t, h) => t + Number(h.totalLiquido), 0);
}

export default function LiquidacionesViaticosPage() {
  const usuario = useAuthStore((state) => state.user);
  const [liquidaciones, setLiquidaciones] = useState<
    LiquidacionViaticosResponse[]
  >([]);
  const [pendientes, setPendientes] = useState<LiquidacionViaticosResponse[]>(
    []
  );
  const [vista, setVista] = useState<Vista>('mios');
  const [loading, setLoading] = useState(true);
  const [aEliminar, setAEliminar] =
    useState<LiquidacionViaticosResponse | null>(null);
  const [eliminando, setEliminando] = useState(false);

  const cargar = useCallback(async () => {
    try {
      setLoading(true);
      const [todos, porRevisar] = await Promise.all([
        liquidacionesViaticosService.getAll(),
        liquidacionesViaticosService.getPendientes(),
      ]);
      setLiquidaciones(todos);
      setPendientes(porRevisar);
    } catch {
      toast.error('No se pudieron cargar las liquidaciones de viáticos.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  // Con pendientes, el director entra directo a su bandeja de revisión
  useEffect(() => {
    if (!loading && pendientes.length > 0) setVista('por-revisar');
  }, [loading, pendientes.length]);

  const esMio = useCallback(
    (liquidacion: LiquidacionViaticosResponse) =>
      String(liquidacion.usuarioId) === String(usuario?.id),
    [usuario?.id]
  );

  const visibles = useMemo(
    () => (vista === 'por-revisar' ? pendientes : liquidaciones.filter(esMio)),
    [vista, pendientes, liquidaciones, esMio]
  );

  const confirmarEliminar = async () => {
    if (!aEliminar) return;
    try {
      setEliminando(true);
      await liquidacionesViaticosService.remove(aEliminar.id);
      toast.success(`Liquidación ${aEliminar.codigoLiquidacion} eliminada.`);
      setAEliminar(null);
      await cargar();
    } catch (error: unknown) {
      toast.error(
        axios.isAxiosError(error) && error.response?.data?.message
          ? String(error.response.data.message)
          : 'No se pudo eliminar la liquidación.'
      );
    } finally {
      setEliminando(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Receipt className="text-primary h-7 w-7" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Liquidación de Viáticos
            </h1>
            <p className="text-muted-foreground">
              Los viáticos de cada persona del viaje, revisados por el Director
              de Programa (ANEXO 5).
            </p>
          </div>
        </div>

        <Button asChild>
          <Link href="/app/liquidaciones-viaticos/nueva">
            <Plus className="mr-2 h-4 w-4" />
            Nueva liquidación
          </Link>
        </Button>
      </div>

      <div className="flex gap-2">
        {(
          [
            ['mios', 'Mis liquidaciones', null],
            ['por-revisar', 'Por revisar', pendientes.length],
          ] as const
        ).map(([clave, etiqueta, contador]) => (
          <Button
            key={clave}
            variant={vista === clave ? 'default' : 'outline'}
            size="sm"
            onClick={() => setVista(clave)}
          >
            {etiqueta}
            {contador ? (
              <Badge
                variant="secondary"
                className={cn('ml-2', vista === clave && 'bg-background')}
              >
                {contador}
              </Badge>
            ) : null}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-[300px] w-full" />
        </div>
      ) : visibles.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
          <div className="bg-muted flex h-16 w-16 items-center justify-center rounded-full">
            <Receipt className="text-muted-foreground h-8 w-8" />
          </div>
          <h2 className="text-lg font-semibold">
            {vista === 'por-revisar'
              ? 'No tienes liquidaciones esperando tu revisión'
              : 'Aún no tienes liquidaciones de viáticos'}
          </h2>
          {vista === 'mios' && (
            <p className="text-muted-foreground max-w-sm text-sm">
              Después de cada viaje desembolsado, liquida los viáticos de cada
              persona con el botón &laquo;Nueva liquidación&raquo;.
            </p>
          )}
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[130px]">Código</TableHead>
                <TableHead>Personas</TableHead>
                <TableHead className="w-[150px] text-right">
                  Total a pagar
                </TableHead>
                {vista === 'por-revisar' && (
                  <TableHead className="w-[200px]">Autor</TableHead>
                )}
                <TableHead className="w-[130px]">Estado</TableHead>
                <TableHead className="w-[140px]">Solicitud</TableHead>
                <TableHead className="w-[60px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibles.map((liquidacion) => {
                const mio = esMio(liquidacion);
                return (
                  <TableRow key={liquidacion.id}>
                    <TableCell className="font-mono text-sm font-medium">
                      <Link
                        href={`/app/liquidaciones-viaticos/${liquidacion.id}`}
                        className="hover:underline"
                      >
                        {liquidacion.codigoLiquidacion}
                      </Link>
                    </TableCell>
                    <TableCell className="max-w-[360px] truncate text-sm">
                      {liquidacion.hojas
                        .map((h) => h.usuario.nombreCompleto)
                        .join(', ') || '—'}
                    </TableCell>
                    <TableCell className="text-right text-sm tabular-nums">
                      {formatMoney(totalAPagar(liquidacion))}
                    </TableCell>
                    {vista === 'por-revisar' && (
                      <TableCell className="text-sm">
                        {liquidacion.usuario?.nombreCompleto ?? '—'}
                      </TableCell>
                    )}
                    <TableCell>
                      <LiquidacionViaticosEstadoBadge
                        estado={liquidacion.estado}
                      />
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {liquidacion.solicitud ? (
                        <Link
                          href={`/app/solicitudes/${liquidacion.solicitud.id}`}
                          className="hover:underline"
                        >
                          {liquidacion.solicitud.codigoSolicitud}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
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
                              href={`/app/liquidaciones-viaticos/${liquidacion.id}`}
                              className="flex items-center"
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              {vista === 'por-revisar'
                                ? 'Revisar'
                                : 'Ver ANEXO 5'}
                            </Link>
                          </DropdownMenuItem>
                          {mio && liquidacionEditable(liquidacion) && (
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/app/liquidaciones-viaticos/${liquidacion.id}/editar`}
                                className="flex items-center"
                              >
                                <Pencil className="mr-2 h-4 w-4" />
                                Editar
                              </Link>
                            </DropdownMenuItem>
                          )}
                          {mio && liquidacion.estado !== 'REVISADO' && (
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => setAEliminar(liquidacion)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Eliminar
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
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
            <AlertDialogTitle>
              ¿Eliminar la liquidación de viáticos?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará la liquidación {aEliminar?.codigoLiquidacion}. La
              solicitud {aEliminar?.solicitud?.codigoSolicitud} quedará libre
              para un liquidacion nuevo.
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
