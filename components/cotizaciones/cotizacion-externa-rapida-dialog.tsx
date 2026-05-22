'use client';

import { useMemo, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Plus, Trash2, Link2, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatMoney } from '@/lib/utils';
import { cotizacionesService } from '@/lib/services/cotizaciones-service';
import type { CotizacionResponse } from '@/types/cotizacion-backend';

interface LineaRapida {
  detalle: string;
  cantidad: number;
  unidad: string;
  precioUnitario: number;
}

const emptyLinea = (): LineaRapida => ({
  detalle: '',
  cantidad: 1,
  unidad: '',
  precioUnitario: 0,
});

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (cotizacion: CotizacionResponse) => void;
}

export function CotizacionExternaRapidaDialog({
  open,
  onOpenChange,
  onSuccess,
}: Props) {
  const [proveedorNombre, setProveedorNombre] = useState('');
  const [adjuntoUrl, setAdjuntoUrl] = useState('');
  const [lineas, setLineas] = useState<LineaRapida[]>([emptyLinea()]);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const total = useMemo(
    () =>
      lineas.reduce(
        (acc, l) => acc + (l.cantidad || 0) * (l.precioUnitario || 0),
        0
      ),
    [lineas]
  );

  const updateLinea = (
    i: number,
    field: keyof LineaRapida,
    value: string | number
  ) => {
    setLineas((prev) =>
      prev.map((l, idx) => (idx === i ? { ...l, [field]: value } : l))
    );
  };

  const addLinea = () => setLineas((prev) => [...prev, emptyLinea()]);
  const removeLinea = (i: number) =>
    setLineas((prev) => prev.filter((_, idx) => idx !== i));

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!proveedorNombre.trim())
      errs.proveedorNombre = 'El nombre del proveedor es obligatorio';
    if (!adjuntoUrl.trim()) {
      errs.adjuntoUrl = 'La URL del documento es obligatoria';
    } else {
      try {
        new URL(adjuntoUrl);
      } catch {
        errs.adjuntoUrl =
          'Ingrese una URL válida (ej: https://drive.google.com/...)';
      }
    }
    if (lineas.every((l) => !l.detalle.trim())) {
      errs.lineas = 'Agregue al menos un ítem con descripción';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const fecha = new Date().toISOString();
      const result = await cotizacionesService.createCotizacion({
        tipo: 'EXTERNA',
        fecha,
        proveedorNombre: proveedorNombre.trim(),
        adjuntoUrl: adjuntoUrl.trim(),
        lineas: lineas
          .filter((l) => l.detalle.trim())
          .map((l) => ({
            detalle: l.detalle.trim(),
            cantidad: Number(l.cantidad) || 1,
            unidad: l.unidad.trim() || undefined,
            precioUnitario: Number(l.precioUnitario) || 0,
          })),
      });
      toast.success(
        `Cotización externa "${result.codigoCotizacion}" creada y agregada al cuadro.`
      );
      onSuccess(result);
      resetForm();
      onOpenChange(false);
    } catch (error: unknown) {
      const mensaje =
        axios.isAxiosError(error) && error.response?.data?.message
          ? String(error.response.data.message)
          : 'No se pudo crear la cotización externa.';
      toast.error(mensaje);
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setProveedorNombre('');
    setAdjuntoUrl('');
    setLineas([emptyLinea()]);
    setErrors({});
  };

  const handleOpenChange = (v: boolean) => {
    if (!v) resetForm();
    onOpenChange(v);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-sky-600" />
            Cotización externa rápida
          </DialogTitle>
          <DialogDescription>
            Registra los datos básicos de la cotización y adjunta la URL del
            documento original. Se creará una cotización de tipo externo y se
            agregará directamente al cuadro.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Proveedor */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="rap-nombre">
                Proveedor <span className="text-destructive">*</span>
              </Label>
              <Input
                id="rap-nombre"
                placeholder="Nombre o razón social"
                value={proveedorNombre}
                onChange={(e) => setProveedorNombre(e.target.value)}
              />
              {errors.proveedorNombre && (
                <p className="text-destructive text-xs">
                  {errors.proveedorNombre}
                </p>
              )}
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="rap-url">
                URL del documento externo{' '}
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="rap-url"
                placeholder="https://drive.google.com/... o https://dropbox.com/..."
                value={adjuntoUrl}
                onChange={(e) => setAdjuntoUrl(e.target.value)}
              />
              {errors.adjuntoUrl && (
                <p className="text-destructive text-xs">{errors.adjuntoUrl}</p>
              )}
              <p className="text-muted-foreground text-xs">
                Enlace al PDF, imagen o documento escaneado del proveedor.
              </p>
            </div>
          </div>

          {/* Ítems */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Ítems de la cotización</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addLinea}
              >
                <Plus className="mr-2 h-4 w-4" />
                Agregar ítem
              </Button>
            </div>
            {errors.lineas && (
              <p className="text-destructive text-xs">{errors.lineas}</p>
            )}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[90px]">Cantidad</TableHead>
                    <TableHead className="w-[100px]">Unidad</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="w-[120px]">P/Unit. (Bs)</TableHead>
                    <TableHead className="w-[110px] text-right">
                      Total (Bs)
                    </TableHead>
                    <TableHead className="w-[50px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lineas.map((linea, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          value={linea.cantidad}
                          onChange={(e) =>
                            updateLinea(i, 'cantidad', Number(e.target.value))
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          placeholder="Pza, Kg..."
                          value={linea.unidad}
                          onChange={(e) =>
                            updateLinea(i, 'unidad', e.target.value)
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          placeholder="Descripción del ítem"
                          value={linea.detalle}
                          onChange={(e) =>
                            updateLinea(i, 'detalle', e.target.value)
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          value={linea.precioUnitario}
                          onChange={(e) =>
                            updateLinea(
                              i,
                              'precioUnitario',
                              Number(e.target.value)
                            )
                          }
                        />
                      </TableCell>
                      <TableCell className="text-right text-sm font-medium">
                        {formatMoney(linea.cantidad * linea.precioUnitario)}
                      </TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          disabled={lineas.length === 1}
                          onClick={() => removeLinea(i)}
                          aria-label="Eliminar ítem"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex justify-end">
              <div className="text-right">
                <p className="text-muted-foreground text-xs uppercase">Total</p>
                <p className="text-lg font-bold">{formatMoney(total)}</p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={saving}>
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Link2 className="mr-2 h-4 w-4" />
            )}
            Crear y agregar al cuadro
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
