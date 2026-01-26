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

interface ReviewModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: FormData) => void;
  loading?: boolean;
  usuarios: Usuario[];
}

export default function ReviewModal({
  isOpen,
  onOpenChange,
  onSubmit,
  loading = false,
  usuarios,
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

  const totalGeneral = totalViaticos + totalGastos;
  const totalLiquidoGeneral = totalLiquidoViaticos + totalLiquidoGastos;
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

            <Separator />

            {/* 2. Resumen Económico */}
            <section className="space-y-3">
              <h3 className="text-muted-foreground text-sm font-bold tracking-wider uppercase">
                Resumen Económico
              </h3>
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Total Viáticos / Pasajes:
                  </span>
                  <div className="text-right">
                    <span className="text-primary font-medium">
                      {formatMoney(totalViaticos)}
                    </span>
                    <p className="text-muted-foreground text-[10px] italic">
                      Líquido: {formatMoney(totalLiquidoViaticos)}
                    </p>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Total Otros Gastos:
                  </span>
                  <div className="text-right">
                    <span className="text-primary font-medium">
                      {formatMoney(totalGastos)}
                    </span>
                    <p className="text-muted-foreground text-[10px] italic">
                      Líquido: {formatMoney(totalLiquidoGastos)}
                    </p>
                  </div>
                </div>
                <div className="mt-2 space-y-1 border-t pt-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Total Bruto Solicitado:
                    </span>
                    <span className="font-bold">
                      {formatMoney(totalGeneral)}
                    </span>
                  </div>
                  <div className="flex justify-between text-base font-black">
                    <span className="text-emerald-700">
                      TOTAL LÍQUIDO PAGABLE:
                    </span>
                    <span className="text-emerald-700">
                      {formatMoney(totalLiquidoGeneral)}
                    </span>
                  </div>
                </div>
              </div>
            </section>

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
