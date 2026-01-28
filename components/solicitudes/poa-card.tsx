'use client';

import { PoaStructureItem } from '@/types/backend';
import { formatMoney, cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface PoaCardProps {
  item: PoaStructureItem;
  onSelect: (item: PoaStructureItem) => void;
  isSelected: boolean;
  isDisabled?: boolean;
  codigoActividad?: string;
  isAlreadyAdded?: boolean;
}

export function PoaCard({
  item,
  onSelect,
  isSelected,
  isDisabled,
  codigoActividad,
  isAlreadyAdded,
}: PoaCardProps) {
  // Parsing amounts (Backend sends decimals as strings or numbers)
  const costoTotal = Number(item.costoTotal || 0);
  const saldoDisponible = Number(item.saldoDisponible ?? costoTotal);

  const hasNoFunds = saldoDisponible <= 0.001;
  const isCompromised = saldoDisponible < costoTotal && !hasNoFunds;

  const codigoCompleto =
    item.actividad?.detalleDescripcion ||
    item.codigoPresupuestario?.codigoCompleto ||
    item.codigoPresupuestario?.descripcion ||
    `Item ${item.id}`;

  const labelPoa = item.codigoPoa || 'Presupuesto';

  return (
    <div
      onClick={() =>
        !hasNoFunds && !isDisabled && !isAlreadyAdded && onSelect(item)
      }
      className={cn(
        'relative flex flex-col gap-3 rounded-xl border p-4 transition-all duration-300',
        'cursor-pointer hover:shadow-md active:scale-[0.98]',
        isSelected
          ? 'bg-primary/5 border-primary ring-primary/20 shadow-sm ring-1'
          : 'bg-card border-border hover:border-primary/30',
        (hasNoFunds || isAlreadyAdded) &&
          'border-destructive/30 bg-muted/30 cursor-not-allowed opacity-60 grayscale',
        isDisabled && !isSelected && 'pointer-events-none opacity-50'
      )}
    >
      {/* Selection Indicator */}
      {isSelected && !isAlreadyAdded && (
        <div className="absolute top-2 right-2">
          <CheckCircle2 className="text-primary h-5 w-5" />
        </div>
      )}

      {/* Header: Activity Code & Highlights */}
      <div className="space-y-3">
        <div className="flex items-center justify-end">
          <div className="flex gap-1">
            {hasNoFunds && (
              <Badge
                variant="destructive"
                className="h-4 text-[9px] font-bold uppercase"
              >
                Sin Fondos
              </Badge>
            )}
            {isAlreadyAdded && (
              <Badge
                variant="secondary"
                className="h-4 text-[9px] font-bold uppercase"
              >
                Ya Agregado
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-start gap-2.5">
          {codigoActividad && (
            <div className="flex flex-col">
              <span className="text-muted-foreground text-[9px] font-bold tracking-tighter uppercase">
                CÓDIGO
              </span>
              <span className="text-primary text-xl leading-none font-black tracking-tight">
                {codigoActividad}
              </span>
            </div>
          )}
          {codigoActividad && <div className="bg-border mt-3 h-6 w-[1.5px]" />}
          <div className="flex flex-col gap-0.5">
            <span className="text-muted-foreground text-[9px] font-bold tracking-tighter uppercase">
              DESCRIPCIÓN
            </span>
            <h4 className="text-foreground line-clamp-3 text-sm leading-[1.15] font-bold tracking-tight">
              {codigoCompleto}
            </h4>
          </div>
        </div>
      </div>

      <div className="mt-auto space-y-3">
        {/* Budget Status */}
        <div className="grid grid-cols-2 gap-2 border-t pt-3">
          <div className="flex flex-col">
            <span className="text-muted-foreground text-[10px] font-bold uppercase">
              Total
            </span>
            <span className="text-muted-foreground text-xs font-medium">
              {formatMoney(costoTotal)}
            </span>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground text-[10px] font-bold uppercase">
                Disponible
              </span>
              {isCompromised && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3 w-3 text-amber-500" />
                    </TooltipTrigger>
                    <TooltipContent className="border-amber-200 bg-amber-50 text-xs text-amber-900">
                      Existen solicitudes en curso afectando este saldo.
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            <span
              className={cn(
                'text-sm font-black',
                hasNoFunds
                  ? 'text-destructive'
                  : isCompromised
                    ? 'text-amber-600'
                    : 'text-emerald-600'
              )}
            >
              {formatMoney(saldoDisponible)}
            </span>
          </div>
        </div>

        {/* Status Badges */}
        {isCompromised && !isAlreadyAdded && (
          <div className="flex items-center gap-1.5 rounded-lg bg-amber-500/10 px-2 py-1 text-amber-700">
            <AlertCircle className="h-3.5 w-3.5" />
            <span className="text-[10px] font-bold tracking-tight uppercase">
              Saldo Comprometido
            </span>
          </div>
        )}

        <Button
          type="button"
          size="sm"
          variant={
            isSelected ? 'default' : isAlreadyAdded ? 'secondary' : 'outline'
          }
          disabled={hasNoFunds || isDisabled || isAlreadyAdded}
          className={cn(
            'h-8 w-full text-[10px] font-bold tracking-wider uppercase',
            isSelected && 'bg-primary hover:bg-primary/90'
          )}
        >
          {isAlreadyAdded ? (
            <>
              <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
              Agregado
            </>
          ) : isSelected ? (
            'Seleccionado'
          ) : (
            'Seleccionar'
          )}
        </Button>
      </div>
    </div>
  );
}
