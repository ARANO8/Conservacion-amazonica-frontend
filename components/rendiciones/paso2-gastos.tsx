'use client';

import {
  useFormContext,
  useFieldArray,
  useWatch,
} from 'react-hook-form';
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
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { FieldGroup, FieldSet, FieldLegend } from '@/components/ui/field';
import { Plus, Trash2 } from 'lucide-react';
import { CreateRendicionInput } from '@/types/rendicion-schema';
import { SolicitudResponse } from '@/types/solicitud-backend';
import { formatMoney } from '@/lib/utils';
import { PartidasAprobadas } from './partidas-aprobadas';
import { GastoCard } from './gasto-card';

export default function Paso2Gastos({
  solicitud,
}: {
  solicitud: SolicitudResponse | null;
}) {
  const form = useFormContext<CreateRendicionInput>();
  const { control } = form;
  const gastos = useWatch({ control, name: 'gastos' }) ?? [];
  const {
    fields: gastosFields,
    append: appendGasto,
    remove: removeGasto,
  } = useFieldArray({
    control,
    name: 'gastos',
  });
  const {
    fields: gastosSinRespaldoFields,
    append: appendGastoSinRespaldo,
    remove: removeGastoSinRespaldo,
  } = useFieldArray({
    control,
    name: 'gastosSinRespaldo',
  });

  const handleAgregarGasto = () => {
    appendGasto({
      concepto: '',
      tipoDocumento: 'FACTURA',
      numeroDocumento: '',
      fechaDocumento: new Date().toISOString().split('T')[0],
      montoBruto: 0,
      montoImpuestos: 0,
      montoTotal: 0,
      montoNeto: 0,
      proveedor: '',
      detalle: '',
      partidaId: 0,
      tipoRetencion: 'SERVICIO',
      urlComprobante: '',
    });
  };

  const handleAgregarGastoSinRespaldo = () => {
    appendGastoSinRespaldo({
      fechaGasto: new Date().toISOString().split('T')[0],
      detalle: '',
      monto: 0,
    });
  };

  const totalMontoTotal = gastosFields.reduce((sum, _, idx) => {
    const monto = form.watch(`gastos.${idx}.montoTotal`);
    const valor =
      typeof monto === 'number' ? monto : parseFloat(String(monto ?? 0)) || 0;
    return sum + valor;
  }, 0);

  const totalGastosSinRespaldo = gastosSinRespaldoFields.reduce(
    (sum, _, idx) => {
      const monto = form.watch(`gastosSinRespaldo.${idx}.monto`);
      const valor =
        typeof monto === 'number' ? monto : parseFloat(String(monto ?? 0)) || 0;
      return sum + valor;
    },
    0
  );

  const granTotalRendido = totalMontoTotal + totalGastosSinRespaldo;

  return (
    <FieldSet>
      <FieldLegend>Rendición de Gastos Ejecutados</FieldLegend>
      <p className="text-foreground mb-6 text-sm">
        Registra cada gasto ejecutado (factura, recibo o boleta) y su partida
        presupuestaria. En esta etapa el respaldo documental es opcional.
      </p>

      <PartidasAprobadas solicitud={solicitud} gastos={gastos} />

      <FieldGroup className="space-y-6">
        {/* --- Lista de gastos --- */}
        {gastosFields.length === 0 ? (
          <div className="bg-muted/50 rounded-lg border-2 border-dashed p-6 text-center">
            <p className="text-foreground text-sm font-medium">
              No hay gastos agregados aún
            </p>
            <p className="text-foreground mt-1 text-sm">
              Presiona el botón de abajo para empezar a registrar los gastos
              ejecutados.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {gastosFields.map((field, index) => (
              <GastoCard
                key={field.id}
                index={index}
                solicitud={solicitud}
                onRemove={() => removeGasto(index)}
                form={form}
              />
            ))}

            <div className="mt-4 flex justify-start">
              <Button
                type="button"
                variant="outline"
                onClick={handleAgregarGasto}
                className="border-dashed"
              >
                <Plus className="mr-2 h-4 w-4" />
                Agregar Gasto
              </Button>
            </div>
          </div>
        )}

        {gastosFields.length === 0 && (
          <div className="mt-4 flex justify-start">
            <Button
              type="button"
              variant="outline"
              onClick={handleAgregarGasto}
              className="border-dashed"
            >
              <Plus className="mr-2 h-4 w-4" />
              Agregar Gasto
            </Button>
          </div>
        )}

        <Separator className="my-6" />

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold tracking-wider uppercase">
              Gastos Menores / Sin Respaldo (Opcional)
            </h3>
            {gastosSinRespaldoFields.length > 0 && (
              <Badge variant="secondary">
                {gastosSinRespaldoFields.length}
              </Badge>
            )}
          </div>

          {gastosSinRespaldoFields.length === 0 ? (
            <div className="bg-muted/50 rounded-lg border-2 border-dashed p-6 text-center">
              <p className="text-foreground text-sm font-medium">
                No hay gastos menores agregados
              </p>
              <p className="text-foreground mt-1 text-sm">
                Agrega aquí egresos sin respaldo oficial (ej: taxi o compras
                menores).
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {gastosSinRespaldoFields.map((field, index) => (
                <Card key={field.id} className="w-full border shadow-sm">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle className="text-sm font-semibold">
                        Gasto Menor #{index + 1}
                      </CardTitle>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeGastoSinRespaldo(index)}
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive h-8 w-8 p-0"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Eliminar gasto menor</span>
                      </Button>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                      <FormField
                        control={control}
                        name={`gastosSinRespaldo.${index}.fechaGasto`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-bold tracking-wider uppercase">
                              Fecha del Gasto
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
                        name={`gastosSinRespaldo.${index}.monto`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-bold tracking-wider uppercase">
                              Monto (Bs.)
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
                                      ? Number.parseFloat(e.target.value)
                                      : 0
                                  )
                                }
                              />
                            </FormControl>
                            <FormMessage className="text-sm" />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={control}
                        name={`gastosSinRespaldo.${index}.detalle`}
                        render={({ field }) => (
                          <FormItem className="md:col-span-2 lg:col-span-3">
                            <FormLabel className="text-sm font-bold tracking-wider uppercase">
                              Detalle del Gasto
                            </FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Describe el gasto menor realizado"
                                className="min-h-16 resize-none text-sm"
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

              <div className="mt-4 flex justify-start">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAgregarGastoSinRespaldo}
                  className="border-dashed"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar Gasto Menor
                </Button>
              </div>
            </div>
          )}

          {gastosSinRespaldoFields.length === 0 && (
            <div className="mt-4 flex justify-start">
              <Button
                type="button"
                variant="outline"
                onClick={handleAgregarGastoSinRespaldo}
                className="border-dashed"
              >
                <Plus className="mr-2 h-4 w-4" />
                Agregar Gasto Menor
              </Button>
            </div>
          )}
        </div>

        <Separator className="my-6" />

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
                  <Textarea
                    placeholder="Agrega cualquier observación o comentario adicional sobre tu rendición..."
                    className="min-h-20 resize-none text-sm"
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-sm" />
              </FormItem>
            )}
          />
        </div>

        <Card className="border-primary/20 bg-primary/5 w-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold uppercase">
              Resumen General de Gastos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-foreground font-medium">
                Total Registrado (Gastos):
              </span>
              <span className="font-bold">
                {formatMoney(totalMontoTotal)} Bs.
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-foreground font-medium">
                Total sin Respaldo (Gastos Menores):
              </span>
              <span className="font-bold text-amber-600 dark:text-amber-400">
                {formatMoney(totalGastosSinRespaldo)} Bs.
              </span>
            </div>
            <Separator className="my-2" />
            <div className="flex items-center justify-between text-sm">
              <span className="font-bold uppercase">Gran Total Rendido:</span>
              <span className="text-primary text-lg font-black">
                {formatMoney(granTotalRendido)} Bs.
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-white/60 px-3 py-2 text-sm dark:bg-black/10">
              <span className="font-bold">Registros de Gasto:</span>
              <Badge variant="secondary">{gastosFields.length}</Badge>
            </div>
          </CardContent>
        </Card>
      </FieldGroup>
    </FieldSet>
  );
}
