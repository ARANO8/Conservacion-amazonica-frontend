/**
 * Regenera las capturas del manual de usuario (static/img/capturas/).
 *
 * Recorre la aplicación local (backend en 3000, frontend en 3001) con una
 * sesión firmada para cada rol, igual que las pruebas E2E del frontend, y
 * guarda una captura por entrada de capturas.json.
 *
 * El manual de usuario es público y la base local tiene los nombres, correos y
 * C.I. de la planilla: antes de cada captura se reemplazan en pantalla por
 * datos ficticios.
 *
 * Uso: pnpm capturas            (todas)
 *      pnpm capturas viajes-     (solo las que empiezan así)
 */
import { execFileSync } from 'node:child_process';
import { createHmac } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { chromium, type BrowserContext, type Page } from '@playwright/test';

const FRONT_URL = process.env.CAPTURAS_FRONT_URL ?? 'http://localhost:3001';
const CONTENEDOR_DB = process.env.CAPTURAS_DB_CONTAINER ?? 'amazonica_db';
const DOCKER = process.env.CAPTURAS_DOCKER ?? 'docker';
const BACKEND_ENV = path.resolve(
  __dirname,
  '../../../Conservacion-amazonica-backend/.env'
);
const DESTINO = path.resolve(__dirname, '../static/img/capturas');

interface Captura {
  /** Nombre del archivo, sin extensión */
  archivo: string;
  /** Ruta de la aplicación, por ejemplo /app/planes-viaje */
  ruta: string;
  rol: string;
  /** Id de un usuario concreto (por ejemplo, el Director de Programa de una solicitud) */
  usuarioId?: number;
  /** Textos de botones o pestañas a pulsar, en orden, antes de capturar */
  clics?: string[];
  /** Texto que debe verse antes de capturar */
  esperar?: string;
  /** Captura de la página entera y no solo de la ventana */
  completa?: boolean;
}

interface Usuario {
  id: number;
  email: string;
  nombreCompleto: string;
  rol: string;
  ci: string;
}

