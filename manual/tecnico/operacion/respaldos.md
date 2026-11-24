---
title: Respaldos
sidebar_position: 3
---

# Respaldos

La base de producción vive en el volumen `db_data` del stack `amzdesk`, dentro del VPS. Los
comprobantes de gastos no se guardan en el sistema (son enlaces externos), así que **la base es
lo único que hay que respaldar**.

## Respaldo puntual (documentado)

`deploy/README.md` documenta un volcado con `pg_dump` desde el contenedor de la base. Para no
escribir credenciales en la línea de comandos, se usan las variables que el propio contenedor ya
tiene:

```bash
cd /opt/amzdesk
docker compose exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB"' \
  > ~/respaldo-amzdesk-$(date +%F).sql
```

`-T` evita que Docker asigne una terminal, que podría colar caracteres en el archivo.

Cuándo hacerlo como mínimo:

- Antes de desplegar una migración que borra o transforma datos.
- Antes de tocar la base a mano.
- Antes de ejecutar un script de mantenimiento contra producción.

## Procedimiento recomendado

:::caution Recomendación, no implementado
Lo que sigue **no está configurado** en el VPS ni documentado en los repos. Es el procedimiento
recomendado; si se adopta, hay que documentarlo en `deploy/README.md` y quitar este aviso.
:::

### Respaldo diario comprimido

Formato personalizado de `pg_dump` (`-Fc`): comprimido y restaurable por tablas con
`pg_restore`.

```bash title="/opt/amzdesk/respaldar.sh (propuesto)"
#!/bin/sh
set -e
cd /opt/amzdesk
DESTINO=/opt/respaldos/amzdesk
mkdir -p "$DESTINO"
docker compose exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' \
  > "$DESTINO/amzdesk-$(date +%F).dump"
# Conservar 14 días
find "$DESTINO" -name 'amzdesk-*.dump' -mtime +14 -delete
```

Programado con cron del host, fuera del horario de uso:

```bash
# crontab -e
30 3 * * * /opt/amzdesk/respaldar.sh >> /var/log/amzdesk-respaldo.log 2>&1
```

### Copia fuera del VPS

Un respaldo que vive en el mismo disco no protege de la pérdida del VPS. Copiar los `.dump`
periódicamente a otro sitio (otra máquina, almacenamiento de la organización), cifrados si salen
de la infraestructura de ACEAA: contienen datos personales del personal y datos financieros.

### Restaurar

Probar la restauración de vez en cuando, en local o en un contenedor aparte, nunca directamente
sobre producción:

```bash
# Contenedor temporal de prueba (en una máquina de desarrollo)
docker run -d --name restaurar -e POSTGRES_PASSWORD=<temporal> postgres:15-alpine
docker cp amzdesk-AAAA-MM-DD.dump restaurar:/tmp/r.dump
docker exec restaurar createdb -U postgres amzdesk
docker exec restaurar pg_restore -U postgres -d amzdesk --no-owner /tmp/r.dump
```

Para restaurar en producción (pérdida de datos, último recurso):

1. Detener la API para que nadie escriba: `docker compose stop backend frontend`.
2. Hacer un respaldo del estado actual, aunque esté dañado.
3. Restaurar con `pg_restore --clean --if-exists --no-owner` dentro del contenedor `db`.
4. Arrancar de nuevo: `docker compose up -d`. El entrypoint aplicará las migraciones que falten
   si el respaldo es anterior a alguna.

## Datos que no están en la base

- `/opt/amzdesk/.env`: no se puede regenerar sin perder las sesiones (`JWT_SECRET`) y el acceso
  a la base (`POSTGRES_PASSWORD`). Guardar una copia en un gestor de secretos, no junto a los
  respaldos de la base.
- `/opt/edge/`: se reconstruye desde `deploy/edge/` del repo del backend.
