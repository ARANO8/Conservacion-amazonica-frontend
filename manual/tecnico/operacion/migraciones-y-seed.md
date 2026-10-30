---
title: Migraciones y seed en el VPS
sidebar_position: 2
---

# Migraciones y seed en el VPS

## Migraciones: automáticas en cada arranque

El contenedor del backend aplica las migraciones pendientes **cada vez que arranca**, antes de
levantar la API:

```bash title="Conservacion-amazonica-backend/docker-entrypoint.sh"
set -e
echo "[entrypoint] Aplicando migraciones pendientes..."
npx prisma migrate deploy
echo "[entrypoint] Migraciones al día. Iniciando la API..."
exec "$@"
```

- Se usa `migrate deploy`, nunca `migrate dev`: no genera migraciones nuevas, no pide
  confirmación y **falla** en lugar de reescribir el historial si algo no cuadra.
- Con `set -e`, si una migración falla la API no arranca. El contenedor se reinicia
  (`restart: unless-stopped`), vuelve a fallar, y el smoke test del CI termina en rojo con los
  logs a la vista.
- Desplegar una migración es simplemente desplegar el backend: no hay paso aparte.

Ver el estado sin desplegar:

```bash
cd /opt/amzdesk
docker compose exec backend npx prisma migrate status
```

:::warning Migraciones destructivas
Una migración que borra o transforma datos se aplica sola en cuanto llega a `main`. Antes de
publicarla: revisar el SQL, probarla contra una copia de la base y **hacer un respaldo** en el
VPS justo antes de desplegar (ver [Respaldos](./respaldos.md)).
:::

### Si una migración falla en producción

1. Ver el error: `docker compose logs --tail 100 backend`.
2. Ver qué quedó: `docker compose exec backend npx prisma migrate status`. Una migración fallida
   queda marcada y Prisma no aplica más hasta resolverla.
3. Corregir en el código con una **migración nueva** (no editar la que ya se publicó) y volver a
   desplegar; o, si se corrigió a mano en la base, marcarla con
   `npx prisma migrate resolve --applied <nombre>` o `--rolled-back <nombre>`.

:::caution Pendiente de confirmar
No hay un procedimiento documentado para migraciones fallidas en el VPS; los pasos 2 y 3 son los
de Prisma y conviene ensayarlos antes contra una copia.
:::

Volver a una imagen anterior **no deshace** las migraciones ya aplicadas (ver
[Rollback](./rollback.md)).

## Seed: una sola vez, a mano

La base de producción no se siembra en cada despliegue: solo migraciones. El seed se ejecuta a
mano al instalar una base nueva; sin él no hay usuarios y nadie puede entrar.

```bash
cd /opt/amzdesk
docker compose run --rm backend node dist/prisma/seed.js
```

- Se ejecuta el **seed compilado** (`dist/prisma/seed.js`): la imagen no tiene `ts-node` ni
  devDependencies.
- El seed busca sus datos en `seeds/` junto a sí mismo, o sea `dist/prisma/seeds`. Por eso el
  `Dockerfile` copia `prisma/seeds` a esa ruta.
- `docker compose run --rm` crea un contenedor temporal con la misma imagen, red y variables que
  el backend, y lo borra al terminar. Pasa también por el entrypoint, así que antes aplica las
  migraciones pendientes.
- `SEED_PASSWORD` se toma del `.env` del VPS. Si está vacía, el seed genera una contraseña
  distinta por usuario y la **imprime una sola vez** al terminar: hay que guardarlas en ese
  momento y entregarlas por un canal seguro.

El seed es idempotente: volver a ejecutarlo no duplica nada y **no cambia las contraseñas** de
usuarios existentes. Sirve, por ejemplo, para cargar una planilla actualizada
(`prisma/seeds/Usuario.csv`) con altas y cambios de cargo o rol; requiere publicar antes una
imagen que incluya el CSV nuevo. El detalle está en
[Base de datos en desarrollo](../desarrollo/base-de-datos.md#seed).

:::danger Datos de prueba
`seed-test-data.ts` no está en la imagen (lo excluye `.dockerignore`) y nunca se ejecuta en
producción.
:::

## Otros scripts de mantenimiento

`pnpm run maintenance:recalibrar-poa-ejecutado` (backend) recalcula el `montoEjecutado` del POA
a partir de las rendiciones aprobadas. Usa `ts-node`, así que se ejecuta desde una máquina de
desarrollo.

:::caution Pendiente de confirmar
No hay un procedimiento documentado para ejecutarlo contra la base de producción (la base no
publica puertos). Si hiciera falta, definirlo antes y respaldar la base primero.
:::
