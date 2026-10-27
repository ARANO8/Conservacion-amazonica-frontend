'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, type FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import axios from 'axios';
import { toast } from 'sonner';
import { Save } from 'lucide-react';

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
import { etiquetaSede } from '@/lib/sedes';

const ETIQUETA =
  'w-[190px] shrink-0 text-xs font-bold tracking-wider uppercase';

/** Firma el VoBo del ANEXO 1 en papel; no interviene en el sistema */
const DIRECTOR_EJECUTIVO = 'Marcos F. Terán Valenzuela';

interface PlanViajeFormProps {
  planId?: number;
  initialValues?: PlanViajeFormData;
  /** El plan respalda una solicitud observada que se está corrigiendo */
  vinculado?: boolean;
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
 * encabezado, cronograma y pie con la emisión y las firmas.
 */
export default function PlanViajeForm({
  planId,
  initialValues,
  vinculado = false,
  destino,
}: PlanViajeFormProps) {
  const router = useRouter();
  const isEdit = typeof planId === 'number';
  const usuario = useAuthStore((state) => state.user);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [guardando, setGuardando] = useState(false);

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
        // Cargo y lugar de emisión se precargan del usuario, pero quedan
        // editables
        if (!isEdit) {
          const yo = lista.find((u) => String(u.id) === String(usuario?.id));
          if (yo?.cargo && !form.getValues('cargo')) {
            form.setValue('cargo', yo.cargo);
          }
          if (yo?.sede && !form.getFieldState('lugarEmision').isDirty) {
            form.setValue('lugarEmision', etiquetaSede(yo.sede));
          }
        }
      })
      .catch((error: unknown) => {
        if (!axios.isCancel(error)) {
          toast.error('No se pudo cargar la lista de usuarios.');
        }
      });
    return () => controller.abort();
  }, [form, isEdit, usuario?.id]);

  const guardar = async (data: PlanViajeFormData) => {
    setGuardando(true);
    try {
      const plan =
        isEdit && planId !== undefined
          ? await planesViajeService.update(planId, data)
          : await planesViajeService.create(data);

      toast.success(`Plan ${plan.codigoPlan} guardado.`);
      router.push(destino ?? `/app/planes-viaje/${plan.id}`);
      router.refresh();
    } catch (error: unknown) {
      toast.error(
        mensajeDeError(error, 'No se pudo guardar el plan de viaje.')
      );
    } finally {
      setGuardando(false);
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
        onSubmit={form.handleSubmit(guardar, onInvalid)}
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
          <div className="space-y-1">
            <span className="text-xs font-bold tracking-wider uppercase">
              VoBo — Director Ejecutivo
            </span>
            <p className="bg-muted rounded-md border px-3 py-2 text-sm">
              {DIRECTOR_EJECUTIVO}
            </p>
          </div>
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
          <Button type="submit" disabled={guardando}>
            <Save className="mr-2 h-4 w-4" />
            {guardando
              ? 'Guardando...'
              : vinculado
                ? 'Guardar cambios'
                : 'Guardar plan'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
