'use client';

import { AppSidebar } from '@/components/layout/app-sidebar';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSet,
  FieldLegend,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import SolicitudItems from '@/components/solicitudes/solicitud-items';
import { useState } from 'react';
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
} from '@/components/ui/combobox';
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

export default function SolicitudPage() {
  const [travelRows, setTravelRows] = useState([
    {
      conceptosViaticos: [] as string[],
      ciudades: '',
      destino: '',
      tipo: '',
      dias: 0,
      personas: 1,
    },
  ]);

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Solicitud</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex-1 space-y-6 p-4 pt-0">
          <FieldGroup>
            <FieldSet>
              <FieldLegend>Datos de Destinatario</FieldLegend>
              <div className="grid gap-4 md:grid-cols-2">
                <Field>
                  <FieldLabel>A:</FieldLabel>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona destinatario" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="director">
                        Marcos F. Terán Valenzuela
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel>Vía:</FieldLabel>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona vía" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="director-programa">
                        Daniel Marcelo Larrea Alcázar
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field className="flex items-end gap-3 md:col-span-2">
                  <div className="flex items-center gap-2">
                    <input
                      id="interino"
                      type="checkbox"
                      className="border-input bg-background size-4 border"
                    />
                    <label htmlFor="interino" className="text-sm">
                      Interino
                    </label>
                  </div>
                </Field>
              </div>
            </FieldSet>

            <Separator />

            <FieldSet>
              <FieldLegend>Proyecto y Responsables</FieldLegend>
              <div className="grid gap-4 md:grid-cols-2">
                <Field>
                  <FieldLabel>Copia:</FieldLabel>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona copia" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="abraham">
                        ABRAHAM SALOMÓN POMA
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel>Desembolso a Nombre De:</FieldLabel>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona persona" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="abraham">
                        ABRAHAM SALOMÓN POMA
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field className="md:col-span-2">
                  <FieldLabel>Proyecto:</FieldLabel>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona proyecto" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="aaf">AAF FORTALECIMIENTO</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>
            </FieldSet>

            <Separator />

            <FieldSet>
              <FieldLegend>Información del Viaje/Taller</FieldLegend>
              <div className="grid gap-4 md:grid-cols-2">
                <Field>
                  <FieldLabel>Código de Actividad POA</FieldLabel>
                  <Input placeholder="Ej. 32113" />
                </Field>
                <Field>
                  <FieldLabel>Código de Actividad Proyecto</FieldLabel>
                  <Input placeholder="Ej. A.133" />
                </Field>
                <Field className="md:col-span-2">
                  <FieldLabel>Lugar(es) de Viaje y/o Taller</FieldLabel>
                  <Input placeholder="Ej. La Paz, Cobija" />
                </Field>
                <Field>
                  <FieldLabel>Fecha viaje y/o Taller</FieldLabel>
                  <Input type="date" />
                </Field>
                <Field className="md:col-span-2">
                  <FieldLabel>Motivo del Viaje y/o Taller</FieldLabel>
                  <Textarea placeholder="Descripción del viaje y/o taller" />
                </Field>
                <Field>
                  <FieldLabel>Fecha Inicio</FieldLabel>
                  <Input type="date" />
                </Field>
                <Field>
                  <FieldLabel>Fecha Fin</FieldLabel>
                  <Input type="date" />
                </Field>
                <Field>
                  <FieldLabel>Lugar de Solicitud</FieldLabel>
                  <Input placeholder="Ej. La Paz" />
                </Field>
                <Field>
                  <FieldLabel>Fecha Solicitud</FieldLabel>
                  <Input type="date" />
                </Field>
              </div>
            </FieldSet>

            <Separator />

            <FieldSet>
              <FieldLegend>Conceptos de Viaje</FieldLegend>
              <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-13">
                <div className="text-muted-foreground md:col-span-3">
                  Concepto Viáticos
                </div>
                <div className="text-muted-foreground md:col-span-3">
                  Ciudades Principales
                </div>
                <div className="text-muted-foreground md:col-span-2">
                  Destino
                </div>
                <div className="text-muted-foreground md:col-span-2">Tipo</div>
                <div className="text-muted-foreground md:col-span-1">Días</div>
                <div className="text-muted-foreground md:col-span-1">
                  Cant. Personas
                </div>
                <div className="text-muted-foreground md:col-span-1">
                  Acciones
                </div>
              </div>

              {travelRows.map((row, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-1 items-end gap-3 md:grid-cols-13"
                >
                  <Field className="md:col-span-3">
                    <FieldLabel>Concepto Viáticos</FieldLabel>
                    <Combobox
                      multiple
                      value={row.conceptosViaticos}
                      onValueChange={(values: string[]) =>
                        setTravelRows((prev) =>
                          prev.map((r, i) =>
                            i === idx ? { ...r, conceptosViaticos: values } : r
                          )
                        )
                      }
                    >
                      <ComboboxInput
                        placeholder="Selecciona conceptos"
                        showClear
                      />
                      <ComboboxContent>
                        <ComboboxList>
                          <ComboboxItem value="pasajes">Pasajes</ComboboxItem>
                          <ComboboxItem value="viaticos">Viáticos</ComboboxItem>
                          <ComboboxItem value="alojamiento">
                            Alojamiento
                          </ComboboxItem>
                          <ComboboxItem value="alimentacion">
                            Alimentación
                          </ComboboxItem>
                          <ComboboxItem value="movilidad">
                            Movilidad
                          </ComboboxItem>
                        </ComboboxList>
                      </ComboboxContent>
                    </Combobox>
                  </Field>
                  <Field className="md:col-span-3">
                    <FieldLabel>Ciudades Principales</FieldLabel>
                    <Input
                      placeholder="Ej. Trinidad"
                      value={row.ciudades}
                      onChange={(e) =>
                        setTravelRows((prev) =>
                          prev.map((r, i) =>
                            i === idx ? { ...r, ciudades: e.target.value } : r
                          )
                        )
                      }
                    />
                  </Field>
                  <Field className="md:col-span-2">
                    <FieldLabel>Destino</FieldLabel>
                    <Input
                      placeholder="Ej. Trinidad"
                      value={row.destino}
                      onChange={(e) =>
                        setTravelRows((prev) =>
                          prev.map((r, i) =>
                            i === idx ? { ...r, destino: e.target.value } : r
                          )
                        )
                      }
                    />
                  </Field>
                  <Field className="md:col-span-2">
                    <FieldLabel>Tipo</FieldLabel>
                    <Select
                      value={row.tipo}
                      onValueChange={(v) =>
                        setTravelRows((prev) =>
                          prev.map((r, i) =>
                            i === idx ? { ...r, tipo: v } : r
                          )
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Institucional" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="institucional">
                          Institucional
                        </SelectItem>
                        <SelectItem value="personal">Personal</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field className="md:col-span-1">
                    <FieldLabel>Días</FieldLabel>
                    <Input
                      type="number"
                      min={0}
                      value={row.dias}
                      onChange={(e) =>
                        setTravelRows((prev) =>
                          prev.map((r, i) =>
                            i === idx
                              ? { ...r, dias: Number(e.target.value) }
                              : r
                          )
                        )
                      }
                    />
                  </Field>
                  <Field className="md:col-span-1">
                    <FieldLabel>Cant. Personas</FieldLabel>
                    <Input
                      type="number"
                      min={1}
                      value={row.personas}
                      onChange={(e) =>
                        setTravelRows((prev) =>
                          prev.map((r, i) =>
                            i === idx
                              ? { ...r, personas: Number(e.target.value) }
                              : r
                          )
                        )
                      }
                    />
                  </Field>
                  <div className="flex h-full items-end md:col-span-1">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive">Eliminar</Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent size="sm">
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Eliminar fila?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción no se puede deshacer. Se eliminará la
                            fila seleccionada.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            variant="destructive"
                            onClick={() =>
                              setTravelRows((prev) =>
                                prev.filter((_, i) => i !== idx)
                              )
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
                    setTravelRows((prev) => [
                      ...prev,
                      {
                        conceptosViaticos: [],
                        ciudades: '',
                        destino: '',
                        tipo: '',
                        dias: 0,
                        personas: 1,
                      },
                    ])
                  }
                >
                  AÑADIR FILA
                </Button>
              </div>
            </FieldSet>

            <Separator />

            <FieldSet>
              <FieldLegend>Conceptos (detalle)</FieldLegend>
              <SolicitudItems />
            </FieldSet>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline">Guardar borrador</Button>
              <Button>Enviar solicitud</Button>
            </div>
          </FieldGroup>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
