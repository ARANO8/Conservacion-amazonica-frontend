'use client';

import { useCallback, useMemo } from 'react';
import { differenceInDays, format, parseISO, startOfToday } from 'date-fns';
import { es } from 'date-fns/locale';
import type { DateRange } from 'react-day-picker';
import { CalendarIcon, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import {
  Control,
  useFieldArray,
  useWatch,
  UseFormSetValue,
} from 'react-hook-form';
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { cn } from '@/lib/utils';
import { FormData } from '@/components/solicitudes/solicitud-schema';

interface PlanificacionActividadesProps {
  control: Control<FormData>;
  setValue: UseFormSetValue<FormData>;
}

function toDate(value: string | Date | undefined): Date | undefined {
  if (!value) return undefined;
  const date = value instanceof Date ? value : parseISO(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function toInputDate(value: Date): string {
  return format(value, 'yyyy-MM-dd');
}

function formatRangeLabel(range: DateRange | undefined): string {
  if (!range?.from) return 'Seleccionar rango de fechas';
  if (!range.to) return format(range.from, 'PPP', { locale: es });
  return `${format(range.from, 'PPP', { locale: es })} - ${format(
    range.to,
    'PPP',
    { locale: es }
  )}`;
}

function calculateCalendarDays(from: Date, to: Date): number {
  const start = new Date(from);
  const end = new Date(to);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  return Math.max(differenceInDays(end, start) + 1, 1);
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
      <div className="text-muted-foreground mb-1 hidden grid-cols-12 gap-2 px-2 text-[10px] font-bold tracking-wider uppercase md:grid">
        <div className="col-span-4">Rango de Fechas</div>
        <div className="col-span-1 text-center">Días</div>
        <div className="col-span-4">Actividad Programada</div>
        <div className="col-span-1 text-center leading-tight">Pers. Inst.</div>
        <div className="col-span-1 text-center leading-tight">Pers. Terc.</div>
        <div className="col-span-1"></div>
      </div>

      <div className="space-y-2">
        {fields.map((field, idx) => (
          <ActividadRow
            key={field.id}
            idx={idx}
            control={control}
            setValue={setValue}
            remove={remove}
          />
        ))}
      </div>

      <div className="flex items-center justify-between pt-2">
        <Button
          variant="outline"
          size="sm"
          type="button"
          className="text-xs"
          onClick={() => {
            const today = new Date();
            append({
              fechaInicio: toInputDate(today),
              fechaFin: toInputDate(today),
              cantDias: 1,
              actividadProgramada: '',
              cantInstitucion: 0,
              cantTerceros: 0,
            });
          }}
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
  const fechaInicio = useWatch({
    control,
    name: `actividades.${idx}.fechaInicio`,
  });

  const fechaFin = useWatch({
    control,
    name: `actividades.${idx}.fechaFin`,
  });

  const selectedRange = useMemo<DateRange | undefined>(() => {
    const from = toDate(fechaInicio as string | Date | undefined);
    const to = toDate(fechaFin as string | Date | undefined);

    if (!from && !to) return undefined;
    return { from, to: to ?? from };
  }, [fechaInicio, fechaFin]);

  const handleRangeChange = useCallback(
    (range: DateRange | undefined) => {
      const from = range?.from;
      const to = range?.to;

      if (!from) {
        setValue(`actividades.${idx}.fechaInicio`, '', {
          shouldDirty: true,
          shouldValidate: true,
        });
        setValue(`actividades.${idx}.fechaFin`, '', {
          shouldDirty: true,
          shouldValidate: true,
        });
        setValue(`actividades.${idx}.cantDias`, 1, {
          shouldDirty: true,
          shouldValidate: true,
        });
        return;
      }

      const normalizedTo = to ?? from;
      const days = calculateCalendarDays(from, normalizedTo);

      setValue(`actividades.${idx}.fechaInicio`, toInputDate(from), {
        shouldDirty: true,
        shouldValidate: true,
      });
      setValue(`actividades.${idx}.fechaFin`, toInputDate(normalizedTo), {
        shouldDirty: true,
        shouldValidate: true,
      });
      setValue(`actividades.${idx}.cantDias`, days, {
        shouldDirty: true,
        shouldValidate: true,
      });
    },
    [idx, setValue]
  );

  const today = useMemo(() => startOfToday(), []);

  return (
    <div className="bg-card hover:bg-muted/30 grid grid-cols-1 items-start gap-2 rounded-lg border p-3 transition-colors md:grid-cols-12 md:p-2">
      <div className="md:col-span-4">
        <LabelMobile label="Rango de Fechas" />

        <FormField
          control={control}
          name={`actividades.${idx}.fechaInicio`}
          render={() => (
            <FormItem>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      type="button"
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left text-xs font-normal',
                        !selectedRange?.from && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      <span className="truncate">
                        {formatRangeLabel(selectedRange)}
                      </span>
                    </Button>
                  </FormControl>
                </PopoverTrigger>

                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    locale={es}
                    selected={selectedRange}
                    onSelect={handleRangeChange}
                    numberOfMonths={2}
                    disabled={{ before: today }}
                    className="rounded-md border"
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

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
                  onChange={(e) =>
                    field.onChange(
                      e.target.value === '' ? undefined : Number(e.target.value)
                    )
                  }
                />
              </FormControl>
            </FormItem>
          )}
        />
      </div>

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
                  onChange={(e) =>
                    field.onChange(
                      e.target.value === '' ? undefined : Number(e.target.value)
                    )
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

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
                  onChange={(e) =>
                    field.onChange(
                      e.target.value === '' ? undefined : Number(e.target.value)
                    )
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

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
