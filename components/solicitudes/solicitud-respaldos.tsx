'use client';

import { useEffect, useState } from 'react';
import { Control, useWatch, UseFormSetValue } from 'react-hook-form';
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FieldGroup, FieldSet, FieldLegend } from '@/components/ui/field';
import { FileSpreadsheet, Link2, Plus, Trash2 } from 'lucide-react';
import { FormData } from '@/components/solicitudes/solicitud-schema';
import { cuadrosComparativosService } from '@/lib/services/cuadros-comparativos-service';
import { cotizacionesService } from '@/lib/services/cotizaciones-service';
import type { CuadroComparativoResponse } from '@/types/cuadro-comparativo-backend';
import type { CotizacionResponse } from '@/types/cotizacion-backend';
import Link from 'next/link';

interface SolicitudRespaldosProps {
  control: Control<FormData>;
  setValue: UseFormSetValue<FormData>;
}

export default function SolicitudRespaldos({
  control,
  setValue,
}: SolicitudRespaldosProps) {
  const [cuadros, setCuadros] = useState<CuadroComparativoResponse[]>([]);
  const [cotizacionesList, setCotizacionesList] = useState<CotizacionResponse[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(false);

  useEffect(() => {
    const loadSystemDocuments = async () => {
      try {
        setIsLoadingList(true);
        const [cuadrosData, cotizacionesData] = await Promise.all([
          cuadrosComparativosService.getCuadros(),
          cotizacionesService.getCotizaciones(),
        ]);
        // Solo mostrar cuadros que no estén en borrador para asegurar respaldo válido
        setCuadros(cuadrosData.filter((c) => c.estado !== 'BORRADOR'));
        setCotizacionesList(cotizacionesData);
      } catch (err) {
        console.error('Error al cargar documentos del sistema:', err);
      } finally {
        setIsLoadingList(false);
      }
    };

    void loadSystemDocuments();
  }, []);
  const urlCotizaciones = useWatch({
    control,
    name: 'urlCotizaciones',
  }) ?? [''];

  const handleAddCotizacion = () => {
    setValue('urlCotizaciones', [...urlCotizaciones, ''], {
      shouldValidate: false,
      shouldDirty: true,
    });
  };

  const handleRemoveCotizacion = (idx: number) => {
    const updated = urlCotizaciones.filter((_, i) => i !== idx);
    setValue('urlCotizaciones', updated.length > 0 ? updated : [''], {
      shouldValidate: false,
      shouldDirty: true,
    });
  };

  return (
    <FieldSet>
      <FieldLegend>Documentos de Respaldo</FieldLegend>
      <p className="text-foreground mb-6 text-sm">
        Adjunta el cuadro comparativo y las cotizaciones para respaldar la
        solicitud antes del envío.
      </p>

      <FieldGroup>
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
            control={control}
            name="urlCuadroComparativo"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <Link2 className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                      <Input
                        type="url"
                        placeholder="https://docs.google.com/spreadsheets/..."
                        className="pl-9 text-sm"
                        {...field}
                        value={field.value ?? ''}
                      />
                    </div>
                    <select
                      className="bg-background border-input rounded-md border px-3 py-2 text-sm sm:max-w-[240px] focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
                      disabled={cuadros.length === 0}
                      onChange={(e) => {
                        if (e.target.value) {
                          setValue('urlCuadroComparativo', e.target.value, {
                            shouldValidate: true,
                            shouldDirty: true,
                          });
                        } else {
                          setValue('urlCuadroComparativo', '', {
                            shouldValidate: true,
                            shouldDirty: true,
                          });
                        }
                      }}
                      value={
                        cuadros.find(
                          (c) =>
                            field.value ===
                            `${window.location.origin}/app/cuadros-comparativos/${c.id}`
                        )?.id ?? ''
                      }
                    >
                      {cuadros.length === 0 ? (
                        <option value="">No hay cuadros disponibles</option>
                      ) : (
                        <>
                          <option value="">-- Vincular del sistema --</option>
                          {cuadros.map((c) => (
                            <option
                              key={c.id}
                              value={`${window.location.origin}/app/cuadros-comparativos/${c.id}`}
                            >
                              {c.codigoCuadro} ({c.estado})
                            </option>
                          ))}
                        </>
                      )}
                    </select>
                  </div>
                </FormControl>
                {cuadros.length === 0 && (
                  <p className="text-muted-foreground text-xs mt-1">
                    Tip: Puedes crear y validar cuadros comparativos en el{' '}
                    <Link
                      href="/app/cuadros-comparativos"
                      className="text-primary hover:underline font-semibold"
                    >
                      módulo de Cuadros Comparativos
                    </Link>{' '}
                    para vincularlos aquí.
                  </p>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Link2 className="text-muted-foreground h-4 w-4 shrink-0" />
            <span className="text-sm font-semibold">Cotizaciones</span>
            <span className="text-foreground text-sm font-normal">
              (opcional)
            </span>
          </div>
          <p className="text-foreground text-sm">
            Si cuentas con cotizaciones, adjúntalas para respaldar los precios
            de los bienes o servicios solicitados.
          </p>

          <div className="space-y-2">
            {urlCotizaciones.map((_, idx) => (
              <FormField
                key={idx}
                control={control}
                name={`urlCotizaciones.${idx}`}
                render={({ field }) => (
                  <FormItem>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
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
                      <select
                        className="bg-background border-input rounded-md border px-3 py-2 text-sm sm:max-w-[240px] focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
                        disabled={cotizacionesList.length === 0}
                        onChange={(e) => {
                          if (e.target.value) {
                            setValue(`urlCotizaciones.${idx}`, e.target.value, {
                              shouldValidate: true,
                              shouldDirty: true,
                            });
                          } else {
                            setValue(`urlCotizaciones.${idx}`, '', {
                              shouldValidate: true,
                              shouldDirty: true,
                            });
                          }
                        }}
                        value={
                          cotizacionesList.find(
                            (c) =>
                              field.value ===
                              `${window.location.origin}/app/cotizaciones/${c.id}`
                          )?.id ?? ''
                        }
                      >
                        {cotizacionesList.length === 0 ? (
                          <option value="">No hay cotizaciones disponibles</option>
                        ) : (
                          <>
                            <option value="">-- Vincular del sistema --</option>
                            {cotizacionesList.map((c) => (
                              <option
                                key={c.id}
                                value={`${window.location.origin}/app/cotizaciones/${c.id}`}
                              >
                                {c.codigoCotizacion} ({c.proveedorNombre})
                              </option>
                            ))}
                          </>
                        )}
                      </select>
                      {urlCotizaciones.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveCotizacion(idx)}
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive h-9 w-9 shrink-0 p-0 self-end sm:self-auto"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">
                            Eliminar cotización {idx + 1}
                          </span>
                        </Button>
                      )}
                    </div>
                    {cotizacionesList.length === 0 && idx === 0 && (
                      <p className="text-muted-foreground text-xs mt-1">
                        Tip: Puedes registrar cotizaciones en el{' '}
                        <Link
                          href="/app/cotizaciones"
                          className="text-primary hover:underline font-semibold"
                        >
                          módulo de Cotizaciones
                        </Link>{' '}
                        para vincularlas aquí.
                      </p>
                    )}
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
