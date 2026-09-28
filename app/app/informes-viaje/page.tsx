'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import axios from 'axios';
import {
  ClipboardList,
  Eye,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';

import { informesViajeService } from '@/lib/services/informes-viaje-service';
import { formatFechaAnexo } from '@/lib/declaracion-movilidad';
import { useAuthStore } from '@/store/auth-store';
import type { InformeViajeResponse } from '@/types/informe-viaje-backend';
import {
  InformeViajeEstadoBadge,
  informeEditable,
} from '@/components/informes-viaje/informe-viaje-estado';
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
import { cn } from '@/lib/utils';

type Vista = 'mios' | 'por-revisar';

function rango(informe: InformeViajeResponse): string {
  const desde = formatFechaAnexo(informe.fechaInicio);
  const hasta = formatFechaAnexo(informe.fechaFin);
  return desde === hasta ? desde : `${desde} al ${hasta}`;
}

export default function InformesViajePage() {
  const usuario = useAuthStore((state) => state.user);
  const [informes, setInformes] = useState<InformeViajeResponse[]>([]);
  const [pendientes, setPendientes] = useState<InformeViajeResponse[]>([]);
  const [vista, setVista] = useState<Vista>('mios');
  const [loading, setLoading] = useState(true);
  const [aEliminar, setAEliminar] = useState<InformeViajeResponse | null>(null);
  const [eliminando, setEliminando] = useState(false);

  const cargar = useCallback(async () => {
    try {
      setLoading(true);
      const [todos, porRevisar] = await Promise.all([
        informesViajeService.getAll(),
        informesViajeService.getPendientes(),
      ]);
      setInformes(todos);
      setPendientes(porRevisar);
    } catch {
      toast.error('No se pudieron cargar los informes de viaje.');
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
    (informe: InformeViajeResponse) =>
      String(informe.usuarioId) === String(usuario?.id),
    [usuario?.id]
  );

  const visibles = useMemo(
    () => (vista === 'por-revisar' ? pendientes : informes.filter(esMio)),
    [vista, pendientes, informes, esMio]
  );

  const confirmarEliminar = async () => {
    if (!aEliminar) return;
    try {
      setEliminando(true);
      await informesViajeService.remove(aEliminar.id);
      toast.success(`Informe ${aEliminar.codigoInforme} eliminado.`);
      setAEliminar(null);
      await cargar();
    } catch (error: unknown) {
      toast.error(
        axios.isAxiosError(error) && error.response?.data?.message
          ? String(error.response.data.message)
          : 'No se pudo eliminar el informe.'
      );
    } finally {
      setEliminando(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <ClipboardList className="text-primary h-7 w-7" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Informe de Viaje
            </h1>
            <p className="text-muted-foreground">
              Lo que se hizo realmente en cada viaje, revisado por el Director
              de Programa (ANEXO 7).
            </p>
          </div>
        </div>

        <Button asChild>
          <Link href="/app/informes-viaje/nueva">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo informe de viaje
          </Link>
        </Button>
      </div>

      <div className="flex gap-2">
        {(
          [
            ['mios', 'Mis informes', null],
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
            <ClipboardList className="text-muted-foreground h-8 w-8" />
          </div>
          <h2 className="text-lg font-semibold">
            {vista === 'por-revisar'
              ? 'No tienes informes esperando tu revisión'
              : 'Aún no tienes informes de viaje'}
          </h2>
          {vista === 'mios' && (
            <p className="text-muted-foreground max-w-sm text-sm">
              Después de cada viaje desembolsado, cuenta qué se hizo con el
              botón &laquo;Nuevo informe de viaje&raquo;.
            </p>
          )}
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[130px]">Código</TableHead>
                <TableHead>Motivo del viaje</TableHead>
                <TableHead className="w-[200px]">Fechas</TableHead>
                {vista === 'por-revisar' && (
                  <TableHead className="w-[200px]">Autor</TableHead>
                )}
                <TableHead className="w-[130px]">Estado</TableHead>
                <TableHead className="w-[140px]">Solicitud</TableHead>
                <TableHead className="w-[60px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibles.map((informe) => {
                const mio = esMio(informe);
                return (
                  <TableRow key={informe.id}>
                    <TableCell className="font-mono text-sm font-medium">
                      <Link
                        href={`/app/informes-viaje/${informe.id}`}
                        className="hover:underline"
                      >
                        {informe.codigoInforme}
                      </Link>
                    </TableCell>
                    <TableCell className="max-w-[360px] truncate text-sm">
                      {informe.motivoViaje || '—'}
                      <span className="text-muted-foreground block text-xs">
                        {informe.lugarViaje}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">{rango(informe)}</TableCell>
                    {vista === 'por-revisar' && (
                      <TableCell className="text-sm">
                        {informe.usuario?.nombreCompleto ?? '—'}
                      </TableCell>
                    )}
                    <TableCell>
                      <InformeViajeEstadoBadge estado={informe.estado} />
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {informe.solicitud ? (
                        <Link
                          href={`/app/solicitudes/${informe.solicitud.id}`}
                          className="hover:underline"
                        >
                          {informe.solicitud.codigoSolicitud}
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
                              href={`/app/informes-viaje/${informe.id}`}
                              className="flex items-center"
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              {vista === 'por-revisar'
                                ? 'Revisar'
                                : 'Ver ANEXO 7'}
                            </Link>
                          </DropdownMenuItem>
                          {mio && informeEditable(informe) && (
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/app/informes-viaje/${informe.id}/editar`}
                                className="flex items-center"
                              >
                                <Pencil className="mr-2 h-4 w-4" />
                                Editar
                              </Link>
                            </DropdownMenuItem>
                          )}
                          {mio && informe.estado !== 'REVISADO' && (
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => setAEliminar(informe)}
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
            <AlertDialogTitle>¿Eliminar el informe de viaje?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará el informe {aEliminar?.codigoInforme}. La solicitud{' '}
              {aEliminar?.solicitud?.codigoSolicitud} quedará libre para un
              informe nuevo.
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
