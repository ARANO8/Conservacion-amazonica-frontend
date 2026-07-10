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
  Info,
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
import { RendicionSolicitudSection } from '@/components/rendiciones/rendicion-solicitud-section';
import { RendicionPartidasPresupuestarias } from '@/components/rendiciones/rendicion-partidas-presupuestarias';
import type { SolicitudResponse } from '@/types/solicitud-backend';
import { useAuthStore } from '@/store/auth-store';
import { catalogosService } from '@/lib/services/catalogos-service';
import { Usuario, type PartidaContable } from '@/types/catalogs';
import { rendicionesService } from '@/lib/services/rendiciones-service';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface RendicionDetailClientProps {
  rendicion: RendicionResponse;
  onPartidaContableUpdated?: (
    gastoId: number,
    partidaContable: PartidaContable | null,
  ) => void;
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
  onPartidaContableUpdated,
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
  const [gastoValidaciones, setGastoValidaciones] = useState<
    Record<number, { estado: 'vacio' | 'correcto' | 'observado'; observacion: string }>
  >({});

  const handleUpdatePartidaContable = async (gastoId: number, codigo: string | null) => {
    try {
      const updated = await rendicionesService.updateGastoPartidaContable(gastoId, codigo);
      if (codigo && updated?.partidaContable) {
        toast.success(`Partida contable "${updated.partidaContable.codigo}" vinculada.`);
        onPartidaContableUpdated?.(gastoId, updated.partidaContable);
      } else {
        toast.success('Partida contable desvinculada.');
        onPartidaContableUpdated?.(gastoId, null);
      }
    } catch (error: unknown) {
      const message =
        error instanceof axios.AxiosError && error.response?.data?.message
          ? error.response.data.message
          : 'No se pudo vincular la partida contable.';
      toast.error(message);
    }
  };

  const handleUpdatePartidaPresupuestaria = async (gastoId: number, partidaId: number | null) => {
    try {
      const updated = await rendicionesService.updateGastoPartidaPresupuestaria(gastoId, partidaId);
      if (partidaId && updated?.partida) {
        toast.success('Partida presupuestaria vinculada.');
      } else {
        toast.success('Partida presupuestaria desvinculada.');
      }
    } catch (error: unknown) {
      const message =
        error instanceof axios.AxiosError && error.response?.data?.message
          ? error.response.data.message
          : 'No se pudo vincular la partida presupuestaria.';
      toast.error(message);
    }
  };

  const handleGastoValidacionChange = (
    gastoId: number,
    estado: 'vacio' | 'correcto' | 'observado',
    observacion: string,
  ) => {
    setGastoValidaciones((prev) => ({ ...prev, [gastoId]: { estado, observacion } }));
  };

  const hasIncorrectos = Object.values(gastoValidaciones).some(
    (v) => v.estado === 'observado',
  );

  const currentUserId = user?.id ? Number(user.id) : null;
  const currentUserRol = user?.rol;
  const isContador = currentUserRol === 'CONTADOR';

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

  const canEditPartidaContable = puedeAccionar && !isContador;
  const canEditPartidaPresupuestaria = puedeAccionar && !isContador;

  const partidasPresupuestarias = useMemo(
    () => rendicion.solicitud?.presupuestos ?? [],
    [rendicion.solicitud],
  );

  const resumenContable = useMemo(() => {
    const map = new Map<
      string,
      { codigo: string; nombre: string; neto: number; impuestos: number; bruto: number }
    >();

    for (const g of gastosRegistrados) {
      const code = g.partidaContable?.codigo ?? 'S/C';
      const name = g.partidaContable?.nombre ?? 'Sin Clasificar';

      const exist = map.get(code);
      const netoVal = toNumber(g.montoNeto);
      const impVal = toNumber(g.montoImpuestos);
      const brutoVal = toNumber(g.montoTotal ?? g.montoBruto ?? g.monto);

      if (exist) {
        exist.neto += netoVal;
        exist.impuestos += impVal;
        exist.bruto += brutoVal;
      } else {
        map.set(code, {
          codigo: code,
          nombre: name,
          neto: netoVal,
          impuestos: impVal,
          bruto: brutoVal,
        });
      }
    }
    return Array.from(map.values());
  }, [gastosRegistrados]);

  const resumenPresupuestario = useMemo(() => {
    type Entry = {
      id: number;
      codigo: string;
      nombre: string;
      proyecto: string;
      grupo: string;
      neto: number;
      impuestos: number;
      bruto: number;
    };
    const map = new Map<number, Entry>();
    const seenOrder: number[] = [];

    for (const g of gastosRegistrados) {
      const partida = g.partida;
      if (!partida) continue;
      const id = partida.id;

      const exist = map.get(id);
      const netoVal = toNumber(g.montoNeto);
      const impVal = toNumber(g.montoImpuestos);
      const brutoVal = toNumber(g.montoTotal ?? g.montoBruto ?? g.monto);

      if (exist) {
        exist.neto += netoVal;
        exist.impuestos += impVal;
        exist.bruto += brutoVal;
      } else {
        map.set(id, {
          id,
          codigo: partida.poa?.codigoPoa ?? '—',
          nombre: partida.poa?.estructura?.partida?.nombre ?? '',
          proyecto: partida.poa?.estructura?.proyecto?.nombre ?? '',
          grupo: partida.poa?.estructura?.grupo?.nombre ?? '',
          neto: netoVal,
          impuestos: impVal,
          bruto: brutoVal,
        });
        seenOrder.push(id);
      }
    }
    return seenOrder.map((id) => map.get(id)!).filter(Boolean);
  }, [gastosRegistrados]);

  const openApproveDialog = async () => {
    if (!isContador) {
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
    if (!isContador && !derivadoAId) {
      toast.error('Debes seleccionar al siguiente aprobador o contador.');
      return;
    }

    try {
      setLoadingAction(true);
      await rendicionesService.aprobarRendicion(rendicion.id, {
        comentario: comentarioAprobar || undefined,
        ...(isContador ? {} : { derivadoAId: Number(derivadoAId) }),
      });

      toast.success(
        isContador
          ? 'Rendición aprobada y finalizada correctamente.'
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

      {/* Partidas Presupuestarias */}
      {gastosRegistrados.length > 0 && (
        <RendicionPartidasPresupuestarias
          solicitud={rendicion.solicitud}
          gastosRendicion={gastosRegistrados}
        />
      )}

      {/* Gastos Section */}
      {gastosRegistrados.length > 0 && (
        <RendicionGastosSection
          gastos={gastosRegistrados}
          canEditPartidaContable={canEditPartidaContable}
          onUpdatePartidaContable={handleUpdatePartidaContable}
          partidasPresupuestarias={partidasPresupuestarias}
          canEditPartidaPresupuestaria={canEditPartidaPresupuestaria}
          onUpdatePartidaPresupuestaria={handleUpdatePartidaPresupuestaria}
          gastoValidaciones={gastoValidaciones}
          onGastoValidacionChange={handleGastoValidacionChange}
        />
      )}

      {/* Resumen Cuentas Contables */}
      {gastosRegistrados.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Resumen de Partidas Contables</CardTitle>
            <p className="text-muted-foreground text-sm">
              Agrupación acumulada de los gastos de esta rendición según la partida contable asociada.
            </p>
          </CardHeader>
          <CardContent>
            <div className="w-full overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-amzdesk-table-header">Código</TableHead>
                    <TableHead className="text-amzdesk-table-header">Partida Contable</TableHead>
                    <TableHead className="text-amzdesk-table-header text-right">Monto Neto</TableHead>
                    <TableHead className="text-amzdesk-table-header text-right">Retenciones/Impuestos</TableHead>
                    <TableHead className="text-amzdesk-table-header text-right font-bold">Total (Bruto)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {resumenContable.map((r) => (
                    <TableRow key={r.codigo}>
                      <TableCell className="font-mono text-xs">{r.codigo}</TableCell>
                      <TableCell className="font-semibold text-xs">{r.nombre}</TableCell>
                      <TableCell className="text-right text-xs font-semibold text-emerald-600">
                        {formatMoney(r.neto)} Bs.
                      </TableCell>
                      <TableCell className="text-right text-xs font-semibold text-orange-600">
                        {formatMoney(r.impuestos)} Bs.
                      </TableCell>
                      <TableCell className="text-right text-xs font-bold text-foreground bg-muted/20">
                        {formatMoney(r.bruto)} Bs.
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resumen Partidas Presupuestarias */}
      {resumenPresupuestario.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Resumen de Partidas Presupuestarias</CardTitle>
            <p className="text-muted-foreground text-sm">
              Agrupación acumulada de los gastos según la partida presupuestaria del POA.
            </p>
          </CardHeader>
          <CardContent>
            <div className="w-full overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-amzdesk-table-header">Código POA</TableHead>
                    <TableHead className="text-amzdesk-table-header">Partida Presupuestaria</TableHead>
                    <TableHead className="text-amzdesk-table-header">Proyecto / Grupo</TableHead>
                    <TableHead className="text-amzdesk-table-header text-right">Monto Neto</TableHead>
                    <TableHead className="text-amzdesk-table-header text-right">Retenciones/Impuestos</TableHead>
                    <TableHead className="text-amzdesk-table-header text-right font-bold">Total (Bruto)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {resumenPresupuestario.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono text-xs">{r.codigo}</TableCell>
                      <TableCell className="font-semibold text-xs">{r.nombre}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {[r.proyecto, r.grupo].filter(Boolean).join(' / ') || '—'}
                      </TableCell>
                      <TableCell className="text-right text-xs font-semibold text-emerald-600">
                        {formatMoney(r.neto)} Bs.
                      </TableCell>
                      <TableCell className="text-right text-xs font-semibold text-orange-600">
                        {formatMoney(r.impuestos)} Bs.
                      </TableCell>
                      <TableCell className="text-right text-xs font-bold text-foreground bg-muted/20">
                        {formatMoney(r.bruto)} Bs.
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
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

      {puedeAccionar ? (
        <div className="bg-background sticky bottom-0 border-t py-4">
          <div className="mx-auto max-w-2xl">
            <div className="flex w-full flex-col gap-3 sm:flex-row">
              <Button
                size="lg"
                className={`flex-1 ${
                  isContador
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
                onClick={() => void openApproveDialog()}
                disabled={loadingAction || hasIncorrectos}
              >
                <CheckCircle className="mr-2 h-5 w-5" />
                {isContador
                  ? 'Aprobar y Finalizar Rendición'
                  : 'Aprobar / Derivar'}
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="flex-1 border-amber-500 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950"
                onClick={() => {
                  const texto = gastosRegistrados
                    .filter((g) => gastoValidaciones[g.id]?.estado === 'observado')
                    .map(
                      (g) =>
                        `• ${g.concepto || 'Gasto #' + g.id}: ${gastoValidaciones[g.id]?.observacion || '(sin detalle)'}`,
                    )
                    .join('\n');
                  setComentarioObservar(texto);
                  setObserveOpen(true);
                }}
                disabled={loadingAction}
              >
                <AlertCircle className="mr-2 h-5 w-5" />
                Observar / Devolver
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <Alert className="border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30">
          <Info className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <AlertTitle className="text-amber-800 dark:text-amber-300">
            Rendición ya atendida
          </AlertTitle>
          <AlertDescription className="text-amber-700 dark:text-amber-400">
            Ya se tomó una decisión sobre esta rendición o fue reasignada. Las
            acciones están deshabilitadas.
          </AlertDescription>
        </Alert>
      )}

      <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isContador
                ? 'Aprobar y Finalizar Rendición'
                : 'Aprobar y Derivar'}
            </DialogTitle>
            <DialogDescription>
              {isContador
                ? 'Esta acción cerrará la rendición de forma definitiva y ejecutará el impacto presupuestario del POA.'
                : 'Aprueba esta revisión y deriva manualmente al siguiente aprobador o contador.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {!isContador && (
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
                      : 'Seleccionar siguiente aprobador / contador...'}
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

            {isContador && (
              <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                <p className="flex items-center gap-2 font-medium">
                  <ShieldCheck className="h-4 w-4" />
                  Solo el rol CONTADOR puede cerrar definitivamente la
                  rendición.
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
