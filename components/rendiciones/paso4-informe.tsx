'use client';

import { useFieldArray, useFormContext } from 'react-hook-form';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { FieldGroup, FieldSet, FieldLegend } from '@/components/ui/field';
import { Badge } from '@/components/ui/badge';
import { CreateRendicionInput } from '@/types/rendicion-schema';
import { Plus, Trash2 } from 'lucide-react';

export default function Paso4Informe() {
  const form = useFormContext<CreateRendicionInput>();
  const { control } = form;

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'informeGastos.actividades',
  });

  const handleAddActividad = () => {
    append({
      fecha: new Date().toISOString().split('T')[0],
      lugar: '',
      personaInstitucion: '',
      actividadesRealizadas: '',
    });
  };

  return (
    <FieldSet>
      <FieldLegend>Anexo 7: Informe de Gastos</FieldLegend>
      <p className="text-foreground mb-6 text-sm">
        Registra el rango del viaje y detalla la bitácora de actividades
        realizadas.
      </p>

      <FieldGroup className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField
            control={control}
            name="informeGastos.fechaInicio"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-bold tracking-wider uppercase">
                  Fecha Inicio *
                </FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    className="h-9"
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

          <FormField
            control={control}
            name="informeGastos.fechaFin"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-bold tracking-wider uppercase">
                  Fecha Fin *
                </FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    className="h-9"
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
        </div>

        <Separator className="my-2" />

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold tracking-wider uppercase">
              Bitácora de Actividades
            </h3>
            {fields.length > 0 && (
              <Badge variant="secondary">{fields.length}</Badge>
            )}
          </div>

          {fields.length === 0 ? (
            <div className="bg-muted/50 rounded-lg border-2 border-dashed p-6 text-center">
              <p className="text-foreground text-sm font-medium">
                No hay actividades registradas
              </p>
              <p className="text-foreground mt-1 text-sm">
                Debes registrar al menos una actividad para completar el
                informe.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {fields.map((field, index) => (
                <Card key={field.id} className="w-full border shadow-sm">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle className="text-sm font-semibold">
                        Actividad #{index + 1}
                      </CardTitle>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => remove(index)}
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive h-8 w-8 p-0"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Eliminar actividad</span>
                      </Button>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                      <FormField
                        control={control}
                        name={`informeGastos.actividades.${index}.fecha`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-bold tracking-wider uppercase">
                              Fecha *
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="date"
                                className="h-9"
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

                      <FormField
                        control={control}
                        name={`informeGastos.actividades.${index}.lugar`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-bold tracking-wider uppercase">
                              Lugar *
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Ej: Cobija"
                                className="h-9 text-sm"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage className="text-sm" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={control}
                        name={`informeGastos.actividades.${index}.personaInstitucion`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-bold tracking-wider uppercase">
                              Persona / Institución / Lugar *
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Ej: Gobierno Autónomo Municipal de Cobija"
                                className="h-9 text-sm"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage className="text-sm" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={control}
                        name={`informeGastos.actividades.${index}.actividadesRealizadas`}
                        render={({ field }) => (
                          <FormItem className="md:col-span-2 lg:col-span-3">
                            <FormLabel className="text-sm font-bold tracking-wider uppercase">
                              Actividades Realizadas *
                            </FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Describe las actividades realizadas en esta fecha"
                                className="min-h-20 resize-none text-sm"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage className="text-sm" />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <Button
            type="button"
            variant="outline"
            onClick={handleAddActividad}
            className="w-full border-dashed"
          >
            <Plus className="mr-2 h-4 w-4" />
            Añadir Actividad
          </Button>
        </div>
      </FieldGroup>
    </FieldSet>
  );
}
