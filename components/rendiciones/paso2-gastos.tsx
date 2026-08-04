'use client';

import { useMemo } from 'react';
import { useFormContext, useFieldArray, useWatch } from 'react-hook-form';
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
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { FieldGroup, FieldSet, FieldLegend } from '@/components/ui/field';
import { Percent, Link2 } from 'lucide-react';
import { CreateRendicionInput } from '@/types/rendicion-schema';
import { SolicitudResponse } from '@/types/solicitud-backend';
import { formatMoney } from '@/lib/utils';
import { PartidasAprobadas } from './partidas-aprobadas';
import { GastoTable } from './gasto-table';
import { ResumenAnexo4Blocks } from './resumen-anexo4';
import { resumirAnexo4, type GastoAnexo4 } from '@/lib/rendicion-anexo4';

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

  const importeRecibido = Number(solicitud?.montoTotalNeto ?? 0);

  const resumen = useMemo(() => {
    const presupuestos = solicitud?.presupuestos ?? [];
    const items: GastoAnexo4[] = (gastos ?? []).map(
      (g: Record<string, unknown>) => ({
        montoLiquido: Number(g?.montoTotal ?? 0),
        tipoDocumento: g?.tipoDocumento as string | undefined,
        tipoRetencion: g?.tipoRetencion as string | undefined,
        nombrePartida:
          presupuestos.find((p) => p.id === Number(g?.partidaId ?? 0))?.poa
            ?.estructura?.partida?.nombre ?? null,
      })
    );
    return resumirAnexo4(items, importeRecibido);
  }, [gastos, solicitud, importeRecibido]);

  return (
    <FieldSet>
      <FieldLegend>Rendición de Gastos Ejecutados</FieldLegend>
      <p className="text-foreground mb-6 text-sm">
        Registra cada gasto ejecutado (factura, recibo o boleta) y su partida
        presupuestaria. En esta etapa el respaldo documental es opcional.
      </p>

      <PartidasAprobadas solicitud={solicitud} gastos={gastos} />

      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900/50 dark:bg-blue-950/20">
        <div className="flex items-start gap-3">
          <Link2 className="mt-0.5 h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
          <div className="min-w-0 flex-1 space-y-1">
            <h3 className="text-sm font-bold tracking-wider text-blue-800 uppercase dark:text-blue-300">
              Enlace de Comprobantes <span className="text-destructive">*</span>
            </h3>
            <p className="text-xs text-blue-700 dark:text-blue-400">
              Ingresa la URL (Google Drive, Dropbox, etc.) donde se encuentran
              todos los comprobantes digitales de esta rendición.
            </p>
            <FormField
              control={control}
              name="comprobanteUrl"
              render={({ field }) => (
                <FormItem className="mt-2">
                  <FormControl>
                    <Input
                      type="url"
                      placeholder="https://drive.google.com/drive/folders/..."
                      className="h-9 bg-white text-sm dark:bg-blue-950/40"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
          </div>
        </div>
      </div>

      <FieldGroup className="space-y-6">
        <div className="flex items-center gap-2">
          <Percent className="text-muted-foreground h-4 w-4 shrink-0" />
          <p className="text-foreground text-sm">
            Las retenciones de RC-IVA (13%), IUE (5%) e IT (3%) se calculan
            automáticamente en la misma tabla, según el tipo de documento y la
            categoría de la partida presupuestaria.
          </p>
        </div>

        <GastoTable
          fields={gastosFields}
          append={appendGasto}
          remove={removeGasto}
          solicitud={solicitud}
          form={form}
        />

        <ResumenAnexo4Blocks
          resumen={resumen}
          importeRecibido={importeRecibido}
        />

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
