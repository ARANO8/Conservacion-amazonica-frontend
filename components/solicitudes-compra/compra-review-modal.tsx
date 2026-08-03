'use client';

import { useState, useMemo } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  CheckCircle2,
  SendHorizonal,
  AlertTriangle,
  Check,
  ChevronsUpDown,
  ShoppingCart,
} from 'lucide-react';
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
import { formatMoney, cn } from '@/lib/utils';
import { calcularMontosConsultoria } from '@/lib/tax-calculator';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { PoaStructureItem } from '@/types/backend';
import type { SolicitudCompraFormData } from './solicitud-compra-schema';

const formatFechaPago = (value: string | Date | undefined): string => {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return format(date, "d 'de' MMM yyyy", { locale: es });
};

interface UsuarioOption {
  id: number;
  nombreCompleto: string;
  rol: string;
  cargo?: string;
}

interface CompraReviewModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  loading?: boolean;
  usuarioOptions: UsuarioOption[];
  selectedPoaCode: string;
  selectedPoaItem?: PoaStructureItem;
}

export default function CompraReviewModal({
  isOpen,
  onOpenChange,
  onConfirm,
  loading = false,
  usuarioOptions,
  selectedPoaCode,
  selectedPoaItem,
}: CompraReviewModalProps) {
  const { watch, setValue } = useFormContext<SolicitudCompraFormData>();
  const [comboOpen, setComboOpen] = useState(false);

  const data = watch();

  // useWatch garantiza reactividad para el cálculo del total
  const watchedItems = useWatch<SolicitudCompraFormData, 'items'>({
    name: 'items',
  });
  const watchedPagos = useWatch<SolicitudCompraFormData, 'pagos'>({
    name: 'pagos',
  });

  const aprobadorSeleccionado = useMemo(
    () => usuarioOptions.find((u) => u.id === data.aprobadorId),
    [usuarioOptions, data.aprobadorId]
  );

  const taxResult = calcularMontosConsultoria(
    Number(data.montoLiquido) || 0,
    data.tipoDocumento ?? 'RECIBO'
  );

  // Cálculo directo sin useMemo para evitar dependencia estancada.
  // En consultorías el POA se afecta por el bruto, no por el líquido.
  const total = data.esConsultoria
    ? taxResult.montoBruto
    : (watchedItems ?? []).reduce(
        (acc, item) =>
          acc +
          (Number(item?.cantidad) || 0) * (Number(item?.costoUnitario) || 0),
        0
      );

  // Las consultorías no llevan aprobador: el contrato nace en ejecución
  const canConfirm =
    !loading &&
    !!data.chequeANombreDe?.trim() &&
    (data.esConsultoria || !!data.aprobadorId);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      {/*
        flex col + overflow-hidden para que el diálogo nunca supere el viewport.
        El área de revisión tiene max-h explícita (no flex-1) para que
        overflow-y-auto funcione sin depender de altura definitiva del padre.
      */}
      <DialogContent className="flex max-h-[92vh] w-full flex-col overflow-hidden sm:max-w-[540px]">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <CheckCircle2 className="h-6 w-6 text-emerald-500" />
            Revisar y Enviar Solicitud
          </DialogTitle>
          <DialogDescription>
            Completa los datos finales y verifica el resumen antes de enviar.
          </DialogDescription>
        </DialogHeader>

        {/*
          Área de revisión con max-h explícita.
          flex-1 necesita padre con altura definitiva para crear overflow;
          max-h-[40vh] funciona en cualquier contexto y activa overflow-y-auto
          cuando el contenido supera el límite.
        */}
        <div className="[&::-webkit-scrollbar-thumb]:bg-border max-h-[40vh] min-h-[100px] overflow-y-auto pr-4 [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
          <div className="space-y-6 py-2">
            {/* ---- Datos de la Solicitud ---- */}
            <section className="space-y-2">
              <h3 className="text-muted-foreground text-[10px] font-black tracking-widest uppercase">
                Datos de la Solicitud
              </h3>
              <div className="bg-muted/30 space-y-3 rounded-lg border px-3 py-3">
                <div className="flex items-start gap-2 text-sm">
                  <span className="text-muted-foreground w-36 shrink-0 text-xs font-bold uppercase">
                    Motivo:
                  </span>
                  <span className="font-semibold">
                    {data.motivoSolicitud || '—'}
                  </span>
                </div>

                {/* Cheque a nombre de — editable en el modal */}
                <div className="space-y-1">
                  <span className="text-muted-foreground text-xs font-bold uppercase">
                    Cheque a nombre de:{' '}
                    <span className="text-destructive">*</span>
                  </span>
                  <Input
                    placeholder="Nombre completo del beneficiario"
                    value={data.chequeANombreDe ?? ''}
                    onChange={(e) =>
                      setValue('chequeANombreDe', e.target.value, {
                        shouldValidate: true,
                      })
                    }
                    className="mt-1"
                  />
                  {!data.chequeANombreDe?.trim() && (
                    <p className="text-destructive text-xs">
                      Este campo es obligatorio.
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* ---- Partida presupuestaria ---- */}
            <section className="space-y-2">
              <h3 className="text-muted-foreground text-[10px] font-black tracking-widest uppercase">
                Partida Presupuestaria
              </h3>
              {selectedPoaItem ? (
                <div className="bg-primary/5 ring-primary/20 space-y-1.5 rounded-lg border px-3 py-3 ring-1">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-xs font-bold uppercase">
                      Código POA:
                    </span>
                    <span className="text-primary font-black">
                      {selectedPoaCode}
                    </span>
                  </div>
                  {selectedPoaItem.actividad?.detalleDescripcion && (
                    <div className="flex items-start gap-2 text-sm">
                      <span className="text-muted-foreground shrink-0 text-xs font-bold uppercase">
                        Actividad:
                      </span>
                      <span className="font-semibold">
                        {selectedPoaItem.actividad.detalleDescripcion}
                      </span>
                    </div>
                  )}
                  {selectedPoaItem.codigoPresupuestario?.codigoCompleto && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground text-xs font-bold uppercase">
                        Código:
                      </span>
                      <span className="font-mono font-semibold">
                        {selectedPoaItem.codigoPresupuestario.codigoCompleto}
                      </span>
                    </div>
                  )}
                  <div className="mt-2 flex items-center justify-between border-t pt-2">
                    <span className="text-muted-foreground text-xs font-bold uppercase">
                      Saldo disponible:
                    </span>
                    <span className="font-black text-emerald-600">
                      {formatMoney(
                        Number(selectedPoaItem.saldoDisponible ?? 0)
                      )}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground text-sm italic">
                  Sin partida seleccionada
                </p>
              )}
            </section>

            {/* ---- Consultoría: retención + cronograma de pagos ---- */}
            {data.esConsultoria && (
              <section className="space-y-2">
                <h3 className="text-muted-foreground text-[10px] font-black tracking-widest uppercase">
                  Contrato de Consultoría
                </h3>

                <div className="space-y-1.5 rounded-lg border p-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Líquido al consultor
                    </span>
                    <span className="font-medium">
                      {formatMoney(taxResult.montoNeto)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Tipo de documento
                    </span>
                    <span>{data.tipoDocumento}</span>
                  </div>
                  {taxResult.desglose.map((d) => (
                    <div key={d.label} className="flex justify-between">
                      <span className="text-muted-foreground">{d.label}</span>
                      <span>{formatMoney(d.monto)}</span>
                    </div>
                  ))}
                  <Separator className="my-1" />
                  <div className="flex justify-between font-semibold">
                    <span>Bruto con cargo al POA</span>
                    <span>{formatMoney(taxResult.montoBruto)}</span>
                  </div>
                </div>

                <div className="rounded-lg border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-muted-foreground px-3 py-2 text-left text-[10px] font-bold uppercase">
                          Pago
                        </th>
                        <th className="text-muted-foreground px-3 py-2 text-left text-[10px] font-bold uppercase">
                          Fecha
                        </th>
                        <th className="text-muted-foreground px-3 py-2 text-right text-[10px] font-bold uppercase">
                          Monto
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {(watchedPagos ?? []).map((pago, i) => (
                        <tr key={i} className="border-b last:border-0">
                          <td className="px-3 py-2">
                            <span className="font-medium">Pago {i + 1}</span>
                            {pago?.descripcion && (
                              <span className="text-muted-foreground ml-1 text-xs">
                                ({pago.descripcion})
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            {formatFechaPago(pago?.fechaPago)}
                          </td>
                          <td className="px-3 py-2 text-right font-semibold">
                            {formatMoney(Number(pago?.monto) || 0)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* ---- Descripción del gasto ---- */}
            {!data.esConsultoria && (
              <section className="space-y-2">
                <h3 className="text-muted-foreground text-[10px] font-black tracking-widest uppercase">
                  Descripción del Gasto
                </h3>
                <div className="rounded-lg border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-muted-foreground px-3 py-2 text-left text-[10px] font-bold uppercase">
                          Descripción
                        </th>
                        <th className="text-muted-foreground px-3 py-2 text-center text-[10px] font-bold uppercase">
                          Cant.
                        </th>
                        <th className="text-muted-foreground px-3 py-2 text-right text-[10px] font-bold uppercase">
                          P/Unit.
                        </th>
                        <th className="text-muted-foreground px-3 py-2 text-right text-[10px] font-bold uppercase">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {(watchedItems ?? []).map((item, i) => {
                        const subtotal =
                          (Number(item?.cantidad) || 0) *
                          (Number(item?.costoUnitario) || 0);
                        return (
                          <tr key={i} className="border-b last:border-0">
                            <td className="px-3 py-2 font-medium">
                              {item?.descripcion || '—'}
                              {item?.uso && (
                                <span className="text-muted-foreground ml-1 text-xs">
                                  ({item.uso})
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-2 text-center">
                              {item?.cantidad}
                            </td>
                            <td className="px-3 py-2 text-right">
                              {formatMoney(Number(item?.costoUnitario) || 0)}
                            </td>
                            <td className="px-3 py-2 text-right font-semibold">
                              {formatMoney(subtotal)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </div>
        </div>

        {/* ── Secciones fijas fuera del área scrollable ── */}

        <Separator className="shrink-0" />

        {/* Selección de aprobador — fuera del scroll para evitar clipping del popover.
            Un contrato de consultoría no se aprueba como un todo: nace en
            ejecución y el aprobador se elige al solicitar cada pago. */}
        {data.esConsultoria ? (
          <div className="text-muted-foreground shrink-0 rounded-lg border border-dashed p-3 text-xs">
            El contrato queda registrado y en ejecución. La aprobación se hace
            al solicitar cada pago del cronograma.
          </div>
        ) : (
          <div className="shrink-0 space-y-3">
            <h3 className="text-muted-foreground text-[10px] font-black tracking-widest uppercase">
              Enviar solicitud a: <span className="text-destructive">*</span>
            </h3>

            <div className="rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-400">
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <p className="text-[13px] leading-tight font-medium">
                  Selecciona a tu inmediato superior o al coordinador del área
                  para la aprobación de esta solicitud.
                </p>
              </div>
            </div>

            <Popover open={comboOpen} onOpenChange={setComboOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  role="combobox"
                  aria-expanded={comboOpen}
                  className={cn(
                    'w-full justify-between overflow-hidden font-normal',
                    !data.aprobadorId && 'text-muted-foreground'
                  )}
                >
                  <span className="truncate text-left">
                    {aprobadorSeleccionado
                      ? `${aprobadorSeleccionado.nombreCompleto}${aprobadorSeleccionado.cargo ? ` — ${aprobadorSeleccionado.cargo}` : ''}`
                      : 'Seleccionar responsable...'}
                  </span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-[var(--radix-popover-trigger-width)] p-0"
                align="start"
                side="top"
                sideOffset={4}
                collisionPadding={16}
              >
                <Command>
                  <CommandInput placeholder="Buscar destinatario..." />
                  {/*
                  no-scrollbar (clase base de CommandList) oculta el scrollbar vía
                  display:none (webkit) y scrollbar-width:none (Firefox).
                  !block + !important sobreescribe display:none en webkit.
                  scrollbar-width:thin sobreescribe scrollbar-width:none en Firefox.
                */}
                  <CommandList className="[&::-webkit-scrollbar-thumb]:bg-border max-h-[200px] [scrollbar-width:thin] [&::-webkit-scrollbar]:!block [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
                    <CommandEmpty>No se encontró el usuario.</CommandEmpty>
                    <CommandGroup>
                      {usuarioOptions.map((u) => (
                        <CommandItem
                          key={u.id}
                          value={u.nombreCompleto}
                          onSelect={() => {
                            setValue('aprobadorId', u.id);
                            setComboOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              'mr-2 h-4 w-4 shrink-0',
                              data.aprobadorId === u.id
                                ? 'opacity-100'
                                : 'opacity-0'
                            )}
                          />
                          <span className="truncate">
                            {u.nombreCompleto}
                            {u.cargo ? ` — ${u.cargo}` : ''}
                          </span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            {!data.aprobadorId && (
              <p className="text-destructive text-sm">
                Debes seleccionar un destinatario para enviar la solicitud.
              </p>
            )}
          </div>
        )}

        {/* Total — al final, antes de los botones de acción */}
        <div className="flex shrink-0 items-center justify-end gap-4 border-t pt-3">
          <div className="flex items-center gap-2">
            <ShoppingCart className="text-primary h-4 w-4" />
            <span className="text-muted-foreground text-xs font-bold uppercase">
              Total Solicitado
            </span>
          </div>
          <span className="text-primary text-2xl font-black tabular-nums">
            {formatMoney(total)}
          </span>
        </div>

        <DialogFooter className="shrink-0 gap-2 sm:gap-0">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Volver a editar
          </Button>
          <Button
            type="button"
            className="min-w-[150px] shadow-lg"
            onClick={onConfirm}
            disabled={!canConfirm}
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
