'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { toast } from 'sonner';
import { Plus, Trash2, Save, Download, Link2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatMoney, normalizeString } from '@/lib/utils';
import { cotizacionesService } from '@/lib/services/cotizaciones-service';
import { cuadrosComparativosService } from '@/lib/services/cuadros-comparativos-service';
import { adaptCuadroFormToPayload } from '@/lib/adapters/cuadro-comparativo-adapter';
import { CuadroAnalisis } from '@/components/cuadros-comparativos/cuadro-analisis';
import type { AnalisisInput } from '@/lib/cuadro-analisis';
import { cuadroComparativoSchema } from '@/components/cuadros-comparativos/cuadro-comparativo-schema';
import type { CotizacionResponse } from '@/types/cotizacion-backend';
import type { CuadroComparativoFormData } from '@/components/cuadros-comparativos/cuadro-comparativo-schema';
import { CotizacionExternaRapidaDialog } from '@/components/cotizaciones/cotizacion-externa-rapida-dialog';

interface Columna {
  cotizacionId: number;
  proveedorNombre: string;
  codigo: string;
  lineas: {
    detalle: string;
    cantidad: number;
    unidad: string;
    precioUnitario: number;
  }[];
}

interface PrecioCelda {
  precioUnitario: number;
  noMenciona: boolean;
}

interface ItemFila {
  descripcion: string;
  cantidad: number;
  unidad: string;
  ganadoraIndex: number | null;
  precios: PrecioCelda[];
}

interface CuadroComparativoBuilderProps {
  cuadroId?: number;
  initialData?: CuadroComparativoFormData;
}

const NINGUNO = 'none';

