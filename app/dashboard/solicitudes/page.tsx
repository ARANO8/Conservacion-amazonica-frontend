'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Eye } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface Request {
  id: number;
  code: string;
  title: string;
  totalAmount: number | string;
  status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}

// Start simple with mapping, then refine styles inline if needed
const getStatusBadge = (status: Request['status']) => {
  let className = '';
  let variant: 'default' | 'secondary' | 'destructive' | 'outline' = 'outline';

  switch (status) {
    case 'DRAFT':
      variant = 'secondary'; // Gris
      break;
    case 'PENDING':
      variant = 'secondary';
      className = 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'; // Amarillo
      break;
    case 'APPROVED':
      variant = 'default';
      className = 'bg-green-100 text-green-800 hover:bg-green-100'; // Verde
      break;
    case 'REJECTED':
      variant = 'destructive'; // Rojo
      break;
  }

  return (
    <Badge variant={variant} className={className}>
      {status}
    </Badge>
  );
};

export default function MyRequestsPage() {
  const [requests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Legacy fetching disabled for Greenfield Migration
    /*
    const fetchRequests = async () => {
      try {
        const response = await api.get<Request[]>('/requests');
        // setRequests(response.data);
      } catch (error) {
        console.error('Error fetching requests:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
    */

    // Use a small timeout or just don't set it if the initial state is already correct
    // But setting it inside the effect is fine if it's not and has no deps that change
    // The warning specifically says "Calling setState synchronously within an effect body"
    // So we wrap it in a microtask or similar, or just initialize loading to false if we aren't fetching.
    const timer = setTimeout(() => {
      setLoading(false);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const formatCurrency = (amount: number | string) => {
    const value = Number(amount);
    if (isNaN(value)) return 'Bs. 0.00';
    return new Intl.NumberFormat('es-BO', {
      style: 'currency',
      currency: 'BOB',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Mis Solicitudes</h1>
        <Button asChild>
          <Link href="/dashboard/solicitud">Nueva Solicitud</Link>
        </Button>
      </div>

      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-muted/10 flex flex-col items-center justify-center rounded-lg border p-8">
          <p className="text-muted-foreground mb-4 text-lg">
            No tienes solicitudes creadas.
          </p>
          <Button asChild variant="outline">
            <Link href="/dashboard/solicitudes/nueva">
              Crear mi primera solicitud
            </Link>
          </Button>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((req) => (
                <TableRow key={req.id}>
                  <TableCell className="font-medium">{req.code}</TableCell>
                  <TableCell>{req.title}</TableCell>
                  <TableCell>{formatCurrency(req.totalAmount)}</TableCell>
                  <TableCell>{formatDate(req.createdAt)}</TableCell>
                  <TableCell>{getStatusBadge(req.status)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/dashboard/solicitudes/${req.id}`}>
                        <Eye className="h-4 w-4" />
                        <span className="sr-only">Ver detalle</span>
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
