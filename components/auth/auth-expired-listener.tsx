'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Escucha el evento global `auth-expired` emitido por el interceptor de Axios
 * cuando el servidor devuelve un 401. Redirige a /login usando el router de
 * Next.js para mantener la navegación SPA (sin full-page refresh).
 *
 * Este componente no renderiza nada visible; se monta dentro del layout
 * protegido (`app/app/layout.tsx`) para que solo esté activo cuando el
 * usuario ya está autenticado.
 */
export function AuthExpiredListener() {
  const router = useRouter();

  useEffect(() => {
    function handleAuthExpired() {
      router.push('/login');
    }

    window.addEventListener('auth-expired', handleAuthExpired);
    return () => {
      window.removeEventListener('auth-expired', handleAuthExpired);
    };
  }, [router]);

  return null;
}
