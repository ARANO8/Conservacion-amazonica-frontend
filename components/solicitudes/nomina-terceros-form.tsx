'use client';

import { Control, useFieldArray } from 'react-hook-form';
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Trash2, UserPlus } from 'lucide-react';
import { FormData } from '@/app/dashboard/solicitud/page';
import { Label } from '@/components/ui/label';

interface NominaTercerosFormProps {
  control: Control<FormData>;
}

export default function NominaTercerosForm({
  control,
}: NominaTercerosFormProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'nomina',
  });

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        {fields.map((field, index) => (
          <NominaCard
            key={field.id}
            index={index}
            control={control}
            remove={remove}
          />
        ))}

        {fields.length === 0 && (
          <div className="text-muted-foreground flex flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center">
            <UserPlus className="mb-2 h-10 w-10 opacity-20" />
            <p className="text-sm">No se han registrado personas externas.</p>
            <p className="text-xs">
              Haz clic en &quot;Agregar Persona&quot; para iniciar el registro.
            </p>
          </div>
        )}
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() =>
          append({
            nombreCompleto: '',
            institucion: '',
          })
        }
      >
        <UserPlus className="mr-2 h-4 w-4" />
        Agregar Persona
      </Button>
    </div>
  );
}

interface NominaCardProps {
  index: number;
  control: Control<FormData>;
  remove: (index: number) => void;
}

function NominaCard({ index, control, remove }: NominaCardProps) {
  return (
    <div className="bg-card animate-in fade-in slide-in-from-top-2 overflow-hidden rounded-xl border shadow-sm duration-300">
      <div className="grid gap-4 p-4 md:grid-cols-2">
        <FormField
          control={control}
          name={`nomina.${index}.nombreCompleto`}
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
          name={`nomina.${index}.institucion`}
          render={({ field }) => (
            <FormItem>
              <Label className="text-muted-foreground text-xs font-bold uppercase">
                Institución o Procedencia
              </Label>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Ej. Universidad Mayor de San Andrés"
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
