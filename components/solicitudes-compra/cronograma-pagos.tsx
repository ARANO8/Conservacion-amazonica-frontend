'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  Banknote,
  Check,
  CheckCircle2,
  ChevronsUpDown,
  ExternalLink,
  Info,
  MessageSquareWarning,
  RotateCcw,
  SendHorizonal,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn, formatDateShort, formatMoney } from '@/lib/utils';
import { solicitudesService } from '@/lib/services/solicitudes-service';
import { useCatalogos } from '@/hooks/use-catalogos';
import { useAuthStore } from '@/store/auth-store';
import type {
  EstadoPagoParcial,
  PagoParcialResponse,
} from '@/types/solicitud-backend';

const ESTADO_PAGO: Record<
  EstadoPagoParcial,
  { label: string; className: string }
> = {
  PLANIFICADO: {
    label: 'Planificado',
    className:
      'border-slate-300 bg-slate-50 text-slate-700 dark:bg-slate-900/40 dark:text-slate-300',
  },
  SOLICITADO: {
    label: 'Solicitado',
    className:
      'border-yellow-300 bg-yellow-50 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-300',
  },
  OBSERVADO: {
    label: 'Observado',
    className:
      'border-orange-300 bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300',
  },
  APROBADO: {
    label: 'Aprobado',
    className:
      'border-blue-300 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
  },
  PAGADO: {
    label: 'Pagado',
    className:
      'border-green-300 bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300',
  },
};

const ROLES_TESORERIA = ['TESORERO', 'ADMIN', 'EJECUTIVO'];

interface CronogramaPagosProps {
  solicitudId: number;
  pagos: PagoParcialResponse[];
  /** Se invoca tras cada transición para que el detalle vuelva a cargarse. */
  onActualizado: () => void | Promise<void>;
}

