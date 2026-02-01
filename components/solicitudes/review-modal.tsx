'use client';

import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { FormData } from '@/components/solicitudes/solicitud-schema';
import { formatMoney } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  CheckCircle2,
  SendHorizonal,
  AlertTriangle,
  Check,
  ChevronsUpDown,
} from 'lucide-react';
import { Concepto, TipoGasto, Usuario } from '@/types/catalogs';
import { cn } from '@/lib/utils';
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

import { PresupuestoReserva } from '@/types/backend';

interface ReviewModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: FormData) => void;
  loading?: boolean;
  usuarios: Usuario[];
  misReservas: PresupuestoReserva[];
  conceptos: Concepto[];
  tiposGasto: TipoGasto[];
}

export default function ReviewModal({
  isOpen,
  onOpenChange,
  onSubmit,
  loading = false,
  usuarios,
  misReservas,
  conceptos,
  tiposGasto,
}: ReviewModalProps) {
  const { watch, control, handleSubmit, setValue } = useFormContext<FormData>();
  const [open, setOpen] = useState(false);

  const data = watch();

  const totalViaticos = (data.viaticos || []).reduce(
    (acc: number, v) => acc + (Number(v.montoNeto) || 0),
    0
  );
  const totalLiquidoViaticos = (data.viaticos || []).reduce(
    (acc: number, v) => acc + Number(v.liquidoPagable || 0),
    0
  );

  const totalGastos = (data.items || []).reduce(
    (acc: number, i) => acc + (Number(i.montoNeto) || 0),
    0
  );
  const totalLiquidoGastos = (data.items || []).reduce(
    (acc: number, i) => acc + Number(i.liquidoPagable || 0),
    0
  );

  const totalNomina = (data.nomina || []).reduce(
    (acc: number, n) => acc + (Number(n.montoNeto) || 0),
    0
  );
  const totalLiquidoNomina = (data.nomina || []).reduce(
    (acc: number, n) => acc + (Number(n.liquidoPagable) || 0),
    0
  );

  const totalGeneral = totalViaticos + totalGastos + totalNomina;
  const totalLiquidoGeneral =
    totalLiquidoViaticos + totalLiquidoGastos + totalLiquidoNomina;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-full sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <CheckCircle2 className="h-6 w-6 text-emerald-500" />
            Revisar y Enviar Solicitud
          </DialogTitle>
          <DialogDescription>
            Por favor, verifica el desglose de tu solicitud por partida
            presupuestaria antes del envío.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[65vh] pr-4">
          <div className="space-y-6 py-4">
            {/* 1. Resumen Planificación (Simplificado) */}
            <section className="space-y-2">
              <h3 className="text-muted-foreground text-[10px] font-black tracking-widest uppercase">
                Planificación General
              </h3>
              <div className="space-y-1.5 px-1">
                {/* CAMBIO 1: CÓDIGO POA GLOBAL */}

                <p className="text-sm">
                  <span className="text-muted-foreground text-xs font-bold uppercase">
                    Lugar/es:
                  </span>{' '}
                  <span className="font-bold">{data.planificacionLugares}</span>
                </p>

                <p className="text-sm">
                  <span className="text-muted-foreground shrink-0 text-xs font-bold uppercase">
                    Objetivo:
                  </span>{' '}
                  <span className="font-bold">
                    {data.planificacionObjetivo}
                  </span>
                </p>

                <p className="text-sm">
                  <span className="text-muted-foreground text-xs font-bold uppercase">
                    CODIGO / POA:
                  </span>{' '}
                  <span className="font-bold">
                    {misReservas.find(
                      (r) => r.id === data.fuentesSeleccionadas?.[0]?.reservaId
                    )?.poa?.codigoPoa || 'S/N'}
                  </span>
                </p>
                <p className="text-sm">
                  <span className="text-muted-foreground text-xs font-bold uppercase">
                    PROYECTO:
                  </span>{' '}
                  <span className="font-bold">
                    {misReservas.find(
                      (r) => r.id === data.fuentesSeleccionadas?.[0]?.reservaId
                    )?.poa?.estructura?.proyecto?.nombre || 'S/N'}
                  </span>
                </p>
              </div>
            </section>

            {/* 2. TAREA 1: DESGLOSE POR PARTIDA (Refinado) */}
            <section className="space-y-4">
              <h3 className="text-muted-foreground text-[10px] font-black tracking-widest uppercase">
                Presupuesto por Partida
              </h3>
              {(data.fuentesSeleccionadas || []).map((fuente, idx) => {
                const reserva = misReservas.find(
                  (r) => r.id === fuente.reservaId
                );
                if (!reserva) return null;

                const nombrePartida =
                  reserva.poa?.estructura?.partida?.nombre || '';
                const esViatico = nombrePartida
                  .toUpperCase()
                  .includes('VIATICOS');

                const viaticosAsociados = (data.viaticos || []).filter(
                  (v) => v.solicitudPresupuestoId === reserva.id
                );
                const gastosAsociados = (data.items || []).filter(
                  (i) => i.solicitudPresupuestoId === reserva.id
                );

                const totalPresupuestado = esViatico
                  ? viaticosAsociados.reduce(
                      (acc, v) => acc + (Number(v.montoNeto) || 0),
                      0
                    )
                  : gastosAsociados.reduce(
                      (acc, i) => acc + (Number(i.montoNeto) || 0),
                      0
                    );

                const totalLiquido = esViatico
                  ? viaticosAsociados.reduce(
                      (acc, v) =>
                        acc + (Number(v.liquidoPagable ?? v.montoNeto) || 0),
                      0
                    )
                  : gastosAsociados.reduce(
                      (acc, i) =>
                        acc + (Number(i.liquidoPagable ?? i.montoNeto) || 0),
                      0
                    );

                return (
                  <div
                    key={fuente.reservaId || idx}
                    className="bg-card overflow-hidden rounded-xl border shadow-sm"
                  >
                    <div className="bg-muted/30 border-b p-3">
                      <p className="text-primary text-base leading-tight font-black uppercase">
                        {nombrePartida || 'Sin Nombre Partida'}
                      </p>
                      <p className="text-muted-foreground mt-1 text-xs font-medium uppercase">
                        {reserva.poa?.actividad?.detalleDescripcion ||
                          'Sin Descripción'}
                      </p>
                    </div>

                    <div className="p-3">
                      <div className="space-y-3">
                        <div className="bg-muted/10 rounded-lg border px-3 py-2">
                          <div className="mb-2 flex items-center justify-between border-b pb-1">
                            <span className="text-muted-foreground text-[10px] font-bold uppercase">
                              {esViatico ? 'Detalle Viático' : 'Detalle Gasto'}
                            </span>
                            <div className="flex gap-8">
                              <span className="text-muted-foreground text-[10px] font-bold uppercase">
                                Líquido
                              </span>
                              <span className="text-muted-foreground text-[10px] font-bold uppercase">
                                Presup.
                              </span>
                            </div>
                          </div>

                          <div className="space-y-2">
                            {esViatico ? (
                              viaticosAsociados.length > 0 ? (
                                viaticosAsociados.map((v, vIdx) => (
                                  <div
                                    key={vIdx}
                                    className="flex items-start justify-between text-xs"
                                  >
                                    <div className="flex flex-col">
                                      <span className="font-semibold uppercase">
                                        {conceptos.find(
                                          (c) => c.id === v.conceptoId
                                        )?.nombre || 'N/A'}
                                      </span>
                                      <span className="text-muted-foreground text-[9px] uppercase">
                                        {data.actividades?.[
                                          v.planificacionIndex ?? -1
                                        ]?.actividadProgramada || 'Sin Destino'}
                                      </span>
                                      <span className="text-muted-foreground text-[8px] italic">
                                        {v.tipoDestino === 'INSTITUCIONAL'
                                          ? 'Institucional'
                                          : v.tipoDestino === 'TERCEROS'
                                            ? 'Tercero'
                                            : v.tipoDestino}
                                      </span>
                                    </div>
                                    <div className="flex gap-4">
                                      <span className="font-medium tabular-nums">
                                        {formatMoney(
                                          v.liquidoPagable ?? v.montoNeto
                                        )}
                                      </span>
                                      <span className="font-bold tabular-nums">
                                        {formatMoney(v.montoNeto)}
                                      </span>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <p className="text-muted-foreground py-1 text-center text-[10px] italic">
                                  Sin viáticos cargados
                                </p>
                              )
                            ) : gastosAsociados.length > 0 ? (
                              gastosAsociados.map((item, iIdx) => (
                                <div
                                  key={iIdx}
                                  className="flex items-start justify-between text-xs"
                                >
                                  <div className="flex flex-col pr-4">
                                    <span className="font-semibold uppercase">
                                      {item.tipoGastoId
                                        ? tiposGasto.find(
                                            (t) => t.id === item.tipoGastoId
                                          )?.nombre
                                        : 'Sin detalle'}
                                    </span>
                                    <span className="text-muted-foreground text-[9px] uppercase">
                                      {item.tipoDocumento || 'S/D'}
                                    </span>
                                  </div>
                                  <div className="flex gap-4">
                                    <span className="font-medium tabular-nums">
                                      {formatMoney(
                                        item.liquidoPagable ?? item.montoNeto
                                      )}
                                    </span>
                                    <span className="font-bold tabular-nums">
                                      {formatMoney(item.montoNeto)}
                                    </span>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <p className="text-muted-foreground py-1 text-center text-[10px] italic">
                                Sin ítems cargados
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-end gap-6 border-t pt-3">
                        <div className="text-right">
                          <p className="text-muted-foreground text-[10px] font-bold uppercase">
                            Subtotal Líquido
                          </p>
                          <p className="text-muted-foreground text-sm font-semibold">
                            {formatMoney(totalLiquido)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-primary text-[10px] font-bold uppercase">
                            Subtotal Presupuestado
                          </p>
                          <p className="text-primary text-sm font-black">
                            {formatMoney(totalPresupuestado)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </section>

            {/* 4. Selección de Destinatario con Alerta Reubicada */}
            <section className="space-y-4">
              <FormField
                control={control}
                name="destinatario"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className="text-muted-foreground text-[10px] font-black tracking-widest uppercase">
                      Enviar solicitud a:{' '}
                      <span className="text-destructive">*</span>
                    </FormLabel>

                    {/* TAREA 3: ALERTA DE APROBACIÓN REUBICADA */}
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-400">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                        <p className="text-[13px] leading-tight font-medium">
                          Importante: Selecciona a tu inmediato superior o al
                          coordinador del área para la aprobación de esta
                          solicitud.
                        </p>
                      </div>
                    </div>

                    <Popover open={open} onOpenChange={setOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={open}
                            className={cn(
                              'w-full justify-between font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value
                              ? usuarios.find(
                                  (usuario) =>
                                    String(usuario.id) === field.value
                                )?.nombreCompleto ||
                                'Seleccionar responsable...'
                              : 'Seleccionar responsable...'}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-[var(--radix-popover-trigger-width)] p-0"
                        align="start"
                      >
                        <Command>
                          <CommandInput placeholder="Buscar destinatario..." />
                          <CommandList>
                            <CommandEmpty>
                              No se encontró el usuario.
                            </CommandEmpty>
                            <CommandGroup>
                              {usuarios.map((usuario) => (
                                <CommandItem
                                  key={usuario.id}
                                  value={usuario.nombreCompleto}
                                  onSelect={() => {
                                    setValue(
                                      'destinatario',
                                      String(usuario.id)
                                    );
                                    setOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      'mr-2 h-4 w-4',
                                      String(usuario.id) === field.value
                                        ? 'opacity-100'
                                        : 'opacity-0'
                                    )}
                                  />
                                  {usuario.nombreCompleto}{' '}
                                  {usuario.cargo ? `- ${usuario.cargo}` : ''}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </section>

            <Separator />

            {/* TAREA 3: FOOTER GLOBAL (Diseño Limpio) */}
            <div className="flex items-center justify-end gap-8 py-2">
              <div className="text-right">
                <span className="text-muted-foreground block text-[10px] font-bold tracking-tight uppercase">
                  TOTAL LÍQUIDO (A Recibir)
                </span>
                <span className="text-sm font-semibold tabular-nums">
                  {formatMoney(totalLiquidoGeneral)}
                </span>
              </div>

              <div className="bg-border h-10 w-[1px]" />

              <div className="text-right">
                <span className="text-primary block text-[10px] font-black tracking-tight uppercase">
                  TOTAL PRESUPUESTADO (Incl. Impuestos)
                </span>
                <span className="text-primary text-2xl font-black tabular-nums">
                  {formatMoney(totalGeneral)}
                </span>
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="mt-4 gap-2 sm:gap-0">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Volver a editar
          </Button>
          <Button
            className="min-w-[150px] shadow-lg"
            onClick={handleSubmit(onSubmit)}
            disabled={loading}
          >
            {loading ? (
              'Enviando...'
            ) : (
              <>
                Confirmar Envío <SendHorizonal className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
