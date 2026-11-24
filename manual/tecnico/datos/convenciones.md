---
title: Convenciones de datos
sidebar_position: 2
---

# Convenciones de datos

## Dinero: `Prisma.Decimal`

Todo importe es `Decimal` en Prisma y `numeric` en PostgreSQL:

| Precisión                      | Dónde                                                                                        |
| ------------------------------ | -------------------------------------------------------------------------------------------- |
| `@db.Decimal(10, 2)`           | La mayoría: solicitud, viáticos, gastos, hospedaje, rendición, POA, cotización, liquidación  |
| `@db.Decimal(12, 2)`           | Cuadro comparativo, orden de compra (`total`), declaración de movilidad                      |
| `@db.Decimal(5, 2)` / `(5, 1)` | No son dinero: días (`Viatico.dias`, `Planificacion.diasCalculados`, `FilaLiquidacion.dias`) |

Reglas:

- En el backend, operar siempre con métodos de `Decimal` (`.plus()`, `.add()`, `.sub()`,
  `.times()`, `.mul()`, `.div()`, `.gt()`), nunca con `+`, `*` o `Number(...)`.
- Redondear a 2 decimales con `toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP)`. Cada helper
  fiscal tiene su `redondear()` o `round2()`.
- Al repartir un total entre varios impuestos, **el último componente se calcula por resta** para
  absorber el redondeo y que la suma cierre exacta.

```ts title="src/solicitudes/solicitudes.helper.ts"
iue = redondear(totalTax.mul(5).div(8));
it = redondear(totalTax.sub(iue)); // Para evitar errores de redondeo
```

:::warning
Hay puntos donde el valor sale como `number`:

- `poa.service.ts` expone `saldoDisponible` y `montoComprometido` con `.toNumber()`.
- Los builders de documentos y algunos mensajes de error formatean con `Number(...)` o
  `.toNumber()`.
- El frontend calcula con `number` en sus espejos fiscales.

Son lecturas para mostrar. Las decisiones (saldo al crear la solicitud, techo al aprobar la
rendición) se toman con `Decimal` dentro de la transacción.
:::

## Borrado lógico: `deletedAt`

16 de los 42 modelos tienen `deletedAt DateTime?`:

`Usuario`, `Proyecto`, `Grupo`, `Partida`, `PartidaContable`, `Poa`, `Solicitud`, `Rendicion`,
`PlanViaje`, `InformeViaje`, `LiquidacionViaticos`, `DeclaracionMovilidad`, `GastoCompra`,
`Cotizacion`, `CuadroComparativo`, `OrdenCompra`.

Los demás (filas, detalles, tablas puente, historial, notificaciones) dependen de un padre que sí lo
tiene, o se reemplazan enteros al editar.

Reglas:

- Eliminar es `update({ data: { deletedAt: new Date() } })`. No hay `delete` físico de entidades
  principales.
- Toda lectura filtra `where: { deletedAt: null }`, también en las relaciones anidadas
  (`gastosCompra: { where: { deletedAt: null } }`) y en los agregados
  (`solicitud: { deletedAt: null, estado: { in: ESTADOS_COMPROMISO_ACTIVO } }`).
- Los modelos más consultados tienen `@@index([deletedAt])`.
- `Solicitud` y `Poa` tienen `restore`. Una solicitud eliminada **conserva su plan de viaje** hasta
  que otra lo toma, para que `restore` pueda recuperarlo.
- Un usuario con `deletedAt` no puede autenticarse.

:::info
Algunas relaciones usan `onDelete: Cascade` (gastos de rendición, personas externas, cuotas). Solo
se activan con un borrado físico, que la aplicación no hace; son una red de seguridad para
scripts de mantenimiento.
:::

## Enums

- Se definen en `schema.prisma` y se importan de `@prisma/client`
  (`import { EstadoSolicitud } from '@prisma/client'`).
- Valores en `SCREAMING_SNAKE_CASE`: `EstadoSolicitud.EN_EJECUCION`, `Rol.VALIDADOR_COMPRAS`.
- Nombres de dominio en español, sin traducir.
- En el frontend se replican como uniones de literales con los mismos valores.
- Agregar un valor a un enum es una migración de PostgreSQL (`ALTER TYPE ... ADD VALUE`).

## Nombres

- Modelos en `PascalCase`, campos en `camelCase`.
- **No hay `@map` ni `@@map`** en el schema: las tablas y columnas de PostgreSQL se llaman igual
  que en Prisma (`"Solicitud"."montoTotalNeto"`). Al consultar con `psql` hay que entrecomillar
  los identificadores.

## Formas de consulta reutilizables

Los `include` y `select` que se repiten viven como constantes tipadas con `satisfies` en el
`*.constants.ts` del módulo:

```ts title="src/informes-viaje/informes-viaje.constants.ts"
export const INFORME_VIAJE_INCLUDE = {
  usuario: { select: USER_SAFE_SELECT },
  directorPrograma: { select: USER_SAFE_SELECT },
  // ...
} satisfies Prisma.InformeViajeInclude;

export type InformeViajeCompleto = Prisma.InformeViajeGetPayload<{
  include: typeof INFORME_VIAJE_INCLUDE;
}>;
```

`USER_SAFE_SELECT` (`solicitudes.constants.ts`) es el `select` de usuario sin contraseña. Usarlo
siempre que se incluya un usuario.

## Migraciones

- Viven en `prisma/migrations/` con nombre `AAAAMMDDHHMMSS_descripcion`.
- En desarrollo: `npx prisma migrate dev --name descripcion`, que además regenera el cliente.
- En producción el contenedor aplica `npx prisma migrate deploy` en cada arranque
  (`docker-entrypoint.sh`).

### `ERD.md`

`ERD.md`, en la raíz del backend, lo genera `prisma-erd-generator` (bloque `generator erd` del
schema) cada vez que corre `prisma generate`. **No se edita a mano**: se regenera.
