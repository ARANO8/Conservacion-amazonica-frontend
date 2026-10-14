import { execFileSync } from 'node:child_process';
import { createHmac } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import type { BrowserContext } from '@playwright/test';

/**
 * Entorno de las pruebas E2E: servidores de desarrollo corriendo, la base de
 * Docker (`amazonica_db`) y sesiones firmadas con el mismo `JWT_SECRET` del
 * backend, sin pasar por la pantalla de login.
 */

export const FRONT_URL = process.env.E2E_FRONT_URL ?? 'http://localhost:3001';
export const API_URL = process.env.E2E_API_URL ?? 'http://localhost:3000';

const CONTENEDOR_DB = process.env.E2E_DB_CONTAINER ?? 'amazonica_db';
const USUARIO_DB = process.env.E2E_DB_USER ?? 'admin';
const NOMBRE_DB = process.env.E2E_DB_NAME ?? 'amazonica_db';

const BACKEND_ENV = path.resolve(
  __dirname,
  '../../../Conservacion-amazonica-backend/.env'
);

/** Ejecuta SQL en la base de desarrollo y devuelve las filas (columnas separadas por tab). */
export function sql(consulta: string): string[][] {
  const salida = execFileSync(
    'docker',
    [
      'exec',
      '-i',
      CONTENEDOR_DB,
      'psql',
      '-U',
      USUARIO_DB,
      '-d',
      NOMBRE_DB,
      '-v',
      'ON_ERROR_STOP=1',
      '-tA',
      '-F',
      '\t',
      '-c',
      consulta,
    ],
    { encoding: 'utf-8' }
  );
  return salida
    .split('\n')
    .map((l) => l.replace(/\r$/, ''))
    .filter((l) => l.length > 0 && !/^(INSERT|UPDATE|DELETE) \d/.test(l))
    .map((l) => l.split('\t'));
}

/** Texto literal SQL, con comillas escapadas. */
export const literal = (v: string | null) =>
  v === null ? 'NULL' : `'${v.replace(/'/g, "''")}'`;

function jwtSecret(): string {
  if (process.env.E2E_JWT_SECRET) return process.env.E2E_JWT_SECRET;
  if (!existsSync(BACKEND_ENV)) {
    throw new Error(
      `Define E2E_JWT_SECRET o crea ${BACKEND_ENV} con JWT_SECRET`
    );
  }
  const linea = readFileSync(BACKEND_ENV, 'utf-8')
    .split(/\r?\n/)
    .find((l) => l.startsWith('JWT_SECRET='));
  if (!linea) throw new Error(`JWT_SECRET no está en ${BACKEND_ENV}`);
  return linea
    .slice('JWT_SECRET='.length)
    .trim()
    .replace(/^["']|["']$/g, '');
}

export interface UsuarioE2E {
  id: number;
  email: string;
  nombreCompleto: string;
  rol: string;
}

/** Usuario activo por email, tal como lo guarda el auth-store. */
export function usuarioPorEmail(email: string): UsuarioE2E {
  const [fila] = sql(
    `SELECT id, email, "nombreCompleto", rol FROM "Usuario" WHERE email = ${literal(email)} AND "deletedAt" IS NULL`
  );
  if (!fila) throw new Error(`No existe el usuario activo ${email}`);
  return {
    id: Number(fila[0]),
    email: fila[1],
    nombreCompleto: fila[2],
    rol: fila[3],
  };
}

/** JWT HS256 con el payload que espera la estrategia del backend. */
function firmarJwt(usuario: UsuarioE2E): string {
  const b64 = (o: object) =>
    Buffer.from(JSON.stringify(o)).toString('base64url');
  const ahora = Math.floor(Date.now() / 1000);
  const cabecera = b64({ alg: 'HS256', typ: 'JWT' });
  const cuerpo = b64({
    sub: usuario.id,
    email: usuario.email,
    rol: usuario.rol,
    iat: ahora,
    exp: ahora + 2 * 60 * 60,
  });
  const firma = createHmac('sha256', jwtSecret())
    .update(`${cabecera}.${cuerpo}`)
    .digest('base64url');
  return `${cabecera}.${cuerpo}.${firma}`;
}

/** Deja el contexto con la sesión del usuario: cookie del JWT y el auth-store. */
export async function iniciarSesion(
  context: BrowserContext,
  usuario: UsuarioE2E
) {
  await context.addCookies([
    {
      name: 'access_token',
      value: firmarJwt(usuario),
      domain: 'localhost',
      path: '/',
    },
  ]);
  const estado = JSON.stringify({
    state: {
      user: {
        id: String(usuario.id),
        nombreCompleto: usuario.nombreCompleto,
        email: usuario.email,
        rol: usuario.rol,
      },
      isAuthenticated: true,
    },
    version: 0,
  });
  await context.addInitScript((valor) => {
    window.localStorage.setItem('auth-storage', valor);
  }, estado);
}

/** Espera a que responda un servidor de desarrollo, con un error claro si no está. */
export async function esperarServidor(url: string, comando: string) {
  const limite = Date.now() + 30_000;
  while (Date.now() < limite) {
    try {
      const r = await fetch(url);
      if (r.status < 500) return;
    } catch {
      // aún no levanta
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`${url} no responde. Levántalo con: ${comando}`);
}
