'use client';

import axios from 'axios';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  AlertCircle,
  ArrowLeft,
  Banknote,
  Calendar,
  CheckCircle,
  Check,
  ChevronsUpDown,
  DollarSign,
  ShieldCheck,
  Wallet,
} from 'lucide-react';
import type {
  RendicionResponse,
  EstadoRendicion,
} from '@/types/rendicion-backend';
import { formatMoney, formatDate } from '@/lib/utils';
import { RendicionGastosSection } from '@/components/rendiciones/rendicion-gastos-section';
import { RendicionDeclaracionSection } from '@/components/rendiciones/rendicion-declaracion-section';
import { RendicionSolicitudSection } from '@/components/rendiciones/rendicion-solicitud-section';
import { useAuthStore } from '@/store/auth-store';
import { catalogosService } from '@/services/catalogos.service';
import { Usuario } from '@/types/catalogs';
import { rendicionesService } from '@/lib/services/rendiciones-service';
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
import { toast } from 'sonner';

interface RendicionDetailClientProps {
  rendicion: RendicionResponse;
}

const ESTADO_COLORS: Record<EstadoRendicion, string> = {
  PENDIENTE: 'bg-yellow-100 text-yellow-800',
  APROBADO: 'bg-green-100 text-green-800',
  OBSERVADO: 'bg-orange-100 text-orange-800',
  RECHAZADO: 'bg-red-100 text-red-800',
  APROBADA: 'bg-green-100 text-green-800',
  OBSERVADA: 'bg-orange-100 text-orange-800',
  RECHAZADA: 'bg-red-100 text-red-800',
};

function toNumber(value: string | number | null | undefined): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

