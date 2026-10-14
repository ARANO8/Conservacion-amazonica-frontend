'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Eye,
  FilePlus2,
  Map as MapIcon,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

import { planesViajeService } from '@/lib/services/planes-viaje-service';
import { formatFechaAnexo } from '@/lib/declaracion-movilidad';
import { useAuthStore } from '@/store/auth-store';
import type { PlanViajeResponse } from '@/types/plan-viaje-backend';
import {
  PlanViajeSituacionBadge,
  planDisponible,
  planEditable,
  solicitudVinculada,
} from '@/components/planes-viaje/plan-viaje-estado';
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

function rangoDelPlan(plan: PlanViajeResponse): string {
  if (plan.actividades.length === 0) return '—';
  const inicios = plan.actividades.map((a) => a.fechaInicio).sort();
  const fines = plan.actividades.map((a) => a.fechaFin).sort();
  const desde = formatFechaAnexo(inicios[0]);
  const hasta = formatFechaAnexo(fines[fines.length - 1]);
  return desde === hasta ? desde : `${desde} al ${hasta}`;
}

export default function PlanesViajePage() {
  const usuario = useAuthStore((state) => state.user);
  const [planes, setPlanes] = useState<PlanViajeResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [aEliminar, setAEliminar] = useState<PlanViajeResponse | null>(null);
  const [eliminando, setEliminando] = useState(false);

  const cargar = useCallback(async () => {
    try {
      setLoading(true);
      setPlanes(await planesViajeService.getAll());
    } catch {
      toast.error('No se pudieron cargar los planes de viaje.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const esMio = useCallback(
    (plan: PlanViajeResponse) => String(plan.usuarioId) === String(usuario?.id),
    [usuario?.id]
  );

  // ADMIN y EJECUTIVO reciben todos los planes; aquí cada uno ve los suyos
  const visibles = useMemo(
    () => planes.filter((p) => esMio(p)),
    [planes, esMio]
  );

  const confirmarEliminar = async () => {
    if (!aEliminar) return;
    try {
      setEliminando(true);
      await planesViajeService.remove(aEliminar.id);
      toast.success(`Plan ${aEliminar.codigoPlan} eliminado.`);
      setAEliminar(null);
      await cargar();
    } catch (error: unknown) {
      toast.error(
        axios.isAxiosError(error) && error.response?.data?.message
          ? String(error.response.data.message)
          : 'No se pudo eliminar el plan de viaje.'
      );
    } finally {
      setEliminando(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <MapIcon className="text-primary h-7 w-7" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Planes de Viaje
            </h1>
            <p className="text-muted-foreground">
              Planificación del viaje (ANEXO 1), con el VoBo del Director
              Ejecutivo en papel. Es el paso previo de toda solicitud de viaje.
            </p>
          </div>
        </div>

        <Button asChild>
          <Link href="/app/planes-viaje/nueva">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo plan de viaje
          </Link>
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-[300px] w-full" />
        </div>
      ) : visibles.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
          <div className="bg-muted flex h-16 w-16 items-center justify-center rounded-full">
            <MapIcon className="text-muted-foreground h-8 w-8" />
          </div>
          <h2 className="text-lg font-semibold">
            Aún no tienes planes de viaje
          </h2>
          <p className="text-muted-foreground max-w-sm text-sm">
            Planifica tu viaje con el botón &laquo;Nuevo plan de viaje&raquo;.
            Cuando esté completo podrás iniciar la solicitud de fondos.
          </p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[130px]">Código</TableHead>
                <TableHead>Objetivo del viaje</TableHead>
                <TableHead className="w-[200px]">Fechas</TableHead>
                <TableHead className="w-[140px]">Estado</TableHead>
                <TableHead className="w-[140px]">Solicitud</TableHead>
                <TableHead className="w-[60px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibles.map((plan) => {
                const solicitud = solicitudVinculada(plan);
                return (
                  <TableRow key={plan.id}>
                    <TableCell className="font-mono text-sm font-medium">
                      <Link
                        href={`/app/planes-viaje/${plan.id}`}
                        className="hover:underline"
                      >
                        {plan.codigoPlan}
                      </Link>
                    </TableCell>
                    <TableCell className="max-w-[360px] truncate text-sm">
                      {plan.objetivoViaje}
                      <span className="text-muted-foreground block text-xs">
                        {plan.lugaresViaje}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">
                      {rangoDelPlan(plan)}
                    </TableCell>
                    <TableCell>
                      <PlanViajeSituacionBadge plan={plan} />
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {solicitud ? (
                        <Link
                          href={`/app/solicitudes/${solicitud.id}`}
                          className="hover:underline"
                        >
                          {solicitud.codigoSolicitud}
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
                              href={`/app/planes-viaje/${plan.id}`}
                              className="flex items-center"
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              Ver ANEXO 1
                            </Link>
                          </DropdownMenuItem>
                          {planDisponible(plan) && (
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/app/solicitudes/nueva?planViajeId=${plan.id}`}
                                className="flex items-center"
                              >
                                <FilePlus2 className="mr-2 h-4 w-4" />
                                Crear solicitud de viaje
                              </Link>
                            </DropdownMenuItem>
                          )}
                          {planEditable(plan) && (
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/app/planes-viaje/${plan.id}/editar`}
                                className="flex items-center"
                              >
                                <Pencil className="mr-2 h-4 w-4" />
                                Editar
                              </Link>
                            </DropdownMenuItem>
                          )}
                          {!solicitud && (
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => setAEliminar(plan)}
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
            <AlertDialogTitle>¿Eliminar el plan de viaje?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará el plan {aEliminar?.codigoPlan} con sus{' '}
              {aEliminar?.actividades.length ?? 0} actividades. Esta acción no
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
