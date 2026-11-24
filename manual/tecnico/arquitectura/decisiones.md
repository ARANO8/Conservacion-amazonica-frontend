---
title: Decisiones de diseño
sidebar_position: 4
---

# Decisiones de diseño

Decisiones que condicionan cualquier cambio. Cada una indica dónde se ve en el código.

## Una sola entidad `Solicitud` para viajes y compras

`Solicitud.tipo` (`TipoSolicitud`: `VIAJE` | `COMPRA_SERVICIO`) distingue los dos trámites. El
manual de procedimientos de ACEAA los trata como el mismo procedimiento de fondos en avance, con
el mismo circuito de firmas y la misma rendición (ANEXO 4). Cambia el cuerpo del formulario
(ANEXO 2 frente a ANEXO 3) y algunas reglas: por ejemplo, el desembolso de un viaje exige que el
Director de Programa la haya derivado a Dirección Financiera (`solicitudes.service.ts`,
`desembolsar`).

## La autorización real vive en el backend

El frontend no tiene `middleware.ts` ni guard de rutas en el servidor. Oculta menús según el rol
(`components/layout/app-sidebar.tsx`), pero quien decide es el backend con `@Roles()` y con
comprobaciones de propiedad dentro de los servicios (por ejemplo, "solo el emisor puede
editar"). Ninguna regla de negocio cuenta como aplicada si solo está en la interfaz.

## JWT en cookie httpOnly

El login responde con la cookie `access_token` (httpOnly, `sameSite: lax`, `secure` en
producción, `path` configurable con `COOKIE_PATH`). El JavaScript del navegador no puede leer el
token. La cookie se acota a `/amzdesk` en producción porque el dominio aloja otros sistemas. Ver
[Autenticación y autorización](../backend/autenticacion.md).

## Mismo origen para frontend y API

La API se publica en `/amzdesk/api` del mismo dominio y `NEXT_PUBLIC_API_URL` es una ruta
relativa. La misma imagen del frontend sirve en cualquier dominio sin reconstruirse, y la cookie
viaja sin trucos de CORS entre dominios.

## Dinero con `Prisma.Decimal`

Todos los importes son `Decimal @db.Decimal(10,2)` o `(12,2)` y se operan con `.plus()`,
`.times()`, `.div()`, con redondeo a 2 decimales. Los impuestos se calculan por factor de
grossing-up, no como porcentaje plano. Ver [Impuestos y retenciones](../datos/impuestos.md).

## Borrado lógico

Las entidades principales tienen `deletedAt`. Eliminar es poner la fecha; las lecturas filtran
`deletedAt: null`. Un documento contable eliminado sigue siendo auditable. Ver
[Convenciones de datos](../datos/convenciones.md).

## `observar` no es rechazar

Observar devuelve el documento a su autor para que corrija y reenvíe. El objeto vuelve al flujo.
Solo la rendición tiene un `RECHAZADO` en su enum, y hoy ningún servicio lo asigna. Ver
[Máquinas de estado](../datos/maquinas-de-estado.md).

## Notificaciones por llamada directa

No hay bus de eventos. Los servicios que necesitan avisar inyectan `NotificacionesService` y
llaman a `crearNotificacion(...)` después de su transacción. El frontend consulta las
notificaciones por polling cada 60 segundos (`hooks/use-notificaciones-polling.ts`).

## Un documento, dos salidas: HTML y PDF

Cada servicio arma los datos de su documento una sola vez (`documentoPdf(plantilla, datos)`) y de
ahí salen el PDF (Puppeteer) y la vista HTML que muestra el frontend. Así no pueden divergir. Ver
[Generación de documentos](../documentos/generacion.md).

## Comprobantes como enlaces

El sistema no almacena archivos: comprobantes y respaldos son URLs (normalmente de Google Drive)
que el usuario pega. Por eso `client_max_body_size` es de 10 MB y no hay almacenamiento de
objetos.

## Lógica fiscal duplicada a propósito

El frontend replica los cálculos del backend para mostrar montos mientras el usuario escribe:

| Backend                                                                          | Frontend                       |
| -------------------------------------------------------------------------------- | ------------------------------ |
| `src/solicitudes/solicitudes.helper.ts`, `src/rendiciones/rendiciones.helper.ts` | `lib/tax-calculator.ts`        |
| `src/liquidaciones-viaticos/liquidacion.helper.ts`                               | `lib/liquidacion-viaticos.ts`  |
| `src/declaraciones-movilidad/declaraciones-movilidad.helper.ts`                  | `lib/declaracion-movilidad.ts` |

El servidor siempre recalcula y su resultado es el que vale. Nada obliga a mantener ambos lados
sincronizados: **si cambia uno, hay que cambiar el otro**.

## Volumen bajo, corrección alta

Son 64 usuarios y decenas de operaciones al mes. Se prefiere simplicidad y trazabilidad a
rendimiento: un Chromium por PDF, polling en vez de WebSockets, cálculos al vuelo del saldo del
POA en lugar de columnas materializadas.
