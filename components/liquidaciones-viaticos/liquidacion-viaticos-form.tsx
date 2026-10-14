'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  useFieldArray,
  useForm,
  useWatch,
  type FieldErrors,
} from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import axios from 'axios';
import { toast } from 'sonner';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronsUpDown,
  Plane,
  Save,
  Send,
  UserPlus,
} from 'lucide-react';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
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
import { DirectorProgramaSelect } from '@/components/shared/director-programa-select';
import {
  HojaLiquidacionCard,
  liquidoDeHoja,
} from '@/components/liquidaciones-viaticos/hoja-liquidacion-card';
import { cn, formatMoney } from '@/lib/utils';
import { formatFechaAnexo } from '@/lib/declaracion-movilidad';
import { useAuthStore } from '@/store/auth-store';
import { catalogosService } from '@/lib/services/catalogos-service';
import { liquidacionesViaticosService } from '@/lib/services/liquidaciones-viaticos-service';
import {
  LiquidacionViaticosSchema,
  defaultLiquidacionValues,
  hojaVacia,
  valoresDesdeSolicitud,
  type LiquidacionViaticosInput,
} from '@/types/liquidacion-viaticos-schema';
import type { SolicitudLiquidable } from '@/types/liquidacion-viaticos-backend';
import type { Concepto, Usuario } from '@/types/catalogs';

interface LiquidacionViaticosFormProps {
  liquidacionId?: number;
  initialValues?: LiquidacionViaticosInput;
  /** Código de la solicitud de la liquidación que se edita (no cambia) */
  codigoSolicitud?: string;
  /** Preselección desde la rendición (`?solicitudId=`) */
  solicitudIdInicial?: number;
}

function mensajeDeError(error: unknown, porDefecto: string): string {
  if (axios.isAxiosError(error) && error.response?.data?.message) {
    const { message } = error.response.data;
    return Array.isArray(message) ? message.join('. ') : String(message);
  }
  return porDefecto;
}

