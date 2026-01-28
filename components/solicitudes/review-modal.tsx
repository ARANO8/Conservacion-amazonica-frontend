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
import { CheckCircle2, SendHorizonal } from 'lucide-react';
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
  const countNomina = data.nomina?.length || 0;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-full sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <CheckCircle2 className="h-6 w-6 text-emerald-500" />
            Revisar y Enviar Solicitud
          </DialogTitle>
          <DialogDescription>
            Por favor, verifica que toda la información ingresada sea correcta
            antes de confirmar el envío.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6 py-4">
            {/* 1. Resumen Planificación */}
            <section className="space-y-3">
              <h3 className="text-muted-foreground text-sm font-bold tracking-wider uppercase">
                Resumen de Planificación
              </h3>
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Lugar/es:</span>
                  <span className="font-medium">
                    {data.planificacionLugares}
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground">Objetivo:</span>
                  <p className="bg-muted/50 rounded-md p-2 text-xs italic">
                    {data.planificacionObjetivo}
                  </p>
                </div>
              </div>
            </section>

            {/* 2. Fuentes de Financiamiento */}
            <section className="space-y-3">
              <h3 className="text-muted-foreground text-sm font-bold tracking-wider uppercase">
                Fuentes de Financiamiento
              </h3>
              <div className="grid gap-3">
                {(data.fuentesSeleccionadas || []).map((fuente, idx) => {
                  const reserva = misReservas.find(
                    (r) => r.id === fuente.reservaId
                  );
                  const nombreFuente =
                    reserva?.poa?.codigoPresupuestario?.codigoCompleto ||
                    reserva?.poa?.codigoPresupuestario?.descripcion ||
                    `Fuente ${idx + 1}`;

                  // Calcular cuánto de esta fuente se está usando en esta solicitud
                  const montoUsoViaticos = (data.viaticos || [])
                    .filter(
                      (v) => v.solicitudPresupuestoId === fuente.reservaId
                    )
                    .reduce(
                      (acc, v) => acc + (Number(v.liquidoPagable) || 0),
                      0
                    );

                  const montoUsoGastos = (data.items || [])
                    .filter(
                      (i) => i.solicitudPresupuestoId === fuente.reservaId
                    )
                    .reduce(
                      (acc, i) => acc + (Number(i.liquidoPagable) || 0),
                      0
                    );

                  const totalUsoFuente = montoUsoViaticos + montoUsoGastos;

                  return (
                    <div
                      key={fuente.reservaId || idx}
                      className="bg-muted/30 flex items-center justify-between rounded-lg border p-2.5 text-sm"
                    >
                      <span className="text-muted-foreground line-clamp-2 max-w-[280px] text-xs font-medium">
                        {nombreFuente}
                      </span>
                      <span className="font-bold text-emerald-600 tabular-nums">
                        {formatMoney(totalUsoFuente)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>

            <Separator />

            {/* 3. Resumen Económico Consolidado (Diseño Limpio) */}
            <div className="flex flex-col gap-4 px-2 py-2">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-[10px] font-black tracking-widest uppercase">
                  TOTAL LÍQUIDO (A Recibir)
                </span>
                <span className="text-foreground text-lg font-bold">
                  {formatMoney(totalLiquidoGeneral)}
                </span>
              </div>

              <div className="bg-border h-[1px] w-full" />

              <div className="flex items-center justify-between">
                <span className="text-primary text-[10px] font-black tracking-widest uppercase">
                  TOTAL PRESUPUESTADO (Incl. Impuestos)
                </span>
                <span className="text-primary text-xl font-black">
                  {formatMoney(totalGeneral)}
                </span>
              </div>
            </div>

            <Separator />

            {/* 3. Resumen Nómina */}
            <section className="space-y-3">
              <h3 className="text-muted-foreground text-sm font-bold tracking-wider uppercase">
                Nómina de Terceros
              </h3>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Personas externas registradas:
                </span>
                <span className="font-medium">
                  {countNomina} {countNomina === 1 ? 'persona' : 'personas'}
                </span>
              </div>
            </section>

            <Separator />

            {/* 4. Selección de Destinatario */}
            <section>
              <FormField
                control={control}
                name="destinatario"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className="text-muted-foreground text-sm font-bold tracking-wider uppercase">
                      Enviar solicitud a:{' '}
                      <span className="text-red-500">*</span>
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="grid w-full grid-cols-[1fr_auto] items-center gap-2 [&>span]:min-w-0 [&>span]:truncate [&>span]:text-left">
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
          </div>
        </ScrollArea>

        <DialogFooter className="mt-4">
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