export function RendicionDetailClient({
  rendicion,
}: RendicionDetailClientProps) {
  const router = useRouter();
  const { user } = useAuthStore();

  const [approveOpen, setApproveOpen] = useState(false);
  const [observeOpen, setObserveOpen] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [derivadoAId, setDerivadoAId] = useState<string>('');
  const [comentarioAprobar, setComentarioAprobar] = useState('');
  const [comentarioObservar, setComentarioObservar] = useState('');

  const currentUserId = user?.id ? Number(user.id) : null;
  const currentUserRol = user?.rol;
  const isTesorero = currentUserRol === 'TESORERO';

  const puedeAccionar = useMemo(() => {
    if (!currentUserId) return false;
    return (
      rendicion.estado === 'PENDIENTE' &&
      Number(rendicion.aprobadorActualId) === currentUserId
    );
  }, [currentUserId, rendicion]);

  const gastosRegistrados = useMemo(
    () => rendicion.gastosRendicion ?? rendicion.gastos ?? [],
    [rendicion.gastosRendicion, rendicion.gastos]
  );

  const totalEfectivoPagado = useMemo(
    () =>
      gastosRegistrados.reduce(
        (acc, gasto) => acc + toNumber(gasto.montoNeto),
        0
      ),
    [gastosRegistrados]
  );

  const montoRecibido = useMemo(
    () => toNumber(rendicion.solicitud?.montoTotalNeto),
    [rendicion.solicitud?.montoTotalNeto]
  );

  const saldoLiquido = useMemo(
    () => montoRecibido - totalEfectivoPagado,
    [montoRecibido, totalEfectivoPagado]
  );

  const usuariosFiltrados = useMemo(
    () => usuarios.filter((u) => Number(u.id) !== currentUserId),
    [usuarios, currentUserId]
  );

  const openApproveDialog = async () => {
    if (!isTesorero) {
      try {
        const data = await catalogosService.getUsuarios();
        setUsuarios(data);
      } catch {
        toast.error('No se pudo cargar la lista de usuarios para derivación.');
        return;
      }
    }

    setApproveOpen(true);
  };

  const handleAprobar = async () => {
    if (!isTesorero && !derivadoAId) {
      toast.error('Debes seleccionar al siguiente usuario para derivar.');
      return;
    }

    try {
      setLoadingAction(true);
      await rendicionesService.aprobarRendicion(rendicion.id, {
        comentario: comentarioAprobar || undefined,
        ...(isTesorero ? {} : { derivadoAId: Number(derivadoAId) }),
      });

      toast.success(
        isTesorero
          ? 'Rendición aprobada de forma final.'
          : 'Rendición derivada correctamente.'
      );
      setApproveOpen(false);
      window.dispatchEvent(new CustomEvent('rendicion-updated'));
    } catch (error: unknown) {
      let message = 'No se pudo procesar la aprobación.';
      if (axios.isAxiosError(error)) {
        const backendMessage = error.response?.data?.message;
        if (Array.isArray(backendMessage)) {
          message = backendMessage.join('. ');
        } else if (typeof backendMessage === 'string') {
          message = backendMessage;
        }
      }
      toast.error(message);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleObservar = async () => {
    if (!comentarioObservar.trim()) {
      toast.error('El comentario es obligatorio para observar la rendición.');
      return;
    }

    try {
      setLoadingAction(true);
      await rendicionesService.observarRendicion(rendicion.id, {
        comentario: comentarioObservar.trim(),
      });

      toast.success('Rendición observada correctamente.');
      setObserveOpen(false);
      window.dispatchEvent(new CustomEvent('rendicion-updated'));
    } catch (error: unknown) {
      let message = 'No se pudo observar la rendición.';
      if (axios.isAxiosError(error)) {
        const backendMessage = error.response?.data?.message;
        if (Array.isArray(backendMessage)) {
          message = backendMessage.join('. ');
        } else if (typeof backendMessage === 'string') {
          message = backendMessage;
        }
      }
      toast.error(message);
    } finally {
      setLoadingAction(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">
                Rendición #{rendicion.id}
              </h1>
              <Badge className={ESTADO_COLORS[rendicion.estado]}>
                {rendicion.estado}
              </Badge>
            </div>
            <p className="text-amzdesk-helper">
              Revisa los detalles antes de tomar una decisión.
            </p>
          </div>
        </div>
      </div>

      <Separator />

      {/* Main Info Card */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-amzdesk-label">
              Fecha de Rendición
            </CardTitle>
            <Calendar className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-amzdesk-monto">
              {formatDate(rendicion.fechaRendicion)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-amzdesk-label">
              Dinero Recibido
            </CardTitle>
            <DollarSign className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-amzdesk-monto text-emerald-600">
              {formatMoney(montoRecibido)}
            </div>
            <p className="text-amzdesk-helper">Según solicitud desembolsada</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-amzdesk-label">
              Efectivo Ejecutado
            </CardTitle>
            <Wallet className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-amzdesk-monto text-blue-600">
              {formatMoney(totalEfectivoPagado)}
            </div>
            <p className="text-amzdesk-helper">
              Suma netos | Bruto: {formatMoney(rendicion.montoRespaldado)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-amzdesk-label">Saldo Líquido</CardTitle>
            <Banknote className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-amzdesk-monto ${
                saldoLiquido > 0 ? 'text-emerald-600' : 'text-red-600'
              }`}
            >
              {formatMoney(saldoLiquido)}
            </div>
            <p className="text-amzdesk-helper">Recibido - Efectivo pagado</p>
          </CardContent>
        </Card>
      </div>

      {/* Solicitud Section */}
      <RendicionSolicitudSection solicitud={rendicion.solicitud} />

      {/* Gastos Section */}
      {gastosRegistrados.length > 0 && (
        <RendicionGastosSection gastos={gastosRegistrados} />
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Informe</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {rendicion.informeGastos ? (
            <>
              <p className="text-sm">
                Periodo: {formatDate(rendicion.informeGastos.fechaInicio)} -{' '}
                {formatDate(rendicion.informeGastos.fechaFin)}
              </p>
              {rendicion.informeGastos.actividades?.length ? (
                <div className="space-y-2">
                  {rendicion.informeGastos.actividades.map(
                    (actividad, index) => (
                      <div key={actividad.id} className="rounded-md border p-3">
                        <p className="text-sm font-semibold">
                          Actividad #{index + 1}
                        </p>
                        <p className="text-muted-foreground text-sm">
                          Fecha: {formatDate(actividad.fecha)}
                        </p>
                        <p className="text-muted-foreground text-sm">
                          Lugar: {actividad.lugar}
                        </p>
                        <p className="text-muted-foreground text-sm">
                          Persona / Institucion: {actividad.personaInstitucion}
                        </p>
                        <p className="mt-2 text-sm whitespace-pre-wrap">
                          {actividad.actividadesRealizadas}
                        </p>
                      </div>
                    )
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">Sin informe.</p>
              )}
            </>
          ) : (
            <p className="text-muted-foreground text-sm">Sin informe.</p>
          )}
        </CardContent>
      </Card>

      {/* Declaración Jurada Section */}
      {rendicion.declaracionesJuradas &&
        rendicion.declaracionesJuradas.length > 0 && (
          <RendicionDeclaracionSection
            declaraciones={rendicion.declaracionesJuradas}
          />
        )}

      {/* Observaciones */}
      {rendicion.observaciones && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Observaciones</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">
              {rendicion.observaciones}
            </p>
          </CardContent>
        </Card>
      )}

      <Separator />

      {puedeAccionar && (
        <div className="bg-background sticky bottom-0 border-t py-4">
          <div className="mx-auto max-w-2xl">
            <div className="flex w-full flex-col gap-3 sm:flex-row">
              <Button
                size="lg"
                className={`flex-1 ${
                  isTesorero
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
                onClick={() => void openApproveDialog()}
                disabled={loadingAction}
              >
                <CheckCircle className="mr-2 h-5 w-5" />
                {isTesorero ? 'Aprobación Final' : 'Aprobar / Derivar'}
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="flex-1 border-amber-500 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950"
                onClick={() => setObserveOpen(true)}
                disabled={loadingAction}
              >
                <AlertCircle className="mr-2 h-5 w-5" />
                Observar / Devolver
              </Button>
            </div>
          </div>
        </div>
      )}

      <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isTesorero ? 'Aprobación Final' : 'Aprobar y Derivar'}
            </DialogTitle>
            <DialogDescription>
              {isTesorero
                ? 'Esta acción cerrará la rendición y afectará el monto ejecutado del POA.'
                : 'Aprueba esta revisión y deriva manualmente al siguiente responsable.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {!isTesorero && (
              <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={popoverOpen}
                    className={`w-full justify-between font-normal ${
                      !derivadoAId ? 'text-muted-foreground' : ''
                    }`}
                  >
                    {derivadoAId
                      ? usuariosFiltrados.find(
                          (u) => String(u.id) === String(derivadoAId)
                        )?.nombreCompleto || 'Seleccionar usuario...'
                      : 'Seleccionar siguiente usuario...'}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-[var(--radix-popover-trigger-width)] p-0"
                  align="start"
                >
                  <Command>
                    <CommandInput placeholder="Buscar usuario..." />
                    <CommandList>
                      <CommandEmpty>No se encontró usuario.</CommandEmpty>
                      <CommandGroup>
                        {usuariosFiltrados.map((u) => (
                          <CommandItem
                            key={u.id}
                            value={u.nombreCompleto}
                            onSelect={() => {
                              setDerivadoAId(String(u.id));
                              setPopoverOpen(false);
                            }}
                          >
                            <Check
                              className={`mr-2 h-4 w-4 ${
                                String(u.id) === String(derivadoAId)
                                  ? 'opacity-100'
                                  : 'opacity-0'
                              }`}
                            />
                            {u.nombreCompleto}
                            {u.cargo ? ` - ${u.cargo}` : ''}
                            {u.rol ? ` (${u.rol})` : ''}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            )}

            {isTesorero && (
              <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                <p className="flex items-center gap-2 font-medium">
                  <ShieldCheck className="h-4 w-4" />
                  Esta aprobación ejecutará el impacto presupuestario en POA.
                </p>
              </div>
            )}

            <Textarea
              placeholder="Comentario (opcional)"
              value={comentarioAprobar}
              onChange={(e) => setComentarioAprobar(e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setApproveOpen(false)}
              disabled={loadingAction}
            >
              Cancelar
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={() => void handleAprobar()}
              disabled={loadingAction}
            >
              {loadingAction ? 'Procesando...' : 'Confirmar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={observeOpen} onOpenChange={setObserveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Observar Rendición</DialogTitle>
            <DialogDescription>
              Registra una observación para devolver la rendición al creador.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2">
            <Textarea
              placeholder="Comentario obligatorio"
              value={comentarioObservar}
              onChange={(e) => setComentarioObservar(e.target.value)}
              className="min-h-[120px]"
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setObserveOpen(false)}
              disabled={loadingAction}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => void handleObservar()}
              disabled={loadingAction}
            >
              {loadingAction ? 'Procesando...' : 'Enviar Observación'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
