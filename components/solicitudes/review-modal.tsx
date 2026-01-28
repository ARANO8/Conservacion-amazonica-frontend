'use client';

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
import { CheckCircle2, SendHorizonal, AlertTriangle } from 'lucide-react';
import { Usuario } from '@/types/catalogs';

import { PresupuestoReserva } from '@/types/backend';

interface ReviewModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: FormData) => void;
  loading?: boolean;
  usuarios: Usuario[];
  misReservas: PresupuestoReserva[];
}

export default function ReviewModal({
  isOpen,
  onOpenChange,
  onSubmit,
  loading = false,
  usuarios,
  misReservas,
}: ReviewModalProps) {
  const { watch, control, handleSubmit } = useFormContext<FormData>();

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
                    PROYECTO / POA:
                  </span>{' '}
                  <span className="font-bold">
                    {misReservas.find(
                      (r) => r.id === data.fuentesSeleccionadas?.[0]?.reservaId
                    )?.poa?.codigoPoa || 'S/N'}
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

                const misViaticos = (data.viaticos || []).filter(
                  (v) => v.solicitudPresupuestoId === fuente.reservaId
                );
                const misGastos = (data.items || []).filter(
                  (i) => i.solicitudPresupuestoId === fuente.reservaId
                );

                const totalViaticosPres = misViaticos.reduce(
                  (acc, v) => acc + (Number(v.montoNeto) || 0),
                  0
                );
                const totalGastosPres = misGastos.reduce(
                  (acc, i) => acc + (Number(i.montoNeto) || 0),
                  0
                );

                const subtotalBud = totalViaticosPres + totalGastosPres;
                const subtotalLiq =
                  misViaticos.reduce(
                    (acc, v) => acc + (Number(v.liquidoPagable) || 0),
                    0
                  ) +
                  misGastos.reduce(
                    (acc, i) => acc + (Number(i.liquidoPagable) || 0),
                    0
                  );

                // 2. DESCRIPCIÓN (El nombre largo, ej: Consultorías...)
                const nombreVisual =
                  reserva.poa?.codigoPresupuestario?.codigoCompleto ||
                  'Sin Descripción';

                // 3. SUBTÍTULO (Detalle de actividad)
                const descActividad =
                  reserva.poa?.actividad?.detalleDescripcion || '';

                return (
                  <div
                    key={fuente.reservaId || idx}
                    className="bg-card overflow-hidden rounded-xl border shadow-sm"
                  >
                    <div className="bg-muted/30 border-b p-3">
                      {/* TÍTULO VERDE: Código - Nombre Partida */}
                      <p className="text-primary text-base leading-tight font-black uppercase">
                        {nombreVisual}
                      </p>

                      {/* SUBTÍTULO GRIS: Descripción de la Actividad */}
                      {descActividad && (
                        <p className="text-muted-foreground mt-1 text-xs font-medium uppercase">
                          {descActividad}
                        </p>
                      )}
                    </div>

                    <div className="p-3">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">
                            • Viáticos:
                          </span>
                          <span className="font-bold tabular-nums">
                            {formatMoney(totalViaticosPres)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">
                            • Gastos:
                          </span>
                          <span className="font-bold tabular-nums">
                            {formatMoney(totalGastosPres)}
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-end gap-6 border-t pt-3">
                        <div className="text-right">
                          <p className="text-muted-foreground text-[12px] font-bold uppercase">
                            Subtotal Líquido
                          </p>
                          <p className="text-muted-foreground text-base font-semibold">
                            {formatMoney(subtotalLiq)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-primary text-[12px] font-bold uppercase">
                            Subtotal Presupuestado
                          </p>
                          <p className="text-primary text-base font-black">
                            {formatMoney(subtotalBud)}
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

                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full truncate overflow-hidden">
                          <SelectValue placeholder="Seleccionar responsable..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent
                        position="popper"
                        side="bottom"
                        className="max-h-[200px] w-[var(--radix-select-trigger-width)]"
                      >
                        {usuarios.map((usuario) => (
                          <SelectItem
                            key={usuario.id}
                            value={String(usuario.id)}
                          >
                            {usuario.nombreCompleto}{' '}
                            {usuario.cargo ? `- ${usuario.cargo}` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
