---
title: Base de datos en desarrollo
sidebar_position: 2
---

# Base de datos en desarrollo

Migraciones, cliente de Prisma, ERD y datos iniciales. Todo se ejecuta en
`Conservacion-amazonica-backend/`. El backend usa Prisma 5.21 y el schema vive en
`prisma/schema.prisma`.

## Migraciones

Las migraciones están en `prisma/migrations/`, una carpeta por cambio, con el formato
`AAAAMMDDHHMMSS_nombre_en_snake_case` (por ejemplo `20261027120000_sede_usuario`). Cada carpeta
tiene un `migration.sql`. Las migraciones ya publicadas no se editan: un cambio nuevo es una
migración nueva.

### Flujo normal (terminal interactiva)

```bash
# 1. Editar prisma/schema.prisma
# 2. Crear y aplicar la migración
npx prisma migrate dev --name nombre_del_cambio
# 3. Regenerar el cliente (migrate dev ya lo hace, pero no está de más)
npx prisma generate
```

### Shell no interactiva (agentes, scripts, CI)

`prisma migrate dev` necesita una terminal interactiva: en una shell no interactiva aborta,
**incluso con `--create-only`**. La alternativa es escribir el SQL con `migrate diff` y
aplicarlo con `migrate deploy`, que nunca pregunta:

```bash
# 1. Crear la carpeta de la migración
mkdir prisma/migrations/20261030120000_nombre_del_cambio

# 2. Generar el SQL: diferencia entre la base actual y el schema editado
npx prisma migrate diff \
  --from-schema-datasource prisma/schema.prisma \
  --to-schema-datamodel prisma/schema.prisma \
  --script \
  --output prisma/migrations/20261030120000_nombre_del_cambio/migration.sql

# 3. Revisar el SQL a mano (renombres, datos existentes, backfill)

# 4. Aplicarla y regenerar el cliente
npx prisma migrate deploy
npx prisma generate
```

:::warning Revisar siempre el SQL
`migrate diff` no distingue un renombre de un "borrar y crear": genera `DROP COLUMN` +
`ADD COLUMN` y se pierden los datos. Si el cambio renombra o transforma columnas con datos, hay
que editar `migration.sql` a mano (por ejemplo, `ALTER TABLE ... RENAME COLUMN` o un `UPDATE` de
backfill) antes de aplicarla.
:::

:::info Usar `--output` y no `>`
En Windows PowerShell 5, redirigir con `>` escribe el archivo en UTF-16 y Prisma no lo lee
bien. `--output` escribe el archivo directamente, en UTF-8, en cualquier shell.
:::

En producción las migraciones se aplican solas al arrancar el contenedor (ver
[Migraciones y seed en el VPS](../operacion/migraciones-y-seed.md)).

## Cliente de Prisma

```bash
npx prisma generate
```

Hace falta después de cada cambio del schema y después de un `pnpm install` limpio. Si el
editor marca tipos de Prisma que no existen, casi siempre es que falta este paso.

El schema declara **dos generadores**:

```prisma title="prisma/schema.prisma (extracto)"
generator client {
  provider = "prisma-client-js"
}

generator erd {
  provider = "prisma-erd-generator"
  output   = "../ERD.md"
}
```

- `client` genera el cliente que usa la aplicación.
- `erd` regenera `ERD.md`, el diagrama entidad-relación en Mermaid. Arrastra
  `@mermaid-js/mermaid-cli` y su propio Chromium, por eso es lento.

Para generar solo el cliente (es lo que hacen el CI y el `Dockerfile`):

```bash
npx prisma generate --generator client
```

## ERD

`ERD.md` está **autogenerado**: no se edita a mano. Se regenera con un `npx prisma generate`
completo (sin `--generator client`) y se commitea junto con el cambio del schema.

## Seed

El seed principal es `prisma/seed.ts`. Está registrado en el `package.json`:

```json title="package.json (extracto)"
"prisma": {
  "seed": "npx ts-node prisma/seed.ts"
}
```

