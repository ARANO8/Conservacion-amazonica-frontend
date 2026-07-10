'use client';

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { cn, formatMoney } from '@/lib/utils';
import { cuadrosComparativosService } from '@/lib/services/cuadros-comparativos-service';
import type { CuadroComparativoResponse } from '@/types/cuadro-comparativo-backend';
import { toast } from 'sonner';

interface CuadroItemsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (cuadroId: number, itemIds: number[]) => Promise<void> | void;
  prefillLoading?: boolean;
}

export function CuadroItemsDialog({
  open,
  onOpenChange,
  onConfirm,
  prefillLoading = false,
}: CuadroItemsDialogProps) {
  const [cuadrosAprobados, setCuadrosAprobados] = useState<
    CuadroComparativoResponse[]
  >([]);
  const [cuadrosLoading, setCuadrosLoading] = useState(false);
  const [selectedCuadroForAdd, setSelectedCuadroForAdd] =
    useState<CuadroComparativoResponse | null>(null);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<number>>(
    new Set()
  );

  // Load approved cuadros comparativos
  const loadAprobados = useCallback(async (signal?: AbortSignal) => {
    setCuadrosLoading(true);
    try {
      const data = await cuadrosComparativosService.getCuadros(signal);
      setCuadrosAprobados(data.filter((c) => c.estado === 'APROBADO'));
    } catch (err) {
      if (axios.isCancel(err)) return;
      toast.error('No se pudieron cargar los cuadros comparativos.');
    } finally {
      setCuadrosLoading(false);
    }
  }, []);

  // Fetch when dialog opens
  useEffect(() => {
    if (open) {
      const controller = new AbortController();
      setSelectedCuadroForAdd(null);
      setSelectedItemIds(new Set());
      void loadAprobados(controller.signal);
      return () => {
        controller.abort();
      };
    }
  }, [open, loadAprobados]);

  const handleConfirm = async () => {
    if (!selectedCuadroForAdd || selectedItemIds.size === 0) return;
    await onConfirm(selectedCuadroForAdd.id, Array.from(selectedItemIds));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
                  Ítems de {selectedCuadroForAdd.codigoCuadro} (proveedor recomendado)
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
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                disabled={
                  !selectedCuadroForAdd ||
                  selectedItemIds.size === 0 ||
                  prefillLoading
                }
                onClick={handleConfirm}
              >
                Agregar{' '}
                {selectedItemIds.size > 0 ? `(${selectedItemIds.size})` : ''}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