function sql(consulta: string): string[][] {
  const salida = execFileSync(
    DOCKER,
    [
      'exec',
      '-i',
      CONTENEDOR_DB,
      'psql',
      '-U',
      'admin',
      '-d',
      'amazonica_db',
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
    .filter((l) => l.length > 0)
    .map((l) => l.split('\t'));
}

function jwtSecret(): string {
  if (process.env.CAPTURAS_JWT_SECRET) return process.env.CAPTURAS_JWT_SECRET;
  if (!existsSync(BACKEND_ENV)) {
    throw new Error(`Define CAPTURAS_JWT_SECRET o crea ${BACKEND_ENV}`);
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

function firmarJwt(u: Usuario): string {
  const b64 = (o: object) =>
    Buffer.from(JSON.stringify(o)).toString('base64url');
  const ahora = Math.floor(Date.now() / 1000);
  const cabecera = b64({ alg: 'HS256', typ: 'JWT' });
  const cuerpo = b64({
    sub: u.id,
    email: u.email,
    rol: u.rol,
    iat: ahora,
    exp: ahora + 7200,
  });
  const firma = createHmac('sha256', jwtSecret())
    .update(`${cabecera}.${cuerpo}`)
    .digest('base64url');
  return `${cabecera}.${cuerpo}.${firma}`;
}

const NOMBRES = [
  'Ana',
  'Luis',
  'Carla',
  'Jorge',
  'María',
  'Pedro',
  'Lucía',
  'Raúl',
  'Sofía',
  'Diego',
];
const APELLIDOS = [
  'Rojas',
  'Vaca',
  'Suárez',
  'Mendoza',
  'Flores',
  'Quispe',
  'Arce',
  'Durán',
  'Rivero',
  'Paz',
];

const FIRMANTES_FIJOS: [string, string][] = [
  ['Marcos F. Terán Valenzuela', 'Director F. Ejecutivo Ejemplo'],
  ['Marcos Terán Valenzuela', 'Director Ejecutivo Ejemplo'],
  ['Marcos Teran Valenzuela', 'Director Ejecutivo Ejemplo'],
  ['Shirley Ramírez Teodovich', 'Directora Financiera Ejemplo'],
  ['Shirley Ramirez Teodovich', 'Directora Financiera Ejemplo'],
];

/**
 * Pares [texto real, texto ficticio] para todos los usuarios: el nombre (en
 * mayúsculas y tal cual), el correo y el C.I. El ficticio depende del id, así
 * que una persona se llama igual en todas las capturas.
 */
function reemplazos(usuarios: Usuario[]): [string, string][] {
  const pares: [string, string][] = [];
  for (const u of usuarios) {
    const ficticio = `${NOMBRES[u.id % NOMBRES.length]} ${APELLIDOS[Math.floor(u.id / NOMBRES.length) % APELLIDOS.length]} ${APELLIDOS[(u.id * 7) % APELLIDOS.length]}`;
    pares.push([u.nombreCompleto, ficticio]);
    pares.push([u.nombreCompleto.toUpperCase(), ficticio.toUpperCase()]);
    pares.push([u.email, `usuario${u.id}@ejemplo.org`]);
    if (u.ci) pares.push([u.ci, `${1000000 + u.id * 137} LP`]);
  }
  // Firmantes fijos que el backend escribe desde constantes, con otra grafía
  // que la de la base
  FIRMANTES_FIJOS.forEach(([real, ficticio]) => {
    pares.push([real, ficticio], [real.toUpperCase(), ficticio.toUpperCase()]);
  });
  // Primero los textos largos, para no reemplazar un trozo de otro
  return pares.sort((a, b) => b[0].length - a[0].length);
}

async function anonimizar(page: Page, pares: [string, string][]) {
  await page.evaluate((lista) => {
    const recorrer = (raiz: Node) => {
      const walker = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT);
      for (let n = walker.nextNode(); n; n = walker.nextNode()) {
        let texto = n.nodeValue ?? '';
        for (const [real, ficticio] of lista) {
          if (texto.includes(real)) texto = texto.split(real).join(ficticio);
        }
        if (texto !== n.nodeValue) n.nodeValue = texto;
      }
    };
    recorrer(document.body);
    // Valores de los campos de formulario
    document.querySelectorAll('input, textarea').forEach((el) => {
      const campo = el as HTMLInputElement;
      for (const [real, ficticio] of lista) {
        if (campo.value.includes(real))
          campo.value = campo.value.split(real).join(ficticio);
      }
    });
    // Los anexos se ven dentro de un iframe del mismo origen
    document.querySelectorAll('iframe').forEach((f) => {
      const doc = (f as HTMLIFrameElement).contentDocument;
      if (doc?.body) recorrer(doc.body);
    });
  }, pares);
}

/** Cookie del JWT y el auth-store, como las pruebas E2E del frontend. */
async function iniciarSesion(context: BrowserContext, usuario: Usuario) {
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

async function main() {
  const filtro = process.argv[2] ?? '';
  const lista: Captura[] = JSON.parse(
    readFileSync(path.resolve(__dirname, 'capturas.json'), 'utf-8')
  );
  const pendientes = lista.filter((c) => c.archivo.startsWith(filtro));

  const usuarios: Usuario[] = sql(
    `SELECT id, email, "nombreCompleto", rol, coalesce(ci, '') FROM "Usuario" WHERE "deletedAt" IS NULL ORDER BY id`
  ).map(([id, email, nombreCompleto, rol, ci]) => ({
    id: Number(id),
    email,
    nombreCompleto,
    rol,
    ci,
  }));
  const pares = reemplazos(usuarios);

  const browser = await chromium.launch({ channel: 'chrome' });
  let fallos = 0;
  for (const c of pendientes) {
    // PUBLICO: sin sesión (pantalla de login)
    const publico = c.rol === 'PUBLICO';
    const usuario = c.usuarioId
      ? usuarios.find((u) => u.id === c.usuarioId)
      : usuarios.find((u) => u.rol === c.rol);
    if (!usuario && !publico) {
      console.log(`FALTA ${c.archivo}: no hay usuario con rol ${c.rol}`);
      fallos++;
      continue;
    }
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 1,
      locale: 'es-BO',
    });
    // tsx compila con keepNames y mete __name() en las funciones que se pasan
    // al navegador; ahí no existe
    await context.addInitScript({ content: 'window.__name = (f) => f;' });
    if (usuario) await iniciarSesion(context, usuario);
    // Panel lateral abierto, como lo ve la mayoría
    await context.addCookies([
      { name: 'sidebar_state', value: 'true', domain: 'localhost', path: '/' },
    ]);

    const page = await context.newPage();
    try {
      await page.goto(FRONT_URL + c.ruta, {
        waitUntil: 'load',
        timeout: 120_000,
      });
      // Algunas pantallas consultan la API cada pocos segundos y nunca quedan
      // en reposo: se espera un rato y se sigue
      await page
        .waitForLoadState('networkidle', { timeout: 20_000 })
        .catch(() => {});
      for (const texto of c.clics ?? []) {
        await page.getByText(texto, { exact: true }).first().click();
        await page
          .waitForLoadState('networkidle', { timeout: 10_000 })
          .catch(() => {});
      }
      if (c.esperar) {
        await page.getByText(c.esperar).first().waitFor({ timeout: 30_000 });
      }
      // Que terminen animaciones y que carguen los iframes de los anexos
      await page.waitForTimeout(1500);
      // Fuera los avisos emergentes y el botón de desarrollo de Next
      await page.addStyleTag({
        content:
          '[data-sonner-toaster], nextjs-portal { display: none !important; }',
      });
      await anonimizar(page, pares);
      await page.screenshot({
        path: path.join(DESTINO, `${c.archivo}.png`),
        fullPage: c.completa ?? false,
      });
      console.log(`OK    ${c.archivo}`);
    } catch (e) {
      fallos++;
      console.log(`FALLO ${c.archivo}: ${(e as Error).message.split('\n')[0]}`);
    } finally {
      await context.close();
    }
  }
  await browser.close();
  console.log(`\n${pendientes.length - fallos}/${pendientes.length} capturas`);
  process.exit(fallos ? 1 : 0);
}

void main();
