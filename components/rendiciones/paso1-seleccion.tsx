'use client';

import { useState } from 'react';
import { UseFormReturn, useWatch } from 'react-hook-form';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { FieldGroup, FieldSet, FieldLegend } from '@/components/ui/field';
import { EstadoBadge } from '@/components/shared/estado-badge';
import {
  CalendarDays,
  Check,
  ChevronsUpDown,
  MapPin,
  FileText,
  Banknote,
  Plus,
  Trash2,
} from 'lucide-react';

import { cn, formatMoney, formatDateShort } from '@/lib/utils';
import { CreateRendicionInput } from '@/types/rendicion-schema';
import { SolicitudResponse } from '@/types/solicitud-backend';

// ---------------------------------------------------------------------------
// Card de resumen de la solicitud seleccionada
// ---------------------------------------------------------------------------

interface SolicitudResumenCardProps {
  solicitud: SolicitudResponse;
}

function SolicitudResumenCard({ solicitud }: SolicitudResumenCardProps) {
  const montoAnticipado = Number(solicitud.montoTotalNeto ?? 0);

  return (
    <Card className="border-primary/20 bg-primary/5 mt-6 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <FileText className="text-primary h-5 w-5 shrink-0" />
            <CardTitle className="text-primary text-base font-bold">
              {solicitud.codigoSolicitud}
            </CardTitle>
          </div>
          <EstadoBadge
            estado={solicitud.estado}
            className="text-[10px] font-bold uppercase"
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Fila 1: Motivo / Destino */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-0.5">
            <span className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">
              Motivo / Objetivo
            </span>
            <p className="text-foreground text-sm leading-snug font-medium">
              {solicitud.motivoViaje || '—'}
            </p>
          </div>

          <div className="space-y-0.5">
            <span className="text-muted-foreground flex items-center gap-1 text-[10px] font-bold tracking-wider uppercase">
              <MapPin className="h-3 w-3" />
              Destino
            </span>
            <p className="text-foreground text-sm font-medium">
              {solicitud.lugarViaje || '—'}
            </p>
          </div>
        </div>

        {/* Fila 2: Fechas */}
        <div className="space-y-0.5">
          <span className="text-muted-foreground flex items-center gap-1 text-[10px] font-bold tracking-wider uppercase">
            <CalendarDays className="h-3 w-3" />
            Período
          </span>
          <p className="text-foreground text-sm font-medium">
            {formatDateShort(solicitud.fechaInicio)}
            {' → '}
            {formatDateShort(solicitud.fechaFin)}
          </p>
        </div>

        <Separator />

        {/* Monto Total Anticipado — elemento principal */}
        <div className="rounded-lg bg-white/60 px-4 py-3 dark:bg-black/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Banknote className="text-primary h-5 w-5" />
              <span className="text-primary text-sm font-bold tracking-tight uppercase">
                Monto Total Anticipado
              </span>
            </div>
            <div className="text-right">
              <span className="text-primary text-2xl font-black tracking-tight">
                {formatMoney(montoAnticipado)}
              </span>
              {solicitud.montoTotalPresupuestado &&
                solicitud.montoTotalPresupuestado !==
                  solicitud.montoTotalNeto && (
                  <p className="text-muted-foreground text-[10px]">
                    Presupuestado:{' '}
                    {formatMoney(Number(solicitud.montoTotalPresupuestado))}
                  </p>
                )}
            </div>
          </div>
        </div>

        {/* Aprobador (si existe) */}
        {solicitud.aprobador && (
          <div className="space-y-0.5">
            <span className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">
              Aprobado por
            </span>
            <p className="text-foreground text-sm font-medium">
              {solicitud.aprobador.nombreCompleto}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------

interface Paso1SeleccionProps {
  form: UseFormReturn<CreateRendicionInput>;
  solicitudes: SolicitudResponse[];
}

export default function Paso1Seleccion({
  form,
  solicitudes,
}: Paso1SeleccionProps) {
  const [open, setOpen] = useState(false);

  // Watch para reaccionar al cambio de solicitudId y mostrar la card
  const solicitudId = useWatch({ control: form.control, name: 'solicitudId' });
  const solicitudSeleccionada = solicitudes.find((s) => s.id === solicitudId);

  // Gestión manual del array de cotizaciones (string[])
  const urlCotizaciones = useWatch({
    control: form.control,
    name: 'urlCotizaciones',
  }) ?? [''];

  const handleAddCotizacion = () => {
    form.setValue('urlCotizaciones', [...urlCotizaciones, ''], {
      shouldValidate: false,
      shouldDirty: true,
    });
  };

  const handleRemoveCotizacion = (idx: number) => {
    const updated = urlCotizaciones.filter((_, i) => i !== idx);
    form.setValue('urlCotizaciones', updated.length > 0 ? updated : [''], {
      shouldValidate: false,
      shouldDirty: true,
    });
  };

  return (
    <FieldSet>
      <FieldLegend>Vincular a una Solicitud Desembolsada</FieldLegend>
      <p className="text-muted-foreground mb-6 text-sm">
        Selecciona la solicitud de fondos que estás rindiendo. Solo se muestran
        solicitudes en estado <strong>Desembolsado</strong>.
      </p>

      {solicitudes.length === 0 ? (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
          <p className="text-sm text-amber-900 dark:text-amber-100">
            No hay solicitudes desembolsadas disponibles para rendir.
          </p>
          <p className="mt-2 text-xs text-amber-700 dark:text-amber-200">
            Asegúrate de que existe al menos una solicitud creada y en estado
            &quot;Desembolsado&quot; antes de proceder con una rendición.
          </p>
        </div>
      ) : (
        <FieldGroup>
          {/* ---- Combobox filtrable de solicitudes ---- */}
          <FormField
            control={form.control}
            name="solicitudId"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <span className="text-sm font-medium">Solicitud</span>
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
                          ? (solicitudes.find((s) => s.id === field.value)
                              ?.codigoSolicitud ?? 'Solicitud no encontrada')
                          : 'Buscar solicitud...'}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>

                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command>
                      <CommandInput placeholder="Buscar por código o motivo..." />
                      <CommandList>
                        <CommandEmpty>
                          No se encontraron solicitudes.
                        </CommandEmpty>
                        <CommandGroup>
                          {solicitudes.map((s) => (
                            <CommandItem
                              key={s.id}
                              value={`${s.codigoSolicitud} ${s.motivoViaje} ${s.lugarViaje ?? ''}`}
                              onSelect={() => {
                                field.onChange(s.id);
                                setOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  'mr-2 h-4 w-4',
                                  field.value === s.id
                                    ? 'opacity-100'
                                    : 'opacity-0'
                                )}
                              />
                              <div className="flex min-w-0 flex-col">
                                <span className="text-sm font-semibold">
                                  {s.codigoSolicitud}
                                </span>
                                <span className="text-muted-foreground truncate text-xs">
                                  {s.motivoViaje}
                                </span>
                              </div>
                              <span className="text-muted-foreground ml-auto shrink-0 text-xs">
                                {formatMoney(Number(s.montoTotalNeto ?? 0))}
                              </span>
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

          {/* ---- Card de Resumen (aparece al seleccionar) ---- */}
          {solicitudSeleccionada && (
            <SolicitudResumenCard solicitud={solicitudSeleccionada} />
          )}

          {/* ---- Fecha de Rendición (solo lectura — siempre es hoy) ---- */}
          <FormField
            control={form.control}
            name="fechaRendicion"
            render={({ field }) => (
              <FormItem>
                <span className="text-sm font-medium">Fecha de Rendición</span>
                <FormControl>
                  <Input
                    type="date"
                    readOnly
                    className="bg-muted cursor-not-allowed"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Separator />

          {/* ---- URL Cuadro Comparativo (opcional) ---- */}
          <FormField
            control={form.control}
            name="urlCuadroComparativo"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">
                  URL Cuadro Comparativo{' '}
                  <span className="text-muted-foreground font-normal">
                    (opcional)
                  </span>
                </FormLabel>
                <FormControl>
                  <Input
                    type="url"
                    placeholder="https://drive.google.com/..."
                    className="text-sm"
                    {...field}
                    value={field.value ?? ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* ---- URLs de Cotizaciones (mínimo 1 requerida) ---- */}
          <div className="space-y-3">
            <span className="text-sm font-medium">
              Cotizaciones <span className="text-destructive">*</span>
            </span>
            <p className="text-muted-foreground text-xs">
              Adjunta al menos una cotización para respaldar los gastos
              realizados.
            </p>

            {urlCotizaciones.map((_, idx) => (
              <FormField
                key={idx}
                control={form.control}
                name={`urlCotizaciones.${idx}`}
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-2">
                      <FormControl>
                        <Input
                          type="url"
                          placeholder={`https://drive.google.com/... (cotización ${idx + 1})`}
                          className="text-sm"
                          {...field}
                        />
                      </FormControl>
                      {urlCotizaciones.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveCotizacion(idx)}
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive h-9 w-9 shrink-0 p-0"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Eliminar cotización</span>
                        </Button>
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddCotizacion}
              className="border-dashed text-xs"
            >
              <Plus className="mr-1 h-3 w-3" />
              Añadir otra cotización
            </Button>
          </div>
        </FieldGroup>
      )}
    </FieldSet>
  );
}
