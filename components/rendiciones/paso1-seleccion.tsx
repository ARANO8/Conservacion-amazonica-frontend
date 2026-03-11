'use client';

import { useState } from 'react';
import { UseFormReturn, useWatch } from 'react-hook-form';
import {
  FormControl,
  FormField,
  FormItem,
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
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { FieldGroup, FieldSet, FieldLegend } from '@/components/ui/field';
import {
  CalendarDays,
  Check,
  ChevronsUpDown,
  MapPin,
  FileText,
  Banknote,
} from 'lucide-react';

import { cn, formatMoney } from '@/lib/utils';
import { CreateRendicionInput } from '@/types/rendicion-schema';
import { SolicitudResponse } from '@/types/solicitud-backend';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatFecha(iso?: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-BO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function estadoBadgeProps(estado: string): {
  label: string;
  className: string;
} {
  switch (estado?.toUpperCase()) {
    case 'DESEMBOLSADO':
      return {
        label: 'Desembolsado',
        className: 'border-emerald-200 bg-emerald-100 text-emerald-800',
      };
    case 'APROBADO':
      return {
        label: 'Aprobado',
        className: 'border-blue-200 bg-blue-100 text-blue-800',
      };
    default:
      return {
        label: estado ?? 'Desconocido',
        className: 'border-border bg-muted text-muted-foreground',
      };
  }
}

// ---------------------------------------------------------------------------
// Card de resumen de la solicitud seleccionada
// ---------------------------------------------------------------------------

interface SolicitudResumenCardProps {
  solicitud: SolicitudResponse;
}

function SolicitudResumenCard({ solicitud }: SolicitudResumenCardProps) {
  const badge = estadoBadgeProps(solicitud.estado);
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
          <Badge
            variant="outline"
            className={cn('text-[10px] font-bold uppercase', badge.className)}
          >
            {badge.label}
          </Badge>
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
            {formatFecha(solicitud.fechaInicio)}
            {' → '}
            {formatFecha(solicitud.fechaFin)}
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

  return (
    <FieldSet>
      <FieldLegend>Vincular a una Solicitud Desembolsada</FieldLegend>
      <p className="text-muted-foreground mb-6 text-sm">
        Selecciona la solicitud de fondos que estás rindiendo. Solo se muestran
        solicitudes en estado <strong>Desembolsado</strong>.
      </p>

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

        {/* ---- Fecha de Rendición ---- */}
        <FormField
          control={form.control}
          name="fechaRendicion"
          render={({ field }) => (
            <FormItem>
              <span className="text-sm font-medium">Fecha de Rendición</span>
              <FormControl>
                <input
                  type="date"
                  className={cn(
                    'border-input bg-background ring-offset-background placeholder:text-muted-foreground',
                    'focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2',
                    'text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
                    'disabled:cursor-not-allowed disabled:opacity-50'
                  )}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </FieldGroup>
    </FieldSet>
  );
}
