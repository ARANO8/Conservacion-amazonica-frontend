'use client';

import { useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Control,
  useFieldArray,
  useWatch,
  UseFormSetValue,
  useFormState,
} from 'react-hook-form';
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Trash2 } from 'lucide-react';
import { FormData } from '@/components/solicitudes/solicitud-schema';

interface PlanificacionActividadesProps {
  control: Control<FormData>;
  setValue: UseFormSetValue<FormData>;
}

export default function PlanificacionActividades({
  control,
  setValue,
}: PlanificacionActividadesProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'actividades',
  });

  return (
    <div className="space-y-4">
      {/* Header - Desktop */}
      <div className="text-muted-foreground mb-1 hidden grid-cols-12 gap-2 px-2 text-[10px] font-bold tracking-wider uppercase md:grid">
        <div className="col-span-2">Fecha Inicio</div>
        <div className="col-span-2">Fecha Fin</div>
        <div className="col-span-1 text-center">Días</div>
        <div className="col-span-4">Actividad Programada</div>
        <div className="col-span-1 text-center leading-tight">Pers. Inst.</div>
        <div className="col-span-1 text-center leading-tight">Pers. Terc.</div>
        <div className="col-span-1"></div>
      </div>

      <div className="space-y-2">
        {fields.map((field, idx) => {
          return (
            <ActividadRow
              key={field.id}
              idx={idx}
              control={control}
              setValue={setValue}
              remove={remove}
            />
          );
        })}
      </div>

      <div className="flex items-center justify-between pt-2">
        <Button
          variant="outline"
          size="sm"
          type="button"
          className="text-xs"
          onClick={() =>
            append({
              fechaInicio: new Date().toISOString().split('T')[0],
              fechaFin: new Date().toISOString().split('T')[0],
              cantDias: 1,
              actividadProgramada: '',
              cantInstitucion: 0,
              cantTerceros: 0,
            })
          }
        >
          + Agregar Actividad al Cronograma
        </Button>
      </div>
    </div>
  );
}

interface ActividadRowProps {
  idx: number;
  control: Control<FormData>;
  setValue: UseFormSetValue<FormData>;
  remove: (index: number) => void;
}

function ActividadRow({ idx, control, setValue, remove }: ActividadRowProps) {
  // Watch dates to calculate days
  const fechaInicio = useWatch({
    control,
    name: `actividades.${idx}.fechaInicio`,
  });
  const fechaFin = useWatch({
    control,
    name: `actividades.${idx}.fechaFin`,
  });

  const calculateDays = useCallback(
    (start: string | Date, end: string | Date) => {
      if (!start || !end) return 1;
      const s = new Date(start);
      const e = new Date(end);
      if (isNaN(s.getTime()) || isNaN(e.getTime())) return 1;

      // Reset hours to avoid DST issues
      s.setHours(0, 0, 0, 0);
      e.setHours(0, 0, 0, 0);

      const diffTime = e.getTime() - s.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return diffDays > 0 ? diffDays : 1;
    },
    []
  );

  // Access form state to check for dirty fields
  const { dirtyFields } = useFormState({ control });

  useEffect(() => {
    // Check if the specific date fields for this row are dirty
    const isFechaInicioDirty = dirtyFields.actividades?.[idx]?.fechaInicio;
    const isFechaFinDirty = dirtyFields.actividades?.[idx]?.fechaFin;

    // Only recalculate if the user has manually changed the dates
    if ((isFechaInicioDirty || isFechaFinDirty) && fechaInicio && fechaFin) {
      const days = calculateDays(fechaInicio, fechaFin);
      setValue(`actividades.${idx}.cantDias`, days, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  }, [fechaInicio, fechaFin, idx, setValue, calculateDays, dirtyFields]);

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="bg-card hover:bg-muted/30 grid grid-cols-1 items-start gap-2 rounded-lg border p-3 transition-colors md:grid-cols-12 md:p-2">
      {/* Fecha Inicio */}
      <div className="md:col-span-2">
        <LabelMobile label="Fecha Inicio" />
        <FormField
          control={control}
          name={`actividades.${idx}.fechaInicio`}
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  type="date"
                  {...field}
                  value={
                    field.value instanceof Date
                      ? field.value.toISOString().split('T')[0]
                      : field.value || ''
                  }
                  min={today}
                  className="h-9 text-xs"
                  onChange={(e) => {
                    const newValue = e.target.value;
                    field.onChange(newValue);

                    // Date Push Logic: If new start date > current end date, push end date
                    if (
                      fechaFin &&
                      newValue >
                        (fechaFin instanceof Date
                          ? fechaFin.toISOString().split('T')[0]
                          : fechaFin)
                    ) {
                      setValue(`actividades.${idx}.fechaFin`, newValue, {
                        shouldValidate: true,
                        shouldDirty: true,
                      });
                    }
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Fecha Fin */}
      <div className="md:col-span-2">
        <LabelMobile label="Fecha Fin" />
        <FormField
          control={control}
          name={`actividades.${idx}.fechaFin`}
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  type="date"
                  {...field}
                  value={
                    field.value instanceof Date
                      ? field.value.toISOString().split('T')[0]
                      : field.value || ''
                  }
                  min={
                    fechaInicio instanceof Date
                      ? fechaInicio.toISOString().split('T')[0]
                      : fechaInicio || today
                  }
                  className="h-9 text-xs"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Días (Editable con decimales) */}
      <div className="md:col-span-1">
        <LabelMobile label="Días" />
        <FormField
          control={control}
          name={`actividades.${idx}.cantDias`}
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  type="number"
                  step="0.5"
                  min="0.5"
                  {...field}
                  className="bg-muted h-9 text-center text-xs font-bold"
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </div>

      {/* Actividad Programada */}
      <div className="md:col-span-4">
        <LabelMobile label="Actividad Programada" />
        <FormField
          control={control}
          name={`actividades.${idx}.actividadProgramada`}
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Descripción de la actividad"
                  className="h-9 text-xs"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Personas Institución */}
      <div className="md:col-span-1">
        <LabelMobile label="Pers. Inst." />
        <FormField
          control={control}
          name={`actividades.${idx}.cantInstitucion`}
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  type="number"
                  {...field}
                  min={0}
                  className="h-9 text-center text-xs"
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Personas Terceros */}
      <div className="md:col-span-1">
        <LabelMobile label="Pers. Terc." />
        <FormField
          control={control}
          name={`actividades.${idx}.cantTerceros`}
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  type="number"
                  {...field}
                  min={0}
                  className="h-9 text-center text-xs"
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Acciones */}
      <div className="mt-2 flex justify-end md:col-span-1 md:mt-0">
        <Button
          variant="ghost"
          size="icon"
          className="text-destructive hover:text-destructive/80 hover:bg-destructive/10 h-9 w-9 shrink-0"
          type="button"
          onClick={() => remove(idx)}
        >
          <Trash2 className="size-4" />
          <span className="sr-only">Eliminar</span>
        </Button>
      </div>
    </div>
  );
}

function LabelMobile({ label }: { label: string }) {
  return (
    <div className="text-muted-foreground mb-1 text-[10px] font-bold uppercase md:hidden">
      {label}
    </div>
  );
}
