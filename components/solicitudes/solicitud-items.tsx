'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Field, FieldLabel } from '@/components/ui/field';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

type Item = {
  grupoPresup?: string;
  partida?: string;
  docum?: string;
  tipo?: string;
  cant: number;
  costoUnit: number;
};

function formatMoney(n: number) {
  return new Intl.NumberFormat('es-BO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(isFinite(n) ? n : 0);
}

export default function SolicitudItems() {
  const [items, setItems] = useState<Item[]>([
    {
      grupoPresup: undefined,
      partida: undefined,
      docum: undefined,
      tipo: undefined,
      cant: 0,
      costoUnit: 0,
    },
  ]);

  const totals = useMemo(() => {
    return items.map((item) => {
      const total = (item.cant || 0) * (item.costoUnit || 0);
      const iva = total * 0.13;
      const iue = total * 0.05;
      const itTax = total * 0.03;
      const liquido = total - iva - iue - itTax;
      return { total, iva, iue, it: itTax, liquido };
    });
  }, [items]);

  const totalLiquido = useMemo(
    () => totals.reduce((acc, t) => acc + t.liquido, 0),
    [totals]
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="font-medium" />
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">
            Total Líquido Pagable Bs. :
          </span>
          <Input className="w-36" readOnly value={formatMoney(totalLiquido)} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-13">
        <div className="text-muted-foreground md:col-span-2">Grupo Presup.</div>
        <div className="text-muted-foreground md:col-span-1">Partida</div>
        <div className="text-muted-foreground md:col-span-1">Docum</div>
        <div className="text-muted-foreground md:col-span-1">Tipo</div>
        <div className="text-muted-foreground md:col-span-1">Cant.</div>
        <div className="text-muted-foreground md:col-span-1">Costo Unit.</div>
        <div className="text-muted-foreground md:col-span-1">Total Bs.</div>
        <div className="text-muted-foreground md:col-span-1">IVA 13%</div>
        <div className="text-muted-foreground md:col-span-1">IUE 5%</div>
        <div className="text-muted-foreground md:col-span-1">IT 3%</div>
        <div className="text-muted-foreground md:col-span-1">
          Líquido Pag. Bs.
        </div>
        <div className="text-muted-foreground md:col-span-1">Acciones</div>
      </div>

      {items.map((item, idx) => {
        const t = totals[idx];
        return (
          <div
            key={idx}
            className="grid grid-cols-1 items-end gap-3 md:grid-cols-13"
          >
            <Field className="md:col-span-2">
              <FieldLabel>Grupo Presup.</FieldLabel>
              <Select
                value={item.grupoPresup}
                onValueChange={(v) =>
                  setItems((p) =>
                    p.map((it, i) =>
                      i === idx ? { ...it, grupoPresup: v } : it
                    )
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="reuniones">REUNIONES_Y_</SelectItem>
                  <SelectItem value="viajes">VIAJES</SelectItem>
                  <SelectItem value="servicios">SERVICIOS</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <Field className="md:col-span-1">
              <FieldLabel>Partida</FieldLabel>
              <Select
                value={item.partida}
                onValueChange={(v) =>
                  setItems((p) =>
                    p.map((it, i) => (i === idx ? { ...it, partida: v } : it))
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="materia">MATERIA</SelectItem>
                  <SelectItem value="pasajes">PASAJES</SelectItem>
                  <SelectItem value="viaticos">VIÁTICOS</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <Field className="md:col-span-1">
              <FieldLabel>Docum</FieldLabel>
              <Select
                value={item.docum}
                onValueChange={(v) =>
                  setItems((p) =>
                    p.map((it, i) => (i === idx ? { ...it, docum: v } : it))
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="factura">Factura</SelectItem>
                  <SelectItem value="recibo">Recibo</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <Field className="md:col-span-1">
              <FieldLabel>Tipo</FieldLabel>
              <Select
                value={item.tipo}
                onValueChange={(v) =>
                  setItems((p) =>
                    p.map((it, i) => (i === idx ? { ...it, tipo: v } : it))
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="compra">Compra</SelectItem>
                  <SelectItem value="servicio">Servicio</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <Field className="md:col-span-1">
              <FieldLabel>Cant.</FieldLabel>
              <Input
                type="number"
                min={0}
                value={item.cant}
                onChange={(e) =>
                  setItems((p) =>
                    p.map((it, i) =>
                      i === idx ? { ...it, cant: Number(e.target.value) } : it
                    )
                  )
                }
              />
            </Field>

            <Field className="md:col-span-1">
              <FieldLabel>Costo Unit.</FieldLabel>
              <Input
                type="number"
                min={0}
                value={item.costoUnit}
                onChange={(e) =>
                  setItems((p) =>
                    p.map((it, i) =>
                      i === idx
                        ? { ...it, costoUnit: Number(e.target.value) }
                        : it
                    )
                  )
                }
              />
            </Field>

            <Field className="md:col-span-1">
              <FieldLabel>Total Bs.</FieldLabel>
              <Input readOnly value={formatMoney(t.total)} />
            </Field>
            <Field className="md:col-span-1">
              <FieldLabel>IVA 13%</FieldLabel>
              <Input readOnly value={formatMoney(t.iva)} />
            </Field>
            <Field className="md:col-span-1">
              <FieldLabel>IUE 5%</FieldLabel>
              <Input readOnly value={formatMoney(t.iue)} />
            </Field>
            <Field className="md:col-span-1">
              <FieldLabel>IT 3%</FieldLabel>
              <Input readOnly value={formatMoney(t.it)} />
            </Field>
            <Field className="md:col-span-1">
              <FieldLabel>Líquido Pag. Bs.</FieldLabel>
              <Input readOnly value={formatMoney(t.liquido)} />
            </Field>
            <div className="flex h-full items-end md:col-span-1">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">Eliminar</Button>
                </AlertDialogTrigger>
                <AlertDialogContent size="sm">
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Eliminar gasto?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción no se puede deshacer. Se eliminará el gasto
                      seleccionado.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      variant="destructive"
                      onClick={() =>
                        setItems((p) => p.filter((_, i) => i !== idx))
                      }
                    >
                      Eliminar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        );
      })}

      <div className="flex items-center justify-between pt-2">
        <Button
          variant="default"
          onClick={() => setItems((p) => [...p, { cant: 0, costoUnit: 0 }])}
        >
          AÑADIR GASTO
        </Button>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">
            Total Líquido Pagable Bs. :
          </span>
          <Input className="w-36" readOnly value={formatMoney(totalLiquido)} />
        </div>
      </div>
    </div>
  );
}
