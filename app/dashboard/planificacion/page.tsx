'use client';

export const dynamic = 'force-dynamic';

import { Button } from '@/components/ui/button';
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

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
import { useState } from 'react';

export default function PlanificacionPage() {
  const [meta, setMeta] = useState({
    nombre: '',
    cargo: '',
    lugar: '',
    objetivo: '',
  });

  type Row = {
    fechaSalida: string;
    fechaLlegada: string;
    actividad: string;
    participantesAceaa: string;
    participantesTerceros: string;
  };

  const [rows, setRows] = useState<Row[]>([
    {
      fechaSalida: '',
      fechaLlegada: '',
      actividad: '',
      participantesAceaa: '',
      participantesTerceros: '',
    },
  ]);

  return (
    <div className="w-full">
      <div className="flex-1 space-y-6 p-4 pt-0">
        <FieldGroup>
          <FieldSet>
            <FieldLegend>Información General</FieldLegend>
            <div className="grid gap-4 md:grid-cols-2">
              <Field>
                <FieldLabel>Nombre</FieldLabel>
                <Input
                  placeholder="ABRAHAM SALOMÓN POMA"
                  value={meta.nombre}
                  onChange={(e) =>
                    setMeta((m) => ({ ...m, nombre: e.target.value }))
                  }
                />
              </Field>
              <Field>
                <FieldLabel>Cargo</FieldLabel>
                <Input
                  placeholder="ESPECIALISTA MANEJO FORESTAL"
                  value={meta.cargo}
                  onChange={(e) =>
                    setMeta((m) => ({ ...m, cargo: e.target.value }))
                  }
                />
              </Field>
              <Field className="md:col-span-2">
                <FieldLabel>Lugar (es) de Viaje</FieldLabel>
                <Input
                  placeholder="Ej. Cobija, Villa Florida"
                  value={meta.lugar}
                  onChange={(e) =>
                    setMeta((m) => ({ ...m, lugar: e.target.value }))
                  }
                />
              </Field>
              <Field className="md:col-span-2">
                <FieldLabel>Objetivo del Viaje</FieldLabel>
                <Input
                  placeholder="Breve explicación de lo que se realizará"
                  value={meta.objetivo}
                  onChange={(e) =>
                    setMeta((m) => ({ ...m, objetivo: e.target.value }))
                  }
                />
              </Field>
            </div>
          </FieldSet>

          <Separator />

          <FieldSet>
            <FieldLegend>Planificación de Actividades</FieldLegend>

            <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-13">
              <div className="text-muted-foreground md:col-span-2">
                Fecha Salida
              </div>
              <div className="text-muted-foreground md:col-span-2">
                Fecha Llegada
              </div>
              <div className="text-muted-foreground md:col-span-4">
                Actividad Programada
              </div>
              <div className="text-muted-foreground md:col-span-2">
                Participantes ACEAA
              </div>
              <div className="text-muted-foreground md:col-span-2">
                Participantes Terceros
              </div>
              <div className="text-muted-foreground md:col-span-1">
                Acciones
              </div>
            </div>

            {rows.map((row, idx) => (
              <div
                key={idx}
                className="grid grid-cols-1 items-end gap-3 md:grid-cols-13"
              >
                <Field className="md:col-span-2">
                  <FieldLabel>Fecha Salida</FieldLabel>
                  <Input
                    type="date"
                    value={row.fechaSalida}
                    onChange={(e) =>
                      setRows((prev) =>
                        prev.map((r, i) =>
                          i === idx ? { ...r, fechaSalida: e.target.value } : r
                        )
                      )
                    }
                  />
                </Field>
                <Field className="md:col-span-2">
                  <FieldLabel>Fecha Llegada</FieldLabel>
                  <Input
                    type="date"
                    value={row.fechaLlegada}
                    onChange={(e) =>
                      setRows((prev) =>
                        prev.map((r, i) =>
                          i === idx ? { ...r, fechaLlegada: e.target.value } : r
                        )
                      )
                    }
                  />
                </Field>
                <Field className="md:col-span-4">
                  <FieldLabel>Actividad Programada</FieldLabel>
                  <Input
                    placeholder="Ej. cámaras trampa"
                    value={row.actividad}
                    onChange={(e) =>
                      setRows((prev) =>
                        prev.map((r, i) =>
                          i === idx ? { ...r, actividad: e.target.value } : r
                        )
                      )
                    }
                  />
                </Field>
                <Field className="md:col-span-2">
                  <FieldLabel>Participantes ACEAA</FieldLabel>
                  <Input
                    placeholder="Nombres o detalle"
                    value={row.participantesAceaa}
                    onChange={(e) =>
                      setRows((prev) =>
                        prev.map((r, i) =>
                          i === idx
                            ? { ...r, participantesAceaa: e.target.value }
                            : r
                        )
                      )
                    }
                  />
                </Field>
                <Field className="md:col-span-2">
                  <FieldLabel>Participantes Terceros</FieldLabel>
                  <Input
                    placeholder="Nombres o detalle"
                    value={row.participantesTerceros}
                    onChange={(e) =>
                      setRows((prev) =>
                        prev.map((r, i) =>
                          i === idx
                            ? { ...r, participantesTerceros: e.target.value }
                            : r
                        )
                      )
                    }
                  />
                </Field>
                <div className="flex items-end md:col-span-1">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive">Eliminar fila</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent size="sm">
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar fila?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acción no se puede deshacer. Se eliminará la fila
                          seleccionada.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          variant="destructive"
                          onClick={() =>
                            setRows((prev) => prev.filter((_, i) => i !== idx))
                          }
                        >
                          Eliminar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}

            <div className="flex justify-start pt-2">
              <Button
                onClick={() =>
                  setRows((prev) => [
                    ...prev,
                    {
                      fechaSalida: '',
                      fechaLlegada: '',
                      actividad: '',
                      participantesAceaa: '',
                      participantesTerceros: '',
                    },
                  ])
                }
              >
                AÑADIR FILA
              </Button>
            </div>
          </FieldSet>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline">Guardar borrador</Button>
            <Button>Enviar</Button>
          </div>
        </FieldGroup>
      </div>
    </div>
  );
}
