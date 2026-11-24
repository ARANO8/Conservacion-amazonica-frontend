---
title: Recursos del VPS
sidebar_position: 4
---

# Recursos del VPS

El VPS tiene **2 GB de RAM** y aloja el proxy `edge`, la aplicación completa (base, API,
frontend, manual) y los otros sistemas del dominio. Varias decisiones de configuración salen de
ese límite.

## Memoria

| Pieza                            | Decisión                                                                                  | Motivo                                                                                                                                |
| -------------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Backend, `shm_size: 512m`        | `/dev/shm` de 512 MB                                                                      | Docker asigna 64 MB por defecto y Chromium se cae con eso; se lanza un navegador por cada PDF. 1 GB sería excesivo para 2 GB en total |
| Backend, Chromium por PDF        | Se abre un navegador por documento y se cierra en un `finally` (`src/pdf/pdf.service.ts`) | Sin un navegador residente ocupando memoria entre PDF; a cambio, generar muchos PDF a la vez dispara el consumo                       |
| Backend, `tini`                  | Init como PID 1                                                                           | Recoge los procesos de Chromium; sin él quedan zombis y acumulan memoria                                                              |
| Frontend, `output: 'standalone'` | Servidor autocontenido de Next                                                            | Imagen y proceso más livianos                                                                                                         |
| Frontend, `images.unoptimized`   | Sin optimizador de imágenes                                                               | Ahorra CPU y memoria                                                                                                                  |
| Manual, `nginx:alpine`           | Estático                                                                                  | Unos pocos MB                                                                                                                         |

Los contenedores no tienen límites de memoria (`mem_limit`) en el compose: si el sistema se queda
sin memoria, el kernel mata el proceso que más consume, normalmente Chromium o Node.

:::tip Señales de falta de memoria
PDF que fallan de forma intermitente, contenedores que se reinician solos o un `502` puntual.
Revisar con `docker stats --no-stream` y `free -m`, y `dmesg | grep -i oom` para ver si el kernel
mató algún proceso.
:::

## Disco

- La imagen del backend pesa alrededor de 1,7 GB, casi todo por Chromium.
- Cada despliegue deja la imagen anterior sin uso; el job `deploy` ejecuta
  `docker image prune -f` para borrarla. Las imágenes anteriores siguen en GHCR, así que se pueden
  recuperar para un rollback.
- Los logs de los contenedores los gestiona Docker. Si crecen demasiado, revisar
  `docker system df` y la configuración de rotación del daemon de Docker.

```bash
df -h /
docker system df
```

## CPU y rate limiting

- `proxy_read_timeout 120s` en `edge` para la API, porque un PDF puede pasar del minuto.
- Rate limiting global de la API: `THROTTLE_LIMIT` peticiones por `THROTTLE_TTL_MS` y por IP. El
  valor por defecto del código (10 por minuto) es de desarrollo; el compose de producción usa 100
  por defecto. `/health` y `/auth/sesion` están excluidos.

El throttler identifica al cliente por IP. En producción, `src/main.ts` activa
`app.set('trust proxy', 1)` para leer la IP real de `X-Forwarded-For` en lugar de la del proxy.

:::caution Pendiente de confirmar
`trust proxy` vale `1`: confía en un solo salto, el nginx de `edge`. Pero delante hay **dos**
proxies (el del proveedor y `edge`). Si el del proveedor no es transparente, la IP que ve la API
podría ser la de ese proxy para todos los usuarios, que compartirían un único cupo. Confirmar con
los logs (`X-Forwarded-For` que llega a `edge`) y, si es el caso, valorar `trust proxy` en `2`.
:::
