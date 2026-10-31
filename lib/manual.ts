import { withBasePath } from '@/lib/utils';

/**
 * Los manuales los sirve su propio contenedor (proyecto `manual/`), no Next:
 * en producción cuelgan de /amzdesk/manual, junto a la aplicación. En
 * desarrollo Next no tiene nada en esa ruta: corren dentro de manual/ con
 * `pnpm start` (usuario, puerto 3002) y `pnpm start:tecnico` (técnico, puerto
 * 3003). NEXT_PUBLIC_MANUAL_URL fuerza otra URL base para los dos.
 */
const DESARROLLO = process.env.NODE_ENV === 'development';
const BASE = process.env.NEXT_PUBLIC_MANUAL_URL;

export const MANUAL_USUARIO_URL = BASE
  ? `${BASE}/`
  : DESARROLLO
    ? 'http://localhost:3002/amzdesk/manual/'
    : withBasePath('/manual/');

/** Exige la sesión de AMZ Desk: nginx la comprueba contra la API. */
export const MANUAL_TECNICO_URL = BASE
  ? `${BASE}/tecnico/`
  : DESARROLLO
    ? 'http://localhost:3003/amzdesk/manual/tecnico/'
    : withBasePath('/manual/tecnico/');
