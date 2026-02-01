'use client';

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
import { useSearchParams } from 'next/navigation';

export default function Page() {
  const searchParams = useSearchParams();
  const isApprover = searchParams.get('role') === 'approver';
  return (
    <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
      <section className="bg-card rounded-xl border p-6 shadow-sm">
        <h1 className="text-2xl font-semibold">Bienvenidos AMZ desk</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Este panel es el punto de partida para gestionar solicitudes y
          rendiciones y mucho más.
        </p>
      </section>

      <section>
        {isApprover ? (
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Revisión de Solicitudes</CardTitle>
                <CardDescription>
                  Accede a las solicitudes pendientes para aprobar o rechazar.
                </CardDescription>
              </CardHeader>
              <CardFooter>
                <Button asChild>
                  <Link href="/dashboard/revision?role=approver">
                    Ir a Revisión
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
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
                  Ver reportes
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}
      </section>

      <section>
        <Card>
          <CardHeader>
            <CardTitle>Notificaciones</CardTitle>
            <CardDescription>Resumen de avisos recientes</CardDescription>
          </CardHeader>
          <CardContent>
            {isApprover ? <ul className="space-y-2 text-sm"></ul> : null}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
