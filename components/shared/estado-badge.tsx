import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Mapa canónico de estados → clases Tailwind
// ---------------------------------------------------------------------------

const ESTADO_VARIANTS: Record<string, string> = {
  PENDIENTE:
    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 hover:bg-yellow-200 dark:hover:bg-yellow-900/40 border-yellow-200 dark:border-yellow-800',
  PENDING:
    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 hover:bg-yellow-200 dark:hover:bg-yellow-900/40 border-yellow-200 dark:border-yellow-800',
  REVIEW_SUPERVISOR:
    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 hover:bg-yellow-200 dark:hover:bg-yellow-900/40 border-yellow-200 dark:border-yellow-800',
  REVIEW_DIRECTOR:
    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 hover:bg-yellow-200 dark:hover:bg-yellow-900/40 border-yellow-200 dark:border-yellow-800',
  REVIEW_FINANCE:
    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 hover:bg-yellow-200 dark:hover:bg-yellow-900/40 border-yellow-200 dark:border-yellow-800',
  APPROVED:
    'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/40 border-emerald-200 dark:border-emerald-800',
  APROBADO:
    'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/40 border-emerald-200 dark:border-emerald-800',
  DISBURSED:
    'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/40 border-emerald-200 dark:border-emerald-800',
  DESEMBOLSADO:
    'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/40 border-emerald-200 dark:border-emerald-800',
  COMPLETED:
    'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/40 border-blue-200 dark:border-blue-800',
  EJECUTADO:
    'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/40 border-blue-200 dark:border-blue-800',
  REJECTED:
    'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/40 border-red-200 dark:border-red-800',
  RECHAZADO:
    'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/40 border-red-200 dark:border-red-800',
  OBSERVADO:
    'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/40 border-amber-200 dark:border-amber-800',
  DRAFT:
    'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 border-zinc-200 dark:border-zinc-700',
  BORRADOR:
    'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 border-zinc-200 dark:border-zinc-700',
};

const FALLBACK =
  'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400';

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------

interface EstadoBadgeProps {
  estado: string;
  className?: string;
}

export function EstadoBadge({ estado, className }: EstadoBadgeProps) {
  const variantClass = ESTADO_VARIANTS[estado] ?? FALLBACK;

  return (
    <Badge variant="outline" className={cn(variantClass, className)}>
      {estado}
    </Badge>
  );
}
