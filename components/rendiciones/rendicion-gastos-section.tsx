'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn, formatMoney, formatDate } from '@/lib/utils';
import { catalogosService } from '@/lib/services/catalogos-service';
import type { GastoRendicionResponse } from '@/types/rendicion-backend';
import type { PartidaContable } from '@/types/catalogs';
import { Check, ChevronsUpDown, ExternalLink, Loader2, Minus, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';

type EstadoValidacion = 'vacio' | 'correcto' | 'observado';

function EstadoGastoControl({
  estado,
  observacion,
  onChange,
}: {
  estado: EstadoValidacion;
  observacion: string;
  onChange: (estado: EstadoValidacion, observacion: string) => void;
}) {
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleClick = () => {
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
      onChange('observado', observacion);
      return;
    }
    clickTimerRef.current = setTimeout(() => {
      clickTimerRef.current = null;
      if (estado === 'observado') {
        onChange('vacio', '');
      } else {
        onChange(estado === 'vacio' ? 'correcto' : 'vacio', observacion);
      }
    }, 250);
  };

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={handleClick}
        title={
          estado === 'vacio'
            ? 'Click: Correcto | Doble click: Observado'
            : estado === 'correcto'
              ? 'Click: Desmarcar | Doble click: Observado'
              : 'Click: Desmarcar'
        }
        className="flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded border transition-colors hover:bg-muted"
      >
        {estado === 'correcto' ? (
          <Check className="h-4 w-4 text-green-600" />
        ) : estado === 'observado' ? (
          <X className="h-4 w-4 text-red-600" />
        ) : (
          <Minus className="h-4 w-4 text-muted-foreground" />
        )}
      </button>
      {estado === 'observado' && (
        <Input
          value={observacion}
          onChange={(e) => onChange('observado', e.target.value)}
          placeholder="Escriba la observación..."
          className="h-7 min-w-[160px] text-xs"
        />
      )}
    </div>
  );
}

interface RendicionGastosSectionProps {
  gastos: GastoRendicionResponse[];
  canEditPartidaContable?: boolean;
  onUpdatePartidaContable?: (gastoId: number, codigo: string | null) => Promise<void>;
  partidasPresupuestarias?: Array<{
    id: number;
    poa?: {
      codigoPoa?: string;
      estructura?: {
        partida?: { id: number; nombre: string };
        proyecto?: { id: number; nombre: string };
        grupo?: { id: number; nombre: string };
      };
    };
  }>;
  canEditPartidaPresupuestaria?: boolean;
  onUpdatePartidaPresupuestaria?: (gastoId: number, partidaId: number | null) => Promise<void>;
  gastoValidaciones?: Record<number, { estado: EstadoValidacion; observacion: string }>;
  onGastoValidacionChange?: (gastoId: number, estado: EstadoValidacion, observacion: string) => void;
}

