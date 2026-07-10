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
import { ScrollArea } from '@/components/ui/scroll-area';
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
  CheckCircle2,
  SendHorizonal,
  AlertTriangle,
  Check,
  ChevronsUpDown,
  Calendar,
  DollarSign,
  Briefcase,
  User,
  Calculator,
} from 'lucide-react';
import { Usuario } from '@/types/catalogs';
import { CreateRendicionInput } from '@/types/rendicion-schema';
import { SolicitudResponse } from '@/types/solicitud-backend';
import { cn, formatMoney, formatDateShort } from '@/lib/utils';

interface RendicionReviewModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateRendicionInput) => void;
  loading?: boolean;
  usuarios: Usuario[];
  solicitud: SolicitudResponse | null;
  currentUserId?: number;
  onError?: (errors: FieldErrors<CreateRendicionInput>) => void;
}

export function RendicionReviewModal({
  isOpen,
  onOpenChange,
  onSubmit,
  loading = false,
  usuarios,
  solicitud,
  currentUserId,
  onError,
}: RendicionReviewModalProps) {
  const { watch, control, handleSubmit, setValue } = useFormContext<CreateRendicionInput>();
  const [openPopover, setOpenPopover] = useState(false);

  const data = watch();

  const usuariosDisponibles = useMemo(() => {
    if (!currentUserId) return usuarios;
    return usuarios.filter((u) => u.id !== currentUserId);
  }, [usuarios, currentUserId]);

  const totalGastos = (data.gastos || []).reduce(
    (acc: number, g) => acc + (Number(g.montoTotal ?? g.montoBruto) || 0),
    0
  );

  const granTotalRendido = totalGastos;

  const montoAnticipado = useMemo(() => {
    return solicitud ? Number(solicitud.montoTotalNeto ?? 0) : 0;
  }, [solicitud]);

  const saldoLiquido = montoAnticipado - granTotalRendido;

  const [aprobadorActualId] = watch([
    'aprobadorActualId',
  ]) as [number | undefined];

  const canConfirmSubmit = !!aprobadorActualId;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-full sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            Revisar y Enviar Rendición
          </DialogTitle>
          <DialogDescription>
            Verifica el desglose financiero e introduce la firma digital para proceder.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[65vh] pr-4">
          <div className="space-y-6 py-4">
            {/* 1. Datos Generales de la Solicitud */}
            {solicitud && (
              <section className="space-y-2 bg-muted/40 rounded-lg p-3 border">
                <h3 className="text-muted-foreground text-[10px] font-black tracking-widest uppercase">
                  Solicitud Vinculada
                </h3>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                  <p className="flex items-center gap-1.5">
                    <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="font-bold">{solicitud.codigoSolicitud}</span>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>
                      {formatDateShort(solicitud.fechaInicio)} →{' '}
                      {formatDateShort(solicitud.fechaFin)}
                    </span>
                  </p>
                  <p className="col-span-2 text-muted-foreground">
                    Motivo: <span className="font-medium text-foreground">{solicitud.motivoViaje}</span>
                  </p>
                </div>
              </section>
            )}

            {/* 2. Resumen Financiero */}
            <section className="space-y-3">
              <h3 className="text-muted-foreground text-[10px] font-black tracking-widest uppercase">
                Resumen Financiero
              </h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-md border bg-slate-50 dark:bg-slate-900 p-2.5 text-center">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Anticipo</p>
                  <p className="mt-1 font-bold text-sm text-foreground">{formatMoney(montoAnticipado)} Bs.</p>
                </div>
                <div className="rounded-md border bg-slate-50 dark:bg-slate-900 p-2.5 text-center">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Ejecutado</p>
                  <p className="mt-1 font-bold text-sm text-blue-600">{formatMoney(granTotalRendido)} Bs.</p>
                </div>
                <div className={cn(
                  "rounded-md border p-2.5 text-center",
                  saldoLiquido >= 0
                    ? "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/30 dark:border-emerald-900/50 dark:text-emerald-400"
                    : "bg-red-50 border-red-200 text-red-800 dark:bg-red-950/30 dark:border-red-900/50 dark:text-red-400"
                )}>
                  <p className="text-[10px] font-bold uppercase opacity-80">
                    {saldoLiquido >= 0 ? 'A Devolver' : 'A Reembolsar'}
                  </p>
                  <p className="mt-1 font-black text-sm">
                    {formatMoney(Math.abs(saldoLiquido))} Bs.
                  </p>
                </div>
              </div>
            </section>

            {/* 3. Resumen de Egresos */}
            {data.gastos && data.gastos.length > 0 && (
              <section className="space-y-2">
                <h3 className="text-muted-foreground text-[10px] font-black tracking-widest uppercase">
                  Detalle de Gastos ({data.gastos.length})
                </h3>
                <div className="max-h-[150px] overflow-y-auto border rounded-md text-xs">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-900 text-muted-foreground text-left border-b font-semibold">
                        <th className="p-2">Fecha</th>
                        <th className="p-2">Doc</th>
                        <th className="p-2">Proveedor / Concepto</th>
                        <th className="p-2 text-right">Monto</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {data.gastos.map((g, i) => (
                        <tr key={i}>
                          <td className="p-2 truncate font-mono text-[10px]">
                            {g.fechaDocumento ? formatDateShort(String(g.fechaDocumento)) : '—'}
                          </td>
                          <td className="p-2 font-mono text-[10px]">{g.tipoDocumento}</td>
                          <td className="p-2 truncate max-w-[200px]">
                            {g.proveedor || 'S/P'} – <span className="text-muted-foreground">{g.concepto}</span>
                          </td>
                          <td className="p-2 text-right font-semibold">{formatMoney(Number(g.montoTotal ?? g.montoBruto))} Bs.</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* 4. Selección del Aprobador Inmediato (Popover Combobox) */}
            <section className="space-y-2">
              <FormField
                control={control}
                name="aprobadorActualId"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-muted-foreground text-[10px] font-black tracking-widest uppercase flex items-center gap-1">
                      <User className="h-3.5 w-3.5" />
                      Derivar Revisión A: <span className="text-destructive">*</span>
                    </FormLabel>

                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-400">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                        <p className="text-[12px] leading-tight font-medium">
                          Importante: Selecciona a tu inmediato superior o al responsable del área que verificará físicamente tu descargo.
                        </p>
                      </div>
                    </div>

                    <Popover open={openPopover} onOpenChange={setOpenPopover}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={openPopover}
                            className={cn(
                              'w-full justify-between h-9 text-sm font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value
                              ? usuariosDisponibles.find(
                                  (u) => u.id === field.value
                                )?.nombreCompleto || 'Seleccionar aprobador...'
                              : 'Seleccionar aprobador...'}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-[var(--radix-popover-trigger-width)] p-0"
                        align="start"
                      >
                        <Command>
                          <CommandInput placeholder="Buscar revisor..." />
                          <CommandList>
                            <CommandEmpty>No se encontró el revisor.</CommandEmpty>
                            <CommandGroup>
                              {usuariosDisponibles.map((usuario) => (
                                <CommandItem
                                  key={usuario.id}
                                  value={usuario.nombreCompleto}
                                  onSelect={() => {
                                    setValue('aprobadorActualId', usuario.id, {
                                      shouldValidate: true,
                                      shouldDirty: true,
                                    });
                                    setOpenPopover(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      'mr-2 h-4 w-4',
                                      usuario.id === field.value ? 'opacity-100' : 'opacity-0'
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
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )}
              />
            </section>

          </div>
        </ScrollArea>

        <DialogFooter className="mt-4 gap-2 sm:gap-0 border-t pt-4">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Volver a editar
          </Button>
          <Button
            className="min-w-[150px] shadow-lg bg-primary text-primary-foreground hover:bg-primary/95"
            onClick={handleSubmit(onSubmit, onError)}
            disabled={loading || !canConfirmSubmit}
          >
            {loading ? (
              'Enviando...'
            ) : (
              <>
                Confirmar y Enviar <SendHorizonal className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
