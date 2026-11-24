import { Badge } from '@/components/ui/badge';
import type {
  EstadoInformeViaje,
  InformeViajeResponse,
} from '@/types/informe-viaje-backend';

const ESTADOS: Record<
  EstadoInformeViaje,
  {
    etiqueta: string;
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
  }
> = {
  BORRADOR: { etiqueta: 'Borrador', variant: 'secondary' },
  ENVIADO: { etiqueta: 'Por revisar', variant: 'outline' },
  OBSERVADO: { etiqueta: 'Observado', variant: 'destructive' },
  REVISADO: { etiqueta: 'Revisado', variant: 'default' },
};

export function InformeViajeEstadoBadge({
  estado,
}: {
  estado: EstadoInformeViaje;
}) {
  const { etiqueta, variant } = ESTADOS[estado] ?? ESTADOS.BORRADOR;
  return <Badge variant={variant}>{etiqueta}</Badge>;
}

/** Mismas reglas que el backend: solo en borrador u observado. */
export function informeEditable(informe: InformeViajeResponse): boolean {
  return informe.estado === 'BORRADOR' || informe.estado === 'OBSERVADO';
}
