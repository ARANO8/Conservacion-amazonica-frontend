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
import { cn, formatMoney, formatDate, formatDateShort } from '@/lib/utils';
import { desglosarGastoPersistido } from '@/lib/rendicion-anexo4';
import { catalogosService } from '@/lib/services/catalogos-service';
import type { GastoRendicionResponse } from '@/types/rendicion-backend';
import type { PartidaContable } from '@/types/catalogs';
import { Check, ChevronsUpDown, Loader2, Minus, X } from 'lucide-react';
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
    <div className="flex items-start gap-1">
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
        className="hover:bg-muted mt-0.5 flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded border transition-colors"
      >
        {estado === 'correcto' ? (
          <Check className="h-3.5 w-3.5 text-green-600" />
        ) : estado === 'observado' ? (
          <X className="h-3.5 w-3.5 text-red-600" />
        ) : (
          <Minus className="text-muted-foreground h-3.5 w-3.5" />
        )}
      </button>
      {estado === 'observado' && (
        <div className="min-w-0 flex-1">
          <Input
            value={observacion}
            onChange={(e) => onChange('observado', e.target.value)}
            placeholder="Observación..."
            className="h-6 text-[10px]"
          />
        </div>
      )}
    </div>
  );
}

interface RendicionGastosSectionProps {
  gastos: GastoRendicionResponse[];
  canEditPartidaContable?: boolean;
  onUpdatePartidaContable?: (
    gastoId: number,
    codigo: string | null
  ) => Promise<void>;
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
  onUpdatePartidaPresupuestaria?: (
    gastoId: number,
    partidaId: number | null
  ) => Promise<void>;
  gastoValidaciones?: Record<
    number,
    { estado: EstadoValidacion; observacion: string }
  >;
  onGastoValidacionChange?: (
    gastoId: number,
    estado: EstadoValidacion,
    observacion: string
  ) => void;
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
  const [allPartidas, setAllPartidas] = useState<PartidaContable[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  // Cargar todas las partidas una sola vez al abrir el popover
  useEffect(() => {
    if (!open) return;
    if (allPartidas.length > 0) return;

    const controller = new AbortController();

    const fetchAll = async () => {
      setLoading(true);
      try {
        const results = await catalogosService.searchPartidasContables(
          '',
          controller.signal
        );
        if (!controller.signal.aborted) {
          setAllPartidas(results);
        }
      } catch {
        // mantener vacío
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchAll();

    return () => controller.abort();
  }, [open, allPartidas.length]);

  // Filtrar localmente: busca sin puntos en el código o por nombre
  const suggestions = useMemo(() => {
    if (!searchQuery.trim()) return allPartidas;
    const query = searchQuery.replace(/\./g, '').toLowerCase();
    return allPartidas.filter(
      (p) =>
        p.codigo.replace(/\./g, '').toLowerCase().includes(query) ||
        p.nombre.toLowerCase().includes(query)
    );
  }, [searchQuery, allPartidas]);

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
          className="h-6 w-full max-w-[140px] justify-between px-1 text-[10px] font-normal"
        >
          <span className="truncate">{currentCodigo || 'Seleccionar...'}</span>
          {loading ? (
            <Loader2 className="ml-0.5 h-2.5 w-2.5 shrink-0 animate-spin opacity-50" />
          ) : (
            <ChevronsUpDown className="ml-0.5 h-2.5 w-2.5 shrink-0 opacity-50" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0" align="start">
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
                      pc.codigo === currentCodigo ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <div className="flex flex-col">
                    <span className="text-primary font-mono text-[11px] font-bold">
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
    [presupuestos, currentPartidaId]
  );

  const filtered = useMemo(() => {
    if (!presupuestos) return [];
    if (!searchQuery.trim()) return presupuestos;
    const q = searchQuery.toLowerCase();
    return presupuestos.filter((p) => {
      const codigo = p.poa?.codigoPoa ?? '';
      const nombre = p.poa?.estructura?.partida?.nombre ?? '';
      return (
        codigo.toLowerCase().includes(q) || nombre.toLowerCase().includes(q)
      );
    });
  }, [presupuestos, searchQuery]);

  const currentLabel = currentItem
    ? `${currentItem.poa?.codigoPoa ?? '—'} — ${currentItem.poa?.estructura?.partida?.nombre ?? ''}`
    : null;

  if (readOnly) {
    return currentLabel ? (
      <span className="text-[11px] leading-tight font-medium">
        {currentLabel}
      </span>
    ) : (
      <span className="text-muted-foreground text-[11px]">—</span>
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
          className="h-6 w-full max-w-[140px] justify-between px-1 text-[10px] font-normal"
        >
          <span className="truncate">{currentLabel || 'Seleccionar...'}</span>
          <ChevronsUpDown className="ml-0.5 h-2.5 w-2.5 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0" align="start">
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
                  className="text-destructive text-xs"
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
                        p.id === currentPartidaId ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <div className="flex flex-col">
                      <span className="text-primary font-mono text-[11px] font-bold">
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
                <TableHead className="text-amzdesk-table-header w-[200px]">
                  Validación
                </TableHead>
                <TableHead className="text-amzdesk-table-header min-w-[160px]">
                  Concepto / Documento
                </TableHead>
                <TableHead className="text-amzdesk-table-header w-[150px]">
                  P. Contable
                </TableHead>
                <TableHead className="text-amzdesk-table-header w-[150px]">
                  P. Presupuestaria
                </TableHead>
                <TableHead className="text-amzdesk-table-header w-[85px]">
                  Fecha
                </TableHead>
                <TableHead className="text-amzdesk-table-header w-[90px] text-right">
                  Total
                </TableHead>
                <TableHead className="text-amzdesk-table-header w-[85px] text-right">
                  RC-IVA 13%
                </TableHead>
                <TableHead className="text-amzdesk-table-header w-[80px] text-right">
                  IUE 5%
                </TableHead>
                <TableHead className="text-amzdesk-table-header w-[80px] text-right">
                  IT 3%
                </TableHead>
                <TableHead className="text-amzdesk-table-header w-[90px] text-right">
                  Total imp.
                </TableHead>
                <TableHead className="text-amzdesk-table-header w-[90px] text-right">
                  Neto
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {gastos.map((gasto) => {
                // Sólo el reparto por impuesto se deriva; los montos son los
                // guardados, que son los que se cargaron al POA.
                const desglose = desglosarGastoPersistido({
                  montoNeto: toNumber(gasto.montoNeto ?? gasto.monto),
                  montoBruto: toNumber(
                    gasto.montoTotal ?? gasto.montoBruto ?? gasto.monto
                  ),
                  montoImpuestos: toNumber(gasto.montoImpuestos),
                  tipoDocumento: gasto.tipoDocumento,
                  tipoRetencion: gasto.tipoRetencion,
                  nombrePartida:
                    gasto.partida?.poa?.estructura?.partida?.nombre ?? null,
                });
                return (
                  <TableRow key={gasto.id}>
                    <TableCell className="align-middle">
                      <EstadoGastoControl
                        estado={gastoValidaciones[gasto.id]?.estado ?? 'vacio'}
                        observacion={
                          gastoValidaciones[gasto.id]?.observacion ?? ''
                        }
                        onChange={(estado, observacion) =>
                          onGastoValidacionChange?.(
                            gasto.id,
                            estado,
                            observacion
                          )
                        }
                      />
                      {gastoValidaciones[gasto.id]?.estado === 'observado' &&
                      gastoValidaciones[gasto.id]?.observacion ? (
                        <p className="mt-1 text-[10px] leading-tight text-red-600">
                          {gastoValidaciones[gasto.id]?.observacion}
                        </p>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <p className="text-xs leading-tight font-medium">
                        {gasto.concepto || '-'}
                      </p>
                      <p className="text-muted-foreground text-[10px] leading-tight">
                        {gasto.tipoDocumento}{' '}
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
                        <span className="text-[11px] leading-tight font-medium">
                          {gasto.partidaContable.codigo}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-[11px]">
                          —
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <PartidaPresupuestariaCombobox
                        presupuestos={partidasPresupuestarias}
                        currentPartidaId={gasto.partidaId ?? null}
                        onUpdate={async (partidaId) => {
                          await onUpdatePartidaPresupuestaria?.(
                            gasto.id,
                            partidaId
                          );
                        }}
                        readOnly={!canEditPartidaPresupuestaria}
                      />
                    </TableCell>
                    <TableCell className="text-[11px] whitespace-nowrap">
                      {gasto.fecha || gasto.fechaDocumento
                        ? formatDateShort(
                            (gasto.fecha || gasto.fechaDocumento)!
                          )
                        : '-'}
                    </TableCell>
                    <TableCell className="text-right text-[11px] font-medium whitespace-nowrap tabular-nums">
                      {formatMoney(desglose.bruto)}
                    </TableCell>
                    <TableCell className="text-right text-[11px] whitespace-nowrap tabular-nums">
                      {desglose.rcIva > 0 ? formatMoney(desglose.rcIva) : '—'}
                    </TableCell>
                    <TableCell className="text-right text-[11px] whitespace-nowrap tabular-nums">
                      {desglose.iue > 0 ? formatMoney(desglose.iue) : '—'}
                    </TableCell>
                    <TableCell className="text-right text-[11px] whitespace-nowrap tabular-nums">
                      {desglose.it > 0 ? formatMoney(desglose.it) : '—'}
                    </TableCell>
                    <TableCell className="text-right text-[11px] font-medium whitespace-nowrap text-orange-600 tabular-nums">
                      {desglose.totalImpuestos > 0
                        ? formatMoney(desglose.totalImpuestos)
                        : '—'}
                    </TableCell>
                    <TableCell className="text-right text-[11px] font-bold whitespace-nowrap text-emerald-600 tabular-nums">
                      {formatMoney(desglose.neto)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
