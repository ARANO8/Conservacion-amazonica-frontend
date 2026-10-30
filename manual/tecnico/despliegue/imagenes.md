---
title: Imágenes Docker
sidebar_position: 3
---

# Imágenes Docker

Cada repo tiene un `Dockerfile` multietapa en su raíz. Las dos imágenes parten de
`node:20-bookworm-slim` y arrancan con `tini` como PID 1. El manual tiene su propia imagen,
descrita en [El manual en producción](./manual-en-produccion.md).

## Backend

`Conservacion-amazonica-backend/Dockerfile`, dos etapas.

### Etapa `builder`

1. Instala todas las dependencias con `pnpm install --frozen-lockfile`.
2. `npx prisma generate --generator client`: solo el cliente. El generador `erd` arrastraría
   `@mermaid-js/mermaid-cli` con un segundo Chromium y no aporta nada a la imagen.
3. `pnpm build`.

Variables de la etapa: `HUSKY=0` (el script `prepare` fallaría sin `.git`) y
`PUPPETEER_SKIP_DOWNLOAD=true` (en ejecución se usa el Chromium del sistema).

### Etapa `runner`

| Qué                                          | Por qué                                                                                                                                                                          |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Debian y no Alpine                           | `bcrypt` es nativo y sus binarios para musl son poco fiables; el Chromium de Debian está mejor alineado con Puppeteer                                                            |
| `chromium`                                   | Generación de PDF con Puppeteer (`PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium`)                                                                                                  |
| `tini`                                       | Init como PID 1: sin él, los procesos de Chromium quedan como zombis                                                                                                             |
| `openssl`                                    | Lo requieren los motores de Prisma                                                                                                                                               |
| `fonts-liberation`, `fonts-dejavu-core`      | Fuentes para los PDF                                                                                                                                                             |
| `pnpm install --prod`                        | Solo dependencias de producción. Antes se borra el script `prepare` (husky no existe en producción); no se usa `--ignore-scripts` porque `bcrypt` necesita el suyo               |
| `prisma/` copiado                            | El entrypoint ejecuta `prisma migrate deploy` en cada arranque                                                                                                                   |
| `dist/`, `logo.png`, `logo-aceaa.jpg`        | La app compilada (las plantillas `.hbs` van dentro de `dist/`) y los logos de los documentos. Se resuelven contra el directorio de trabajo, así que el proceso arranca en `/app` |
| `prisma/seeds` copiado a `dist/prisma/seeds` | Para poder ejecutar el seed compilado sin `ts-node` (ver [Migraciones y seed](../operacion/migraciones-y-seed.md))                                                               |
| `USER node`                                  | No corre como root. No se hace `chown -R /app`: duplicaría unos 250 MB en una capa y la app no necesita escribir sus archivos                                                    |

```text title="Conservacion-amazonica-backend/Dockerfile (final)"
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:3000/health')..."

ENTRYPOINT ["/usr/bin/tini", "--", "/usr/local/bin/docker-entrypoint.sh"]
CMD ["node", "dist/src/main"]
```

El entrypoint aplica las migraciones y después lanza la API:

```bash title="Conservacion-amazonica-backend/docker-entrypoint.sh"
set -e
echo "[entrypoint] Aplicando migraciones pendientes..."
npx prisma migrate deploy
echo "[entrypoint] Migraciones al día. Iniciando la API..."
exec "$@"
```

La imagen pesa alrededor de 1,7 GB, casi todo por Chromium.

### Qué no entra (`.dockerignore`)

`.env`, `node_modules`, `dist`, tests (`test/`, `*.spec.ts`), `.git`, `.husky`, `.github`,
`README.md`, `ERD.md`, los `*.sql` y los scripts locales de `prisma/` (`seed-test-data.ts`,
`check-data.ts`, `create_test_solicitud.ts`, `reset_passwords.ts`, `_check-rendicion*.ts`).

## Frontend

`Conservacion-amazonica-frontend/Dockerfile`, tres etapas.

| Etapa     | Qué hace                                                                                                                           |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `deps`    | `pnpm install --frozen-lockfile` con `HUSKY=0`                                                                                     |
| `builder` | Recibe `NEXT_PUBLIC_BASE_PATH` y `NEXT_PUBLIC_API_URL` como `ARG` (por defecto `/amzdesk` y `/amzdesk/api`) y ejecuta `pnpm build` |
| `runner`  | Copia la salida `standalone` de Next, `.next/static` y `public/`; corre como `node` en el puerto 3001 con `node server.js`         |

Puntos a tener en cuenta:

- `next.config.ts` usa `output: 'standalone'`: Next genera un servidor autocontenido con solo
  las dependencias de ejecución, y la imagen no arrastra `node_modules` entero.
- Las `NEXT_PUBLIC_*` se **hornean** en el bundle durante el build. Cambiar el prefijo
  `/amzdesk` o la URL de la API exige reconstruir la imagen; tocar el `.env` del VPS no sirve.
- Las rutas son relativas: la misma imagen sirve en cualquier dominio.
- El healthcheck consulta `NEXT_PUBLIC_BASE_PATH` + `/login`, porque con `basePath` la raíz
  devuelve 404.
- `images.unoptimized: true`: el optimizador de imágenes de Next no resuelve bien el
  `basePath`, y además así se ahorra CPU en el VPS.

:::info Carpeta `manual/` y la imagen del frontend
La carpeta `manual/` vive en el repo del frontend pero tiene su propia imagen. Que no termine
dentro de la imagen de Next depende de `.dockerignore` del frontend y de la configuración de
TypeScript y ESLint de Next.
:::

:::caution Pendiente de confirmar
Al escribir esta página, `.dockerignore` del frontend no excluye `manual/`. Confirmar, cuando se
cierre la spec 026, si se excluye para no copiar sus archivos al contexto de build de Next.
:::

## Construir una imagen en local

Normalmente no hace falta: las construye el CI. Para reproducir un fallo de build:

```bash
cd Conservacion-amazonica-backend
docker build -t amzdesk-backend:local .

cd ../Conservacion-amazonica-frontend
docker build -t amzdesk-frontend:local .
```

Con Podman, el mismo comando con `podman build`.
