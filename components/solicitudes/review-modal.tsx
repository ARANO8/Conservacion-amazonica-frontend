'use client';

import { useState, useMemo } from 'react';
import { useFormContext, FieldErrors } from 'react-hook-form';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
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
  Landmark,
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

import { SeleccionPresupuesto } from '@/types/backend';
import { PresupuestoBreakdown } from '@/components/solicitudes/presupuesto-breakdown';
import { mapFormToBreakdown } from '@/lib/mappers/breakdown-mapper';

interface ReviewModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: FormData) => void;
  loading?: boolean;
  usuarios: Usuario[];
  misSelecciones: SeleccionPresupuesto[];
  conceptos: Concepto[];
  tiposGasto: TipoGasto[];
  currentUserId?: number;
  onError?: (errors: FieldErrors<FormData>) => void;
}

export default function ReviewModal({
  isOpen,
  onOpenChange,
  onSubmit,
  loading = false,
  usuarios,
  misSelecciones,
  conceptos,
  tiposGasto,
  currentUserId,
  onError,
}: ReviewModalProps) {
  const { watch, control, handleSubmit, setValue } = useFormContext<FormData>();
  const [open, setOpen] = useState(false);

  const data = watch();

  const usuariosDisponibles = useMemo(() => {
    if (!currentUserId) return usuarios;
    return usuarios.filter((u) => u.id !== currentUserId);
  }, [usuarios, currentUserId]);

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

  const partidasMapped = useMemo(() => {
    return mapFormToBreakdown(data, misSelecciones, conceptos, tiposGasto);
  }, [data, misSelecciones, conceptos, tiposGasto]);

  // FIXME: DEBUGGING
  console.log('DATA EN STEP 3:', {
    fuentesSeleccionadas: data.fuentesSeleccionadas,
    misSelecciones,
  });
  console.log(
    'PROYECTO SELECCIONADO:',
    misSelecciones.find(
      (r) => r.poaId === data.fuentesSeleccionadas?.[0]?.poaId
    )?.poa?.estructura?.proyecto
  );

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
                    {misSelecciones.find(
                      (r) => r.poaId === data.fuentesSeleccionadas?.[0]?.poaId
                    )?.poa?.codigoPoa || 'S/N'}
                  </span>
                </p>
                <p className="text-sm">
                  <span className="text-muted-foreground text-xs font-bold uppercase">
                    PROYECTO:
                  </span>{' '}
                  <span className="font-bold">
                    {misSelecciones.find(
                      (r) => r.poaId === data.fuentesSeleccionadas?.[0]?.poaId
                    )?.poa?.estructura?.proyecto?.nombre || 'S/N'}
                  </span>
                </p>
              </div>
            </section>

            {/* 1.5 Información Bancaria del Proyecto */}
            <section className="space-y-3 pt-2">
              <h3 className="text-muted-foreground text-[10px] font-black tracking-widest uppercase">
                Información Bancaria
              </h3>
              {(() => {
                const proyectoSeleccionado = misSelecciones.find(
                  (r) => r.poaId === data.fuentesSeleccionadas?.[0]?.poaId
                )?.poa?.estructura?.proyecto;
                const cuentaBancaria = proyectoSeleccionado?.cuentaBancaria;

                if (!cuentaBancaria) {
                  return (
                    <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50/50 p-4 dark:border-gray-800 dark:bg-gray-900/50">
                      <p className="text-center text-sm text-gray-500 italic dark:text-gray-400">
                        Cuenta bancaria no asignada a este proyecto.
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="rounded-lg border border-blue-100 bg-blue-50/50 p-4 shadow-sm xl:rounded-xl dark:border-blue-900/30 dark:bg-blue-950/20">
                    <div className="mb-3 flex items-center gap-2 border-b border-blue-100/50 pb-3 dark:border-blue-900/50">
                      <Landmark className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      <span className="text-base font-bold text-blue-950 dark:text-blue-50">
                        {cuentaBancaria.banco || 'Banco no especificado'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] font-bold tracking-widest text-blue-600/70 uppercase dark:text-blue-400/70">
                          Nro. de Cuenta
                        </p>
                        <p className="mt-0.5 text-sm font-semibold tracking-wide text-blue-950 dark:text-blue-50">
                          {cuentaBancaria.numeroCuenta || 'S/N'}
                        </p>
                      </div>
                      {cuentaBancaria.moneda && (
                        <div>
                          <p className="text-[10px] font-bold tracking-widest text-blue-600/70 uppercase dark:text-blue-400/70">
                            Moneda
                          </p>
                          <p className="mt-0.5 text-sm font-semibold text-blue-950 dark:text-blue-50">
                            {cuentaBancaria.moneda}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </section>

            {/* 2. DESGLOSE POR PARTIDA (DRY Refactored) */}
            <section className="space-y-4">
              <h3 className="text-muted-foreground text-[10px] font-black tracking-widest uppercase">
                Presupuesto por Partida
              </h3>
              <PresupuestoBreakdown partidas={partidasMapped} />
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
                              ? usuariosDisponibles.find(
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
                              {usuariosDisponibles.map((usuario) => (
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
            onClick={handleSubmit(onSubmit, onError)}
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