export function CronogramaPagos({
  solicitudId,
  pagos,
  onActualizado,
}: CronogramaPagosProps) {
  const { user } = useAuthStore();
  const { usuarios } = useCatalogos();

  const [pagoActivo, setPagoActivo] = useState<PagoParcialResponse | null>(
    null
  );
  /** Qué diálogo está abierto para `pagoActivo` */
  const [modo, setModo] = useState<'solicitar' | 'observar'>('solicitar');
  const [aprobadorId, setAprobadorId] = useState<number>(0);
  const [urlComprobante, setUrlComprobante] = useState('');
  const [urlInforme, setUrlInforme] = useState('');
  const [observacion, setObservacion] = useState('');
  const [comboOpen, setComboOpen] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const currentUserId = user?.id ? Number(user.id) : null;
  const esTesoreria = !!user?.rol && ROLES_TESORERIA.includes(user.rol);

  const ordenados = useMemo(
    () => [...pagos].sort((a, b) => a.numero - b.numero),
    [pagos]
  );
  const pagados = ordenados.filter((p) => p.estado === 'PAGADO').length;
  const observados = ordenados.filter((p) => p.estado === 'OBSERVADO').length;

  const destinatarios = useMemo(
    () => usuarios.filter((u) => Number(u.id) !== currentUserId),
    [usuarios, currentUserId]
  );

  // Al corregir una cuota observada se reutiliza el respaldo ya cargado para
  // que Adquisiciones sólo tenga que cambiar lo que motivó la devolución.
  const abrirSolicitud = (pago: PagoParcialResponse) => {
    setPagoActivo(pago);
    setModo('solicitar');
    setAprobadorId(pago.aprobadorId ?? 0);
    setUrlComprobante(pago.urlComprobante ?? '');
    setUrlInforme(pago.urlInforme ?? '');
  };

  const abrirObservacion = (pago: PagoParcialResponse) => {
    setPagoActivo(pago);
    setModo('observar');
    setObservacion('');
  };

  const ejecutar = async (accion: () => Promise<unknown>, exito: string) => {
    try {
      setEnviando(true);
      await accion();
      toast.success(exito);
      setPagoActivo(null);
      await onActualizado();
    } catch (error) {
      const mensaje =
        error &&
        typeof error === 'object' &&
        'response' in error &&
        typeof (error as { response?: { data?: { message?: string } } })
          .response?.data?.message === 'string'
          ? (error as { response: { data: { message: string } } }).response.data
              .message
          : 'No se pudo completar la operación.';
      toast.error(mensaje);
    } finally {
      setEnviando(false);
    }
  };

  const confirmarSolicitud = () => {
    if (!pagoActivo) return;
    if (!aprobadorId) {
      toast.error('Selecciona a quién enviar la solicitud de pago');
      return;
    }
    if (!urlComprobante.trim()) {
      toast.error('El comprobante del consultor es obligatorio');
      return;
    }
    void ejecutar(
      () =>
        solicitudesService.solicitarPago(solicitudId, pagoActivo.id, {
          aprobadorId,
          urlComprobante: urlComprobante.trim(),
          ...(urlInforme.trim() ? { urlInforme: urlInforme.trim() } : {}),
        }),
      `Pago ${pagoActivo.numero} enviado para aprobación`
    );
  };

  const confirmarObservacion = () => {
    if (!pagoActivo) return;
    if (observacion.trim().length < 5) {
      toast.error('Describe el motivo de la observación');
      return;
    }
    void ejecutar(
      () =>
        solicitudesService.observarPago(
          solicitudId,
          pagoActivo.id,
          observacion.trim()
        ),
      `Pago ${pagoActivo.numero} devuelto a Adquisiciones`
    );
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
        <div>
          <CardTitle className="text-base">Cronograma de Pagos</CardTitle>
          <p className="text-muted-foreground mt-1 text-xs">
            {pagados} de {ordenados.length} cuotas pagadas
            {observados > 0 &&
              ` · ${observados} observada${observados > 1 ? 's' : ''}`}
          </p>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="text-muted-foreground flex items-start gap-2 rounded-lg border border-dashed p-3 text-xs">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Las solicitudes de pago de consultoría las realiza Adquisiciones
            (Denis Ruiz).
          </span>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[70px]">Pago</TableHead>
                <TableHead>Producto / Hito</TableHead>
                <TableHead className="w-[130px]">Fecha prevista</TableHead>
                <TableHead className="w-[130px] text-right">
                  Monto (Bs)
                </TableHead>
                <TableHead className="w-[120px]">Estado</TableHead>
                <TableHead className="w-[230px] text-right">Acción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ordenados.map((pago) => {
                const esAprobador =
                  currentUserId !== null && pago.aprobadorId === currentUserId;

                return (
                  <TableRow key={pago.id}>
                    <TableCell className="font-medium">{pago.numero}</TableCell>
                    <TableCell>
                      {pago.descripcion?.trim() || '-'}
                      {(pago.urlComprobante || pago.urlInforme) && (
                        <span className="mt-1 flex gap-3">
                          {pago.urlComprobante && (
                            <a
                              href={pago.urlComprobante}
                              target="_blank"
                              rel="noreferrer"
                              className="text-primary inline-flex items-center gap-1 text-xs hover:underline"
                            >
                              <ExternalLink className="h-3 w-3" />
                              Comprobante
                            </a>
                          )}
                          {pago.urlInforme && (
                            <a
                              href={pago.urlInforme}
                              target="_blank"
                              rel="noreferrer"
                              className="text-primary inline-flex items-center gap-1 text-xs hover:underline"
                            >
                              <ExternalLink className="h-3 w-3" />
                              Informe
                            </a>
                          )}
                        </span>
                      )}
                      {pago.estado === 'OBSERVADO' && pago.observacion && (
                        <span className="mt-1 block text-xs text-orange-700 dark:text-orange-300">
                          Observación: {pago.observacion}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDateShort(pago.fechaPago)}
                      {pago.fechaPagoReal && (
                        <span className="text-muted-foreground block text-xs">
                          Pagado: {formatDateShort(pago.fechaPagoReal)}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatMoney(Number(pago.monto))}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={ESTADO_PAGO[pago.estado]?.className ?? ''}
                      >
                        {ESTADO_PAGO[pago.estado]?.label ?? pago.estado}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {pago.estado === 'PLANIFICADO' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => abrirSolicitud(pago)}
                        >
                          <SendHorizonal className="mr-2 h-4 w-4" />
                          Solicitar pago
                        </Button>
                      )}

                      {pago.estado === 'OBSERVADO' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => abrirSolicitud(pago)}
                        >
                          <RotateCcw className="mr-2 h-4 w-4" />
                          Corregir y reenviar
                        </Button>
                      )}

                      {pago.estado === 'SOLICITADO' && esAprobador && (
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={enviando}
                            onClick={() => abrirObservacion(pago)}
                          >
                            <MessageSquareWarning className="mr-2 h-4 w-4" />
                            Observar
                          </Button>
                          <Button
                            size="sm"
                            disabled={enviando}
                            onClick={() =>
                              void ejecutar(
                                () =>
                                  solicitudesService.aprobarPago(
                                    solicitudId,
                                    pago.id
                                  ),
                                `Pago ${pago.numero} aprobado`
                              )
                            }
                          >
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Aprobar
                          </Button>
                        </div>
                      )}

                      {pago.estado === 'SOLICITADO' && !esAprobador && (
                        <span className="text-muted-foreground text-xs">
                          Esperando aprobación
                        </span>
                      )}

                      {pago.estado === 'APROBADO' && esTesoreria && (
                        <Button
                          size="sm"
                          disabled={enviando}
                          onClick={() =>
                            void ejecutar(
                              () =>
                                solicitudesService.pagarPago(
                                  solicitudId,
                                  pago.id
                                ),
                              `Pago ${pago.numero} registrado`
                            )
                          }
                        >
                          <Banknote className="mr-2 h-4 w-4" />
                          Registrar pago
                        </Button>
                      )}

                      {pago.estado === 'APROBADO' && !esTesoreria && (
                        <span className="text-muted-foreground text-xs">
                          Listo para tesorería
                        </span>
                      )}

                      {pago.estado === 'PAGADO' && (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {/* Diálogo de solicitud de pago */}
      <Dialog
        open={!!pagoActivo && modo === 'solicitar'}
        onOpenChange={(open) => !open && setPagoActivo(null)}
      >
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>
              {pagoActivo?.estado === 'OBSERVADO'
                ? 'Corregir y reenviar pago'
                : 'Solicitar pago'}{' '}
              {pagoActivo?.numero}
              {pagoActivo ? ` — ${formatMoney(Number(pagoActivo.monto))}` : ''}
            </DialogTitle>
            <DialogDescription>
              Adjunta el respaldo del consultor y elige quién debe aprobarlo.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {pagoActivo?.estado === 'OBSERVADO' && pagoActivo.observacion && (
              <div className="rounded-md border border-orange-300 bg-orange-50 p-3 text-xs text-orange-800 dark:bg-orange-950/40 dark:text-orange-200">
                <span className="font-semibold">Motivo de la devolución:</span>{' '}
                {pagoActivo.observacion}
              </div>
            )}

            <div className="space-y-1.5">
              <Label>
                Comprobante del consultor{' '}
                <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="https://drive.google.com/..."
                value={urlComprobante}
                onChange={(e) => setUrlComprobante(e.target.value)}
              />
              <p className="text-muted-foreground text-xs">
                Factura o recibo que respalda este pago.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label>Informe o producto entregado</Label>
              <Input
                placeholder="https://drive.google.com/..."
                value={urlInforme}
                onChange={(e) => setUrlInforme(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label>
                Enviar a <span className="text-destructive">*</span>
              </Label>
              <Popover open={comboOpen} onOpenChange={setComboOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between font-normal"
                  >
                    {aprobadorId
                      ? (destinatarios.find((u) => Number(u.id) === aprobadorId)
                          ?.nombreCompleto ?? 'Seleccionar...')
                      : 'Seleccionar...'}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                  <Command>
                    <CommandInput placeholder="Buscar persona..." />
                    <CommandList>
                      <CommandEmpty>Sin resultados.</CommandEmpty>
                      <CommandGroup>
                        {destinatarios.map((u) => (
                          <CommandItem
                            key={u.id}
                            value={u.nombreCompleto}
                            onSelect={() => {
                              setAprobadorId(Number(u.id));
                              setComboOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                'mr-2 h-4 w-4',
                                Number(u.id) === aprobadorId
                                  ? 'opacity-100'
                                  : 'opacity-0'
                              )}
                            />
                            <span className="truncate">
                              {u.nombreCompleto}
                              {u.cargo && (
                                <span className="text-muted-foreground">
                                  {' '}
                                  — {u.cargo}
                                </span>
                              )}
                            </span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPagoActivo(null)}
              disabled={enviando}
            >
              Cancelar
            </Button>
            <Button onClick={confirmarSolicitud} disabled={enviando}>
              <SendHorizonal className="mr-2 h-4 w-4" />
              Enviar solicitud
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de observación (devolución a Adquisiciones) */}
      <Dialog
        open={!!pagoActivo && modo === 'observar'}
        onOpenChange={(open) => !open && setPagoActivo(null)}
      >
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>
              Observar pago {pagoActivo?.numero}
              {pagoActivo ? ` — ${formatMoney(Number(pagoActivo.monto))}` : ''}
            </DialogTitle>
            <DialogDescription>
              La cuota vuelve a Adquisiciones para que corrija el respaldo y la
              reenvíe. El contrato sigue en ejecución.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-1.5">
            <Label>
              Motivo de la observación{' '}
              <span className="text-destructive">*</span>
            </Label>
            <Textarea
              rows={4}
              placeholder="Ej. El recibo no coincide con el monto de la cuota"
              value={observacion}
              onChange={(e) => setObservacion(e.target.value)}
              maxLength={500}
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPagoActivo(null)}
              disabled={enviando}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={confirmarObservacion}
              disabled={enviando}
            >
              <MessageSquareWarning className="mr-2 h-4 w-4" />
              Devolver con observación
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
