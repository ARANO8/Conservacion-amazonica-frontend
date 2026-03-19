'use client';

import * as React from 'react';
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  HeaderGroup,
  Header,
  Row,
  Cell,
} from '@tanstack/react-table';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Partida } from '@/types/catalogs';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  partidas: Partida[];
  partidaId?: number;
  onPartidaChange: (partidaId?: number) => void;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  partidas,
  partidaId,
  onPartidaChange,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
    },
  });

  return (
    <div>
      <div className="flex flex-col gap-2 py-4 md:flex-row md:items-center">
        <Input
          placeholder="Filtrar por solicitante..."
          value={
            (table.getColumn('solicitante')?.getFilterValue() as string) ?? ''
          }
          onChange={(event) =>
            table.getColumn('solicitante')?.setFilterValue(event.target.value)
          }
          className="w-full md:max-w-sm"
        />
        <Input
          placeholder="Filtrar por Código..."
          value={
            (table.getColumn('codigoSolicitud')?.getFilterValue() as string) ??
            ''
          }
          onChange={(event) =>
            table
              .getColumn('codigoSolicitud')
              ?.setFilterValue(event.target.value)
          }
          className="w-full md:max-w-[200px]"
        />
        <Input
          placeholder="Filtrar por estado..."
          value={(table.getColumn('estado')?.getFilterValue() as string) ?? ''}
          onChange={(event) =>
            table.getColumn('estado')?.setFilterValue(event.target.value)
          }
          className="w-full md:max-w-[180px]"
        />
        <Select
          value={partidaId !== undefined ? String(partidaId) : 'ALL'}
          onValueChange={(value) =>
            onPartidaChange(value === 'ALL' ? undefined : Number(value))
          }
        >
          <SelectTrigger className="w-full md:max-w-[280px]">
            <SelectValue placeholder="Filtrar por Partida..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todas las partidas</SelectItem>
            {partidas.map((partida) => (
              <SelectItem key={partida.id} value={String(partida.id)}>
                {partida.codigo
                  ? `${partida.codigo} - ${partida.nombre}`
                  : partida.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="bg-card rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup: HeaderGroup<TData>) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header: Header<TData, unknown>) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row: Row<TData>) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map((cell: Cell<TData, unknown>) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  Sin resultados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="text-muted-foreground flex-1 text-sm">
          {table.getFilteredRowModel().rows.length} solicitud(es) en total
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Anterior
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Siguiente
        </Button>
      </div>
    </div>
  );
}
