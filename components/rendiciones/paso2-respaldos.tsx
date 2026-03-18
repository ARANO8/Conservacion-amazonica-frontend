'use client';

import { useFormContext, useWatch } from 'react-hook-form';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FieldGroup, FieldSet, FieldLegend } from '@/components/ui/field';
import { Plus, Trash2, Link2, FileSpreadsheet } from 'lucide-react';

import { CreateRendicionInput } from '@/types/rendicion-schema';

// ---------------------------------------------------------------------------
// Componente Principal
// ---------------------------------------------------------------------------

export default function Paso2Respaldos() {
  const form = useFormContext<CreateRendicionInput>();

  // Gestión manual del array de cotizaciones (string[])
  // useFieldArray no admite string[] directamente — usamos useWatch + setValue
  const urlCotizaciones = useWatch({
    control: form.control,
    name: 'urlCotizaciones',
  }) ?? [''];

  const handleAddCotizacion = () => {
    form.setValue('urlCotizaciones', [...urlCotizaciones, ''], {
      shouldValidate: false,
      shouldDirty: true,
    });
  };

  const handleRemoveCotizacion = (idx: number) => {
    const updated = urlCotizaciones.filter((_, i) => i !== idx);
    form.setValue('urlCotizaciones', updated.length > 0 ? updated : [''], {
      shouldValidate: false,
      shouldDirty: true,
    });
  };

  return (
    <FieldSet>
      <FieldLegend>Respaldos Generales de la Rendición</FieldLegend>
      <p className="text-foreground mb-6 text-sm">
        Adjunta los documentos de respaldo generales antes de registrar los
        comprobantes individuales. Las cotizaciones son obligatorias para
        continuar.
      </p>

      <FieldGroup>
        {/* ---- URL Cuadro Comparativo (opcional) ---- */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="text-muted-foreground h-4 w-4 shrink-0" />
            <span className="text-sm font-semibold">Cuadro Comparativo</span>
            <span className="text-foreground text-sm font-normal">
              (opcional)
            </span>
          </div>
          <p className="text-foreground text-sm">
            Si realizaste una comparación de proveedores, adjunta aquí el enlace
            al cuadro comparativo (Google Sheets, Drive, etc.).
          </p>
          <FormField
            control={form.control}
            name="urlCuadroComparativo"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <div className="relative">
                    <Link2 className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                    <Input
                      type="url"
                      placeholder="https://docs.google.com/spreadsheets/..."
                      className="pl-9 text-sm"
                      {...field}
                      value={field.value ?? ''}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* ---- URLs de Cotizaciones (mínimo 1 requerida) ---- */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Link2 className="text-muted-foreground h-4 w-4 shrink-0" />
            <span className="text-sm font-semibold">
              Cotizaciones <span className="text-destructive">*</span>
            </span>
          </div>
          <p className="text-foreground text-sm">
            Adjunta al menos una cotización que respalde los precios de los
            bienes o servicios adquiridos.
          </p>

          <div className="space-y-2">
            {urlCotizaciones.map((_, idx) => (
              <FormField
                key={idx}
                control={form.control}
                name={`urlCotizaciones.${idx}`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="sr-only">
                      Cotización {idx + 1}
                    </FormLabel>
                    <div className="flex items-center gap-2">
                      <FormControl>
                        <div className="relative flex-1">
                          <Link2 className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                          <Input
                            type="url"
                            placeholder={`https://drive.google.com/... (cotización ${idx + 1})`}
                            className="pl-9 text-sm"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      {urlCotizaciones.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveCotizacion(idx)}
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive h-9 w-9 shrink-0 p-0"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">
                            Eliminar cotización {idx + 1}
                          </span>
                        </Button>
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddCotizacion}
            className="border-dashed text-sm"
          >
            <Plus className="mr-1 h-3 w-3" />
            Añadir otra cotización
          </Button>
        </div>
      </FieldGroup>
    </FieldSet>
  );
}
