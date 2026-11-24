---
title: Infraestructura común
sidebar_position: 2
---

# Infraestructura común

Lo que comparten todos los módulos: el arranque en `main.ts`, Prisma, los filtros de excepción y
las constantes.

## Arranque (`src/main.ts`)

En orden:

1. `trust proxy = 1` si `NODE_ENV=production`. Sin esto Express vería la IP del nginx en todas
   las peticiones y el rate limiting tendría un solo cubo para todos los usuarios.
2. `helmet` con `contentSecurityPolicy: false` (la API no sirve HTML de aplicación y así no se
   rompe Swagger) y `crossOriginResourcePolicy: 'cross-origin'`.
3. `cookie-parser`, necesario para leer el JWT de la cookie.
4. CORS: `origin = FRONTEND_URL` (por defecto `http://localhost:4200`), `credentials: true`.
5. `ValidationPipe` global. Ver [Validación y errores](./validacion-y-errores.md).
6. Filtros globales `AllExceptionsFilter` y `PrismaClientExceptionFilter`.
7. `app.listen(PORT)` (por defecto `3000`).
8. Swagger se genera **después** de levantar el servidor, en un `setImmediate`, porque la
   introspección de todos los DTOs es lenta. Queda en `/doc` (JSON en `/doc-json`).

:::warning
Swagger se monta siempre, sin mirar `NODE_ENV`. En producción lo cierra el nginx edge
(`location /amzdesk/api/doc` con `deny all`). Si cambia el proxy, revisar esto.
:::

## Configuración y throttling (`src/app.module.ts`)

- `ConfigModule.forRoot({ isGlobal: true })`.
- `ThrottlerModule` con un solo límite, leído de `THROTTLE_TTL_MS` y `THROTTLE_LIMIT`. Si faltan o
  no son enteros positivos, cae en **10 peticiones por 60 segundos**. En producción
  `docker-compose.prod.yml` pone `100` por defecto.
- `ThrottlerGuard` registrado como `APP_GUARD`: aplica a **todos** los endpoints.

Excepciones al límite global:

| Dónde                                                  | Decorador                 | Motivo                                           |
| ------------------------------------------------------ | ------------------------- | ------------------------------------------------ |
| `POST /auth/login`                                     | `@Throttle` 5 por minuto  | Fuerza bruta de contraseñas                      |
| `GET /catalogos/partidas-contables/search`             | `@Throttle` 60 por minuto | Autocompletado                                   |
| `HealthController` completo                            | `@SkipThrottle()`         | Healthcheck de Docker y smoke test               |
| `GET /auth/sesion`                                     | `@SkipThrottle()`         | nginx lo llama en cada página del manual técnico |
| Todos los `GET .../pdf` y `GET /rendiciones/:id/excel` | `@SkipThrottle()`         | Descargas de documentos                          |

:::tip
En desarrollo, con el valor por defecto de 10 por minuto, una pantalla con muchos catálogos puede
recibir 429. Definir `THROTTLE_LIMIT` en el `.env` local.
:::

## PrismaModule

```ts title="src/prisma/prisma.module.ts"
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

`PrismaService` extiende `PrismaClient` y conecta en `onModuleInit`. Al ser `@Global()`, basta con
inyectarlo en el constructor. Varios módulos lo siguen poniendo en `imports`: es redundante pero
inofensivo.

Patrones de uso:

- Escrituras de varias tablas dentro de `this.prisma.$transaction(async (tx) => { ... })`. Los
  helpers que participan reciben `tx` (por ejemplo `recalcularTotales(solicitudId, tx)`).
- Formas de consulta reutilizables como constantes tipadas con `satisfies`:
  `SOLICITUD_INCLUDE` y `USER_SAFE_SELECT` en `solicitudes.constants.ts`,
  `INFORME_VIAJE_INCLUDE`, `LIQUIDACION_INCLUDE`, `PLAN_VIAJE_INCLUDE`, `CUADRO_INCLUDE`,
  `ORDEN_INCLUDE`, `COTIZACION_INCLUDE`.
- `USER_SAFE_SELECT` existe para no devolver nunca el hash de la contraseña al incluir usuarios.
- Los códigos correlativos (`generarCodigo(tx)`) se calculan dentro de la transacción para
  evitar choques de `@unique`.

## Filtros de excepción (`src/common/filters/`)

Se registran en `main.ts` así:

```ts title="src/main.ts"
app.useGlobalFilters(
  new AllExceptionsFilter(),
  new PrismaClientExceptionFilter(httpAdapterHost)
);
```

NestJS prueba primero el **último** registrado. Un `PrismaClientKnownRequestError` lo atiende
`PrismaClientExceptionFilter`; todo lo demás cae en `AllExceptionsFilter`. El detalle de cada uno
está en [Validación y errores](./validacion-y-errores.md).

## Constantes (`src/common/constants/`)

### `financial.constants.ts`

| Constante                                | Valor o contenido                           | Uso                                                     |
| ---------------------------------------- | ------------------------------------------- | ------------------------------------------------------- |
| `IVA_RATE`, `IT_RATE`, `IUE_COMPRA_RATE` | 0,13 / 0,03 / 0,05                          | Declaradas; los helpers usan hoy literales equivalentes |
| `RETENCION_MOVILIDAD_RATE`               | 0,16                                        | Pie del ANEXO 6                                         |
| `FACTOR_MOVILIDAD`                       | 0,84                                        | Grossing-up del ANEXO 6                                 |
| `FACTOR_RETENCION_VIATICOS`              | 0,87                                        | Grossing-up de viáticos (RC-IVA 13 %)                   |
| `TIPO_CAMBIO_USD_BOB`                    | 6,96                                        | Tarifas de viático en USD; `tarifaEnBolivianos()`       |
| `DESTINATARIO_ANEXOS`                    | Nombre del Director Ejecutivo               | Campo "A:" de los anexos y firma "Aprobado por"         |
| `CARGO_DIRECTOR_EJECUTIVO`               | `'DIRECTOR EJECUTIVO'`                      | Cargo bajo esa firma                                    |
| `MONEDA_DEFAULT`, `LOCALE_DEFAULT`       | `'Bs'`, `'es-BO'`                           | Formato                                                 |
| `ESTADOS_COMPROMISO_ACTIVO`              | `PENDIENTE`, `DESEMBOLSADO`, `EN_EJECUCION` | Estados de solicitud que comprometen presupuesto        |

Ver [Impuestos y retenciones](../datos/impuestos.md) y [Firmas](../documentos/firmas.md).

### `sede.constants.ts`

`etiquetaSede(sede)` convierte el enum `Sede` en el texto del "Lugar de emisión" ("La Paz",
"Trinidad", "Cobija") y cae en `'La Paz'` si el usuario no tiene sede.

## Logs

Cada servicio usa `new Logger(NombreServicio.name)`. No hay configuración de transporte: los logs
salen por la salida estándar del contenedor.