```bash
npx prisma db seed
```

### Qué siembra

Lee los archivos de `prisma/seeds/`:

| Archivo                | Qué carga                                                                                                                                 |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `Usuario.csv`          | Usuarios: nombre, email, cargo, rol, C.I. y sede, desde la planilla de personal (spec 024)                                                |
| `cuentasBancarias.csv` | Cuentas bancarias                                                                                                                         |
| `Concepto.csv`         | Conceptos de viático                                                                                                                      |
| `TipoGasto.csv`        | Tipos de gasto                                                                                                                            |
| `POA.csv`              | POA: proyectos, grupos, partidas, actividades, códigos presupuestarios y estructuras programáticas. Se lee en `latin1`; el resto en UTF-8 |
| `plan-de-cuentas.json` | Plan de cuentas (`PartidaContable`), jerárquico                                                                                           |

:::danger Datos personales
`Usuario.csv` contiene datos reales de la planilla (nombres, C.I.). No se copia a otros sitios,
no se pega en issues ni en este manual.
:::

### Contraseñas: `SEED_PASSWORD`

- Si `SEED_PASSWORD` está definida, todos los usuarios **nuevos** reciben esa contraseña. Es lo
  cómodo en desarrollo.
- Si no está definida, cada usuario nuevo recibe una contraseña aleatoria distinta. El seed las
  imprime **una sola vez** al terminar, bajo "Credenciales generadas". Hay que guardarlas en ese
  momento.

### Idempotencia

El seed se puede ejecutar varias veces sin duplicar datos:

- Los catálogos usan `upsert` o buscan antes de crear.
- Un usuario que ya existe (mismo email) se actualiza: nombre, cargo y rol, y C.I. y sede solo
  si el CSV trae valor (un campo vacío no pisa lo que un ADMIN cargó a mano).
- **La contraseña de un usuario existente nunca se reescribe.** Volver a sembrar con otra
  `SEED_PASSWORD` no cambia las contraseñas ya creadas.

Por eso el seed sirve también para actualizar cargos y roles desde una planilla nueva.

### Datos de prueba: `seed-test-data.ts`

`prisma/seed-test-data.ts` crea un juego de datos ficticio para probar los PDF y los flujos:
una solicitud de viaje `PENDIENTE` (`SOL-2026-TEST-001`) con su plan de viaje y viáticos, otra
`DESEMBOLSADO` (`SOL-2026-TEST-002`) con su rendición, una solicitud de compra desembolsada,
cotizaciones, un cuadro comparativo y una orden de compra. Al terminar imprime un resumen y los
endpoints de PDF para probar. Lo usa también el script de capturas del manual (spec 026).

```bash
npx ts-node prisma/seed-test-data.ts
```

- Necesita el seed principal antes: busca usuarios concretos de `Usuario.csv`, un POA `ACTIVO`
  y catálogos, y falla con un mensaje claro si faltan.
- **No es idempotente**: crea registros con `codigoSolicitud` fijo, que es único. Una segunda
  ejecución falla. Para repetirlo hay que limpiar antes esos registros o partir de una base
  nueva.
- No viaja en la imagen de producción (está en `.dockerignore`), así que no se puede ejecutar
  en el VPS por accidente.

:::caution Pendiente de confirmar
No hay un script de `package.json` para `seed-test-data.ts`; el comando de arriba sale del
`prisma.seed` del principal. Confirmar que es la forma en que se ejecuta.
:::

Otros scripts sueltos de `prisma/` (`check-data.ts`, `create_test_solicitud.ts`,
`reset_passwords.ts`, `_check-rendicion*.ts`) son utilidades locales de diagnóstico; tampoco
entran en la imagen.

## Empezar de cero

Para recrear la base local desde cero (borra **todos** los datos locales):

```bash
npx prisma migrate reset        # interactivo: pide confirmación; aplica todo y ejecuta el seed
```

En una shell no interactiva se puede añadir `--force`. Nunca contra una base que no sea la
local.
