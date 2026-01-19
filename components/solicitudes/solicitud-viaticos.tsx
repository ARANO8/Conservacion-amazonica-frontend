'use client';

import { useMemo, useEffect } from 'react';
import {
  Control,
  useFieldArray,
  useWatch,
  useFormContext,
} from 'react-hook-form';
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { FormData } from '@/app/dashboard/solicitud/page';
import { formatMoney } from '@/lib/utils';
import { Label } from '@/components/ui/label';

interface SolicitudViaticosProps {
  control: Control<FormData>;
  actividadesPlanificadas: FormData['actividades'];
}

export default function SolicitudViaticos({
  control,
  actividadesPlanificadas,
}: SolicitudViaticosProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'viaticos',
  });

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        {fields.map((field, index) => (
          <ViaticoCard
            key={field.id}
            index={index}
            control={control}
            remove={remove}
            actividadesPlanificadas={actividadesPlanificadas}
          />
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() =>
          append({
            concepto: '',
            planificacionId: '',
            tipo: 'institucional',
            dias: 0,
            personas: 0,
            unitCost: 0,
            amount: 0,
          })
        }
      >
        + Agregar Otro Viático
      </Button>
    </div>
  );
}

interface ViaticoCardProps {
  index: number;
  control: Control<FormData>;
  remove: (index: number) => void;
  actividadesPlanificadas: FormData['actividades'];
}

function ViaticoCard({
  index,
  control,
  remove,
  actividadesPlanificadas,
}: ViaticoCardProps) {
  const { setValue } = useFormContext<FormData>();

  const dias = useWatch({
    control,
    name: `viaticos.${index}.dias`,
  }) as number;

  const personas = useWatch({
    control,
    name: `viaticos.${index}.personas`,
  }) as number;

  const unitCost = useWatch({
    control,
    name: `viaticos.${index}.unitCost`,
  }) as number;

  const total = useMemo(() => {
    const d = Number(dias) || 0;
    const p = Number(personas) || 0;
    const u = Number(unitCost) || 0;
    return d * p * u;
  }, [dias, personas, unitCost]);

  useEffect(() => {
    setValue(`viaticos.${index}.amount`, total);
  }, [total, setValue, index]);

  // Impuestos informativos
  const iva = total * 0.13;
  const it = total * 0.03;

  return (
    <div className="bg-card animate-in fade-in slide-in-from-top-2 overflow-hidden rounded-xl border shadow-sm duration-300">
      <div className="space-y-4 p-4">
        {/* Fila Superior: Distribución Equitativa (33% c/u) */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <FormField
            control={control}
            name={`viaticos.${index}.concepto`}
            render={({ field }) => (
              <FormItem>
                <Label className="text-muted-foreground text-xs font-bold uppercase">
                  Concepto Viático
                </Label>
                <Select
                  onValueChange={field.onChange}
                  value={field.value ?? 'viaticos'}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Concepto..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="viaticos">Viáticos</SelectItem>
                    <SelectItem value="pasajes">Pasajes</SelectItem>
                    <SelectItem value="refrigerios">Refrigerios</SelectItem>
                    <SelectItem value="otros">Otros</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name={`viaticos.${index}.planificacionId`}
            render={({ field }) => (
              <FormItem>
                <Label className="text-muted-foreground text-xs font-bold uppercase">
                  Planificación
                </Label>
                <Select
                  onValueChange={field.onChange}
                  value={field.value ?? ''}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Seleccionar actividad..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {actividadesPlanificadas.length > 0 ? (
                      actividadesPlanificadas.map((act, idx) => (
                        <SelectItem key={idx} value={act.actividadProgramada}>
                          {act.actividadProgramada}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-actividades" disabled>
                        No hay actividades
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name={`viaticos.${index}.tipo`}
            render={({ field }) => (
              <FormItem>
                <Label className="text-muted-foreground text-xs font-bold uppercase">
                  Tipo
                </Label>
                <Select
                  onValueChange={field.onChange}
                  value={field.value ?? 'institucional'}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="institucional">Institucional</SelectItem>
                    <SelectItem value="tercero">Tercero</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Fila Central */}
        <div className="grid gap-4 md:grid-cols-4">
          <FormField
            control={control}
            name={`viaticos.${index}.dias`}
            render={({ field }) => (
              <FormItem>
                <Label className="text-muted-foreground text-xs font-bold uppercase">
                  Días
                </Label>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    className="w-full"
                    value={field.value ?? 0}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name={`viaticos.${index}.personas`}
            render={({ field }) => (
              <FormItem>
                <Label className="text-muted-foreground text-xs font-bold uppercase">
                  Personas
                </Label>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    className="w-full"
                    value={field.value ?? 0}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name={`viaticos.${index}.unitCost`}
            render={({ field }) => (
              <FormItem>
                <Label className="text-muted-foreground text-xs font-bold uppercase">
                  Costo Unitario (Bs)
                </Label>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    className="w-full"
                    value={field.value ?? 0}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="space-y-2">
            <Label className="text-muted-foreground text-xs font-bold uppercase">
              Total (Bs)
            </Label>
            <Input
              value={formatMoney(total)}
              readOnly
              className="bg-muted font-bold"
            />
          </div>
        </div>
      </div>

      {/* Footer Informático */}
      <div className="bg-muted/50 flex flex-wrap items-center justify-between gap-4 border-t p-3 px-4">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex flex-col">
            <span className="text-muted-foreground text-[10px] leading-tight font-bold uppercase">
              Total Líquido
            </span>
            <span className="text-primary text-sm font-bold">
              {formatMoney(total)}
            </span>
          </div>
          <div className="bg-border hidden h-8 w-[1px] sm:block" />
          <div className="flex gap-4">
            <div className="flex flex-col">
              <span className="text-muted-foreground text-[10px] uppercase">
                IVA 13%
              </span>
              <span className="text-xs font-medium">{formatMoney(iva)}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-muted-foreground text-[10px] uppercase">
                IT 3%
              </span>
              <span className="text-xs font-medium">{formatMoney(it)}</span>
            </div>
          </div>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => remove(index)}
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="mr-2 size-4" />
          Eliminar
        </Button>
      </div>
    </div>
  );
}
