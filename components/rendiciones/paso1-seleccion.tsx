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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
} from 'lucide-react';

import { cn, formatMoney, formatDateShort } from '@/lib/utils';
import { CreateRendicionInput } from '@/types/rendicion-schema';
import { SolicitudResponse } from '@/types/solicitud-backend';
import { Usuario } from '@/types/catalogs';

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
            className="text-sm font-bold uppercase"
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Fila 1: Motivo / Destino */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-0.5">
            <span className="text-foreground text-sm font-bold tracking-wider uppercase">
              Motivo / Objetivo
            </span>
            <p className="text-foreground text-sm leading-snug font-medium">
              {solicitud.motivoViaje || '—'}
            </p>
          </div>

          <div className="space-y-0.5">
            <span className="text-foreground flex items-center gap-1 text-sm font-bold tracking-wider uppercase">
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
          <span className="text-foreground flex items-center gap-1 text-sm font-bold tracking-wider uppercase">
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
                  <p className="text-foreground text-sm">
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
            <span className="text-foreground text-sm font-bold tracking-wider uppercase">
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
  usuarios: Usuario[];
  currentUserId?: number;
}

export default function Paso1Seleccion({
  form,
  solicitudes,
  usuarios,
  currentUserId,
}: Paso1SeleccionProps) {
  const [open, setOpen] = useState(false);

  // Watch para reaccionar al cambio de solicitudId y mostrar la card
  const solicitudId = useWatch({ control: form.control, name: 'solicitudId' });
  const solicitudSeleccionada = solicitudes.find((s) => s.id === solicitudId);
  const aprobadoresDisponibles = usuarios.filter(
    (usuario) => usuario.id !== currentUserId
  );

  return (
    <FieldSet>
      <FieldLegend>Vincular a una Solicitud Desembolsada</FieldLegend>
      <p className="text-foreground mb-6 text-sm">
        Selecciona la solicitud de fondos que estás rindiendo. Solo se muestran
        solicitudes en estado <strong>Desembolsado</strong>.
      </p>

      {solicitudes.length === 0 ? (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
          <p className="text-sm text-amber-900 dark:text-amber-100">
            No hay solicitudes desembolsadas disponibles para rendir.
          </p>
          <p className="mt-2 text-sm text-amber-800 dark:text-amber-100">
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
                                <span className="text-foreground truncate text-sm">
                                  {s.motivoViaje}
                                </span>
                              </div>
                              <span className="text-foreground ml-auto shrink-0 text-sm font-medium">
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

          {/* ---- Aprobador inmediato ---- */}
          <FormField
            control={form.control}
            name="aprobadorActualId"
            render={({ field }) => (
              <FormItem>
                <span className="text-sm font-medium">Aprobador Inmediato</span>
                <Select
                  value={field.value ? String(field.value) : ''}
                  onValueChange={(value) => field.onChange(Number(value))}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecciona un aprobador..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {aprobadoresDisponibles.map((usuario) => (
                      <SelectItem key={usuario.id} value={String(usuario.id)}>
                        {usuario.nombreCompleto}
                        {usuario.cargo ? ` — ${usuario.cargo}` : ''}
                        {usuario.rol ? ` (${usuario.rol})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </FieldGroup>
      )}
    </FieldSet>
  );
}
