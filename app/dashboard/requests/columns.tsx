'use client';

import { ColumnDef, Row } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Eye } from 'lucide-react';
import Link from 'next/link';

export type RequestTableData = {
  id: string;
  code: string;
  description: string;
  status:
    | 'DRAFT'
    | 'PENDING'
    | 'APPROVED'
    | 'REJECTED'
    | 'REVIEW_SUPERVISOR'
    | 'REVIEW_DIRECTOR'
    | 'REVIEW_FINANCE'
    | 'DISBURSED'
    | 'COMPLETED';
  createdAt: string;
  user: {
    name: string;
  };
  items: {
    amount: number | string;
    totalAmount?: number | string;
  }[];
  poaCode: string | null;
};

export const columns: ColumnDef<RequestTableData>[] = [
  {
    accessorKey: 'poaCode',
    header: 'Código POA',
  },
  {
    accessorKey: 'createdAt',
    header: 'Fecha',
    cell: ({ row }: { row: Row<RequestTableData> }) => {
      const date = new Date(row.getValue('createdAt'));
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    },
  },
  {
    accessorKey: 'user.name',
    header: 'Solicitante',
  },
  {
    accessorKey: 'description',
    header: 'Descripción',
    cell: ({ row }: { row: Row<RequestTableData> }) => {
      const description = row.getValue('description') as string;
      return (
        <div className="max-w-[300px] truncate" title={description}>
          {description}
        </div>
      );
    },
  },
  {
    id: 'monto',
    header: () => <div className="text-right">Monto</div>,
    cell: ({ row }: { row: Row<RequestTableData> }) => {
      const items = row.original.items || [];
      const total = items.reduce((acc: number, item) => {
        const amount = item.totalAmount ?? item.amount;
        return acc + Number(amount || 0);
      }, 0);

      const formatted = new Intl.NumberFormat('es-BO', {
        style: 'currency',
        currency: 'BOB',
      }).format(total);

      return <div className="text-right font-medium">{formatted}</div>;
    },
  },
  {
    accessorKey: 'status',
    header: 'Estado',
    cell: ({ row }: { row: Row<RequestTableData> }) => {
      const status = row.getValue('status') as string;

      const variants: Record<string, string> = {
        PENDING:
          'bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200',
        REVIEW_SUPERVISOR:
          'bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200',
        REVIEW_DIRECTOR:
          'bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200',
        REVIEW_FINANCE:
          'bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200',
        APPROVED:
          'bg-green-100 text-green-800 hover:bg-green-100 border-green-200',
        DISBURSED:
          'bg-green-100 text-green-800 hover:bg-green-100 border-green-200',
        COMPLETED:
          'bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200',
        REJECTED: 'bg-red-100 text-red-800 hover:bg-red-100 border-red-200',
        DRAFT: 'bg-gray-100 text-gray-800 hover:bg-gray-100 border-gray-200',
      };

      return (
        <Badge
          variant="outline"
          className={variants[status] || 'bg-gray-100 text-gray-800'}
        >
          {status}
        </Badge>
      );
    },
  },
  {
    id: 'actions',
    cell: ({ row }: { row: Row<RequestTableData> }) => {
      const request = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Abrir menú</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link
                href={`/dashboard/requests/${request.id}`}
                className="flex items-center"
              >
                <Eye className="mr-2 h-4 w-4" />
                Ver Detalle
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
