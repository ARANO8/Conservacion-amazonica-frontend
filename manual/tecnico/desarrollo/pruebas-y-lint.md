---
title: Pruebas y lint
sidebar_position: 3
---

# Pruebas y lint

## Lint: la verificación del día a día

Durante el desarrollo se verifica con lint, no con `build`. El `build` se reserva para el
despliegue y lo ejecuta el CI.

| Repo     | Comando         | Qué hace                                              |
| -------- | --------------- | ----------------------------------------------------- |
| backend  | `pnpm run lint` | ESLint sobre `src`, `test` y `types`, **con `--fix`** |
| frontend | `pnpm run lint` | ESLint sobre el proyecto, sin corrección automática   |

El chequeo de tipos se puede lanzar aparte, igual que lo hace el CI:

```bash
npx tsc --noEmit
```

El CI de los dos repos ejecuta `tsc --noEmit` y `pnpm lint` antes de construir la imagen: si
fallan en local, fallarán en el despliegue (ver [CI/CD](../despliegue/ci-cd.md)).

## Backend: Jest

Tests unitarios con Jest y `ts-jest`. La configuración está en el `package.json`: `rootDir` es
`src` y se ejecutan los archivos `*.spec.ts`.

```bash
cd Conservacion-amazonica-backend
pnpm run test                                             # todos
pnpm run test -- src/solicitudes/solicitudes.service.spec.ts   # un archivo
pnpm run test -- --testPathPattern="poa.service"          # por patrón de ruta
pnpm run test -- --testNamePattern="should create"        # por nombre del caso
pnpm run test:watch                                       # modo watch
pnpm run test:cov                                         # cobertura en coverage/
```

Hoy hay specs en `auth`, `cuadros-comparativos`, `declaraciones-movilidad`, `informes-viaje`,
`liquidaciones-viaticos`, `planes-viaje`, `rendiciones` y `solicitudes`. La cobertura es
parcial: un cambio no queda cubierto por la suite solo porque los tests pasen.

Los tests no tocan la base: mockean `PrismaService`. El CI los ejecuta en cada despliegue
(job **Verificar**).

:::caution Pendiente de confirmar
`pnpm run test:e2e` del backend usa `test/jest-e2e.json` y `test/app.e2e-spec.ts`, que parece
el ejemplo que genera Nest al crear el proyecto. No está en el CI. Confirmar si sigue en uso o
se puede retirar.
:::

## Frontend: Playwright (E2E)

El frontend no tiene tests unitarios. Sí tiene pruebas de punta a punta con Playwright, que se
ejecutan **contra los servidores de desarrollo ya levantados** y la base local.

```ts title="playwright.config.ts (extracto)"
testDir: './e2e',
globalSetup: './e2e/global-setup.ts',
globalTeardown: './e2e/global-teardown.ts',
fullyParallel: false,
workers: 1,                       // los casos comparten la base: uno a la vez
use: {
  baseURL: process.env.E2E_FRONT_URL ?? 'http://localhost:3001',
},
projects: [{ name: 'chrome', use: { channel: 'chrome' } }],
```

Puntos clave:

- Usa el **Chrome instalado** (`channel: 'chrome'`): no hace falta descargar navegadores.
- Un solo worker y sin reintentos: los casos comparten la base de desarrollo.
- Timeout de 5 minutos por caso, porque el servidor de desarrollo compila cada página la primera
  vez.
- No inicia sesión por la pantalla de login: `e2e/support/entorno.ts` firma la cookie de sesión
  con el mismo `JWT_SECRET` del `.env` del backend.
- Prepara y deshace datos con SQL directo, mediante `docker exec` sobre el contenedor de la base.

### Estructura

```text
e2e/
  global-setup.ts           espera a los servidores y prepara los datos del caso
  global-teardown.ts        deja la base como estaba
  support/entorno.ts        URLs, SQL contra el contenedor, sesiones firmadas
  liquidacion-viaticos/     caso de la Liquidación de Viáticos (ANEXO 5)
```

El caso actual necesita que exista una solicitud concreta en estado `DESEMBOLSADO` (definida en
`e2e/liquidacion-viaticos/datos.ts`) y sin liquidación activa; si no, el setup se detiene con un
mensaje que dice qué falta.

### Ejecutar

```bash
# Con la base, el backend (3000) y el frontend (3001) en marcha
cd Conservacion-amazonica-frontend
pnpm run test:e2e                 # sin ventana
pnpm run test:e2e:ui              # con el navegador visible
```

Los resultados quedan en `test-results/` y `playwright-report/` (los dos ignorados por git).

### Variables opcionales

| Variable                     | Por defecto                            | Para qué                 |
| ---------------------------- | -------------------------------------- | ------------------------ |
| `E2E_FRONT_URL`              | `http://localhost:3001`                | URL del frontend         |
| `E2E_API_URL`                | `http://localhost:3000`                | URL del backend          |
| `E2E_DB_CONTAINER`           | `amazonica_db`                         | Contenedor de PostgreSQL |
| `E2E_DB_USER`, `E2E_DB_NAME` | los del compose de desarrollo          | Credenciales de `psql`   |
| `E2E_JWT_SECRET`             | el `JWT_SECRET` del `.env` del backend | Para firmar las sesiones |

:::info Con Podman
`entorno.ts` invoca el binario `docker`. Si la base corre en Podman, hace falta que `docker`
resuelva a Podman (alias o el paquete `podman-docker`).
:::

## Antes de cada commit

Los hooks de husky ejecutan lint-staged sobre los archivos preparados (ver
[Convenciones](./convenciones.md)). No sustituye a un `pnpm run lint` completo antes de
publicar.