function toNumber(value: string | number | null | undefined): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function PartidaContableCombobox({
  currentCodigo,
  onUpdate,
}: {
  currentCodigo: string | null;
  onUpdate: (codigo: string | null) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<PartidaContable[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;

    setLoading(true);
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const results = await catalogosService.searchPartidasContables(
          searchQuery,
          controller.signal,
        );
        if (!controller.signal.aborted) {
          setSuggestions(results);
        }
      } catch {
        // mantener sugerencias actuales en caso de error de red/límite
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [searchQuery, open]);

  async function handleSelect(pc: PartidaContable) {
    setOpen(false);
    setSearchQuery(pc.codigo);
    await onUpdate(pc.codigo);
  }

  return (
    <Popover
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (v) {
          setSearchQuery('');
        }
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="h-7 w-full max-w-[220px] justify-between px-1.5 text-[11px] font-normal"
        >
          <span className="truncate">
            {currentCodigo || 'Seleccionar...'}
          </span>
          {loading ? (
            <Loader2 className="ml-1 h-3 w-3 shrink-0 animate-spin opacity-50" />
          ) : (
            <ChevronsUpDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Buscar partida contable..."
            value={searchQuery}
            onValueChange={setSearchQuery}
            className="h-8 text-xs"
          />
          <CommandList>
            <CommandEmpty className="text-xs">
              {loading ? 'Buscando...' : 'No se encontró ninguna partida.'}
            </CommandEmpty>
            <CommandGroup>
              {suggestions.map((pc) => (
                <CommandItem
                  key={pc.id}
                  value={pc.codigo}
                  onSelect={() => void handleSelect(pc)}
                  className="text-xs"
                >
                  <Check
                    className={cn(
                      'mr-2 h-3 w-3',
                      pc.codigo === currentCodigo
                        ? 'opacity-100'
                        : 'opacity-0',
                    )}
                  />
                  <div className="flex flex-col">
                    <span className="font-mono text-[11px] font-bold text-primary">
                      {pc.codigo}
                    </span>
                    {pc.nombre && (
                      <span className="text-muted-foreground text-[10px] leading-tight">
                        {pc.nombre}
                      </span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function PartidaPresupuestariaCombobox({
  presupuestos,
  currentPartidaId,
  onUpdate,
  readOnly,
}: {
  presupuestos: RendicionGastosSectionProps['partidasPresupuestarias'];
  currentPartidaId: number | null;
  onUpdate: (partidaId: number | null) => Promise<void>;
  readOnly: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const currentItem = useMemo(
    () => presupuestos?.find((p) => p.id === currentPartidaId) ?? null,
    [presupuestos, currentPartidaId],
  );

  const filtered = useMemo(() => {
    if (!presupuestos) return [];
    if (!searchQuery.trim()) return presupuestos;
    const q = searchQuery.toLowerCase();
    return presupuestos.filter((p) => {
      const codigo = p.poa?.codigoPoa ?? '';
      const nombre = p.poa?.estructura?.partida?.nombre ?? '';
      return (
        codigo.toLowerCase().includes(q) ||
        nombre.toLowerCase().includes(q)
      );
    });
  }, [presupuestos, searchQuery]);

  const currentLabel = currentItem
    ? `${currentItem.poa?.codigoPoa ?? '—'} — ${currentItem.poa?.estructura?.partida?.nombre ?? ''}`
    : null;

  if (readOnly) {
    return currentLabel ? (
      <span className="font-medium text-xs">{currentLabel}</span>
    ) : (
      <span className="text-muted-foreground text-xs">—</span>
    );
  }

  return (
    <Popover
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (v) {
          setSearchQuery('');
        }
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="h-7 w-full max-w-[220px] justify-between px-1.5 text-[11px] font-normal"
        >
          <span className="truncate">
            {currentLabel || 'Seleccionar...'}
          </span>
          <ChevronsUpDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Buscar partida presupuestaria..."
            value={searchQuery}
            onValueChange={setSearchQuery}
            className="h-8 text-xs"
          />
          <CommandList>
            <CommandEmpty className="text-xs">
              No se encontró ninguna partida.
            </CommandEmpty>
            <CommandGroup>
              {currentPartidaId && (
                <CommandItem
                  value="__clear__"
                  onSelect={() => {
                    setOpen(false);
                    void onUpdate(null);
                  }}
                  className="text-xs text-destructive"
                >
                  Desvincular
                </CommandItem>
              )}
              {filtered.map((p) => {
                const codigo = p.poa?.codigoPoa ?? '—';
                const nombre = p.poa?.estructura?.partida?.nombre ?? '';
                return (
                  <CommandItem
                    key={p.id}
                    value={`${codigo} ${nombre}`}
                    onSelect={() => {
                      setOpen(false);
                      void onUpdate(p.id);
                    }}
                    className="text-xs"
                  >
                    <Check
                      className={cn(
                        'mr-2 h-3 w-3',
                        p.id === currentPartidaId
                          ? 'opacity-100'
                          : 'opacity-0',
                      )}
                    />
                    <div className="flex flex-col">
                      <span className="font-mono text-[11px] font-bold text-primary">
                        {codigo}
                      </span>
                      {nombre && (
                        <span className="text-muted-foreground text-[10px] leading-tight">
                          {nombre}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export function RendicionGastosSection({
  gastos,
  canEditPartidaContable = false,
  onUpdatePartidaContable,
  partidasPresupuestarias = [],
  canEditPartidaPresupuestaria = false,
  onUpdatePartidaPresupuestaria,
  gastoValidaciones = {},
  onGastoValidacionChange,
}: RendicionGastosSectionProps) {
  if (!gastos || gastos.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Gastos Registrados</CardTitle>
        <p className="text-muted-foreground text-sm">
          {gastos.length} gasto{gastos.length !== 1 ? 's' : ''} registrado
          {gastos.length !== 1 ? 's' : ''}
        </p>
      </CardHeader>
      <CardContent>
        <div className="w-full overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-amzdesk-table-header">
                  Validación
                </TableHead>
                <TableHead className="text-amzdesk-table-header">
                  Observación
                </TableHead>
                <TableHead className="text-amzdesk-table-header">
                  Concepto
                </TableHead>
                <TableHead className="text-amzdesk-table-header">
                  Documento
                </TableHead>
                <TableHead className="text-amzdesk-table-header">
                  Partida Contable
                </TableHead>
                <TableHead className="text-amzdesk-table-header">
                  Partida Presupuestaria
                </TableHead>
                <TableHead className="text-amzdesk-table-header">
                  Fecha
                </TableHead>
                <TableHead className="text-amzdesk-table-header text-right">
                  Monto Total (Bruto)
                </TableHead>
                <TableHead className="text-amzdesk-table-header text-right">
                  Retención / Impuestos
                </TableHead>
                <TableHead className="text-amzdesk-table-header text-right">
                  Efectivo Pagado
                </TableHead>
                <TableHead className="text-amzdesk-table-header">
                  Comprobante
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {gastos.map((gasto) => (
                <TableRow key={gasto.id}>
                  <TableCell className="align-middle">
                    <EstadoGastoControl
                      estado={gastoValidaciones[gasto.id]?.estado ?? 'vacio'}
                      observacion={gastoValidaciones[gasto.id]?.observacion ?? ''}
                      onChange={(estado, observacion) =>
                        onGastoValidacionChange?.(gasto.id, estado, observacion)
                      }
                    />
                  </TableCell>
                  <TableCell className="align-middle">
                    {gastoValidaciones[gasto.id]?.estado === 'observado' ? (
                      <span className="text-xs text-red-600">
                        {gastoValidaciones[gasto.id]?.observacion || '(sin detalle)'}
                      </span>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">{gasto.concepto || '-'}</p>
                    {gasto.detalle && (
                      <p className="text-muted-foreground text-xs">
                        {gasto.detalle}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">{gasto.tipoDocumento}</p>
                    <p className="text-muted-foreground text-xs">
                      {gasto.numeroDocumento || gasto.nroDocumento || 'S/N'}
                    </p>
                  </TableCell>
                  <TableCell>
                    {canEditPartidaContable && onUpdatePartidaContable ? (
                      <PartidaContableCombobox
                        currentCodigo={gasto.partidaContable?.codigo ?? null}
                        onUpdate={async (codigo) => {
                          await onUpdatePartidaContable(gasto.id, codigo);
                        }}
                      />
                    ) : gasto.partidaContable ? (
                      <span className="font-medium text-xs">
                        {gasto.partidaContable.codigo} — {gasto.partidaContable.nombre}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <PartidaPresupuestariaCombobox
                      presupuestos={partidasPresupuestarias}
                      currentPartidaId={gasto.partidaId ?? null}
                      onUpdate={async (partidaId) => {
                        await onUpdatePartidaPresupuestaria?.(gasto.id, partidaId);
                      }}
                      readOnly={!canEditPartidaPresupuestaria}
                    />
                  </TableCell>
                  <TableCell>
                    {gasto.fecha || gasto.fechaDocumento
                      ? formatDate((gasto.fecha || gasto.fechaDocumento)!)
                      : '-'}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatMoney(
                      toNumber(
                        gasto.montoTotal ?? gasto.montoBruto ?? gasto.monto,
                      ),
                    )}
                  </TableCell>
                  <TableCell className="text-right font-semibold text-orange-600">
                    {formatMoney(toNumber(gasto.montoImpuestos))}
                  </TableCell>
                  <TableCell className="text-right font-semibold text-emerald-600">
                    {formatMoney(toNumber(gasto.montoNeto ?? gasto.monto))}
                  </TableCell>
                  <TableCell>
                    {gasto.urlComprobante ? (
                      <a
                        href={gasto.urlComprobante}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                      >
                        Ver Comprobante
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    ) : (
                      <span className="text-muted-foreground text-sm">
                        Sin adjunto
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
