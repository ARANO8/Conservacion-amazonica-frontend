'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ClipboardList, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import InformeActividadesForm from '@/components/informes-actividades/informe-actividades-form';
import { informesActividadesService } from '@/lib/services/informes-actividades-service';
import type { InformeActividadesInput } from '@/types/informe-actividades-schema';

/** El formulario trabaja con `yyyy-MM-dd`; el backend devuelve ISO completo. */
function toInputDate(iso: string): string {
  return iso.split('T')[0] ?? '';
}

export default function EditarInformeActividadesPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [initialValues, setInitialValues] =
    useState<InformeActividadesInput | null>(null);
  const [informeId, setInformeId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargar = async () => {
      try {
        setLoading(true);
        const informe = await informesActividadesService.getById(params.id);
        setInformeId(informe.id);
        setInitialValues({
          fechaInicio: toInputDate(informe.fechaInicio),
          fechaFin: toInputDate(informe.fechaFin),
          actividades: (informe.actividades ?? []).map((a) => ({
            fecha: toInputDate(a.fecha),
            lugar: a.lugar,
            personaInstitucion: a.personaInstitucion,
            actividadesRealizadas: a.actividadesRealizadas,
          })),
        });
      } catch {
        toast.error('No se pudo cargar el informe de actividades.');
        router.push('/app/informe-actividades');
      } finally {
        setLoading(false);
      }
    };

    void cargar();
  }, [params.id, router]);

  if (loading || !initialValues || informeId === null) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="text-primary size-10 animate-spin" />
        <span className="text-muted-foreground ml-3 text-sm">
          Cargando informe...
        </span>
      </div>
    );
  }

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
              Editar Informe de Actividades
            </h1>
            <p className="text-muted-foreground text-xs">
              Viajes y Viáticos — bitácora de actividades realizadas (ANEXO 7).
            </p>
          </div>
        </div>
      </div>

      <InformeActividadesForm
        informeId={informeId}
        initialValues={initialValues}
      />
    </div>
  );
}
