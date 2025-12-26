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
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldSet,
  FieldLegend,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
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
import { Textarea } from '@/components/ui/textarea';
import { useMemo, useState } from 'react';
import { notFound, useParams, useRouter } from 'next/navigation';

const MOCK = [
  {
    id: 'SOL-001',
    solicitante: 'ABRAHAM SALOMÓN POMA',
    fecha: '2025-12-20',
    proyecto: 'AAF FORT',
    monto: 1250,
    lugar: 'Cobija, Villa Florida',
    motivo: 'Taller y coordinación con aliados',
  },
  {
    id: 'SOL-002',
    solicitante: 'MARIA GÓMEZ',
    fecha: '2025-12-21',
    proyecto: 'AAF FORT',
    monto: 980,
    lugar: 'La Paz',
    motivo: 'Reuniones de planificación',
  },
];

export default function RevisionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params?.id || '');
  const solicitud = useMemo(() => MOCK.find((s) => s.id === id), [id]);
  const [mensaje, setMensaje] = useState('');

  if (!solicitud) return notFound();

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
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/dashboard/revision">
                    Revisión
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>{solicitud.id}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex-1 space-y-6 p-4 pt-0">
          <Card>
            <CardHeader>
              <CardTitle>Detalle de Solicitud</CardTitle>
              <CardDescription>
                Revise la información antes de aprobar o rechazar.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <Field>
                  <FieldLabel>ID</FieldLabel>
                  <Input readOnly value={solicitud.id} />
                </Field>
                <Field>
                  <FieldLabel>Solicitante</FieldLabel>
                  <Input readOnly value={solicitud.solicitante} />
                </Field>
                <Field>
                  <FieldLabel>Fecha</FieldLabel>
                  <Input
                    readOnly
                    value={new Date(solicitud.fecha).toLocaleDateString(
                      'es-BO'
                    )}
                  />
                </Field>
                <Field>
                  <FieldLabel>Proyecto</FieldLabel>
                  <Input readOnly value={solicitud.proyecto} />
                </Field>
                <Field>
                  <FieldLabel>Lugar(es) de Viaje</FieldLabel>
                  <Input readOnly value={solicitud.lugar} />
                </Field>
                <Field>
                  <FieldLabel>Monto</FieldLabel>
                  <Input readOnly value={solicitud.monto.toFixed(2)} />
                </Field>
                <Field className="md:col-span-2">
                  <FieldLabel>Motivo</FieldLabel>
                  <Input readOnly value={solicitud.motivo} />
                </Field>
              </div>

              <Separator className="my-6" />

              <FieldGroup>
                <FieldSet>
                  <FieldLegend>Acción</FieldLegend>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field className="md:col-span-2">
                      <FieldLabel>Mensaje (opcional)</FieldLabel>
                      <Textarea
                        placeholder="Escribe un mensaje para el solicitante"
                        value={mensaje}
                        onChange={(e) => setMensaje(e.target.value)}
                      />
                    </Field>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="default">Aprobar</Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent size="sm">
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Confirmar aprobación
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción aprobará la solicitud {solicitud.id}.
                            (Demostración front-end)
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => router.push('/dashboard/revision')}
                          >
                            Confirmar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive">Rechazar</Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent size="sm">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirmar rechazo</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción rechazará la solicitud {solicitud.id}.
                            (Demostración front-end)
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            variant="destructive"
                            onClick={() => router.push('/dashboard/revision')}
                          >
                            Confirmar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </FieldSet>
              </FieldGroup>
            </CardContent>
            <CardFooter className="text-muted-foreground justify-end text-xs">
              Demostración frontend — sin persistencia
            </CardFooter>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
