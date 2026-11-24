---
title: Stack de producción
sidebar_position: 4
---

# Stack de producción

El stack de la aplicación se define en `Conservacion-amazonica-backend/deploy/docker-compose.prod.yml`
y se copia al VPS como `/opt/amzdesk/docker-compose.yml`. Lee sus valores de
`/opt/amzdesk/.env`, que vive solo en el VPS (permisos `600`, fuera de git).

:::warning El compose no se despliega solo
Los workflows solo cambian la imagen de un servicio. Si se modifica
`deploy/docker-compose.prod.yml`, hay que copiarlo a mano al VPS y ejecutar
`docker compose up -d`.
:::

## Servicios

| Servicio   | Contenedor         | Imagen               | Redes             | Notas                                           |
| ---------- | ------------------ | -------------------- | ----------------- | ----------------------------------------------- |
| `db`       | `amzdesk_db`       | `postgres:15-alpine` | `interna`         | Volumen `db_data`; healthcheck con `pg_isready` |
| `backend`  | `amzdesk_backend`  | `${BACKEND_IMAGE}`   | `interna`, `edge` | Espera a que `db` esté sana; `shm_size: 512m`   |
| `frontend` | `amzdesk_frontend` | `${FRONTEND_IMAGE}`  | `edge`            | Depende de `backend`                            |
| `manual`   | ver la nota        | `${MANUAL_IMAGE}`    | `edge`            | Lo agrega la spec 026                           |

Todos con `restart: unless-stopped`.

- **Ningún servicio publica puertos.** El nginx de `edge` los alcanza por la red compartida.
- **PostgreSQL ni siquiera está en la red `edge`**: solo es visible desde la red `interna`, es
  decir, desde el backend.
- `shm_size: 512m` en el backend: Docker asigna 64 MB a `/dev/shm` y Chromium se cae con eso,
  más aún porque se lanza un navegador por cada PDF. 512 MB y no más, porque el VPS tiene 2 GB en
  total (ver [Recursos](../operacion/recursos.md)).

:::caution Pendiente de confirmar
El servicio `manual` se está agregando en paralelo a esta página (spec 026). Confirmar el nombre
de su contenedor (siguiendo la convención sería `amzdesk_manual`) y que está solo en la red
`edge`.
:::

El backend recibe estas variables desde el compose:

```yaml title="deploy/docker-compose.prod.yml (extracto)"
environment:
  NODE_ENV: production
  PORT: 3000
  DATABASE_URL: ${DATABASE_URL}
  JWT_SECRET: ${JWT_SECRET}
  JWT_EXPIRES_IN: ${JWT_EXPIRES_IN:-24h}
  FRONTEND_URL: ${FRONTEND_URL}
  COOKIE_PATH: ${COOKIE_PATH:-/amzdesk}
  THROTTLE_TTL_MS: ${THROTTLE_TTL_MS:-60000}
  THROTTLE_LIMIT: ${THROTTLE_LIMIT:-100}
  PUPPETEER_EXECUTABLE_PATH: /usr/bin/chromium
  SEED_PASSWORD: ${SEED_PASSWORD:-}
```

## El `.env` del VPS

La plantilla está en `deploy/.env.example`. Solo nombres y significado:

| Variable                                            | Qué es                                                                                                                        |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` | Credenciales con que se crea la base. Distintas de las de desarrollo                                                          |
| `DATABASE_URL`                                      | Conexión de la API. El host es `db` (el servicio en la red interna) y las credenciales deben coincidir con las tres de arriba |
| `JWT_SECRET`                                        | Mínimo 32 caracteres o la API no arranca. Distinto del de desarrollo                                                          |
| `JWT_EXPIRES_IN`                                    | Vigencia del token                                                                                                            |
| `FRONTEND_URL`                                      | Origen público del sistema, sin barra final (frontend y API comparten dominio)                                                |
| `COOKIE_PATH`                                       | `/amzdesk`: acota la cookie de sesión al prefijo para que el JWT no viaje a las otras aplicaciones del dominio                |
| `THROTTLE_TTL_MS`, `THROTTLE_LIMIT`                 | Rate limiting por IP. El valor por defecto del código (10) es de desarrollo y se queda corto para el dashboard                |
| `SEED_PASSWORD`                                     | Contraseña de los usuarios que crea el seed. Solo se usa al sembrar                                                           |
| `BACKEND_IMAGE`, `FRONTEND_IMAGE`                   | Imagen desplegada de cada servicio, con su etiqueta `sha-*`. **Las reescribe el CI** en cada despliegue                       |
| `MANUAL_IMAGE`                                      | Imagen del manual (spec 026). Se agrega a mano una vez                                                                        |

:::danger
El `.env` del VPS no se copia a ningún sitio, no se commitea y no se pega en issues ni en chats.
Si se filtra `JWT_SECRET`, cualquiera puede fabricar sesiones válidas: hay que rotarlo (lo que
cierra todas las sesiones abiertas).
:::

## Comandos habituales

Siempre desde `/opt/amzdesk`:

```bash
docker compose ps                     # estado y salud de los contenedores
docker compose pull <servicio>        # bajar la imagen indicada en el .env
docker compose up -d <servicio>       # recrear un servicio
docker compose up -d                  # aplicar cambios del compose a todos
```

El resto (logs, migraciones, respaldos, rollback) está en la sección
[Operación](../operacion/logs-y-estado.md).
