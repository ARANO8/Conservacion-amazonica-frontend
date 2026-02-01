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
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';

type Solicitud = {
  id: string;
  solicitante: string;
  fecha: string;
  proyecto: string;
  monto: number;
  estado: 'Pendiente' | 'Aprobada' | 'Rechazada';
};

const MOCK: Solicitud[] = [
  {
    id: 'SOL-001',
    solicitante: 'ABRAHAM SALOMÓN POMA',
    fecha: '2025-12-20',
    proyecto: 'AAF FORT',
    monto: 1250,
    estado: 'Pendiente',
  },
  {
    id: 'SOL-002',
    solicitante: 'MARIA GÓMEZ',
    fecha: '2025-12-21',
    proyecto: 'AAF FORT',
    monto: 980,
    estado: 'Pendiente',
  },
];

export default function RevisionListPage() {
  const [q, setQ] = useState('');
  const [items] = useState<Solicitud[]>(MOCK);
  const filtered = useMemo(
    () =>
      items.filter(
        (s) =>
          s.id.toLowerCase().includes(q.toLowerCase()) ||
          s.solicitante.toLowerCase().includes(q.toLowerCase())
      ),
    [items, q]
  );
  const searchParams = useSearchParams();
  const isApprover = searchParams.get('role') === 'approver';

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
                  <BreadcrumbPage>Revisión</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex-1 space-y-6 p-4 pt-0">
          {!isApprover ? (
            <Card>
              <CardHeader>
                <CardTitle>Acceso restringido</CardTitle>
                <CardDescription>
                  Esta sección está disponible solo para usuarios aprobadores.
                </CardDescription>
              </CardHeader>
              <CardFooter>
                <Button asChild>
                  <Link href="/dashboard">Volver al dashboard</Link>
                </Button>
              </CardFooter>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Solicitudes pendientes</CardTitle>
                <CardDescription>
                  Lista de solicitudes enviadas por los usuarios para su
                  revisión.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 pb-3">
                  <Input
                    placeholder="Buscar por ID o solicitante"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-12">
                  <div className="text-muted-foreground md:col-span-2">ID</div>
                  <div className="text-muted-foreground md:col-span-3">
                    Solicitante
                  </div>
                  <div className="text-muted-foreground md:col-span-2">
                    Fecha
                  </div>
                  <div className="text-muted-foreground md:col-span-2">
                    Proyecto
                  </div>
                  <div className="text-muted-foreground md:col-span-1">
                    Monto
                  </div>
                  <div className="text-muted-foreground md:col-span-2">
                    Acciones
                  </div>
                </div>
                {filtered.map((s) => (
                  <div
                    key={s.id}
                    className="grid grid-cols-1 items-center gap-3 md:grid-cols-12"
                  >
                    <div className="md:col-span-2">{s.id}</div>
                    <div className="md:col-span-3">{s.solicitante}</div>
                    <div className="md:col-span-2">
                      {new Date(s.fecha).toLocaleDateString('es-BO')}
                    </div>
                    <div className="md:col-span-2">{s.proyecto}</div>
                    <div className="md:col-span-1">{s.monto.toFixed(2)}</div>
                    <div className="flex gap-2 md:col-span-2">
                      <Button asChild size="sm">
                        <Link
                          href={`/dashboard/revision/${s.id}?role=approver`}
                        >
                          Revisar
                        </Link>
                      </Button>
                      <Button asChild variant="outline" size="sm">
                        <Link
                          href={`/dashboard/revision/${s.id}?role=approver`}
                        >
                          Detalles
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
              <CardFooter className="text-muted-foreground justify-end text-xs">
                Demostración frontend — sin persistencia
              </CardFooter>
            </Card>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
