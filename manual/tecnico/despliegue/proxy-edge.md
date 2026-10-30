---
title: Proxy edge
sidebar_position: 5
---

# Proxy edge

El stack `edge` es un nginx (`nginx:alpine`, contenedor `edge_nginx`) que reparte el dominio
entre los sistemas del VPS. Es el **único contenedor que publica un puerto** en el host: el 80.

```text
Conservacion-amazonica-backend/deploy/edge/
  docker-compose.yml     el servicio nginx y la red "edge"
  nginx.conf             se monta como /etc/nginx/conf.d/default.conf
  html/index.html        marcador de la raíz del dominio (portfolio)
```

En el VPS, esos archivos viven en `/opt/edge/`.

:::warning No se despliega solo
Ningún workflow toca `edge`. Un cambio en `deploy/edge/nginx.conf` hay que copiarlo a mano y
recargar nginx (ver [Cambiar la configuración](#cambiar-la-configuración)). Un error aquí afecta
a **todo el dominio**, no solo a AMZ Desk.
:::

## Reparto de rutas

nginx elige el `location` de **prefijo más largo**, sin importar el orden en el archivo.

| `location`                 | Destino                 | Qué hace                              |
| -------------------------- | ----------------------- | ------------------------------------- |
| `/amzdesk/api/doc`         | `amzdesk_backend:3000`  | Swagger, restringido por IP           |
| `/amzdesk/api/`            | `amzdesk_backend:3000`  | API, recortando el prefijo            |
| `/amzdesk/manual/tecnico/` | servicio `manual`       | Manual técnico, con sesión (spec 026) |
| `/amzdesk/manual/`         | servicio `manual`       | Manual de usuario, público (spec 026) |
| `/amzdesk`                 | `amzdesk_frontend:3001` | Frontend, con el prefijo completo     |
| `/exbmail`                 | otra aplicación         | Otro sistema del mismo dominio        |
| `/`                        | `/var/www/html`         | Raíz del dominio (portfolio)          |

Las dos rutas del manual se describen en [El manual en producción](./manual-en-produccion.md).

## La API: `/amzdesk/api/` y el `rewrite`

Nest sirve en la raíz (no define `setGlobalPrefix`), así que hay que quitar `/amzdesk/api`
antes de reenviar: `/amzdesk/api/health` llega a la API como `/health`.

```nginx title="deploy/edge/nginx.conf (extracto)"
location /amzdesk/api/ {
    set $amzdesk_api http://amzdesk_backend:3000;
    rewrite ^/amzdesk/api/(.*)$ /$1 break;
    proxy_pass $amzdesk_api;

    proxy_http_version 1.1;
    proxy_set_header Host              $host;
    proxy_set_header X-Real-IP         $remote_addr;
    proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $esquema_original;

    proxy_read_timeout 120s;
    proxy_send_timeout 120s;
}
```

- Se recorta con `rewrite` y no con la barra final de `proxy_pass` porque el destino es una
  **variable** (necesaria para el `resolver`, ver abajo), y con una variable nginx desactiva la
  sustitución automática de la URI.
- `proxy_read_timeout 120s`: generar un PDF con Puppeteer puede pasar del minuto por defecto.
- `client_max_body_size 10m` a nivel de servidor.

## El frontend: `/amzdesk` sin barra final

Aquí la ruta se reenvía **completa**, con su prefijo: Next se compiló con `basePath=/amzdesk` y
espera recibirlo. También reenvía las cabeceras de WebSocket (`Upgrade`, `Connection`).

El `location` va **sin barra final y sin redirección propia**, a propósito. Next considera
canónica la forma sin barra y responde `308` a `/amzdesk/` para quitarla. Si nginx redirigiera
`/amzdesk` a `/amzdesk/`, cada uno desharía lo del otro y el navegador entraría en un bucle
(`ERR_TOO_MANY_REDIRECTS`). Normaliza Next.

## Swagger restringido por IP

Swagger se monta siempre, sin mirar `NODE_ENV`. Sin restricción quedaría abierto a internet:

```nginx title="deploy/edge/nginx.conf (extracto)"
location /amzdesk/api/doc {
    allow 127.0.0.1;
    # allow <IP pública de quien lo consulta>;
    deny all;
    ...
}
```

Al ser el prefijo más largo, gana sobre `/amzdesk/api/` y cubre también `/amzdesk/api/doc-json`.
Para consultarlo desde fuera hay que añadir una línea `allow` con la IP pública propia, copiar la
config y recargar. Desde el propio VPS siempre funciona contra `127.0.0.1`.

## Detalles que no se deben quitar

### `resolver 127.0.0.11`

```nginx
resolver 127.0.0.11 valid=10s ipv6=off;
```

Es el DNS interno de Docker. nginx resuelve los nombres de los `proxy_pass` fijos **una sola vez
al arrancar**, y cada despliegue recrea los contenedores con otra IP. Sin el `resolver` y sin
destinos en variables (`set $amzdesk_api ...`), el proxy serviría `502` después del primer
despliegue hasta que alguien lo reiniciara. Por eso **todos** los `proxy_pass` usan una
variable.

### `absolute_redirect off`

Por defecto nginx reconstruye las redirecciones como `$scheme://$host/...`. Como el TLS lo
termina el proxy anterior, aquí `$scheme` siempre es `http`, y un usuario que llegó por HTTPS
acabaría redirigido a HTTP. Con `absolute_redirect off`, la cabecera `Location` sale relativa
(`/amzdesk/...`) y el navegador conserva el esquema original.

### `X-Forwarded-Proto`

```nginx
map $http_x_forwarded_proto $esquema_original {
    default   $scheme;
    "~^https$" https;
    "~^http$"  http;
}
```

Respeta el esquema que informa el proxy anterior y, si no viene, usa el de esta conexión. Todos
los `location` reenvían `X-Forwarded-Proto $esquema_original`. Sin esto la aplicación creería
que todo el tráfico es HTTP.

### Logs a la salida estándar

`access_log /dev/stdout` y `error_log /dev/stderr`: se consultan con `docker compose logs` y no
crecen sin rotación dentro del contenedor.

## La cookie de sesión y el prefijo

El backend emite la cookie de sesión (httpOnly) con `Path=/amzdesk` (`COOKIE_PATH` en el
`.env`). Así:

- El navegador la envía a todo lo que cuelga de `/amzdesk`: el frontend, la API en
  `/amzdesk/api/` y el manual en `/amzdesk/manual/`.
- **No** la envía a los otros sistemas del dominio (`/`, `/exbmail`), que no tienen por qué ver
  el JWT.

Que el manual cuelgue de `/amzdesk` es lo que permite protegerlo con la misma sesión, sin login
propio.

## Cambiar la configuración

```bash
# En la máquina de desarrollo
scp -P <puerto> deploy/edge/nginx.conf <usuario>@<vps>:/opt/edge/nginx.conf

# En el VPS
cd /opt/edge
docker compose exec nginx nginx -t           # validar ANTES de recargar
docker compose exec nginx nginx -s reload    # recarga sin cortar conexiones
```

Si `nginx -t` falla, **no recargar**: nginx sigue sirviendo con la config anterior mientras no se
recargue. Corregir y volver a probar.

### Agregar otro sistema al dominio

Copiar uno de los bloques `location` (con su `set` de variable y su `proxy_pass`), cambiar el
prefijo y el nombre del contenedor, y recargar. El stack nuevo debe unirse a la red externa
`edge`, igual que el de AMZ Desk.
