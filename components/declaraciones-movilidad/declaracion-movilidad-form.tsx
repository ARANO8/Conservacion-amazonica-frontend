'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useAuthStore } from '@/store/auth-store';
import { declaracionesMovilidadService } from '@/lib/services/declaraciones-movilidad-service';
import { MovilidadTable } from './movilidad-table';
import {
  DeclaracionMovilidadSchema,
  defaultDeclaracionMovilidadValues,
  type DeclaracionMovilidadInput,
} from '@/types/declaracion-movilidad-schema';

/** Ciudades de emisión que ofrece la planilla original (celda C36 del Excel). */
const LUGARES_EMISION = ['La Paz', 'Cobija'];

const ETIQUETA =
  'w-[190px] shrink-0 text-xs font-bold tracking-wider uppercase';

interface DeclaracionMovilidadFormProps {
  declaracionId?: number;
  initialValues?: DeclaracionMovilidadInput;
}

export default function DeclaracionMovilidadForm({
  declaracionId,
  initialValues,
}: DeclaracionMovilidadFormProps) {
  const router = useRouter();
  const isEdit = typeof declaracionId === 'number';
  const [saving, setSaving] = useState(false);
  const usuario = useAuthStore((state) => state.user);

  const form = useForm<DeclaracionMovilidadInput>({
    resolver: zodResolver(DeclaracionMovilidadSchema),
    defaultValues: initialValues ?? defaultDeclaracionMovilidadValues,
    mode: 'onBlur',
  });

  // Los errores de la grilla no tienen dónde pintar un mensaje: hay que decir
  // en el toast qué fila quedó incompleta, además del marcado en rojo.
  const onInvalid = () => {
    const errores = form.formState.errors;

    // `errors.detalles` puede ser el error del arreglo entero o el de cada fila.
    const erroresPorFila = Array.isArray(errores.detalles)
      ? errores.detalles
      : [];
    const filasConError = erroresPorFila
      .map((fila, index) => (fila ? index + 1 : null))
      .filter((numero): numero is number => numero !== null);

    if (filasConError.length > 0) {
      toast.error(
        filasConError.length === 1
          ? `La fila ${filasConError[0]} del detalle está incompleta.`
          : `Las filas ${filasConError.join(', ')} del detalle están incompletas.`
      );
      return;
    }

    const motivo =
      errores.detalles?.message ??
      errores.detalles?.root?.message ??
      errores.cargo?.message ??
      errores.motivoActividad?.message ??
      errores.proyectoPartida?.message ??
      errores.fechaEmision?.message;

    toast.error(
      typeof motivo === 'string'
        ? motivo
        : 'Revisa los campos marcados en rojo antes de guardar.'
    );
  };

  const onSubmit = async (data: DeclaracionMovilidadInput) => {
    try {
      setSaving(true);
      if (isEdit && declaracionId !== undefined) {
        await declaracionesMovilidadService.update(declaracionId, data);
        toast.success('Declaración de movilidad actualizada.');
      } else {
        await declaracionesMovilidadService.create(data);
        toast.success('Declaración de movilidad registrada.');
      }
      router.push('/app/declaracion-movilidad');
      router.refresh();
    } catch (error: unknown) {
      const mensaje =
        axios.isAxiosError(error) && error.response?.data?.message
          ? String(error.response.data.message)
          : 'No se pudo guardar la declaración de movilidad.';
      toast.error(mensaje);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit, onInvalid)}
        className="space-y-6 p-6"
      >
        {/* Título tal como aparece impreso en el anexo */}
        <header className="space-y-1">
          <p className="text-muted-foreground text-center text-xs font-bold tracking-widest uppercase">
            Anexo 6
          </p>
          <h2 className="text-center text-lg font-bold tracking-wide uppercase">
            Declaración Jurada de Movilidad
          </h2>
          <p className="text-muted-foreground text-center text-xs font-semibold">
            (Expresado en Bolivianos)
          </p>
        </header>

        {/* Cabecera: cuatro filas etiqueta / valor, igual que la planilla */}
        <section className="space-y-2">
          <div className="flex items-center gap-3">
            <span className={ETIQUETA}>Nombre</span>
            <Input
              value={usuario?.nombreCompleto ?? ''}
              readOnly
              disabled
              className="h-9 text-sm"
            />
          </div>

          <FormField
            control={form.control}
            name="cargo"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <div className="flex items-center gap-3">
                  <span className={ETIQUETA}>Cargo *</span>
                  <FormControl>
                    <Input
                      placeholder="Ej: Especialista en Planificación y Monitoreo Institucional"
                      className="h-9 text-sm"
                      {...field}
                    />
                  </FormControl>
                </div>
                <FormMessage className="pl-[202px] text-sm" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="motivoActividad"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <div className="flex items-center gap-3">
                  <span className={ETIQUETA}>Motivo/Actividad *</span>
                  <FormControl>
                    <Input
                      placeholder="Ej: TALLER POA 2026"
                      className="h-9 text-sm"
                      {...field}
                    />
                  </FormControl>
                </div>
                <FormMessage className="pl-[202px] text-sm" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="proyectoPartida"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <div className="flex items-center gap-3">
                  <span className={ETIQUETA}>Proyecto/Partida Pptal *</span>
                  <FormControl>
                    <Input
                      placeholder="Ej: A5.1 / 10 /10 - POA: 4132 (Elaboración del POA 2026)"
                      className="h-9 text-sm"
                      {...field}
                    />
                  </FormControl>
                </div>
                <FormMessage className="pl-[202px] text-sm" />
              </FormItem>
            )}
          />
        </section>

        <p className="text-sm">
          De conformidad a las instrucciones impartidas por la institución{' '}
          <strong className="italic">DECLARO BAJO JURAMENTO</strong> haber
          realizado los gastos de movilidad que a continuación detallo:
        </p>

        <MovilidadTable form={form} />

        <p className="text-muted-foreground text-xs">
          En la columna resaltada escribe lo que gastaste en tus pasajes
          terrestres; el <strong>Monto Bs</strong> con impuestos se calcula solo
          y es el único que sale impreso en el anexo.
        </p>

        <Separator />

        {/* Pie: lugar y fecha de emisión */}
        <section className="flex flex-wrap items-start gap-4">
          <FormField
            control={form.control}
            name="lugarEmision"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <span className="text-xs font-bold tracking-wider uppercase">
                  Lugar de emisión *
                </span>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-9 w-[180px] text-sm">
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {LUGARES_EMISION.map((lugar) => (
                      <SelectItem key={lugar} value={lugar}>
                        {lugar}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                  <Input
                    type="date"
                    className="h-9 w-[180px] text-sm"
                    value={
                      typeof field.value === 'string'
                        ? field.value
                        : field.value instanceof Date
                          ? field.value.toISOString().split('T')[0]
                          : ''
                    }
                    onChange={(e) => field.onChange(e.target.value)}
                  />
                </FormControl>
                <FormMessage className="text-sm" />
              </FormItem>
            )}
          />
        </section>

        <Separator />

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/app/declaracion-movilidad')}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {isEdit ? 'Guardar cambios' : 'Registrar declaración'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
