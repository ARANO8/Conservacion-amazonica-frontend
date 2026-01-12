'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Control, useFieldArray } from 'react-hook-form';
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { FormData } from '@/app/dashboard/solicitud/page';

interface SolicitudViajeItemsProps {
  control: Control<FormData>;
}

export default function SolicitudViajeItems({
  control,
}: SolicitudViajeItemsProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'viaticos',
  });

  return (
    <div className="space-y-3">
      <div className="text-muted-foreground mb-2 hidden grid-cols-12 gap-2 text-xs font-medium md:grid">
        <div className="col-span-3">Concepto Viático</div>
        <div className="col-span-2">Ciudad</div>
        <div className="col-span-2">Destino</div>
        <div className="col-span-2">Tipo</div>
        <div className="col-span-1">Días</div>
        <div className="col-span-1">Pers.</div>
        <div className="col-span-1"></div>
      </div>

      {fields.map((field, idx) => (
        <div
          key={field.id}
          className="bg-muted/5 grid grid-cols-1 items-start gap-2 rounded-md border p-2 md:grid-cols-12"
        >
          {/* Concepto */}
          <div className="md:col-span-3">
            <div className="text-muted-foreground mb-1 text-xs md:hidden">
              Concepto
            </div>
            <FormField
              control={control}
              name={`viaticos.${idx}.concepto`}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Concepto"
                      className="h-8 text-xs"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Ciudad */}
          <div className="md:col-span-2">
            <div className="text-muted-foreground mb-1 text-xs md:hidden">
              Ciudad
            </div>
            <FormField
              control={control}
              name={`viaticos.${idx}.ciudad`}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Ciudad"
                      className="h-8 text-xs"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Destino */}
          <div className="md:col-span-2">
            <div className="text-muted-foreground mb-1 text-xs md:hidden">
              Destino
            </div>
            <FormField
              control={control}
              name={`viaticos.${idx}.destino`}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Destino"
                      className="h-8 text-xs"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Tipo */}
          <div className="md:col-span-2">
            <div className="text-muted-foreground mb-1 text-xs md:hidden">
              Tipo
            </div>
            <FormField
              control={control}
              name={`viaticos.${idx}.tipo`}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Tipo"
                      className="h-8 text-xs"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Dias */}
          <div className="md:col-span-1">
            <div className="text-muted-foreground mb-1 text-xs md:hidden">
              Días
            </div>
            <FormField
              control={control}
              name={`viaticos.${idx}.dias`}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      className="h-8 text-xs"
                      min={0}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === ''
                            ? undefined
                            : Number(e.target.value)
                        )
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Personas */}
          <div className="md:col-span-1">
            <div className="text-muted-foreground mb-1 text-xs md:hidden">
              Pers.
            </div>
            <FormField
              control={control}
              name={`viaticos.${idx}.personas`}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      className="h-8 text-xs"
                      min={1}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === ''
                            ? undefined
                            : Number(e.target.value)
                        )
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Acciones */}
          <div className="flex justify-end md:col-span-1">
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive hover:text-destructive h-8 w-8 shrink-0"
              type="button"
              onClick={() => remove(idx)}
            >
              <span className="sr-only">Eliminar</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-4"
              >
                <path d="M3 6h18" />
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                <line x1="10" x2="10" y1="11" y2="17" />
                <line x1="14" x2="14" y1="11" y2="17" />
              </svg>
            </Button>
          </div>
        </div>
      ))}

      <div className="flex items-center justify-between pt-2">
        <Button
          variant="outline"
          size="sm"
          type="button"
          onClick={() =>
            append({
              concepto: '',
              ciudad: '',
              destino: '',
              tipo: '',
              dias: 0,
              personas: 1,
            })
          }
        >
          + Añadir Concepto
        </Button>
      </div>
    </div>
  );
}
