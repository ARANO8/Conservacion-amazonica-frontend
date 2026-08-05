import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMoney(n: number | string) {
  const num = typeof n === 'string' ? parseFloat(n) : n;
  return new Intl.NumberFormat('es-BO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    style: 'currency',
    currency: 'BOB',
  }).format(isFinite(num) ? num : 0);
}

export function formatDate(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('es-BO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(dateObj);
}

export function formatDateShort(
  date: string | Date | null | undefined
): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '-';
  return new Intl.DateTimeFormat('es-BO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
}

export function normalizeString(text?: string | null): string {
  if (!text) return '';
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toUpperCase();
}

/**
 * Ruta interna con el prefijo de la aplicaci\u00f3n aplicado.
 *
 * Next antepone el `basePath` a `<Link>` y a `router.push`, pero **no** al
 * `src` de las im\u00e1genes ni a otros recursos de `public/`. En producci\u00f3n la
 * aplicaci\u00f3n cuelga de `/amzdesk`, as\u00ed que un `src="/logo.webp"` acaba pidiendo
 * la ra\u00edz del dominio, donde vive otro sitio, y devuelve 404.
 */
export function withBasePath(path: string): string {
  return `${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}${path}`;
}

/**
 * URL absoluta a una ruta interna, para enlaces que se comparten fuera de la
 * aplicaci\u00f3n. `window.location.origin` tampoco incluye el prefijo.
 */
export function absoluteAppUrl(path: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return `${origin}${withBasePath(path)}`;
}
