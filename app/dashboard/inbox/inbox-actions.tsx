'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { SolicitudResponse } from '@/types/solicitud-backend';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Textarea } from '@/components/ui/textarea';
import {
  MoreHorizontal,
  Eye,
  CheckCircle,
  AlertCircle,
  Check,
  ChevronsUpDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { toast } from 'sonner';
import api from '@/lib/api';
import { useCatalogos } from '@/hooks/use-catalogos';
import { useAuthStore } from '@/store/auth-store';

interface InboxActionsProps {
  request: SolicitudResponse;
}

export function InboxActions({ request }: InboxActionsProps) {
  const router = useRouter();
  const { user: currentUser } = useAuthStore();
  const { usuarios, isLoading: loadingUsers } = useCatalogos();

  const [isApproveOpen, setIsApproveOpen] = React.useState(false);
  const [isObserveOpen, setIsObserveOpen] = React.useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  // States for forms
  const [nuevoAprobadorId, setNuevoAprobadorId] = React.useState<string>('');
  const [observacion, setObservacion] = React.useState<string>('');

  const filteredUsers = React.useMemo(() => {
    return usuarios.filter((u) => String(u.id) !== String(currentUser?.id));
  }, [usuarios, currentUser]);

  const handleAprobar = async () => {
    if (!nuevoAprobadorId) {
      toast.error('Debe seleccionar el siguiente aprobador');
      return;
    }

    try {
      setSubmitting(true);
      await api.patch(`/solicitudes/${request.id}/aprobar`, {
        nuevoAprobadorId: Number(nuevoAprobadorId),
      });
      toast.success('Solicitud derivada correctamente');
      setIsApproveOpen(false);
      router.refresh();
    } catch {
      toast.error('Error al derivar la solicitud');
    } finally {
      setSubmitting(false);
    }
  };

  const handleObservar = async () => {
    if (!observacion.trim()) {
      toast.error('Debe ingresar un motivo para la observación');
      return;
    }

    try {
      setSubmitting(true);
      await api.patch(`/solicitudes/${request.id}/observar`, {
        observacion,
      });
      toast.success('Solicitud observada correctamente');
      setIsObserveOpen(false);
      router.refresh();
    } catch {
      toast.error('Error al observar la solicitud');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
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
              href={`/dashboard/requests/${request.id}`}
              className="flex items-center"
            >
              <Eye className="mr-2 h-4 w-4" />
              Ver Detalle
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setIsApproveOpen(true)}>
            <CheckCircle className="mr-2 h-4 w-4 text-emerald-500" />
            Aprobar / Derivar
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setIsObserveOpen(true)}>
            <AlertCircle className="mr-2 h-4 w-4 text-amber-500" />
            Observar / Devolver
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Modal Aprobar / Derivar */}
      <Dialog open={isApproveOpen} onOpenChange={setIsApproveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Derivar Solicitud</DialogTitle>
            <DialogDescription>
              Seleccione al siguiente usuario que debe revisar esta solicitud.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={isPopoverOpen}
                  className={cn(
                    'w-full justify-between font-normal',
                    !nuevoAprobadorId && 'text-muted-foreground'
                  )}
                  disabled={loadingUsers}
                >
                  {nuevoAprobadorId
                    ? filteredUsers.find(
                        (u) => String(u.id) === nuevoAprobadorId
                      )?.nombreCompleto || 'Seleccionar aprobador...'
                    : 'Seleccionar aprobador...'}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-[var(--radix-popover-trigger-width)] p-0"
                align="start"
              >
                <Command>
                  <CommandInput placeholder="Buscar aprobador..." />
                  <CommandList>
                    <CommandEmpty>No se encontró el usuario.</CommandEmpty>
                    <CommandGroup>
                      {filteredUsers.map((user) => (
                        <CommandItem
                          key={user.id}
                          value={user.nombreCompleto}
                          onSelect={() => {
                            setNuevoAprobadorId(String(user.id));
                            setIsPopoverOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              'mr-2 h-4 w-4',
                              String(user.id) === nuevoAprobadorId
                                ? 'opacity-100'
                                : 'opacity-0'
                            )}
                          />
                          {user.nombreCompleto}
                          {user.cargo ? ` - ${user.cargo}` : ''}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsApproveOpen(false)}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button onClick={handleAprobar} disabled={submitting}>
              {submitting ? 'Procesando...' : 'Confirmar Derivación'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Observar / Devolver */}
      <Dialog open={isObserveOpen} onOpenChange={setIsObserveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Observar Solicitud</DialogTitle>
            <DialogDescription>
              Explique el motivo por el cual la solicitud está siendo observada
              o devuelta al emisor.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Ingrese el motivo de la observación..."
              value={observacion}
              onChange={(e) => setObservacion(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsObserveOpen(false)}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleObservar}
              disabled={submitting}
            >
              {submitting ? 'Procesando...' : 'Enviar Observación'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
