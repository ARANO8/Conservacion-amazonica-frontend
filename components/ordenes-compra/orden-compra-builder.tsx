'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { toast } from 'sonner';
import { Plus, Trash2, Save, AlertTriangle, Download } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { cn, formatMoney } from '@/lib/utils';
import { ordenesCompraService } from '@/lib/services/ordenes-compra-service';
import { cuadrosComparativosService } from '@/lib/services/cuadros-comparativos-service';
import type { CuadroComparativoResponse } from '@/types/cuadro-comparativo-backend';
import type { OrdenCompraResponse } from '@/types/orden-compra-backend';

interface ItemRow {
  orden: number;
  item: string;
  cantidad: number;
  unidad: string;
  detalle: string;
  precioUnitario: number;
  cuadroItemId?: number;
  sinCuadro: boolean;
}

interface OrdenCompraBuilderProps {
  ordenId?: number;
  initialData?: OrdenCompraResponse;
  prefillCuadroId?: number;
}

function newItem(orden: number): ItemRow {
  return {
    orden,
    item: '',
    cantidad: 1,
    unidad: '',
    detalle: '',
    precioUnitario: 0,
    sinCuadro: true,
  };
}

export default function OrdenCompraBuilder({
  ordenId,
  initialData,
  prefillCuadroId,
}: OrdenCompraBuilderProps) {
  const router = useRouter();
  const isEdit = typeof ordenId === 'number';

  const [saving, setSaving] = useState(false);
  const [prefillLoading, setPrefillLoading] = useState(false);

  const [cuadroComparativoId, setCuadroComparativoId] = useState<
    number | undefined
  >(initialData?.cuadroComparativoId ?? undefined);

  const [proveedorNombre, setProveedorNombre] = useState(
    initialData?.proveedorNombre ?? ''
  );
  const [proveedorDireccion, setProveedorDireccion] = useState(
    initialData?.proveedorDireccion ?? ''
  );
  const [proveedorTelefono, setProveedorTelefono] = useState(
    initialData?.proveedorTelefono ?? ''
  );
  const [lugarEntrega, setLugarEntrega] = useState(
    initialData?.lugarEntrega ?? ''
  );
  const [formaPago, setFormaPago] = useState(
    initialData?.formaPago ?? 'Transferencia bancaria'
  );
  const [garantia, setGarantia] = useState(initialData?.garantia ?? 'N/A');
  const [observaciones, setObservaciones] = useState(
    initialData?.observaciones ?? ''
  );

  const [items, setItems] = useState<ItemRow[]>(() => {
    if (initialData?.items && initialData.items.length > 0) {
      return initialData.items.map((it) => ({
        orden: it.orden,
        item: it.item,
        cantidad: Number(it.cantidad),
        unidad: it.unidad ?? '',
        detalle: it.detalle ?? '',
        precioUnitario: Number(it.precioUnitario),
        cuadroItemId: it.cuadroItemId ?? undefined,
        sinCuadro: it.sinCuadro,
      }));
    }
    return [newItem(1)];
  });

  const [addCuadroOpen, setAddCuadroOpen] = useState(false);
  const [cuadrosAprobados, setCuadrosAprobados] = useState<
    CuadroComparativoResponse[]
  >([]);
  const [cuadrosLoading, setCuadrosLoading] = useState(false);
  const [selectedCuadroForAdd, setSelectedCuadroForAdd] =
    useState<CuadroComparativoResponse | null>(null);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<number>>(
    new Set()
  );

  const totalGeneral = items.reduce(
    (acc, it) => acc + it.precioUnitario * it.cantidad,
    0
  );

  const haySinCuadro = items.some((it) => it.sinCuadro);

  useEffect(() => {
    if (prefillCuadroId && !isEdit) {
      void handlePrefill(prefillCuadroId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefillCuadroId]);

  const loadAprobados = useCallback(async () => {
    if (cuadrosLoading) return;
    setCuadrosLoading(true);
    try {
      const data = await cuadrosComparativosService.getCuadros();
      setCuadrosAprobados(data.filter((c) => c.estado === 'APROBADO'));
    } catch {
      toast.error('No se pudieron cargar los cuadros comparativos.');
    } finally {
      setCuadrosLoading(false);
    }
  }, [cuadrosLoading]);

  const handlePrefill = async (cuadroId: number) => {
    setPrefillLoading(true);
    try {
      const data = await ordenesCompraService.prefillFromCuadro(cuadroId);
      setCuadroComparativoId(data.cuadroComparativoId);
      setProveedorNombre(data.proveedorNombre);
      setProveedorDireccion(data.proveedorDireccion);
      setProveedorTelefono(data.proveedorTelefono);
      setGarantia(data.garantia || 'N/A');
      setFormaPago(data.formaPago || 'Transferencia bancaria');
      setItems(
        data.items.map((it) => ({
          orden: it.orden,
          item: it.item,
          cantidad: it.cantidad,
          unidad: it.unidad,
          detalle: it.detalle,
          precioUnitario: it.precioUnitario,
          cuadroItemId: it.cuadroItemId,
          sinCuadro: false,
        }))
      );
      toast.success(
        `Prellenado desde ${data.cuadroCodigoCuadro}. Revisa y ajusta antes de guardar.`
      );
    } catch (error: unknown) {
      const msg =
        axios.isAxiosError(error) && error.response?.data?.message
          ? String(error.response.data.message)
          : 'No se pudo precargar el cuadro.';
      toast.error(msg);
    } finally {
      setPrefillLoading(false);
    }
  };

  const openAddFromCuadro = async () => {
    setSelectedCuadroForAdd(null);
    setSelectedItemIds(new Set());
    setAddCuadroOpen(true);
    await loadAprobados();
  };

  const confirmAddFromCuadro = async () => {
    if (!selectedCuadroForAdd) return;
    setPrefillLoading(true);
    try {
      const data = await ordenesCompraService.prefillFromCuadro(
        selectedCuadroForAdd.id
      );
      const toAdd = data.items.filter((it) =>
        selectedItemIds.has(it.cuadroItemId)
      );
      if (toAdd.length === 0) {
        toast.info('No seleccionaste ningún ítem.');
        return;
      }
      const maxOrden = items.reduce((m, it) => Math.max(m, it.orden), 0);
      const newRows: ItemRow[] = toAdd.map((it, idx) => ({
        orden: maxOrden + idx + 1,
        item: it.item,
        cantidad: it.cantidad,
        unidad: it.unidad,
        detalle: it.detalle,
        precioUnitario: it.precioUnitario,
        cuadroItemId: it.cuadroItemId,
        sinCuadro: false,
      }));
      setItems((prev) => [...prev, ...newRows]);
      setAddCuadroOpen(false);
      toast.success(`${newRows.length} ítem(s) agregado(s).`);
    } catch {
      toast.error('No se pudieron cargar los ítems del cuadro seleccionado.');
    } finally {
      setPrefillLoading(false);
    }
  };

  const updateItem = (idx: number, field: keyof ItemRow, value: unknown) => {
    setItems((prev) =>
      prev.map((it, i) => (i === idx ? { ...it, [field]: value } : it))
    );
  };

  const addEmptyItem = () => {
    const maxOrden = items.reduce((m, it) => Math.max(m, it.orden), 0);
    setItems((prev) => [...prev, newItem(maxOrden + 1)]);
  };

  const removeItem = (idx: number) => {
    setItems((prev) => {
      const filtered = prev.filter((_, i) => i !== idx);
      return filtered.map((it, i) => ({ ...it, orden: i + 1 }));
    });
  };

  const handleSave = async () => {
    if (!proveedorNombre.trim()) {
      toast.error('El nombre del proveedor es obligatorio.');
      return;
    }
    if (items.length === 0) {
      toast.error('Agrega al menos un ítem.');
      return;
    }
    const invalidItems = items.filter((it) => !it.item.trim());
    if (invalidItems.length > 0) {
      toast.error('Todos los ítems deben tener una descripción.');
      return;
    }

    const payload = {
      cuadroComparativoId,
      proveedorNombre: proveedorNombre.trim(),
      proveedorDireccion: proveedorDireccion.trim() || undefined,
      proveedorTelefono: proveedorTelefono.trim() || undefined,
      lugarEntrega: lugarEntrega.trim() || undefined,
      formaPago: formaPago.trim() || 'Transferencia bancaria',
      garantia: garantia.trim() || 'N/A',
      observaciones: observaciones.trim() || undefined,
      items: items.map((it) => ({
        orden: it.orden,
        item: it.item.trim(),
        cantidad: it.cantidad,
        unidad: it.unidad.trim() || undefined,
        detalle: it.detalle.trim() || undefined,
        precioUnitario: it.precioUnitario,
        cuadroItemId: it.cuadroItemId,
        sinCuadro: it.sinCuadro,
      })),
    };

    setSaving(true);
    try {
      let result: OrdenCompraResponse;
      if (isEdit) {
        result = await ordenesCompraService.updateOrden(ordenId, payload);
        toast.success('Orden de compra actualizada.');
      } else {
        result = await ordenesCompraService.createOrden(payload);
        toast.success(`Orden ${result.codigoOrden} creada correctamente.`);
      }
      router.push(`/app/ordenes-compra/${result.id}`);
    } catch (error: unknown) {
      const msg =
        axios.isAxiosError(error) && error.response?.data?.message
          ? String(error.response.data.message)
          : 'No se pudo guardar la orden.';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      {haySinCuadro && (
        <div className="flex items-start gap-3 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Uno o más ítems no tienen cuadro comparativo de respaldo. Estos
            ítems se incluirán en la orden pero no están respaldados por una
            cotización registrada.
          </span>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Proveedor</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1 sm:col-span-2">
              <Label>Nombre del proveedor / empresa *</Label>
              <Input
                value={proveedorNombre}
                onChange={(e) => setProveedorNombre(e.target.value)}
                placeholder="Ej. MITRU Eventos S.R.L."
              />
            </div>
            <div className="space-y-1">
              <Label>Dirección</Label>
              <Input
                value={proveedorDireccion}
                onChange={(e) => setProveedorDireccion(e.target.value)}
                placeholder="Av. Montes 123, La Paz"
              />
            </div>
            <div className="space-y-1">
              <Label>Teléfono</Label>
              <Input
                value={proveedorTelefono}
                onChange={(e) => setProveedorTelefono(e.target.value)}
                placeholder="71234567"
              />
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1">
              <Label>Lugar de entrega / prestación</Label>
              <Input
                value={lugarEntrega}
                onChange={(e) => setLugarEntrega(e.target.value)}
                placeholder="Oficinas ACEAA"
              />
            </div>
            <div className="space-y-1">
              <Label>Forma de pago</Label>
              <Input
                value={formaPago}
                onChange={(e) => setFormaPago(e.target.value)}
                placeholder="Transferencia bancaria"
              />
            </div>
            <div className="space-y-1">
              <Label>Garantía</Label>
              <Input
                value={garantia}
                onChange={(e) => setGarantia(e.target.value)}
                placeholder="N/A"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label>Observaciones</Label>
            <Textarea
              rows={3}
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Notas adicionales sobre la orden..."
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="text-base">Ítems de la orden</CardTitle>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={prefillLoading}
                onClick={() => void openAddFromCuadro()}
              >
                <Download className="mr-2 h-3.5 w-3.5" />
                Agregar desde cuadro
              </Button>
              <Button variant="outline" size="sm" onClick={addEmptyItem}>
                <Plus className="mr-2 h-3.5 w-3.5" />
                Ítem nuevo (sin cuadro)
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">#</TableHead>
                  <TableHead className="min-w-[180px]">
                    Artículo / Servicio
                  </TableHead>
                  <TableHead className="w-24">Cantidad</TableHead>
                  <TableHead className="w-24">Unidad</TableHead>
                  <TableHead className="min-w-[140px]">Detalle</TableHead>
                  <TableHead className="w-32">Precio Unit. (Bs)</TableHead>
                  <TableHead className="w-32 text-right">Total (Bs)</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((it, idx) => (
                  <TableRow
                    key={idx}
                    className={cn(
                      it.sinCuadro && 'bg-amber-50/40 dark:bg-amber-950/10'
                    )}
                  >
                    <TableCell className="text-muted-foreground text-xs">
                      {it.orden}
                      {it.sinCuadro && (
                        <span
                          className="ml-1 text-amber-600"
                          title="Sin cuadro comparativo"
                        >
                          *
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Input
                        value={it.item}
                        onChange={(e) =>
                          updateItem(idx, 'item', e.target.value)
                        }
                        placeholder="Descripción del artículo"
                        className="h-8 text-sm"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={it.cantidad}
                        onChange={(e) =>
                          updateItem(
                            idx,
                            'cantidad',
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="h-8 text-sm"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={it.unidad}
                        onChange={(e) =>
                          updateItem(idx, 'unidad', e.target.value)
                        }
                        placeholder="Unid."
                        className="h-8 text-sm"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={it.detalle}
                        onChange={(e) =>
                          updateItem(idx, 'detalle', e.target.value)
                        }
                        placeholder="Especificaciones"
                        className="h-8 text-sm"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={it.precioUnitario}
                        onChange={(e) =>
                          updateItem(
                            idx,
                            'precioUnitario',
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="h-8 text-sm"
                      />
                    </TableCell>
                    <TableCell className="text-right text-sm font-medium">
                      {formatMoney(it.precioUnitario * it.cantidad)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive h-7 w-7"
                        onClick={() => removeItem(idx)}
                        disabled={items.length <= 1}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="mt-3 flex items-center justify-end gap-3">
            <span className="text-muted-foreground text-sm">Total general</span>
            <span className="text-lg font-bold">
              {formatMoney(totalGeneral)}
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
        <Button disabled={saving} onClick={() => void handleSave()}>
          <Save className="mr-2 h-4 w-4" />
          {saving
            ? 'Guardando...'
            : isEdit
              ? 'Actualizar orden'
              : 'Crear orden'}
        </Button>
      </div>

      <Dialog open={addCuadroOpen} onOpenChange={setAddCuadroOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Agregar ítems desde cuadro comparativo</DialogTitle>
            <DialogDescription>
              Selecciona un cuadro aprobado y los ítems que quieres incluir.
            </DialogDescription>
          </DialogHeader>

          {cuadrosLoading ? (
            <p className="text-muted-foreground py-4 text-center text-sm">
              Cargando cuadros...
            </p>
          ) : cuadrosAprobados.length === 0 ? (
            <p className="text-muted-foreground py-4 text-center text-sm">
              No hay cuadros comparativos aprobados disponibles.
            </p>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-2">
                {cuadrosAprobados.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setSelectedCuadroForAdd(c);
                      setSelectedItemIds(new Set());
                    }}
                    className={cn(
                      'rounded-md border p-3 text-left text-sm transition-colors',
                      selectedCuadroForAdd?.id === c.id
                        ? 'border-primary bg-primary/5'
                        : 'hover:bg-muted/50'
                    )}
                  >
                    <span className="font-semibold">{c.codigoCuadro}</span>
                    <span className="text-muted-foreground ml-2">
                      {c.cotizaciones.find(
                        (col) => col.id === c.cotizacionRecomendadaId
                      )?.proveedorNombre ?? ''}
                    </span>
                  </button>
                ))}
              </div>

              {selectedCuadroForAdd && (
                <div className="rounded-md border">
                  <p className="text-muted-foreground border-b px-3 py-2 text-xs font-medium">
                    Ítems de {selectedCuadroForAdd.codigoCuadro} (proveedor
                    recomendado)
                  </p>
                  <div className="max-h-60 overflow-y-auto">
                    {selectedCuadroForAdd.items
                      .filter((item) => {
                        const p = item.precios.find(
                          (pr) =>
                            pr.cuadroCotizacionId ===
                            selectedCuadroForAdd.cotizacionRecomendadaId
                        );
                        return p && !p.noMenciona;
                      })
                      .map((item) => {
                        const precio = item.precios.find(
                          (p) =>
                            p.cuadroCotizacionId ===
                            selectedCuadroForAdd.cotizacionRecomendadaId
                        );
                        const total =
                          Number(precio?.precioUnitario ?? 0) *
                          Number(item.cantidad);
                        return (
                          <label
                            key={item.id}
                            className="hover:bg-muted/30 flex cursor-pointer items-center gap-3 border-b px-3 py-2 last:border-b-0"
                          >
                            <Checkbox
                              checked={selectedItemIds.has(item.id)}
                              onCheckedChange={(checked) => {
                                setSelectedItemIds((prev) => {
                                  const next = new Set(prev);
                                  if (checked) next.add(item.id);
                                  else next.delete(item.id);
                                  return next;
                                });
                              }}
                            />
                            <span className="flex-1 text-sm">
                              {item.descripcion}
                            </span>
                            <span className="text-muted-foreground text-xs">
                              {Number(item.cantidad)} {item.unidad ?? ''} ·{' '}
                              {formatMoney(total)}
                            </span>
                          </label>
                        );
                      })}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setAddCuadroOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  disabled={
                    !selectedCuadroForAdd ||
                    selectedItemIds.size === 0 ||
                    prefillLoading
                  }
                  onClick={() => void confirmAddFromCuadro()}
                >
                  Agregar{' '}
                  {selectedItemIds.size > 0 ? `(${selectedItemIds.size})` : ''}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
