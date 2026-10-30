---
title: Entorno local
sidebar_position: 1
---

# Entorno local

Cómo levantar AMZ Desk en una máquina de desarrollo: base de datos, backend y frontend.

## Requisitos

| Herramienta     | Versión                 | De dónde sale                                                                  |
| --------------- | ----------------------- | ------------------------------------------------------------------------------ |
| Node.js         | 20.9 o superior         | `engines` de los dos `package.json`; las imágenes usan `node:20-bookworm-slim` |
| pnpm            | 10.14                   | `packageManager` de los dos `package.json` (se activa con `corepack enable`)   |
| PostgreSQL      | 15                      | `postgres:15-alpine`, en un contenedor                                         |
| Docker o Podman | cualquiera reciente     | para el contenedor de la base                                                  |
| Google Chrome   | instalado en el sistema | lo usan las pruebas E2E y, si se configura, Puppeteer                          |

El workspace tiene dos repos independientes, uno al lado del otro. La carpeta que los contiene
**no es un repositorio git**:

```text
Conservacion-amazonica-backend/    NestJS 11, puerto 3000
Conservacion-amazonica-frontend/   Next.js 16, puerto 3001
specs/                             especificaciones (SDD)
```

Todos los comandos se ejecutan dentro del directorio de cada proyecto.

## Base de datos

PostgreSQL corre en un contenedor llamado `amazonica_db`, publicado en el puerto `5432`. Está
definido en el compose del backend:

```yaml title="Conservacion-amazonica-backend/docker-compose.yml (extracto)"
services:
  postgres:
    image: postgres:15-alpine
    container_name: amazonica_db
    ports:
      - '5432:5432'
    volumes:
      - db_data:/var/lib/postgresql/data:Z
```

La marca `:Z` del volumen es obligatoria con Podman y SELinux; con Docker no estorba.

Primera vez, con Docker:

```bash
cd Conservacion-amazonica-backend
docker-compose up -d
```

Si el contenedor ya existe y se gestiona con Podman, basta con arrancarlo:

```bash
podman start amazonica_db
podman ps                      # comprobar que está "Up"
```

Para abrir una consola SQL:

```bash
podman exec -it amazonica_db psql -U <usuario> -d amazonica_db
```

El usuario y la contraseña de desarrollo están en `docker-compose.yml` y deben coincidir con
`DATABASE_URL` del `.env` del backend.

## Variables de entorno

Los valores nunca van en git. Cada repo trae una plantilla documentada: `.env.example`.

### Backend: `Conservacion-amazonica-backend/.env`

| Variable                            | Obligatoria | Qué es                                                                                                    |
| ----------------------------------- | ----------- | --------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`                      | sí          | Cadena de conexión de Prisma a PostgreSQL                                                                 |
| `JWT_SECRET`                        | sí          | Secreto para firmar los JWT. Mínimo 32 caracteres o la API no arranca                                     |
| `JWT_EXPIRES_IN`                    | no          | Vigencia del token (`24h` por defecto)                                                                    |
| `FRONTEND_URL`                      | sí          | Origen permitido por CORS: un único origen, sin barra final                                               |
| `PORT`                              | no          | Puerto de la API (`3000` por defecto)                                                                     |
| `NODE_ENV`                          | no          | `production` activa el flag `Secure` de la cookie, que exige HTTPS. En local, sin definir o `development` |
| `COOKIE_PATH`                       | no          | Ruta de la cookie de sesión. `/` en local, `/amzdesk` en producción                                       |
| `THROTTLE_TTL_MS`, `THROTTLE_LIMIT` | no          | Rate limiting global: ventana en milisegundos y peticiones por ventana                                    |
| `PUPPETEER_EXECUTABLE_PATH`         | no          | Ruta del Chromium o Chrome para los PDF. Vacía, Puppeteer usa el navegador que descargó al instalarse     |
| `SEED_PASSWORD`                     | no          | Contraseña fija para los usuarios nuevos que crea el seed (ver [Base de datos](./base-de-datos.md))       |

### Frontend: `Conservacion-amazonica-frontend/.env.local`

| Variable                | Qué es                                                                                                |
| ----------------------- | ----------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_API_URL`   | URL base de la API. En local, la del backend en el puerto 3000                                        |
| `NEXT_PUBLIC_BASE_PATH` | Prefijo de la aplicación. En local se deja vacío: la app vive en la raíz. En producción es `/amzdesk` |

