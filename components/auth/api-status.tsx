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
    const checkStatus = async () => {
      try {
        const baseURL =
          process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
        // Ping a la raíz o a /doc como sugirió el usuario
        await axios.get(`${baseURL}/doc`, { timeout: 5000 });
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
        setIsLoading(false);
      }
    };

    checkStatus();
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
        Backend: {status === 'connected' ? 'En línea' : 'Fuera de línea'}
      </span>
    </Badge>
  );
}
