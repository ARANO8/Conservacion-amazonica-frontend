'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useFieldArray, useForm, type FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import axios from 'axios';
import { toast } from 'sonner';
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Plane,
  Plus,
  Save,
  Send,
  Trash2,
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
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { DirectorProgramaSelect } from '@/components/shared/director-programa-select';
import { cn } from '@/lib/utils';
import { formatFechaAnexo } from '@/lib/declaracion-movilidad';
import { useAuthStore } from '@/store/auth-store';
import { catalogosService } from '@/lib/services/catalogos-service';
import { informesViajeService } from '@/lib/services/informes-viaje-service';
import {
  InformeViajeSchema,
  actividadVacia,
  defaultInformeViajeValues,
  valoresDesdePrecarga,
  type InformeViajeInput,
} from '@/types/informe-viaje-schema';
import type { SolicitudInformable } from '@/types/informe-viaje-backend';
import type { Usuario } from '@/types/catalogs';

/** "A:" del ANEXO 7: el Director Ejecutivo, como en los demás anexos. */
const DESTINATARIO = 'Marcos F. Terán Valenzuela';

const ETIQUETA =
  'w-[170px] shrink-0 text-xs font-bold tracking-wider uppercase';

interface InformeViajeFormProps {
  informeId?: number;
  initialValues?: InformeViajeInput;
  /** Código de la solicitud del informe que se edita (no cambia) */
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

/**
 * Formulario del Informe de Viaje, maquetado como la hoja del ANEXO 7. Al
 * crear, primero se elige la solicitud de viaje: de ella se precarga lo que
 * ya se sabe del viaje, y aquí se completa lo que realmente se hizo.
 */
export default function InformeViajeForm({
  informeId,
  initialValues,
  codigoSolicitud,
  solicitudIdInicial,
}: InformeViajeFormProps) {
  const router = useRouter();
  const isEdit = typeof informeId === 'number';
  const usuario = useAuthStore((state) => state.user);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [disponibles, setDisponibles] = useState<SolicitudInformable[] | null>(
    isEdit ? [] : null
  );
  const [guardando, setGuardando] = useState<'guardar' | 'enviar' | null>(null);

  const form = useForm<InformeViajeInput>({
    resolver: zodResolver(InformeViajeSchema),
    defaultValues: initialValues ?? defaultInformeViajeValues,
    mode: 'onBlur',
  });
  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: 'actividades',
  });

  const solicitudId = form.watch('solicitudId');
  const actividades = form.watch('actividades');

  const elegirSolicitud = (solicitud: SolicitudInformable) => {
    form.reset(valoresDesdePrecarga(solicitud.id, solicitud.precarga));
  };

  useEffect(() => {
    const controller = new AbortController();
    catalogosService
      .getUsuarios(controller.signal)
      .then(setUsuarios)
      .catch(() => undefined);

    if (!isEdit) {
      informesViajeService
        .getSolicitudesDisponibles(controller.signal)
        .then((lista) => {
          setDisponibles(lista);
          const inicial = lista.find((s) => s.id === solicitudIdInicial);
          if (inicial) {
            form.reset(valoresDesdePrecarga(inicial.id, inicial.precarga));
          } else if (solicitudIdInicial) {
            toast.error(
              'Esa solicitud no admite informe: debe ser tuya, estar desembolsada y no tener otro informe.'
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

  // FECHA: DEL / AL — abarca todas las filas, igual que en el backend
  const rango = useMemo(() => {
    const fechas = (actividades ?? [])
      .map((a) => a.fecha)
      .filter(Boolean)
      .sort();
    return fechas.length
      ? { del: fechas[0], al: fechas[fechas.length - 1] }
      : null;
  }, [actividades]);

  const guardar = async (data: InformeViajeInput, enviar: boolean) => {
    if (enviar && !data.directorProgramaId) {
      toast.error(
        'Selecciona al Director de Programa que revisará el informe.'
      );
      return;
    }
    setGuardando(enviar ? 'enviar' : 'guardar');
    try {
      const informe =
        isEdit && informeId !== undefined
          ? await informesViajeService.update(informeId, data)
          : await informesViajeService.create(data);

      if (enviar) {
        await informesViajeService.enviar(informe.id);
        toast.success(
          `Informe ${informe.codigoInforme} enviado al Director de Programa.`
        );
      } else {
        toast.success(`Informe ${informe.codigoInforme} guardado.`);
      }
      router.push(`/app/informes-viaje/${informe.id}`);
      router.refresh();
    } catch (error: unknown) {
      toast.error(mensajeDeError(error, 'No se pudo guardar el informe.'));
    } finally {
      setGuardando(null);
    }
  };

  const onInvalid = (errores: FieldErrors<InformeViajeInput>) => {
    if (errores.solicitudId) {
      toast.error('Elige la solicitud de viaje de la que informas.');
      return;
    }
    const filas = Array.isArray(errores.actividades)
      ? errores.actividades
          .map((fila, i) => (fila ? i + 1 : null))
          .filter((n): n is number => n !== null)
      : [];
    toast.error(
      filas.length > 0
        ? `Completa la fila ${filas.join(', ')} de la tabla.`
        : (errores.actividades?.message ??
            'Revisa los campos marcados en rojo.')
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
            No tienes viajes pendientes de informe
          </h3>
          <p className="text-muted-foreground max-w-md text-sm">
            El informe se hace después del viaje, sobre una solicitud de viaje
            tuya ya desembolsada. Cada solicitud lleva un solo informe.
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
          <h3 className="font-semibold">¿De qué viaje informas?</h3>
          <p className="text-muted-foreground text-sm">
            Motivo, lugar, fechas y actividades se toman del plan de viaje;
            luego completas lo que realmente se hizo.
          </p>
        </div>
        <div className="grid gap-2 md:grid-cols-2">
          {disponibles.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => elegirSolicitud(s)}
              className="hover:bg-muted/50 flex items-start gap-3 rounded-lg border p-3 text-left transition-colors"
            >
              <CheckCircle2 className="text-muted-foreground/40 mt-0.5 h-5 w-5 shrink-0" />
              <span className="min-w-0 space-y-0.5">
                <span className="block font-mono text-xs font-semibold">
                  {s.codigoSolicitud}
                </span>
                <span className="block truncate text-sm font-medium">
                  {s.precarga.motivoViaje || 'Sin motivo registrado'}
                </span>
                <span className="text-muted-foreground block text-xs">
                  {s.precarga.lugarViaje || '—'}
                  {s.precarga.fechaInicio &&
                    ` · ${formatFechaAnexo(s.precarga.fechaInicio)} al ${formatFechaAnexo(s.precarga.fechaFin)}`}
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const solicitudElegida = disponibles?.find((s) => s.id === solicitudId);

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((d) => guardar(d, false), onInvalid)}
        className="space-y-6 p-6"
      >
        <header className="space-y-1">
          <p className="text-muted-foreground text-center text-xs font-bold tracking-widest uppercase">
            Anexo 7
          </p>
          <h2 className="text-center text-lg font-bold tracking-wide uppercase">
            Informe de Viaje
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
                  onClick={() => form.reset(defaultInformeViajeValues)}
                >
                  cambiar
                </button>
              </>
            )}
          </p>
        </header>

        <section className="space-y-2">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
            <span className={ETIQUETA}>A:</span>
            <Input
              value={DESTINATARIO}
              readOnly
              disabled
              className="h-9 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
            <span className={ETIQUETA}>De:</span>
            <Input
              value={usuario?.nombreCompleto ?? ''}
              readOnly
              disabled
              className="h-9 text-sm"
            />
          </div>
          {(
            [
              ['motivoViaje', 'Motivo del viaje *'],
              ['lugarViaje', 'Lugar de viaje *'],
            ] as const
          ).map(([name, etiqueta]) => (
            <FormField
              key={name}
              control={form.control}
              name={name}
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
                    <span className={ETIQUETA}>{etiqueta}</span>
                    <FormControl>
                      <Input className="h-9 text-sm" {...field} />
                    </FormControl>
                  </div>
                  <FormMessage className="text-sm sm:pl-[182px]" />
                </FormItem>
              )}
            />
          ))}
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
            <span className={ETIQUETA}>Fecha:</span>
            <p className="text-sm">
              {rango
                ? `Del ${formatFechaAnexo(rango.del)} al ${formatFechaAnexo(rango.al)}`
                : 'Se calcula de las fechas de la tabla'}
            </p>
          </div>
        </section>

        <Separator />

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Informe</h3>
            <span className="text-muted-foreground text-xs">
              {fields.length} actividad(es)
            </span>
          </div>

          {fields.map((field, index) => (
            <div
              key={field.id}
              className="bg-card grid grid-cols-1 gap-x-2 gap-y-3 rounded-lg border p-3 md:grid-cols-12"
            >
              <div className="text-muted-foreground flex items-center justify-between md:col-span-12">
                <span className="text-xs font-semibold">Fila {index + 1}</span>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    disabled={index === 0}
                    onClick={() => move(index, index - 1)}
                  >
                    <ArrowUp className="size-4" />
                    <span className="sr-only">Subir fila</span>
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    disabled={index === fields.length - 1}
                    onClick={() => move(index, index + 1)}
                  >
                    <ArrowDown className="size-4" />
                    <span className="sr-only">Bajar fila</span>
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive/80 hover:bg-destructive/10 h-7 w-7"
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="size-4" />
                    <span className="sr-only">Quitar fila</span>
                  </Button>
                </div>
              </div>

              <FormField
                control={form.control}
                name={`actividades.${index}.fecha`}
                render={({ field: f }) => (
                  <FormItem className="md:col-span-2">
                    <span className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">
                      Fecha
                    </span>
                    <FormControl>
                      <Input type="date" className="h-9 text-xs" {...f} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`actividades.${index}.lugar`}
                render={({ field: f }) => (
                  <FormItem className="md:col-span-3">
                    <span className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">
                      Lugar
                    </span>
                    <FormControl>
                      <Input
                        placeholder="Ej. Riberalta"
                        className="h-9 text-xs"
                        {...f}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`actividades.${index}.personaInstitucion`}
                render={({ field: f }) => (
                  <FormItem className="md:col-span-7">
                    <span className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">
                      Persona / institución / lugar
                    </span>
                    <FormControl>
                      <Input
                        placeholder="Ej. Gobierno Autónomo Municipal de Riberalta"
                        className="h-9 text-xs"
                        {...f}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`actividades.${index}.actividadesRealizadas`}
                render={({ field: f }) => (
                  <FormItem className="md:col-span-12">
                    <span className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">
                      Actividades realizadas
                    </span>
                    <FormControl>
                      <Textarea
                        placeholder="Qué se hizo realmente, con quién y qué resultados hubo"
                        className="min-h-16 text-xs"
                        {...f}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={() =>
              append(actividadVacia(actividades?.at(-1)?.fecha || undefined))
            }
          >
            <Plus className="mr-1 h-4 w-4" />
            Agregar fila
          </Button>
          <p className="text-muted-foreground text-xs">
            El informe detallado se hace llegar al Coordinador de Proyectos o
            Director de Sede según corresponda.
          </p>
        </section>

        <Separator />

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

        <div className="flex flex-wrap justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              router.push(
                isEdit
                  ? `/app/informes-viaje/${informeId}`
                  : '/app/informes-viaje'
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
