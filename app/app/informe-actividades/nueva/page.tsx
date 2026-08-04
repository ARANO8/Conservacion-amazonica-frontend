import Link from 'next/link';
import { ArrowLeft, ClipboardList } from 'lucide-react';

import { Button } from '@/components/ui/button';
import InformeActividadesForm from '@/components/informes-actividades/informe-actividades-form';

export default function NuevoInformeActividadesPage() {
  return (
    <div className="flex flex-col gap-0">
      <div className="flex shrink-0 items-center gap-3 border-b px-6 py-4">
        <Button variant="ghost" size="icon" asChild className="shrink-0">
          <Link href="/app/informe-actividades">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Volver a informes de actividades</span>
          </Link>
        </Button>

        <div className="flex items-center gap-2">
          <ClipboardList className="text-primary h-5 w-5 shrink-0" />
          <div>
            <h1 className="text-lg leading-tight font-bold">
              Nuevo Informe de Actividades
            </h1>
            <p className="text-muted-foreground text-xs">
              Viajes y Viáticos — bitácora de actividades realizadas (ANEXO 7).
            </p>
          </div>
        </div>
      </div>

      <InformeActividadesForm />
    </div>
  );
}