/** Combobox para sumar a una persona del personal a la liquidación. */
function AgregarPersona({
  usuarios,
  excluir,
  onElegir,
}: {
  usuarios: Usuario[];
  excluir: number[];
  onElegir: (u: Usuario) => void;
}) {
  const [abierto, setAbierto] = useState(false);
  const disponibles = usuarios.filter((u) => !excluir.includes(u.id));
  return (
    <Popover open={abierto} onOpenChange={setAbierto}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <UserPlus className="mr-2 h-4 w-4" />
          Agregar persona
          <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar persona..." />
          <CommandList>
            <CommandEmpty>No se encontró la persona.</CommandEmpty>
            <CommandGroup>
              {disponibles.map((u) => (
                <CommandItem
                  key={u.id}
                  value={`${u.nombreCompleto} ${u.cargo ?? ''}`}
                  onSelect={() => {
                    onElegir(u);
                    setAbierto(false);
                  }}
                >
                  <Check className="mr-2 h-4 w-4 opacity-0" />
                  {u.nombreCompleto}
                  {u.cargo ? ` - ${u.cargo}` : ''}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

/**
 * Formulario de la Liquidación de Viáticos (ANEXO 5). Al crear se elige la
 * solicitud desembolsada: de ella salen las hojas del personal institucional
 * ya calculadas, y aquí se ajustan días, porcentajes y datos de cada persona.
 */
export default function LiquidacionViaticosForm({
  liquidacionId,
  initialValues,
  codigoSolicitud,
  solicitudIdInicial,
}: LiquidacionViaticosFormProps) {
  const router = useRouter();
  const isEdit = typeof liquidacionId === 'number';
  const usuario = useAuthStore((state) => state.user);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [conceptos, setConceptos] = useState<Concepto[]>([]);
  const [disponibles, setDisponibles] = useState<SolicitudLiquidable[] | null>(
    isEdit ? [] : null
  );
  const [guardando, setGuardando] = useState<'guardar' | 'enviar' | null>(null);

  const form = useForm<LiquidacionViaticosInput>({
    resolver: zodResolver(LiquidacionViaticosSchema),
    defaultValues: initialValues ?? defaultLiquidacionValues,
    mode: 'onBlur',
  });
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'hojas',
  });

  const solicitudId = useWatch({ control: form.control, name: 'solicitudId' });
  const hojas = useWatch({ control: form.control, name: 'hojas' });

  useEffect(() => {
    const controller = new AbortController();
    catalogosService
      .getUsuarios(controller.signal)
      .then(setUsuarios)
      .catch(() => undefined);
    catalogosService
      .getConceptos(controller.signal)
      .then((lista) =>
        // Solo las tarifas que pagan viático al personal institucional
        setConceptos(lista.filter((c) => Number(c.precioInstitucional) > 0))
      )
      .catch(() => toast.error('No se pudieron cargar las tarifas.'));

    if (!isEdit) {
      liquidacionesViaticosService
        .getSolicitudesDisponibles(controller.signal)
        .then((lista) => {
          setDisponibles(lista);
          const inicial = lista.find((s) => s.id === solicitudIdInicial);
          if (inicial) {
            form.reset(valoresDesdeSolicitud(inicial));
          } else if (solicitudIdInicial) {
            toast.error(
              'Esa solicitud no admite liquidación: debe ser tuya, estar desembolsada y no tener otra liquidación.'
            );
          }
        })
        .catch(() => {
          if (!controller.signal.aborted) {
            toast.error('No se pudieron cargar tus solicitudes de viaje.');
            setDisponibles([]);
          }
        });
    }
    return () => controller.abort();
  }, [form, isEdit, solicitudIdInicial]);

  const solicitudElegida = disponibles?.find((s) => s.id === solicitudId);

  const totalLiquidado = useMemo(
    () => (hojas ?? []).reduce((t, h) => t + liquidoDeHoja(h, conceptos), 0),
    [hojas, conceptos]
  );
  const presupuestado = Number(solicitudElegida?.presupuestadoLiquido ?? 0);
  const excede =
    !!solicitudElegida && presupuestado > 0 && totalLiquidado > presupuestado;

  const guardar = async (data: LiquidacionViaticosInput, enviar: boolean) => {
    if (enviar && !data.directorProgramaId) {
      toast.error(
        'Selecciona al Director de Programa que revisará la liquidación.'
      );
      return;
    }
    setGuardando(enviar ? 'enviar' : 'guardar');
    try {
      const liquidacion =
        isEdit && liquidacionId !== undefined
          ? await liquidacionesViaticosService.update(liquidacionId, data)
          : await liquidacionesViaticosService.create(data);

      if (enviar) {
        await liquidacionesViaticosService.enviar(liquidacion.id);
        toast.success(
          `Liquidación ${liquidacion.codigoLiquidacion} enviada al Director de Programa.`
        );
      } else {
        toast.success(`Liquidación ${liquidacion.codigoLiquidacion} guardada.`);
      }
      router.push(`/app/liquidaciones-viaticos/${liquidacion.id}`);
      router.refresh();
    } catch (error: unknown) {
      toast.error(mensajeDeError(error, 'No se pudo guardar la liquidación.'));
    } finally {
      setGuardando(null);
    }
  };

  const onInvalid = (errores: FieldErrors<LiquidacionViaticosInput>) => {
    if (errores.solicitudId) {
      toast.error('Elige la solicitud de viaje que liquidas.');
      return;
    }
    const conError = Array.isArray(errores.hojas)
      ? errores.hojas
          .map((h, i) => (h ? (hojas?.[i]?.nombre ?? `hoja ${i + 1}`) : null))
          .filter((n): n is string => n !== null)
      : [];
    toast.error(
      conError.length > 0
        ? `Revisa la hoja de ${conError.join(', ')}.`
        : (errores.hojas?.message ??
            errores.hojas?.root?.message ??
            'Revisa los campos marcados en rojo.')
    );
  };

  const agregarPersona = (u: Usuario) => {
    const base = hojas?.[0];
    append(
      hojaVacia(
        u,
        base && {
          motivoViaje: base.motivoViaje,
          destino: base.destino,
          fechaSalida: base.fechaSalida,
          fechaRetorno: base.fechaRetorno,
        },
        solicitudElegida?.partidaPorDefecto ?? undefined
      )
    );
  };

  // --- Paso previo: elegir la solicitud ---
  if (!isEdit && !solicitudId) {
    if (disponibles === null) {
      return (
        <div className="space-y-3 p-6">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      );
    }
    if (disponibles.length === 0) {
      return (
        <div className="m-6 flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-14 text-center">
          <div className="bg-muted flex h-14 w-14 items-center justify-center rounded-full">
            <Plane className="text-muted-foreground h-7 w-7" />
          </div>
          <h3 className="font-semibold">
            No tienes viajes pendientes de liquidar
          </h3>
          <p className="text-muted-foreground max-w-md text-sm">
            La liquidación se hace sobre una solicitud de viaje tuya ya
            desembolsada. Cada solicitud lleva una sola liquidación, con una
            hoja por persona.
          </p>
          <Button variant="outline" size="sm" asChild>
            <Link href="/app/solicitudes">Ver mis solicitudes</Link>
          </Button>
        </div>
      );
    }
    return (
      <div className="space-y-4 p-6">
        <div>
          <h3 className="font-semibold">¿Qué viaje liquidas?</h3>
          <p className="text-muted-foreground text-sm">
            Se arma una hoja por cada persona de ACEAA del viaje, con los días
            de viático de la solicitud y las tarifas vigentes.
          </p>
        </div>
        <div className="grid gap-2 md:grid-cols-2">
          {disponibles.map((s) => {
            const primera = s.hojas[0];
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => form.reset(valoresDesdeSolicitud(s))}
                className="hover:bg-muted/50 flex items-start gap-3 rounded-lg border p-3 text-left transition-colors"
              >
                <CheckCircle2 className="text-muted-foreground/40 mt-0.5 h-5 w-5 shrink-0" />
                <span className="min-w-0 space-y-0.5">
                  <span className="block font-mono text-xs font-semibold">
                    {s.codigoSolicitud}
                  </span>
                  <span className="block truncate text-sm font-medium">
                    {primera?.motivoViaje || 'Sin motivo registrado'}
                  </span>
                  <span className="text-muted-foreground block text-xs">
                    {s.hojas.length === 0
                      ? 'Sin personal institucional registrado: agrégalo a mano'
                      : `${s.hojas.length} persona(s) · ${formatMoney(
                          s.hojas.reduce(
                            (t, h) => t + Number(h.totalLiquido),
                            0
                          )
                        )} a pagar`}
                    {primera?.fechaSalida &&
                      ` · ${formatFechaAnexo(primera.fechaSalida)} al ${formatFechaAnexo(primera.fechaRetorno)}`}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((d) => guardar(d, false), onInvalid)}
        className="space-y-6 p-6"
      >
        <header className="space-y-1">
          <p className="text-muted-foreground text-center text-xs font-bold tracking-widest uppercase">
            Anexo 5
          </p>
          <h2 className="text-center text-lg font-bold tracking-wide uppercase">
            Liquidación de Viáticos
          </h2>
          <p className="text-muted-foreground text-center text-xs">
            Solicitud{' '}
            <span className="font-mono font-semibold">
              {codigoSolicitud ?? solicitudElegida?.codigoSolicitud}
            </span>
            {!isEdit && (
              <>
                {' · '}
                <button
                  type="button"
                  className="hover:text-foreground underline"
                  onClick={() => form.reset(defaultLiquidacionValues)}
                >
                  cambiar
                </button>
              </>
            )}
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <FormField
            control={form.control}
            name="lugarEmision"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <span className="text-xs font-bold tracking-wider uppercase">
                  Lugar de emisión *
                </span>
                <FormControl>
                  <Input className="h-9 text-sm" {...field} />
                </FormControl>
                <FormMessage className="text-sm" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="fechaEmision"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <span className="text-xs font-bold tracking-wider uppercase">
                  Fecha *
                </span>
                <FormControl>
                  <Input type="date" className="h-9 text-sm" {...field} />
                </FormControl>
                <FormMessage className="text-sm" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="directorProgramaId"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <span className="text-xs font-bold tracking-wider uppercase">
                  Revisado por — Director de Programa
                </span>
                <DirectorProgramaSelect
                  usuarios={usuarios}
                  value={field.value}
                  excluirId={usuario?.id}
                  onChange={(id) =>
                    form.setValue('directorProgramaId', id, {
                      shouldDirty: true,
                    })
                  }
                />
                <FormMessage className="text-sm" />
              </FormItem>
            )}
          />
        </section>

        <Separator />

        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold">Hojas por persona</h3>
              <p className="text-muted-foreground text-xs">
                Una hoja del ANEXO 5 por cada persona de ACEAA. Viático completo
                (100%) o medio viático (50%) según el manual.
              </p>
            </div>
            <AgregarPersona
              usuarios={usuarios}
              excluir={(hojas ?? []).map((h) => h.usuarioId)}
              onElegir={agregarPersona}
            />
          </div>

          {fields.length === 0 && (
            <p className="text-muted-foreground rounded-md border border-dashed px-4 py-6 text-center text-sm">
              La solicitud no tiene personal institucional registrado. Agrega a
              las personas que viajaron.
            </p>
          )}

          {fields.map((field, index) => (
            <HojaLiquidacionCard
              key={field.id}
              form={form}
              index={index}
              conceptos={conceptos}
              partidaPorDefecto={
                solicitudElegida?.partidaPorDefecto ?? undefined
              }
              puedeQuitar={fields.length > 1}
              onRemove={() => remove(index)}
            />
          ))}
        </section>

        <div
          className={cn(
            'flex flex-wrap items-center justify-between gap-3 rounded-md border px-4 py-3 text-sm',
            excede &&
              'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200'
          )}
        >
          <span className="flex items-center gap-2">
            {excede && <AlertTriangle className="h-4 w-4 shrink-0" />}
            {excede
              ? `Lo liquidado supera lo presupuestado para viáticos (${formatMoney(presupuestado)}). Puedes guardar igual; la diferencia quedará a la vista del revisor.`
              : 'Total a pagar de todas las hojas'}
          </span>
          <span className="font-bold tabular-nums">
            {formatMoney(totalLiquidado)}
          </span>
        </div>

        <Separator />

        <div className="flex flex-wrap justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              router.push(
                isEdit
                  ? `/app/liquidaciones-viaticos/${liquidacionId}`
                  : '/app/liquidaciones-viaticos'
              )
            }
          >
            Cancelar
          </Button>
          <Button type="submit" variant="secondary" disabled={!!guardando}>
            <Save className="mr-2 h-4 w-4" />
            {guardando === 'guardar' ? 'Guardando...' : 'Guardar borrador'}
          </Button>
          <Button
            type="button"
            disabled={!!guardando}
            className={cn(guardando === 'enviar' && 'opacity-80')}
            onClick={form.handleSubmit((d) => guardar(d, true), onInvalid)}
          >
            <Send className="mr-2 h-4 w-4" />
            {guardando === 'enviar'
              ? 'Enviando...'
              : 'Guardar y enviar a revisión'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
