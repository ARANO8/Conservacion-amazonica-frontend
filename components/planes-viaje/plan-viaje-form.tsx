'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, type FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import axios from 'axios';
import { toast } from 'sonner';
import { Check, ChevronsUpDown, Save, Send } from 'lucide-react';

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
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth-store';
import { catalogosService } from '@/lib/services/catalogos-service';
import { planesViajeService } from '@/lib/services/planes-viaje-service';
import PlanViajeActividades from '@/components/planes-viaje/plan-viaje-actividades';
import {
  planViajeDefaults,
  planViajeSchema,
  type PlanViajeFormData,
} from '@/components/planes-viaje/plan-viaje-schema';
import type { Usuario } from '@/types/catalogs';

const ETIQUETA =
  'w-[190px] shrink-0 text-xs font-bold tracking-wider uppercase';

interface PlanViajeFormProps {
  planId?: number;
  initialValues?: PlanViajeFormData;
  /** Un plan vinculado a una solicitud no cambia de Director de Programa */
  directorFijo?: boolean;
  /** A dónde volver al guardar (p. ej. la solicitud observada que se corrige) */
  destino?: string;
}

function mensajeDeError(error: unknown, porDefecto: string): string {
  if (axios.isAxiosError(error) && error.response?.data?.message) {
    const { message } = error.response.data;
    return Array.isArray(message) ? message.join('. ') : String(message);
  }
  return porDefecto;
}

/**
 * Formulario del Plan de Viaje, maquetado como la hoja del ANEXO 1:
 * encabezado, cronograma y pie con la emisión y el VoBo.
 */
