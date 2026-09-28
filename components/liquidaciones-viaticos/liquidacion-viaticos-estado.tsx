import { Badge } from '@/components/ui/badge';
import type {
  EstadoLiquidacionViaticos,
  LiquidacionViaticosResponse,
} from '@/types/liquidacion-viaticos-backend';

const ESTADOS: Record<
  EstadoLiquidacionViaticos,
  {
    etiqueta: string;
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
  }
> = {
  BORRADOR: { etiqueta: 'Borrador', variant: 'secondary' },
  ENVIADO: { etiqueta: 'Por revisar', variant: 'outline' },
  OBSERVADO: { etiqueta: 'Observada', variant: 'destructive' },
  REVISADO: { etiqueta: 'Revisada', variant: 'default' },
};

export function LiquidacionViaticosEstadoBadge({
  estado,
}: {
  estado: EstadoLiquidacionViaticos;
}) {
  const { etiqueta, variant } = ESTADOS[estado] ?? ESTADOS.BORRADOR;
  return <Badge variant={variant}>{etiqueta}</Badge>;
}

/** Mismas reglas que el backend: solo en borrador u observada. */
export function liquidacionEditable(
  liquidacion: LiquidacionViaticosResponse
): boolean {
  return (
    liquidacion.estado === 'BORRADOR' || liquidacion.estado === 'OBSERVADO'
  );
}
