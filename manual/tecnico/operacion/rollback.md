---
title: Rollback
sidebar_position: 5
---

# Rollback

Cada despliegue publica en GHCR una etiqueta **inmutable** `sha-<commit>`, y esas etiquetas no
se borran. Volver atrás es apuntar el `.env` del VPS a una etiqueta anterior y recrear el
servicio. No hace falta reconstruir nada.

## Procedimiento

1. **Elegir el commit** al que volver: el último que funcionaba, en el historial de `main` del
   repo afectado o en la pestaña **Actions** de GitHub (cada ejecución verde corresponde a una
   imagen publicada). La etiqueta es `sha-` seguido del hash **completo** del commit.

2. **Apuntar el `.env`** a esa imagen. Para el backend:

   ```bash
   cd /opt/amzdesk
   grep '^BACKEND_IMAGE=' .env          # anotar la imagen actual, por si hay que volver
   sed -i 's|^BACKEND_IMAGE=.*|BACKEND_IMAGE=ghcr.io/<propietario>/<repo-backend>:sha-<commit-anterior>|' .env
   ```

   Para el frontend, lo mismo con `FRONTEND_IMAGE`; para el manual, con `MANUAL_IMAGE`. El nombre
   de la imagen es el que ya figura en el `.env`: solo cambia la etiqueta.

3. **Recrear el servicio:**

   ```bash
   docker compose pull backend
   docker compose up -d backend
   ```

4. **Comprobar:**

   ```bash
   docker compose ps
   curl -fsS http://127.0.0.1/amzdesk/api/health
   curl -sL -o /dev/null -w '%{http_code}\n' http://127.0.0.1/amzdesk
   ```

## Lo que el rollback no deshace

:::danger Las migraciones no vuelven atrás
Volver a una imagen anterior del backend **no revierte las migraciones** ya aplicadas: Prisma no
tiene "migrate down". La imagen anterior arrancará contra un schema más nuevo que el suyo.

- Si la migración solo **añadió** (tablas, columnas opcionales, valores de enum), la versión
  anterior suele funcionar: ignora lo que no conoce.
- Si **borró, renombró o hizo obligatoria** una columna que la versión anterior usa, la versión
  anterior fallará. En ese caso, la salida es avanzar: una migración nueva y un despliegue nuevo,
  o restaurar el respaldo previo al despliegue (ver [Respaldos](./respaldos.md)).
  :::

- **El próximo push a `main` pisa el rollback.** El CI reescribe la línea de la imagen con el
  commit nuevo. Si el fallo sigue en `main`, hay que revertirlo allí también (`git revert` del
  commit problemático y push), o el siguiente despliegue lo volverá a publicar.
- Backend y frontend se despliegan por separado. Si un cambio tocó los dos, puede hacer falta
  volver atrás en ambos para que sigan siendo compatibles.
- La configuración de `edge` no tiene versiones en GHCR. Para volver atrás, se copia la versión
  anterior de `deploy/edge/nginx.conf` desde git, se valida con `nginx -t` y se recarga (ver
  [Proxy edge](../despliegue/proxy-edge.md#cambiar-la-configuración)).

## Relanzar un despliegue

Si el fallo fue del CI y no del código (por ejemplo, un corte de red durante el `deploy`), se
puede relanzar el workflow desde **Actions**, con **Re-run jobs**, o con **Run workflow**
(`workflow_dispatch`) sobre `main`.
