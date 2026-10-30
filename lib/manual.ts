import { withBasePath } from '@/lib/utils';

/**
 * Los manuales los sirve su propio contenedor (proyecto `manual/`), no Next:
 * en producción cuelgan de /amzdesk/manual, junto a la aplicación. En
 * desarrollo corren con `pnpm start` dentro de manual/, en otro puerto, y se
 * apunta a ellos con NEXT_PUBLIC_MANUAL_URL.
 */
const BASE = process.env.NEXT_PUBLIC_MANUAL_URL ?? withBasePath('/manual');

export const MANUAL_USUARIO_URL = `${BASE}/`;

/** Exige la sesión de AMZ Desk: nginx la comprueba contra la API. */
export const MANUAL_TECNICO_URL = `${BASE}/tecnico/`;
