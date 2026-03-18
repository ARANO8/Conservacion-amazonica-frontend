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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  MoreHorizontal,
  Download,
  CheckCircle,
  AlertCircle,
  Check,
  ChevronsUpDown,
  Banknote,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { toast } from 'sonner';
import api from '@/lib/api';
import { solicitudesService } from '@/lib/services/solicitudes-service';
import { useCatalogos } from '@/hooks/use-catalogos';
import { useAuthStore } from '@/store/auth-store';

interface InboxActionsProps {
  request: SolicitudResponse;
  mode?: 'dropdown' | 'buttons';
}

export function InboxActions({
  request,
  mode = 'dropdown',
}: InboxActionsProps) {
  const router = useRouter();
  const { user: currentUser } = useAuthStore();
  const { usuarios, isLoading: loadingUsers } = useCatalogos();

  const isTesorero = currentUser?.rol === 'TESORERO';

  const [isApproveOpen, setIsApproveOpen] = React.useState(false);
  const [isObserveOpen, setIsObserveOpen] = React.useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  // States for forms
  const [nuevoAprobadorId, setNuevoAprobadorId] = React.useState<string>('');
  const [observacion, setObservacion] = React.useState<string>('');
  const [codigoDesembolso, setCodigoDesembolso] = React.useState<string>('');
  const [urlComprobante, setUrlComprobante] = React.useState<string>('');

  const filteredUsers = React.useMemo(() => {
    return usuarios.filter((u) => String(u.id) !== String(currentUser?.id));
  }, [usuarios, currentUser]);

  // ── Derivar (Admin / otros aprobadores) ──
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
      setNuevoAprobadorId('');
      if (mode === 'buttons') {
        router.push('/app/aprobaciones');
      } else {
        router.refresh();
      }
    } catch {
      toast.error('Error al derivar la solicitud');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Desembolsar (Tesorero) ──
  const handleDesembolsar = async () => {
    if (!codigoDesembolso.trim()) {
      toast.error('Debe ingresar el código de transferencia');
      return;
    }

    try {
      setSubmitting(true);
      await solicitudesService.desembolsar(
        request.id,
        codigoDesembolso.trim(),
        urlComprobante.trim() || undefined
      );
      toast.success('Solicitud desembolsada correctamente');
      setIsApproveOpen(false);
      setCodigoDesembolso('');
      setUrlComprobante('');
      if (mode === 'buttons') {
        router.push('/app/aprobaciones');
      } else {
        router.refresh();
      }
    } catch {
      toast.error('Error al desembolsar la solicitud');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Observar ──
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
      setObservacion('');
      if (mode === 'buttons') {
        router.push('/app/aprobaciones');
      } else {
        router.refresh();
      }
    } catch {
      toast.error('Error al observar la solicitud');
    } finally {
      setSubmitting(false);
    }
  };

  // Dropdown mode: icon with menu
  const renderDropdown = () => (
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
            href={`/app/aprobaciones/${request.id}`}
            className="flex items-center"
          >
            <Download className="mr-2 h-4 w-4" />
            Descargar Solicitud
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  // Buttons mode: large action buttons for detail page
  const renderButtons = () => (
    <div className="flex w-full flex-col gap-3 sm:flex-row">
      <Button
        size="lg"
        className={cn(
          'flex-1',
          isTesorero
            ? 'bg-blue-600 hover:bg-blue-700'
            : 'bg-emerald-600 hover:bg-emerald-700'
        )}
        onClick={() => setIsApproveOpen(true)}
      >
        {isTesorero ? (
          <>
            <Banknote className="mr-2 h-5 w-5" />
            Desembolsar
          </>
        ) : (
          <>
            <CheckCircle className="mr-2 h-5 w-5" />
            Aprobar / Derivar
          </>
        )}
      </Button>
      <Button
        size="lg"
        variant="outline"
        className="flex-1 border-amber-500 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950"
        onClick={() => setIsObserveOpen(true)}
      >
        <AlertCircle className="mr-2 h-5 w-5" />
        Observar / Devolver
      </Button>
    </div>
  );

  // ── Modal content: Derivar vs Desembolsar ──
  const renderApproveModalContent = () => {
    if (isTesorero) {
      return (
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Desembolsar Solicitud</DialogTitle>
            <DialogDescription>
              Ingrese el código de transferencia o comprobante para confirmar el
              desembolso de esta solicitud.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label
                htmlFor="codigoDesembolso"
                className="text-sm leading-none font-medium"
              >
                Código de Transferencia / Comprobante{' '}
                <span className="text-destructive">*</span>
              </label>
              <Input
                id="codigoDesembolso"
                placeholder="Ej. TRF-2026-00123"
                value={codigoDesembolso}
                onChange={(e) => setCodigoDesembolso(e.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <label
                htmlFor="urlComprobante"
                className="text-sm leading-none font-medium"
              >
                URL del Comprobante{' '}
                <span className="text-muted-foreground ml-1 font-normal">
                  (opcional)
                </span>
              </label>
              <Input
                id="urlComprobante"
                type="url"
                placeholder="Ej: Google Drive, OneDrive..."
                value={urlComprobante}
                onChange={(e) => setUrlComprobante(e.target.value)}
              />
              <p className="text-muted-foreground text-xs">
                Enlace al comprobante de transferencia (Google Drive, OneDrive,
                etc.).
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsApproveOpen(false);
                setCodigoDesembolso('');
                setUrlComprobante('');
              }}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              onClick={handleDesembolsar}
              disabled={submitting || !codigoDesembolso.trim()}
            >
              {submitting ? 'Procesando...' : 'Confirmar Desembolso'}
            </Button>
          </DialogFooter>
        </DialogContent>
      );
    }

    return (
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
                  ? filteredUsers.find((u) => String(u.id) === nuevoAprobadorId)
                      ?.nombreCompleto || 'Seleccionar aprobador...'
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
    );
  };

  return (
    <>
      {mode === 'dropdown' ? renderDropdown() : renderButtons()}

      {/* Modal Aprobar/Derivar o Desembolsar (según rol) */}
      <Dialog open={isApproveOpen} onOpenChange={setIsApproveOpen}>
        {renderApproveModalContent()}
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
