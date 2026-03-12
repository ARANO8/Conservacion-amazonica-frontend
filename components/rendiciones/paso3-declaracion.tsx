'use client';

import { useFormContext, useFieldArray } from 'react-hook-form';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { FieldGroup, FieldSet, FieldLegend } from '@/components/ui/field';
import { CreateRendicionInput } from '@/types/rendicion-schema';
import { cn, formatMoney } from '@/lib/utils';
import { Plus, Trash2 } from 'lucide-react';

// ---------------------------------------------------------------------------
// Componente Principal
// ---------------------------------------------------------------------------

export default function Paso3Declaracion() {
  const form = useFormContext<CreateRendicionInput>();
  const { control, watch } = form;
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'gastosSinRespaldo',
  });

  const [confirmaDatos, aceptaDevolucion] = watch([
    'declaracionJurada.confirmaDatosVeridicos',
    'declaracionJurada.aceptaPoliticaDevolucion',
  ]) as [boolean | undefined, boolean | undefined];

  const handleAgregarGastoSinRespaldo = () => {
    append({
      fechaGasto: new Date().toISOString().split('T')[0],
      detalle: '',
      monto: 0,
    });
  };

  const totalGastosSinRespaldo = fields.reduce((sum, _, idx) => {
    const monto = form.watch(`gastosSinRespaldo.${idx}.monto`);
    const valor =
      typeof monto === 'number' ? monto : parseFloat(String(monto ?? 0)) || 0;
    return sum + valor;
  }, 0);

  return (
    <FieldSet>
      <FieldLegend>Declaración Jurada y Gastos sin Respaldo</FieldLegend>
      <p className="text-muted-foreground mb-6 text-sm">
        Registra los gastos realizados sin respaldo oficial (pasajes de taxi,
        compras en mercado, etc.) y confirma la veracidad de tu rendición.
      </p>

      <FieldGroup className="space-y-8">
        {/* ========== SECCIÓN A: GASTOS SIN RESPALDO ========== */}
        <div>
          <div className="mb-4 flex items-center gap-2">
            <h3 className="text-sm font-bold tracking-wider uppercase">
              Gastos sin Respaldo Oficial
            </h3>
            {fields.length > 0 && (
              <Badge variant="secondary">{fields.length}</Badge>
            )}
          </div>

          {fields.length === 0 ? (
            <div className="bg-muted/50 rounded-lg border-2 border-dashed p-6 text-center">
              <p className="text-muted-foreground text-sm font-medium">
                No hay gastos sin respaldo agregados
              </p>
              <p className="text-muted-foreground mt-1 text-xs">
                Presiona el botón de abajo si necesitas registrar gastos sin
                documentación oficial.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {fields.map((field, index) => (
                <Card key={field.id} className="border shadow-sm">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle className="text-sm font-semibold">
                        Gasto sin Respaldo #{index + 1}
                      </CardTitle>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => remove(index)}
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive h-8 w-8 p-0"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Eliminar gasto</span>
                      </Button>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {/* --- Fecha del Gasto --- */}
                      <FormField
                        control={control}
                        name={`gastosSinRespaldo.${index}.fechaGasto`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-bold tracking-wider uppercase">
                              Fecha del Gasto
                            </FormLabel>
                            <FormControl>
                              <input
                                type="date"
                                className={cn(
                                  'border-input bg-background ring-offset-background placeholder:text-muted-foreground',
                                  'focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-2',
                                  'text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
                                  'disabled:cursor-not-allowed disabled:opacity-50'
                                )}
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
                            <FormMessage className="text-[10px]" />
                          </FormItem>
                        )}
                      />

                      {/* --- Monto --- */}
                      <FormField
                        control={control}
                        name={`gastosSinRespaldo.${index}.monto`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-bold tracking-wider uppercase">
                              Monto (Bs.) *
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0.00"
                                step="0.01"
                                min="0"
                                className="h-9 text-sm"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(
                                    e.target.value
                                      ? parseFloat(e.target.value)
                                      : 0
                                  )
                                }
                              />
                            </FormControl>
                            <FormMessage className="text-[10px]" />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* --- Detalle del Gasto --- */}
                    <FormField
                      control={control}
                      name={`gastosSinRespaldo.${index}.detalle`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold tracking-wider uppercase">
                            Detalle del Gasto *
                          </FormLabel>
                          <FormControl>
                            <textarea
                              placeholder="Describe el gasto realizado (ej: pasaje de taxi, compras en mercado, etc.)"
                              className={cn(
                                'border-input bg-background ring-offset-background placeholder:text-muted-foreground',
                                'focus-visible:ring-ring flex min-h-16 w-full rounded-md border px-3 py-2',
                                'text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
                                'resize-none disabled:cursor-not-allowed disabled:opacity-50'
                              )}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-[10px]" />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* --- Botón Agregar Gasto sin Respaldo --- */}
          <Button
            type="button"
            variant="outline"
            onClick={handleAgregarGastoSinRespaldo}
            className="mt-4 w-full border-dashed"
          >
            <Plus className="mr-2 h-4 w-4" />
            Agregar Gasto sin Respaldo
          </Button>

          {/* --- Resumen de Gastos sin Respaldo --- */}
          {fields.length > 0 && (
            <Card className="mt-4 border-amber-200/50 bg-amber-50/50 dark:border-amber-900/50 dark:bg-amber-950/20">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold uppercase">
                    Total Gastos sin Respaldo:
                  </span>
                  <span className="text-lg font-black text-amber-600 dark:text-amber-400">
                    {formatMoney(totalGastosSinRespaldo)} Bs.
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <Separator className="my-6" />

        {/* ========== SECCIÓN B: TÉRMINOS Y CONDICIONES ========== */}
        <div>
          <h3 className="mb-6 text-sm font-bold tracking-wider uppercase">
            Términos y Condiciones
          </h3>

          <div className="space-y-6">
            {/* --- Confirmación de Datos Verídicos --- */}
            <div className="bg-card rounded-lg border p-4">
              <FormField
                control={control}
                name="declaracionJurada.confirmaDatosVeridicos"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start gap-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value === true}
                        onCheckedChange={(checked) => {
                          field.onChange(checked === true);
                        }}
                        className="mt-1"
                      />
                    </FormControl>
                    <div className="flex-1">
                      <FormLabel className="cursor-pointer text-sm leading-relaxed font-semibold">
                        Declaro bajo juramento que los gastos detallados en este
                        formulario son verídicos y se realizaron conforme a lo
                        aprobado en la solicitud de fondos.
                      </FormLabel>
                      <p className="text-muted-foreground mt-1 text-xs">
                        * Este campo es obligatorio para continuar
                      </p>
                      <FormMessage className="mt-2 text-[10px]" />
                    </div>
                  </FormItem>
                )}
              />
            </div>

            {/* --- Aceptación de Política de Devolución --- */}
            <div className="bg-card rounded-lg border p-4">
              <FormField
                control={control}
                name="declaracionJurada.aceptaPoliticaDevolucion"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start gap-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value === true}
                        onCheckedChange={(checked) => {
                          field.onChange(checked === true);
                        }}
                        className="mt-1"
                      />
                    </FormControl>
                    <div className="flex-1">
                      <FormLabel className="cursor-pointer text-sm leading-relaxed font-semibold">
                        Acepto la política de devolución de saldos. Si la
                        rendición es inferior al monto desembolsado, me
                        comprometo a devolver la diferencia en los plazos
                        establecidos.
                      </FormLabel>
                      <p className="text-muted-foreground mt-1 text-xs">
                        * Este campo es obligatorio para continuar
                      </p>
                      <FormMessage className="mt-2 text-[10px]" />
                    </div>
                  </FormItem>
                )}
              />
            </div>

            {/* --- Resumen de Aceptación --- */}
            <div
              className={cn(
                'rounded-lg border-2 p-4 transition-colors',
                confirmaDatos && aceptaDevolucion
                  ? 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/50 dark:bg-emerald-950/20'
                  : 'border-amber-200/50 bg-amber-50/50 dark:border-amber-900/50 dark:bg-amber-950/20'
              )}
            >
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    'h-2 w-2 rounded-full',
                    confirmaDatos && aceptaDevolucion
                      ? 'bg-emerald-500'
                      : 'bg-amber-500'
                  )}
                />
                <p className="text-sm font-medium">
                  {confirmaDatos && aceptaDevolucion
                    ? '✓ Listo para enviar la rendición'
                    : '⚠ Debes aceptar todos los términos para continuar'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* --- Observaciones Generales (Opcional) --- */}
        <div>
          <h3 className="mb-3 text-sm font-bold tracking-wider uppercase">
            Observaciones Generales (Opcional)
          </h3>
          <FormField
            control={control}
            name="observaciones"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <textarea
                    placeholder="Agrega cualquier observación o comentario adicional sobre tu rendición..."
                    className={cn(
                      'border-input bg-background ring-offset-background placeholder:text-muted-foreground',
                      'focus-visible:ring-ring flex min-h-20 w-full rounded-md border px-3 py-2',
                      'text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
                      'resize-none disabled:cursor-not-allowed disabled:opacity-50'
                    )}
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-[10px]" />
              </FormItem>
            )}
          />
        </div>
      </FieldGroup>
    </FieldSet>
  );
}