export default function PlanViajeForm({
  planId,
  initialValues,
  directorFijo = false,
  destino,
}: PlanViajeFormProps) {
  const router = useRouter();
  const isEdit = typeof planId === 'number';
  const usuario = useAuthStore((state) => state.user);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [guardando, setGuardando] = useState<'guardar' | 'enviar' | null>(null);
  const [directorAbierto, setDirectorAbierto] = useState(false);

  const form = useForm<PlanViajeFormData>({
    resolver: zodResolver(planViajeSchema),
    defaultValues: initialValues ?? planViajeDefaults(),
    mode: 'onBlur',
  });

  useEffect(() => {
    const controller = new AbortController();
    catalogosService
      .getUsuarios(controller.signal)
      .then((lista) => {
        setUsuarios(lista);
        // El cargo se precarga del usuario, pero queda editable
        if (!isEdit && !form.getValues('cargo')) {
          const yo = lista.find((u) => String(u.id) === String(usuario?.id));
          if (yo?.cargo) form.setValue('cargo', yo.cargo);
        }
      })
      .catch((error: unknown) => {
        if (!axios.isCancel(error)) {
          toast.error('No se pudo cargar la lista de usuarios.');
        }
      });
    return () => controller.abort();
  }, [form, isEdit, usuario?.id]);

  // Ni uno mismo ni Dirección Financiera (Tesorero), igual que en la solicitud
  const directoresDisponibles = useMemo(
    () =>
      usuarios.filter(
        (u) => String(u.id) !== String(usuario?.id) && u.rol !== 'TESORERO'
      ),
    [usuarios, usuario?.id]
  );

  const directorId = form.watch('directorProgramaId');
  const nombreDirector = usuarios.find(
    (u) => String(u.id) === directorId
  )?.nombreCompleto;

  /** La nómina institucional debe cuadrar antes de pedir el VoBo. */
  const validarParaEnviar = (data: PlanViajeFormData): boolean => {
    if (!data.directorProgramaId) {
      toast.error('Selecciona al Director de Programa que dará el VoBo.');
      return false;
    }
    for (const [i, a] of data.actividades.entries()) {
      if (a.institucionales.length !== Number(a.cantInstitucion)) {
        toast.error(
          `En la actividad ${i + 1} declaraste ${a.cantInstitucion} persona(s) institucional(es) pero seleccionaste ${a.institucionales.length}.`
        );
        return false;
      }
    }
    return true;
  };

  const guardar = async (data: PlanViajeFormData, enviar: boolean) => {
    if (enviar && !validarParaEnviar(data)) return;

    setGuardando(enviar ? 'enviar' : 'guardar');
    try {
      const plan =
        isEdit && planId !== undefined
          ? await planesViajeService.update(planId, data)
          : await planesViajeService.create(data);

      if (enviar) {
        await planesViajeService.enviar(plan.id);
        toast.success(
          `Plan ${plan.codigoPlan} enviado al Director de Programa para su VoBo.`
        );
      } else {
        toast.success(`Plan ${plan.codigoPlan} guardado.`);
      }
      router.push(destino ?? `/app/planes-viaje/${plan.id}`);
      router.refresh();
    } catch (error: unknown) {
      toast.error(
        mensajeDeError(error, 'No se pudo guardar el plan de viaje.')
      );
    } finally {
      setGuardando(null);
    }
  };

  const onInvalid = (errores: FieldErrors<PlanViajeFormData>) => {
    const filas = Array.isArray(errores.actividades)
      ? errores.actividades
          .map((fila, i) => (fila ? i + 1 : null))
          .filter((n): n is number => n !== null)
      : [];
    toast.error(
      filas.length > 0
        ? `Revisa la actividad ${filas.join(', ')} del cronograma.`
        : (errores.actividades?.message ??
            errores.actividades?.root?.message ??
            'Revisa los campos marcados en rojo.')
    );
  };

  const campoCabecera = (
    name: 'cargo' | 'lugaresViaje',
    etiqueta: string,
    placeholder: string
  ) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className="space-y-1">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
            <span className={ETIQUETA}>{etiqueta}</span>
            <FormControl>
              <Input
                placeholder={placeholder}
                className="h-9 text-sm"
                {...field}
              />
            </FormControl>
          </div>
          <FormMessage className="text-sm sm:pl-[202px]" />
        </FormItem>
      )}
    />
  );

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((d) => guardar(d, false), onInvalid)}
        className="space-y-6 p-6"
      >
        <header className="space-y-1">
          <p className="text-muted-foreground text-center text-xs font-bold tracking-widest uppercase">
            Anexo 1
          </p>
          <h2 className="text-center text-lg font-bold tracking-wide uppercase">
            Planificación de Viaje
          </h2>
        </header>

        <section className="space-y-2">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
            <span className={ETIQUETA}>Nombre</span>
            <Input
              value={usuario?.nombreCompleto ?? ''}
              readOnly
              disabled
              className="h-9 text-sm"
            />
          </div>
          {campoCabecera('cargo', 'Cargo', 'Ej: Técnico de campo')}
          {campoCabecera(
            'lugaresViaje',
            'Lugar(es) de viaje *',
            'Ej: Riberalta - Guayaramerín'
          )}
          <FormField
            control={form.control}
            name="objetivoViaje"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:gap-3">
                  <span className={cn(ETIQUETA, 'sm:pt-2')}>
                    Objetivo del viaje *
                  </span>
                  <FormControl>
                    <Textarea
                      placeholder="Describe el objetivo del viaje"
                      className="min-h-20 text-sm"
                      {...field}
                    />
                  </FormControl>
                </div>
                <FormMessage className="text-sm sm:pl-[202px]" />
              </FormItem>
            )}
          />
        </section>

        <Separator />

        <section className="space-y-3">
          <h3 className="text-sm font-semibold">Cronograma</h3>
          <PlanViajeActividades
            control={form.control}
            setValue={form.setValue}
            usuarios={usuarios}
          />
          <div className="text-muted-foreground space-y-0.5 text-xs">
            <p>
              Personal ACEAA: al indicar la cantidad se abre la selección de
              quiénes participan.
            </p>
            <p>
              Terceros: sus nombres y procedencia se registran en la solicitud
              de viaje. Para la rendición se adjunta el Registro de Asistencia
              de la actividad, si corresponde.
            </p>
          </div>
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
                  VoBo — Director de Programa
                </span>
                {directorFijo ? (
                  <p className="bg-muted rounded-md border px-3 py-2 text-sm">
                    {nombreDirector ?? 'Director de Programa designado'}
                  </p>
                ) : (
                  <Popover
                    open={directorAbierto}
                    onOpenChange={setDirectorAbierto}
                  >
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          type="button"
                          variant="outline"
                          role="combobox"
                          aria-expanded={directorAbierto}
                          className={cn(
                            'h-9 w-full justify-between text-sm font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          <span className="truncate">
                            {nombreDirector ?? 'Seleccionar...'}
                          </span>
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-[var(--radix-popover-trigger-width)] min-w-72 p-0"
                      align="start"
                    >
                      <Command>
                        <CommandInput placeholder="Buscar Director de Programa..." />
                        <CommandList>
                          <CommandEmpty>
                            No se encontró el usuario.
                          </CommandEmpty>
                          <CommandGroup>
                            {directoresDisponibles.map((u) => (
                              <CommandItem
                                key={u.id}
                                value={`${u.nombreCompleto} ${u.cargo ?? ''}`}
                                onSelect={() => {
                                  form.setValue(
                                    'directorProgramaId',
                                    String(u.id),
                                    { shouldDirty: true }
                                  );
                                  setDirectorAbierto(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    'mr-2 h-4 w-4',
                                    String(u.id) === field.value
                                      ? 'opacity-100'
                                      : 'opacity-0'
                                  )}
                                />
                                {u.nombreCompleto}
                                {u.cargo ? ` - ${u.cargo}` : ''}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                )}
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
                destino ??
                  (isEdit ? `/app/planes-viaje/${planId}` : '/app/planes-viaje')
              )
            }
          >
            Cancelar
          </Button>
          <Button type="submit" variant="secondary" disabled={!!guardando}>
            <Save className="mr-2 h-4 w-4" />
            {guardando === 'guardar'
              ? 'Guardando...'
              : directorFijo
                ? 'Guardar cambios'
                : 'Guardar borrador'}
          </Button>
          {!directorFijo && (
            <Button
              type="button"
              disabled={!!guardando}
              onClick={form.handleSubmit((d) => guardar(d, true), onInvalid)}
            >
              <Send className="mr-2 h-4 w-4" />
              {guardando === 'enviar'
                ? 'Enviando...'
                : 'Guardar y enviar a VoBo'}
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}
