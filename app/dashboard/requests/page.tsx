'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';
import { columns } from './columns';
import { SolicitudResponse } from '@/types/solicitud-backend';
import { DataTable } from './data-table';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

export default function RequestsPage() {
  const [data, setData] = useState<SolicitudResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const response = await api.get<SolicitudResponse[]>('/solicitudes');
        setData(response.data);
      } catch (error) {
        toast.error(
          'No se pudieron cargar las solicitudes. Intente nuevamente.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, []);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mis Solicitudes</h1>
          <p className="text-muted-foreground">
            Gestiona y visualiza el estado de tus solicitudes.
          </p>
        </div>
        <Button asChild className="bg-primary hover:bg-primary/90">
          <Link href="/dashboard/solicitud">Nueva Solicitud</Link>
        </Button>
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      ) : (
        <DataTable columns={columns} data={data} />
      )}
    </div>
  );
}