:::warning Se hornean al compilar
Las variables `NEXT_PUBLIC_*` se incrustan en el bundle del navegador durante `next build`. No
se leen en tiempo de ejecución: cambiarlas en producción exige reconstruir la imagen.
`NEXT_PUBLIC_BASE_PATH` debe empezar por `/` o quedar vacía; una cadena como `amzdesk` rompe el
build.
:::

`NEXT_PUBLIC_MANUAL_URL` (opcional) es la URL de los manuales que enlazan el login y el panel
lateral (`lib/manual.ts`). En la imagen no hace falta: se deriva del `basePath`
(`/amzdesk/manual`). En desarrollo, con el manual corriendo (`pnpm start` en `manual/`), se
define como `http://localhost:3002/amzdesk/manual`.

## Arrancar las aplicaciones

Con la base en marcha, en dos terminales:

```bash
# Terminal 1
cd Conservacion-amazonica-backend
pnpm install
npx prisma migrate dev          # o "migrate deploy" en una shell no interactiva
npx prisma generate
pnpm run start:dev              # http://localhost:3000
```

```bash
# Terminal 2
cd Conservacion-amazonica-frontend
pnpm install
pnpm run dev                    # http://localhost:3001
```

Comprobaciones rápidas:

| URL                            | Qué responde                                                                                                                     |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| `http://localhost:3000/health` | `200` si la API y la base responden; `503` si la base no                                                                         |
| `http://localhost:3000/doc`    | Swagger. Tarda unos segundos más que la API en estar disponible (ver [Problemas conocidos](../operacion/problemas-conocidos.md)) |
| `http://localhost:3001/login`  | Pantalla de ingreso                                                                                                              |

Si la base está vacía, nadie puede entrar: hay que sembrarla (ver [Base de datos](./base-de-datos.md)).

### Contrato de la API en el frontend

El frontend guarda una copia del OpenAPI del backend en `backend-spec.json`. Se regenera con el
backend en marcha:

```bash
cd Conservacion-amazonica-frontend
pnpm run spec:sync              # descarga http://localhost:3000/doc-json
```

## Comandos de cada repo

| Repo     | Comando                                         | Para qué                                                    |
| -------- | ----------------------------------------------- | ----------------------------------------------------------- |
| backend  | `pnpm run start:dev`                            | API con recarga en caliente                                 |
| backend  | `pnpm run start:debug`                          | Igual, con el inspector de Node                             |
| backend  | `pnpm run lint`                                 | ESLint con `--fix`                                          |
| backend  | `pnpm run test`                                 | Tests unitarios (Jest)                                      |
| backend  | `pnpm run maintenance:recalibrar-poa-ejecutado` | Script de mantenimiento: recalcula `montoEjecutado` del POA |
| frontend | `pnpm run dev`                                  | Next en modo desarrollo, puerto 3001                        |
| frontend | `pnpm run lint`                                 | ESLint                                                      |
| frontend | `pnpm run test:e2e`                             | Pruebas E2E con Playwright                                  |
| frontend | `pnpm run spec:sync`                            | Regenera `backend-spec.json`                                |

:::tip Lint, no build
Durante el desarrollo se verifica con `pnpm run lint` y, si hace falta, `npx tsc --noEmit`. El
`build` se reserva para la etapa de despliegue: lo ejecuta el CI.
:::
