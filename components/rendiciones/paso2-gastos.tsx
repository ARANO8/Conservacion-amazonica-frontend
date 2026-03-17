'use client';

import { useFormContext, useFieldArray } from 'react-hook-form';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { FieldGroup, FieldSet, FieldLegend } from '@/components/ui/field';
import {
  CreateRendicionInput,
  TipoDocumentoGastoEnum,
} from '@/types/rendicion-schema';
import { SolicitudResponse } from '@/types/solicitud-backend';
import { formatMoney } from '@/lib/utils';
import { Banknote, BookOpen, Layers, Plus, Trash2 } from 'lucide-react';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getTipoDocumentoLabel(tipo: string): string {
  switch (tipo) {
    case 'FACTURA':
      return 'Factura';
    case 'RECIBO':
      return 'Recibo';
    case 'BOLETA':
      return 'Boleta';
    default:
      return tipo;
  }
}

// ---------------------------------------------------------------------------
// Sub-componente: Grid de Partidas Aprobadas
// ---------------------------------------------------------------------------

interface PartidasAprobadasProps {
  solicitud: SolicitudResponse | null;
}

function PartidasAprobadas({ solicitud }: PartidasAprobadasProps) {
  const presupuestos = solicitud?.presupuestos ?? [];

  // Filtrar entradas que tengan al menos código POA para que la card tenga sentido
  const partidas = presupuestos.filter((p) => p.poa?.codigoPoa);

  if (!solicitud) return null;

  if (partidas.length === 0) {
    return (
      <div className="bg-muted/40 mb-6 rounded-lg border border-dashed p-4">
        <div className="flex items-center gap-2">
          <Layers className="text-muted-foreground h-4 w-4 shrink-0" />
          <p className="text-muted-foreground text-sm">
            No se encontraron partidas presupuestarias para esta solicitud.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6 space-y-3">
      {/* Encabezado de sección */}
      <div className="flex items-center gap-2">
        <BookOpen className="text-primary h-4 w-4 shrink-0" />
        <h3 className="text-sm font-bold tracking-wide uppercase">
          Partidas Aprobadas para esta Rendición
        </h3>
      </div>
      <p className="text-muted-foreground text-xs">
        Cada comprobante debe imputarse a una de estas partidas. El monto
        mostrado es el subtotal presupuestado aprobado por línea.
      </p>

      {/* Grid de tarjetas */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        {partidas.map((p) => {
          const codigo = p.poa?.codigoPoa ?? '—';
          const partida = p.poa?.estructura?.partida?.nombre ?? 'Sin partida';
          const proyecto = p.poa?.estructura?.proyecto?.nombre;
          const grupo = p.poa?.estructura?.grupo?.nombre;
          const monto = Number(
            p.subtotalPresupuestado ?? p.poa?.montoPresupuestado ?? 0
          );

          return (
            <Card
              key={p.id}
              className="bg-muted/40 border shadow-none transition-shadow hover:shadow-sm"
            >
              <CardHeader className="pt-3 pb-2">
                <div className="flex items-start justify-between gap-2">
                  <Badge
                    variant="secondary"
                    className="text-primary bg-primary/10 border-primary/20 shrink-0 border font-mono text-[10px] font-bold"
                  >
                    {codigo}
                  </Badge>
                </div>
                <CardTitle className="text-foreground mt-1 text-xs leading-snug font-semibold">
                  {partida}
                </CardTitle>
                {(proyecto || grupo) && (
                  <p className="text-muted-foreground truncate text-[10px]">
                    {[proyecto, grupo].filter(Boolean).join(' / ')}
                  </p>
                )}
              </CardHeader>

              <CardContent className="pb-3">
                <Separator className="mb-2" />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Banknote className="text-muted-foreground h-3.5 w-3.5" />
                    <span className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">
                      Aprobado
                    </span>
                  </div>
                  <span className="text-primary text-sm font-black tracking-tight">
                    {formatMoney(monto)}{' '}
                    <span className="text-muted-foreground text-[10px] font-normal">
                      Bs.
                    </span>
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Separator className="mt-4" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Componente Principal
// ---------------------------------------------------------------------------

export default function Paso2Gastos({
  solicitud,
}: {
  solicitud: SolicitudResponse | null;
}) {
  const form = useFormContext<CreateRendicionInput>();
  const { control } = form;
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'gastos',
  });

  const handleAgregarGasto = () => {
    append({
      concepto: '',
      tipoDocumento: 'FACTURA',
      numeroDocumento: '',
      fechaDocumento: new Date().toISOString().split('T')[0],
      montoTotal: 0,
      montoNeto: 0,
      proveedor: '',
      detalle: '',
      partidaId: 0,
      urlComprobante: '',
    });
  };

  const totalMontoTotal = fields.reduce((sum, gasto, idx) => {
    const monto = form.watch(`gastos.${idx}.montoTotal`);
    const valor =
      typeof monto === 'number' ? monto : parseFloat(String(monto ?? 0)) || 0;
    return sum + valor;
  }, 0);

  const totalMontoNeto = fields.reduce((sum, gasto, idx) => {
    const monto = form.watch(`gastos.${idx}.montoNeto`);
    const valor =
      typeof monto === 'number' ? monto : parseFloat(String(monto ?? 0)) || 0;
    return sum + valor;
  }, 0);

  return (
    <FieldSet>
      <FieldLegend>Detalle de Comprobantes y Respaldo Documental</FieldLegend>
      <p className="text-muted-foreground mb-6 text-sm">
        Registra cada comprobante con su documento respaldo (Factura, Recibo o
        Boleta). Asegúrate de incluir todos los montos (total y neto).
      </p>

      <PartidasAprobadas solicitud={solicitud} />

      <FieldGroup className="space-y-6">
        {/* --- Lista de gastos --- */}
        {fields.length === 0 ? (
          <div className="bg-muted/50 rounded-lg border-2 border-dashed p-6 text-center">
            <p className="text-muted-foreground text-sm font-medium">
              No hay comprobantes agregados aún
            </p>
            <p className="text-muted-foreground mt-1 text-xs">
              Presiona el botón de abajo para empezar a registrar tus
              comprobantes.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {fields.map((field, index) => (
              <Card key={field.id} className="border shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-sm font-semibold">
                      Comprobante #{index + 1}
                    </CardTitle>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => remove(index)}
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive h-8 w-8 p-0"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Eliminar comprobante</span>
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {/* --- Fecha Documento --- */}
                    <FormField
                      control={control}
                      name={`gastos.${index}.fechaDocumento`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold tracking-wider uppercase">
                            Fecha
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
                          <FormMessage className="text-[10px]" />
                        </FormItem>
                      )}
                    />

                    {/* --- Tipo Documento --- */}
                    <FormField
                      control={control}
                      name={`gastos.${index}.tipoDocumento`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold tracking-wider uppercase">
                            Tipo
                          </FormLabel>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <FormControl>
                              <SelectTrigger className="h-9">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {TipoDocumentoGastoEnum.options.map((tipo) => (
                                <SelectItem key={tipo} value={tipo}>
                                  {getTipoDocumentoLabel(tipo)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage className="text-[10px]" />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {/* --- Número Documento --- */}
                    <FormField
                      control={control}
                      name={`gastos.${index}.numeroDocumento`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold tracking-wider uppercase">
                            N° Documento
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Ej: 0001-2025-0001234"
                              className="h-9 text-sm"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-[10px]" />
                        </FormItem>
                      )}
                    />

                    {/* --- Proveedor --- */}
                    <FormField
                      control={control}
                      name={`gastos.${index}.proveedor`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold tracking-wider uppercase">
                            Proveedor
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Nombre del proveedor"
                              className="h-9 text-sm"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-[10px]" />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* --- Concepto / Detalle --- */}
                  <FormField
                    control={control}
                    name={`gastos.${index}.concepto`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold tracking-wider uppercase">
                          Concepto / Detalle *
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe el gasto realizado (requerido)"
                            className="min-h-16 resize-none text-sm"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )}
                  />

                  {/* --- Partida Presupuestaria --- */}
                  <FormField
                    control={control}
                    name={`gastos.${index}.partidaId`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold tracking-wider uppercase">
                          Partida Presupuestaria *
                        </FormLabel>
                        <Select
                          value={field.value ? String(field.value) : ''}
                          onValueChange={(val) => field.onChange(Number(val))}
                        >
                          <FormControl>
                            <SelectTrigger className="h-9 text-sm">
                              <SelectValue placeholder="Selecciona una partida..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {(solicitud?.presupuestos ?? []).map((p) => {
                              const codigo = p.poa?.codigoPoa ?? '—';
                              const partida =
                                p.poa?.estructura?.partida?.nombre ?? '—';
                              return (
                                <SelectItem key={p.id} value={String(p.id)}>
                                  {codigo} – {partida}
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )}
                  />

                  {/* --- URL Comprobante --- */}
                  <FormField
                    control={control}
                    name={`gastos.${index}.urlComprobante`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold tracking-wider uppercase">
                          URL Comprobante *
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="url"
                            placeholder="https://drive.google.com/..."
                            className="h-9 text-sm"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )}
                  />

                  <Separator className="my-2" />

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {/* --- Monto Total (con impuestos) --- */}
                    <FormField
                      control={control}
                      name={`gastos.${index}.montoTotal`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold tracking-wider uppercase">
                            Monto Total (con IVA) Bs. *
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

                    {/* --- Monto Neto (sin impuestos) --- */}
                    <FormField
                      control={control}
                      name={`gastos.${index}.montoNeto`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold tracking-wider uppercase">
                            Monto Neto (sin IVA) Bs. *
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

                  {/* --- Resumen de impuestos --- */}
                  <div className="bg-muted/50 rounded-lg p-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground font-medium">
                        Diferencia (IVA aprox.):
                      </span>
                      <span className="font-bold">
                        {formatMoney(
                          (form.watch(`gastos.${index}.montoTotal`) || 0) -
                            (form.watch(`gastos.${index}.montoNeto`) || 0)
                        )}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Separator className="my-6" />

        {/* --- Botón Agregar Comprobante --- */}
        <Button
          type="button"
          variant="outline"
          onClick={handleAgregarGasto}
          className="w-full border-dashed"
        >
          <Plus className="mr-2 h-4 w-4" />
          Agregar Comprobante
        </Button>

        {/* --- Resumen Total --- */}
        {fields.length > 0 && (
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold">
                Resumen de Comprobantes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground font-medium">
                  Total Neto:
                </span>
                <span className="text-primary font-bold">
                  {formatMoney(totalMontoNeto)} Bs.
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground font-medium">
                  Total con Impuestos:
                </span>
                <span className="text-primary font-bold">
                  {formatMoney(totalMontoTotal)} Bs.
                </span>
              </div>
              <Separator className="my-2" />
              <div className="flex items-center justify-between text-sm">
                <span className="font-bold uppercase">
                  Impuestos Totales (aprox.):
                </span>
                <span className="text-primary text-lg font-black">
                  {formatMoney(totalMontoTotal - totalMontoNeto)} Bs.
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-white/60 px-3 py-2 text-sm dark:bg-black/10">
                <span className="font-bold">Cantidad de Comprobantes:</span>
                <Badge variant="secondary">{fields.length}</Badge>
              </div>
            </CardContent>
          </Card>
        )}
      </FieldGroup>
    </FieldSet>
  );
}
