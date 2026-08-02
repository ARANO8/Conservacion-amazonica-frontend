'use client';

import { Control, useFieldArray, useWatch } from 'react-hook-form';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Trash2, UserPlus, Users } from 'lucide-react';
import { FormData } from '@/components/solicitudes/solicitud-schema';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface NominaTercerosFormProps {
  control: Control<FormData>;
}

const formatFecha = (value: string | Date | undefined) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return format(date, "d 'de' MMMM", { locale: es });
};

export default function NominaTercerosForm({
  control,
}: NominaTercerosFormProps) {
  const actividades = useWatch({ control, name: 'actividades' }) || [];

  const grupos = actividades
    .map((actividad, index) => ({ actividad, index }))
    .filter(({ actividad }) => (actividad?.cantTerceros ?? 0) > 0);

  if (grupos.length === 0) {
    return (
      <div className="text-muted-foreground flex flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center">
        <UserPlus className="mb-2 h-10 w-10 opacity-20" />
        <p className="text-sm">
          No declaraste personas terceras en la planificación.
        </p>
        <p className="text-xs">
          Vuelve al paso 1 y ajusta la columna &quot;Pers. Terc.&quot; si
          necesitas registrarlas.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {grupos.map(({ actividad, index }) => (
        <GrupoActividad
          key={index}
          control={control}
          actividadIndex={index}
          titulo={actividad?.actividadProgramada || `Actividad ${index + 1}`}
          fechaInicio={formatFecha(actividad?.fechaInicio)}
          fechaFin={formatFecha(actividad?.fechaFin)}
          declarados={Number(actividad?.cantTerceros) || 0}
        />
      ))}
    </div>
  );
}

interface GrupoActividadProps {
  control: Control<FormData>;
  actividadIndex: number;
  titulo: string;
  fechaInicio: string | null;
  fechaFin: string | null;
  declarados: number;
}

function GrupoActividad({
  control,
  actividadIndex,
  titulo,
  fechaInicio,
  fechaFin,
  declarados,
}: GrupoActividadProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `actividades.${actividadIndex}.terceros`,
  });

  const coincide = fields.length === declarados;

  return (
    <div className="space-y-3 rounded-xl border p-4">
      <div className="flex flex-wrap items-start justify-between gap-2 border-b pb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Users className="text-muted-foreground h-4 w-4 shrink-0" />
            <p className="truncate text-sm font-semibold">{titulo}</p>
          </div>
          {fechaInicio && fechaFin && (
            <p className="text-muted-foreground mt-0.5 pl-6 text-xs">
              {fechaInicio} - {fechaFin}
            </p>
          )}
        </div>
        <span
          className={cn(
            'rounded-full px-2.5 py-1 text-xs font-medium',
            coincide
              ? 'bg-muted text-muted-foreground'
              : 'bg-destructive/10 text-destructive'
          )}
        >
          Registrados: {fields.length} / {declarados}
        </span>
      </div>

      <div className="space-y-4">
        {fields.map((field, index) => (
          <TerceroCard
            key={field.id}
            control={control}
            actividadIndex={actividadIndex}
            index={index}
            remove={remove}
          />
        ))}

        {fields.length === 0 && (
          <div className="text-muted-foreground flex flex-col items-center justify-center rounded-xl border border-dashed p-6 text-center">
            <UserPlus className="mb-2 h-8 w-8 opacity-20" />
            <p className="text-xs">
              No se han registrado personas para esta actividad.
            </p>
          </div>
        )}
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() =>
          append({ nombreCompleto: '', procedenciaInstitucion: '' })
        }
      >
        <UserPlus className="mr-2 h-4 w-4" />
        Agregar Persona
      </Button>
    </div>
  );
}

interface TerceroCardProps {
  control: Control<FormData>;
  actividadIndex: number;
  index: number;
  remove: (index: number) => void;
}

function TerceroCard({
  control,
  actividadIndex,
  index,
  remove,
}: TerceroCardProps) {
  return (
    <div className="bg-card animate-in fade-in slide-in-from-top-2 overflow-hidden rounded-xl border shadow-sm duration-300">
      <div className="bg-muted/50 border-b px-4 py-2">
        <p className="text-muted-foreground text-xs font-bold uppercase">
          Tercero {index + 1}
        </p>
      </div>

      <div className="grid gap-4 p-4 md:grid-cols-2">
        <FormField
          control={control}
          name={`actividades.${actividadIndex}.terceros.${index}.nombreCompleto`}
          render={({ field }) => (
            <FormItem>
              <Label className="text-muted-foreground text-xs font-bold uppercase">
                Nombre Completo
              </Label>
              <FormControl>
                <Input {...field} placeholder="Ej. Juan Pérez" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name={`actividades.${actividadIndex}.terceros.${index}.procedenciaInstitucion`}
          render={({ field }) => (
            <FormItem>
              <Label className="text-muted-foreground text-xs font-bold uppercase">
                Procedencia / Institución
              </Label>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Ej. Consultor Externo, Comunidad X, etc."
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="bg-muted/50 flex justify-end border-t p-2 px-4">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => remove(index)}
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Eliminar
        </Button>
      </div>
    </div>
  );
}
