import { AppSidebar } from '@/components/layout/app-sidebar';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function Page() {
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
                  <BreadcrumbPage>Inicio</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
          <section className="bg-card rounded-xl border p-6 shadow-sm">
            <h1 className="text-2xl font-semibold">
              Bienvenido al Sistema de Fondos
            </h1>
            <p className="text-muted-foreground mt-2 text-sm">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Phasellus
              euismod, nunc sed cursus pretium, sapien felis varius lorem, vitae
              viverra arcu augue sed neque. Este panel es el punto de partida
              para gestionar solicitudes y rendiciones.
            </p>
          </section>

          <section>
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>Solicitud de Viaje/Taller</CardTitle>
                  <CardDescription>
                    Inicia una nueva solicitud para viajes o talleres
                    institucionales.
                  </CardDescription>
                </CardHeader>
                <CardFooter>
                  <Button asChild>
                    <Link href="/dashboard/solicitud">Crear solicitud</Link>
                  </Button>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Rendición de Gastos</CardTitle>
                  <CardDescription>
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                    Próximamente.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-muted-foreground text-sm">
                    En desarrollo
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" disabled>
                    Abrir
                  </Button>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Reportes</CardTitle>
                  <CardDescription>
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                    Próximamente.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-muted-foreground text-sm">
                    En desarrollo
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" disabled>
                    Ver reportes
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </section>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
