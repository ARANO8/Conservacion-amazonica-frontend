'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function ApiStatus() {
  const [status, setStatus] = useState<'connected' | 'disconnected'>(
    'disconnected'
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkStatus = async (isInitial = false) => {
      if (isInitial) setIsLoading(true);
      try {
        const baseURL = process.env.NEXT_PUBLIC_API_URL;
        // Endpoint público de salud: comprueba el servicio y su conexión con la
        // base de datos, y está exento del rate limiting.
        await axios.get(`${baseURL}/health`, { timeout: 5000 });
        setStatus('connected');
      } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
          // Si hay respuesta (incluso 401, 404, etc), el servidor está vivo
          setStatus('connected');
        } else {
          // Error de red o timeout
          setStatus('disconnected');
        }
      } finally {
        if (isInitial) setIsLoading(false);
      }
    };

    checkStatus(true); // Verificación inicial

    const interval = setInterval(() => {
      checkStatus(false); // Polling silencioso cada 30s
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  if (isLoading) return null;

  return (
    <Badge
      variant="outline"
      className="bg-background/50 flex items-center gap-2 backdrop-blur-sm"
    >
      <div
        className={cn(
          'h-2 w-2 rounded-full',
          status === 'connected' ? 'bg-emerald-500' : 'bg-red-500'
        )}
      />
      <span className="text-[10px] font-medium tracking-wider uppercase">
        Estado: {status === 'connected' ? 'En línea' : 'Fuera de línea'}
      </span>
    </Badge>
  );
}
