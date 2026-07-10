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
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { FieldGroup, FieldSet, FieldLegend } from '@/components/ui/field';
import { Percent } from 'lucide-react';
import { CreateRendicionInput } from '@/types/rendicion-schema';
import { SolicitudResponse } from '@/types/solicitud-backend';
import { formatMoney } from '@/lib/utils';
import { PartidasAprobadas } from './partidas-aprobadas';
import { GastoTable } from './gasto-table';
import { RetencionesTable } from './retenciones-table';

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

  const totalMontoTotal = gastosFields.reduce((sum, _, idx) => {
    const monto = form.watch(`gastos.${idx}.montoTotal`);
    const valor =
      typeof monto === 'number' ? monto : parseFloat(String(monto ?? 0)) || 0;
    return sum + valor;
  }, 0);

  const granTotalRendido = totalMontoTotal;

  return (
    <FieldSet>
      <FieldLegend>Rendición de Gastos Ejecutados</FieldLegend>
      <p className="text-foreground mb-6 text-sm">
        Registra cada gasto ejecutado (factura, recibo o boleta) y su partida
        presupuestaria. En esta etapa el respaldo documental es opcional.
      </p>

      <PartidasAprobadas solicitud={solicitud} gastos={gastos} />

      <FieldGroup className="space-y-6">
        <GastoTable
          fields={gastosFields}
          append={appendGasto}
          remove={removeGasto}
          solicitud={solicitud}
          form={form}
        />

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Percent className="text-muted-foreground h-4 w-4 shrink-0" />
            <h3 className="text-sm font-bold tracking-wider uppercase">
              Retenciones Impositivas por Gasto
            </h3>
          </div>
          <p className="text-foreground text-sm">
            Cálculo automático de retenciones de RC-IVA (13%), IUE (5%) e IT
            (3%) según el tipo de documento y la categoría de la partida
            presupuestaria.
          </p>
          <RetencionesTable
            form={form}
            solicitud={solicitud}
          />
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
