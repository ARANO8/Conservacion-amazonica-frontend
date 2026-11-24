---
title: Logs y estado
sidebar_position: 1
---

# Logs y estado

Todo se consulta con `docker compose` desde el directorio de cada stack en el VPS:
`/opt/amzdesk` para la aplicación y `/opt/edge` para el proxy.

## Estado de los servicios

```bash
cd /opt/amzdesk
docker compose ps
```

La columna de estado muestra `healthy` / `unhealthy` en los servicios con healthcheck:

| Servicio   | Healthcheck                                                           |
| ---------- | --------------------------------------------------------------------- |
| `db`       | `pg_isready` cada 10 s                                                |
| `backend`  | `GET /health` cada 30 s, con 40 s de gracia al arrancar (migraciones) |
| `frontend` | `GET /amzdesk/login` cada 30 s                                        |

Comprobaciones por el mismo camino que un navegador, atravesando `edge`:

```bash
curl -fsS http://127.0.0.1/amzdesk/api/health            # {"status":"ok",...}
curl -sL -o /dev/null -w '%{http_code}\n' http://127.0.0.1/amzdesk   # 200
```

`/health` responde `503` si la API está viva pero no llega a la base. No tiene rate limiting, así
que un `429` ahí no puede confundirse con una caída.

## Logs de la aplicación

```bash
cd /opt/amzdesk
docker compose logs -f backend                # en vivo
docker compose logs --tail 200 backend        # últimas líneas
docker compose logs --since 30m frontend      # última media hora
docker compose logs db
```

Qué buscar en el backend:

| Mensaje                                                | Significa                                                 |
| ------------------------------------------------------ | --------------------------------------------------------- |
| `[entrypoint] Aplicando migraciones pendientes...`     | Arranque del contenedor                                   |
| `[entrypoint] Migraciones al día. Iniciando la API...` | Migraciones aplicadas; arranca Nest                       |
| `Swagger documentación disponible en /doc`             | La API terminó de arrancar                                |
| `Healthcheck fallido: la base de datos no responde`    | `/health` no llega a PostgreSQL                           |
| `Error al generar Swagger`                             | Falló la generación del OpenAPI; la API sigue funcionando |

Si el contenedor se reinicia en bucle, `docker compose ps` lo muestra como `Restarting` y los
logs dicen por qué (lo más habitual: una migración que falla o una variable del `.env` que falta;
por ejemplo, `JWT_SECRET` con menos de 32 caracteres).

## Logs del proxy

nginx escribe el access log y el error log a la salida estándar del contenedor:

```bash
cd /opt/edge
docker compose logs -f nginx
docker compose logs --tail 200 nginx | grep amzdesk
```

Sirve para ver los códigos que devuelve el proxy (`502`, `403` de Swagger, `401` del manual
técnico) y si una petición llegó siquiera al VPS.

:::info Lo que no llega al VPS
El proxy del proveedor, delante del VPS, puede cortar peticiones antes de que lleguen a `edge`
(por ejemplo, un `403` a IP de centros de datos o un `413` por tamaño). Esas no aparecen en
estos logs.
:::

## Uso de recursos

```bash
docker stats --no-stream          # CPU y memoria por contenedor
df -h /                           # disco
docker system df                  # espacio de imágenes, volúmenes y caché
```

Ver [Recursos](./recursos.md) para los límites del VPS.
