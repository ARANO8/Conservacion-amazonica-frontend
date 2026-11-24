'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Route } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import DeclaracionMovilidadForm from '@/components/declaraciones-movilidad/declaracion-movilidad-form';
import { declaracionesMovilidadService } from '@/lib/services/declaraciones-movilidad-service';
import type { DeclaracionMovilidadInput } from '@/types/declaracion-movilidad-schema';

/** El formulario trabaja con `yyyy-MM-dd`; el backend devuelve ISO completo. */
function toInputDate(iso: string): string {
  return iso.split('T')[0] ?? '';
}

export default function EditarDeclaracionMovilidadPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [initialValues, setInitialValues] =
    useState<DeclaracionMovilidadInput | null>(null);
  const [declaracionId, setDeclaracionId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargar = async () => {
      try {
        setLoading(true);
        const declaracion = await declaracionesMovilidadService.getById(
          params.id
        );
        setDeclaracionId(declaracion.id);
        setInitialValues({
          cargo: declaracion.cargo,
          motivoActividad: declaracion.motivoActividad,
          proyectoPartida: declaracion.proyectoPartida,
          lugarEmision: declaracion.lugarEmision,
          fechaEmision: toInputDate(declaracion.fechaEmision),
          // La columna auxiliar sólo reaparece aquí: es lo que se vuelve a editar
          detalles: (declaracion.detalles ?? []).map((detalle) => ({
            fecha: toInputDate(detalle.fecha),
            origen: detalle.origen,
            destino: detalle.destino,
            motivo: detalle.motivo,
            montoGastado: Number(detalle.montoGastado),
          })),
        });
      } catch {
        toast.error('No se pudo cargar la declaración de movilidad.');
        router.push('/app/declaracion-movilidad');
      } finally {
        setLoading(false);
      }
    };

    void cargar();
  }, [params.id, router]);

  if (loading || !initialValues || declaracionId === null) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="text-primary size-10 animate-spin" />
        <span className="text-muted-foreground ml-3 text-sm">
          Cargando declaración...
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0">
      <div className="flex shrink-0 items-center gap-3 border-b px-6 py-4">
        <Button variant="ghost" size="icon" asChild className="shrink-0">
          <Link href="/app/declaracion-movilidad">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Volver a declaraciones de movilidad</span>
          </Link>
        </Button>

        <div className="flex items-center gap-2">
          <Route className="text-primary h-5 w-5 shrink-0" />
          <div>
            <h1 className="text-lg leading-tight font-bold">
              Editar Declaración Jurada de Movilidad
            </h1>
            <p className="text-muted-foreground text-xs">
              Viajes y Viáticos — gastos de movilidad declarados (ANEXO 6).
            </p>
          </div>
        </div>
      </div>

      <DeclaracionMovilidadForm
        declaracionId={declaracionId}
        initialValues={initialValues}
      />
    </div>
  );
}
