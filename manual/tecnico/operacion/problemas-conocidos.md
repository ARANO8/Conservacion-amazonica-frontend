---
title: Problemas conocidos
sidebar_position: 6
---

# Problemas conocidos

Síntomas que ya se vieron, su causa y qué hacer.

## En desarrollo

### "Jest worker encountered 2 child process exceptions" en el frontend

**Síntoma.** Con `pnpm run dev`, las rutas dinámicas (`[id]`) responden `500` y el log del
servidor muestra `Jest worker encountered 2 child process exceptions, exceeding retry limit`,
a veces con `Failed to generate static paths`. Afecta a rutas que antes respondían bien.

**Causa.** Falta de **memoria RAM**, no un error del código. Next arranca un proceso hijo para
las rutas dinámicas; si se muere por memoria, lo reintenta dos veces y después deja de
intentarlo para siempre. El `500` es permanente hasta reiniciar el servidor. El nombre "Jest
worker" viene de la librería de procesos que usa Next, no de tests. El servidor de Next ocupa
por sí solo alrededor de 1,3 GB.

**Solución.**

1. Liberar memoria: cerrar pestañas del navegador y otros `next dev` que estén corriendo.
2. Reiniciar `pnpm run dev`.

No borrar `.next`: parece que lo arregla solo porque obliga a reiniciar, y el primer arranque con
la caché a medio construir puede dejar todas las rutas en `404` hasta un segundo reinicio.

### `/doc-json` responde 404 justo después de arrancar el backend

**Síntoma.** `pnpm run spec:sync` (o abrir `/doc`) devuelve `404` aunque la API ya responde.

**Causa.** Swagger se monta **después** de `app.listen()`, en un `setImmediate`, para no
retrasar el arranque: generar el documento recorre todos los controladores y DTO y es lento. Hay
unos segundos en que la API responde y Swagger todavía no existe.

**Solución.** Esperar a ver `Swagger documentación disponible en /doc` en el log del backend y
volver a intentarlo. Si aparece `Error al generar Swagger`, el problema es otro: un DTO o un
decorador que rompe la generación.

### Los PDF no se generan en local

**Causa habitual.** Puppeteer no encuentra un navegador. Si se instalaron dependencias con
`PUPPETEER_SKIP_DOWNLOAD`, no hay Chromium descargado.

**Solución.** Definir `PUPPETEER_EXECUTABLE_PATH` en el `.env` del backend con la ruta del Chrome
instalado en el sistema, y reiniciar el backend.

### `prisma migrate dev` aborta en una shell no interactiva

Ver la alternativa con `migrate diff` en
[Base de datos en desarrollo](../desarrollo/base-de-datos.md#shell-no-interactiva-agentes-scripts-ci).

### Las pruebas E2E no pueden consultar la base

`e2e/support/entorno.ts` ejecuta `docker exec` sobre el contenedor `amazonica_db`. Con Podman,
`docker` tiene que resolver a Podman. Ver [Pruebas y lint](../desarrollo/pruebas-y-lint.md).

## En producción

### `502 Bad Gateway` después de un despliegue

**Causa más probable.** nginx tiene en caché una IP vieja del contenedor. Cada despliegue recrea
el contenedor con otra IP; si un `proxy_pass` apunta a un nombre fijo en lugar de a una variable,
nginx lo resolvió una vez al arrancar y sigue usando la IP antigua.

**Comprobar.**

- Que `nginx.conf` mantiene `resolver 127.0.0.11 valid=10s ipv6=off;` y que **todos** los
  `proxy_pass` usan una variable (`set $amzdesk_api ...; proxy_pass $amzdesk_api;`). Ver
  [Proxy edge](../despliegue/proxy-edge.md#resolver-1270011).
- Que el contenedor de destino está vivo: `docker compose ps` en `/opt/amzdesk`. Un `502` también
  aparece mientras el backend aplica migraciones o si está reiniciándose en bucle.
- Que el contenedor está en la red `edge`: `docker network inspect edge`.

**Salida de emergencia.** `cd /opt/edge && docker compose exec nginx nginx -s reload` fuerza a
resolver de nuevo. Si con eso se arregla, la causa era el `resolver` o un destino fijo, y hay que
corregir la config para que no vuelva a pasar.

### Los PDF fallan en producción

**Causas posibles.**

- `/dev/shm` insuficiente: comprobar que el compose mantiene `shm_size: 512m` en el backend.
- Falta de memoria al generar varios PDF a la vez (ver [Recursos](./recursos.md)).
- Tiempo de espera: un PDF largo puede acercarse a los 120 s de `proxy_read_timeout`.

**Comprobar.** `docker compose logs --tail 200 backend` alrededor de la hora del fallo. El
servicio cierra el navegador en un `finally` y registra `Error al cerrar el navegador` si no pudo.

### El smoke test del CI falla con 403

Si la comprobación se moviera fuera del VPS, fallaría siempre: el proxy del proveedor responde
`403` a las IP de GitHub Actions. Por eso el smoke test se ejecuta dentro del VPS por SSH (ver
[CI/CD](../despliegue/ci-cd.md#smoke-test-dentro-del-vps)). Un `403` desde el propio VPS, en
cambio, apunta a la config de `edge` (por ejemplo, el bloque de Swagger).

### Bucle de redirecciones en `/amzdesk` (`ERR_TOO_MANY_REDIRECTS`)

**Causa.** nginx y Next normalizando la barra final en sentidos opuestos. Ver
[Proxy edge](../despliegue/proxy-edge.md#el-frontend-amzdesk-sin-barra-final): el bloque
`location /amzdesk` va sin barra y sin redirección propia.

### Usuarios redirigidos de HTTPS a HTTP

**Causa.** Redirecciones absolutas construidas con el esquema interno (`http`). Comprobar que
`edge` mantiene `absolute_redirect off` y el reenvío de `X-Forwarded-Proto`.

### La sesión no se mantiene o se pierde al navegar

- `NODE_ENV=production` activa el flag `Secure` de la cookie: solo viaja por HTTPS. Entrando por
  HTTP (por ejemplo, contra `127.0.0.1`) no hay sesión.
- `COOKIE_PATH` debe ser `/amzdesk`. Con otro valor, la cookie no llegaría a la API, al frontend
  o al manual técnico.

### El manual técnico redirige siempre al login, incluso con sesión

- Comprobar que la cookie llega: la sesión debe haberse iniciado en el mismo dominio, y el
  manual técnico cuelga de `/amzdesk`, dentro del `Path` de la cookie.
- Comprobar `GET /auth/sesion` directamente desde el navegador con sesión:
  `/amzdesk/api/auth/sesion` debe responder `204`.
- Si el backend está caído, `auth_request` devuelve `500`, no la redirección.

Ver [El manual en producción](../despliegue/manual-en-produccion.md).

### El build del frontend falla en el CI por el manual

La configuración del manual tiene `onBrokenLinks: 'throw'`: un enlace roto entre páginas rompe
el build de la imagen del manual. Probar el manual en local antes de publicar (ver
[Este manual](../desarrollo/manual.md)).