export default function CuadroComparativoBuilder({
  cuadroId,
  initialData,
}: CuadroComparativoBuilderProps) {
  const router = useRouter();
  const isEdit = typeof cuadroId === 'number';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cotizaciones, setCotizaciones] = useState<CotizacionResponse[]>([]);
  const [rapidaOpen, setRapidaOpen] = useState(false);
  const [cols, setCols] = useState<Columna[]>([]);
  const [items, setItems] = useState<ItemFila[]>([]);
  const [recomendadaIndex, setRecomendadaIndex] = useState<number | null>(null);
  const [lugarFecha, setLugarFecha] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [fuenteItems, setFuenteItems] = useState<string>('');

  useEffect(() => {
    const cargar = async () => {
      try {
        setLoading(true);
        const data = await cotizacionesService.getCotizaciones();
        setCotizaciones(data);

        if (initialData) {
          setLugarFecha(initialData.lugarFecha ?? '');
          setObservaciones(initialData.observaciones ?? '');
          setRecomendadaIndex(initialData.recomendadaIndex);
          setCols(
            initialData.cotizaciones.map((c) => {
              const full = data.find((d) => d.id === c.cotizacionId);
              return {
                cotizacionId: c.cotizacionId,
                proveedorNombre: c.proveedorNombre,
                codigo: full?.codigoCotizacion ?? `#${c.cotizacionId}`,
                lineas: (full?.lineas ?? []).map((l) => ({
                  detalle: l.detalle,
                  cantidad: Number(l.cantidad) || 0,
                  unidad: l.unidad ?? '',
                  precioUnitario: Number(l.precioUnitario) || 0,
                })),
              };
            })
          );
          setItems(
            initialData.items.map((it) => ({
              descripcion: it.descripcion,
              cantidad: it.cantidad,
              unidad: it.unidad ?? '',
              ganadoraIndex: it.ganadoraIndex,
              precios: it.precios.map((p) => ({
                precioUnitario: p.precioUnitario,
                noMenciona: p.noMenciona,
              })),
            }))
          );
        }
      } catch {
        toast.error('No se pudieron cargar las cotizaciones.');
      } finally {
        setLoading(false);
      }
    };
    void cargar();
  }, [initialData]);

  const totalesPorColumna = useMemo(() => {
    return cols.map((_, ci) =>
      items.reduce((acc, item) => {
        const celda = item.precios[ci];
        if (!celda || celda.noMenciona) return acc;
        return acc + (Number(celda.precioUnitario) || 0) * item.cantidad;
      }, 0)
    );
  }, [cols, items]);

  const analisisInput = useMemo<AnalisisInput>(
    () => ({
      columnas: cols.map((c) => ({ proveedorNombre: c.proveedorNombre })),
      items: items.map((item) => ({
        descripcion: item.descripcion || '(sin descripción)',
        cantidad: Number(item.cantidad) || 0,
        precios: cols.map((_, ci) => {
          const celda = item.precios[ci];
          return {
            precioUnitario: Number(celda?.precioUnitario) || 0,
            noMenciona: celda?.noMenciona ?? true,
          };
        }),
      })),
    }),
    [cols, items]
  );

  const toggleCotizacion = (cot: CotizacionResponse) => {
    const idx = cols.findIndex((c) => c.cotizacionId === cot.id);
    if (idx >= 0) {
      setCols((prev) => prev.filter((_, i) => i !== idx));
      setItems((prev) =>
        prev.map((it) => ({
          ...it,
          ganadoraIndex:
            it.ganadoraIndex === idx
              ? null
              : it.ganadoraIndex !== null && it.ganadoraIndex > idx
                ? it.ganadoraIndex - 1
                : it.ganadoraIndex,
          precios: it.precios.filter((_, i) => i !== idx),
        }))
      );
      setRecomendadaIndex((r) =>
        r === idx ? null : r !== null && r > idx ? r - 1 : r
      );
    } else {
      setCols((prev) => [
        ...prev,
        {
          cotizacionId: cot.id,
          proveedorNombre: cot.proveedorNombre,
          codigo: cot.codigoCotizacion,
          lineas: (cot.lineas ?? []).map((l) => ({
            detalle: l.detalle,
            cantidad: Number(l.cantidad) || 0,
            unidad: l.unidad ?? '',
            precioUnitario: Number(l.precioUnitario) || 0,
          })),
        },
      ]);
      setItems((prev) =>
        prev.map((it) => ({
          ...it,
          precios: [...it.precios, autoPrecio(cot, it.descripcion)],
        }))
      );
    }
  };

  const autoPrecio = (
    cot: CotizacionResponse,
    descripcion: string
  ): PrecioCelda => {
    const objetivo = normalizeString(descripcion);
    const match = (cot.lineas ?? []).find(
      (l) => normalizeString(l.detalle) === objetivo
    );
    if (match) {
      return {
        precioUnitario: Number(match.precioUnitario) || 0,
        noMenciona: false,
      };
    }
    return { precioUnitario: 0, noMenciona: true };
  };

  const cargarItemsDesde = (cotizacionId: string) => {
    const col = cols.find((c) => String(c.cotizacionId) === cotizacionId);
    if (!col) return;
    if (col.lineas.length === 0) {
      toast.info('La cotización seleccionada no tiene ítems.');
      return;
    }
    const cotizacionesFull = cols.map((c) =>
      cotizaciones.find((d) => d.id === c.cotizacionId)
    );
    const nuevos: ItemFila[] = col.lineas.map((linea) => ({
      descripcion: linea.detalle,
      cantidad: linea.cantidad,
      unidad: linea.unidad,
      ganadoraIndex: null,
      precios: cols.map((_, ci) => {
        const full = cotizacionesFull[ci];
        return full
          ? autoPrecio(full, linea.detalle)
          : { precioUnitario: 0, noMenciona: true };
      }),
    }));
    setItems(nuevos);
    toast.success(
      `${nuevos.length} ítems cargados desde ${col.proveedorNombre}.`
    );
  };

  const agregarItem = () => {
    setItems((prev) => [
      ...prev,
      {
        descripcion: '',
        cantidad: 1,
        unidad: '',
        ganadoraIndex: null,
        precios: cols.map(() => ({ precioUnitario: 0, noMenciona: false })),
      },
    ]);
  };

  const eliminarItem = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const setItem = (idx: number, patch: Partial<ItemFila>) => {
    setItems((prev) =>
      prev.map((it, i) => (i === idx ? { ...it, ...patch } : it))
    );
  };

  const setCelda = (
    itemIdx: number,
    colIdx: number,
    patch: Partial<PrecioCelda>
  ) => {
    setItems((prev) =>
      prev.map((it, i) => {
        if (i !== itemIdx) return it;
        const precios = it.precios.map((p, ci) =>
          ci === colIdx ? { ...p, ...patch } : p
        );
        return { ...it, precios };
      })
    );
  };

  const guardar = async () => {
    const form: CuadroComparativoFormData = {
      lugarFecha,
      observaciones,
      recomendadaIndex,
      cotizaciones: cols.map((c) => ({
        cotizacionId: c.cotizacionId,
        proveedorNombre: c.proveedorNombre,
      })),
      items: items.map((it) => ({
        descripcion: it.descripcion,
        cantidad: it.cantidad,
        unidad: it.unidad,
        ganadoraIndex: it.ganadoraIndex,
        precios: it.precios.map((p) => ({
          precioUnitario: p.precioUnitario,
          noMenciona: p.noMenciona,
        })),
      })),
    };

    const parsed = cuadroComparativoSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(
        parsed.error.issues[0]?.message ?? 'Revisa los datos del cuadro.'
      );
      return;
    }

    try {
      setSaving(true);
      const payload = adaptCuadroFormToPayload(parsed.data);
      if (isEdit) {
        await cuadrosComparativosService.updateCuadro(cuadroId, payload);
        toast.success('Cuadro comparativo actualizado.');
      } else {
        await cuadrosComparativosService.createCuadro(payload);
        toast.success('Cuadro comparativo registrado.');
      }
      router.push('/app/cuadros-comparativos');
      router.refresh();
    } catch (error: unknown) {
      const mensaje =
        axios.isAxiosError(error) && error.response?.data?.message
          ? String(error.response.data.message)
          : 'No se pudo guardar el cuadro comparativo.';
      toast.error(mensaje);
    } finally {
      setSaving(false);
    }
  };

  /** Cotización externa creada inline: añade a la lista y la auto-selecciona. */
  const handleRapidaSuccess = (newCot: CotizacionResponse) => {
    setCotizaciones((prev) => [...prev, newCot]);
    toggleCotizacion(newCot);
  };

  if (loading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-10 w-full max-w-md" />
        <Skeleton className="h-[420px] w-full" />
      </div>
    );
  }

  const seleccionadasIds = new Set(cols.map((c) => c.cotizacionId));

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base">
            1. Selecciona las cotizaciones a comparar
          </CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setRapidaOpen(true)}
          >
            <Link2 className="mr-2 h-4 w-4" />
            Cotización externa rápida
          </Button>
        </CardHeader>
        <CardContent>
          {cotizaciones.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No tienes cotizaciones registradas. Crea una cotización propia o
              agrega una cotización externa rápida con el botón de arriba.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
              {cotizaciones.map((cot) => {
                const checked = seleccionadasIds.has(cot.id);
                const isExterna = cot.tipo === 'EXTERNA';
                return (
                  <label
                    key={cot.id}
                    className="hover:bg-accent flex cursor-pointer items-start gap-3 rounded-md border p-3"
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => toggleCotizacion(cot)}
                      className="mt-0.5"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-medium">
                          {cot.proveedorNombre}
                        </p>
                        {isExterna && (
                          <span className="shrink-0 rounded-full bg-sky-100 px-1.5 py-0.5 text-[10px] font-medium text-sky-700 dark:bg-sky-950/60 dark:text-sky-300">
                            Externa
                          </span>
                        )}
                      </div>
                      <p className="text-muted-foreground text-xs">
                        {cot.codigoCotizacion} · {cot.lineas?.length ?? 0} ítems
                        · {formatMoney(cot.total)}
                      </p>
                      {isExterna && cot.adjuntoUrl && (
                        <a
                          href={cot.adjuntoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="block truncate text-[10px] text-sky-600 hover:underline"
                        >
                          Ver documento
                        </a>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {cols.length >= 1 && (
        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base">
              2. Ítems y precios por cotización
            </CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={fuenteItems} onValueChange={setFuenteItems}>
                <SelectTrigger className="h-9 w-[220px]">
                  <SelectValue placeholder="Cargar ítems desde..." />
                </SelectTrigger>
                <SelectContent>
                  {cols.map((c) => (
                    <SelectItem
                      key={c.cotizacionId}
                      value={String(c.cotizacionId)}
                    >
                      {c.proveedorNombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!fuenteItems}
                onClick={() => cargarItemsDesde(fuenteItems)}
              >
                <Download className="mr-2 h-4 w-4" />
                Cargar ítems
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={agregarItem}
              >
                <Plus className="mr-2 h-4 w-4" />
                Agregar ítem
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40px]">#</TableHead>
                    <TableHead className="min-w-[220px]">Descripción</TableHead>
                    <TableHead className="w-[90px]">Cant.</TableHead>
                    <TableHead className="w-[110px]">Unid.</TableHead>
                    {cols.map((c) => (
                      <TableHead
                        key={c.cotizacionId}
                        className="min-w-[200px] text-center"
                      >
                        {c.proveedorNombre}
                      </TableHead>
                    ))}
                    <TableHead className="w-[150px]">Ganador</TableHead>
                    <TableHead className="w-[50px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6 + cols.length}
                        className="text-muted-foreground h-20 text-center"
                      >
                        Carga ítems desde una cotización o agrégalos
                        manualmente.
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="text-muted-foreground text-xs">
                          {idx + 1}
                        </TableCell>
                        <TableCell>
                          <Input
                            value={item.descripcion}
                            onChange={(e) =>
                              setItem(idx, { descripcion: e.target.value })
                            }
                            placeholder="Detalle del ítem"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min={0}
                            step="0.01"
                            value={item.cantidad}
                            onChange={(e) =>
                              setItem(idx, {
                                cantidad: Number(e.target.value) || 0,
                              })
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={item.unidad}
                            onChange={(e) =>
                              setItem(idx, { unidad: e.target.value })
                            }
                            placeholder="Unid."
                          />
                        </TableCell>
                        {cols.map((c, ci) => {
                          const celda = item.precios[ci] ?? {
                            precioUnitario: 0,
                            noMenciona: false,
                          };
                          const subtotal = celda.noMenciona
                            ? 0
                            : (Number(celda.precioUnitario) || 0) *
                              item.cantidad;
                          return (
                            <TableCell key={c.cotizacionId}>
                              <div className="space-y-1">
                                <Input
                                  type="number"
                                  min={0}
                                  step="0.01"
                                  disabled={celda.noMenciona}
                                  value={celda.precioUnitario}
                                  onChange={(e) =>
                                    setCelda(idx, ci, {
                                      precioUnitario:
                                        Number(e.target.value) || 0,
                                    })
                                  }
                                />
                                <div className="flex items-center justify-between gap-2">
                                  <label className="text-muted-foreground flex items-center gap-1 text-xs">
                                    <Checkbox
                                      checked={celda.noMenciona}
                                      onCheckedChange={(v) =>
                                        setCelda(idx, ci, {
                                          noMenciona: v === true,
                                        })
                                      }
                                    />
                                    No menciona
                                  </label>
                                  <span className="text-xs font-medium">
                                    {formatMoney(subtotal)}
                                  </span>
                                </div>
                              </div>
                            </TableCell>
                          );
                        })}
                        <TableCell>
                          <Select
                            value={
                              item.ganadoraIndex === null
                                ? NINGUNO
                                : String(item.ganadoraIndex)
                            }
                            onValueChange={(v) =>
                              setItem(idx, {
                                ganadoraIndex: v === NINGUNO ? null : Number(v),
                              })
                            }
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={NINGUNO}>
                                Sin selección
                              </SelectItem>
                              {cols.map((c, ci) => (
                                <SelectItem
                                  key={c.cotizacionId}
                                  value={String(ci)}
                                >
                                  {c.proveedorNombre}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => eliminarItem(idx)}
                            aria-label="Eliminar ítem"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                  {items.length > 0 && (
                    <TableRow className="bg-muted/50 font-semibold">
                      <TableCell colSpan={4} className="text-right">
                        TOTALES
                      </TableCell>
                      {cols.map((c, ci) => (
                        <TableCell key={c.cotizacionId} className="text-center">
                          {formatMoney(totalesPorColumna[ci] ?? 0)}
                        </TableCell>
                      ))}
                      <TableCell colSpan={2} />
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {cols.length >= 1 && items.length > 0 && (
        <CuadroAnalisis
          input={analisisInput}
          recomendadaIndex={recomendadaIndex}
        />
      )}

      {cols.length >= 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              3. Recomendación y observaciones
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Cotización recomendada
              </label>
              <Select
                value={
                  recomendadaIndex === null ? NINGUNO : String(recomendadaIndex)
                }
                onValueChange={(v) =>
                  setRecomendadaIndex(v === NINGUNO ? null : Number(v))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona la recomendada" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NINGUNO}>Sin recomendación</SelectItem>
                  {cols.map((c, ci) => (
                    <SelectItem key={c.cotizacionId} value={String(ci)}>
                      {c.proveedorNombre} ·{' '}
                      {formatMoney(totalesPorColumna[ci] ?? 0)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Lugar y Fecha</label>
              <Input
                value={lugarFecha}
                onChange={(e) => setLugarFecha(e.target.value)}
                placeholder="Ej. La Paz, 23 de octubre de 2025"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Observaciones</label>
              <Textarea
                rows={3}
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Observaciones del cuadro comparativo"
              />
            </div>
          </CardContent>
        </Card>
      )}

      <Separator />

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/app/cuadros-comparativos')}
        >
          Cancelar
        </Button>
        <Button type="button" disabled={saving} onClick={() => void guardar()}>
          <Save className="mr-2 h-4 w-4" />
          {isEdit ? 'Guardar cambios' : 'Registrar cuadro comparativo'}
        </Button>
      </div>

      <CotizacionExternaRapidaDialog
        open={rapidaOpen}
        onOpenChange={setRapidaOpen}
        onSuccess={handleRapidaSuccess}
      />
    </div>
  );
}
