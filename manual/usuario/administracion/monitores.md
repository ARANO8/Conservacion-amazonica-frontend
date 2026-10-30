---
title: Monitores
sidebar_position: 6
---

# Monitores

Los monitores son vistas globales, **solo de lectura**, de todas las solicitudes y todas las
rendiciones del sistema. Sirven para seguir el trabajo pendiente sin depender de la bandeja.

**Quién los ve:** `ADMIN`, `EJECUTIVO`, `CONTADOR` y `TESORERO`. Están en el panel lateral
bajo **Monitores**. Si otro rol abre la dirección, la aplicación lo devuelve a **Inicio**.

## Monitor de Solicitudes

**Monitores > Solicitudes**. Una fila por solicitud, de viaje o de compra.

| Columna             | Qué muestra                                                            |
| ------------------- | ---------------------------------------------------------------------- |
| **Código**          | El código de la solicitud                                              |
| **Solicitante**     | Quién la emitió                                                        |
| **Motivo**          | El motivo del viaje o de la compra                                     |
| **Fecha**           | Fecha de la solicitud                                                  |
| **Aprobador**       | Quién la tiene en su bandeja ahora                                     |
| **Estado**          | `PENDIENTE`, `OBSERVADO`, `DESEMBOLSADO`, `EN_EJECUCION` o `EJECUTADO` |
| **Cód. Desembolso** | El código que registró Dirección Financiera                            |
| **Descargar**       | El PDF de la solicitud                                                 |

Filtros: **Filtrar por solicitante...**, **Filtrar por Código...**, **Filtrar por estado...** y
**Filtrar por Partida...**. Con **Ver Detalle** abres la solicitud completa.

![Monitor de Solicitudes con los filtros y la columna Aprobador](/img/capturas/admin-monitor-solicitudes.png)

## Monitor de Rendiciones

**Monitores > Rendiciones**. Una fila por rendición.

| Columna            | Qué muestra                                  |
| ------------------ | -------------------------------------------- |
| **Código / ID**    | El código de la solicitud rendida            |
| **Emisor**         | Quién rinde                                  |
| **Fecha**          | Fecha de la rendición                        |
| **Monto Recibido** | Lo desembolsado                              |
| **Saldo Líquido**  | La diferencia entre lo recibido y lo rendido |
| **Estado**         | `PENDIENTE`, `OBSERVADO` o `APROBADO`        |
| **Descargar**      | El PDF de la rendición                       |

Filtros: **Filtrar por emisor...**, **Filtrar por Código / ID...** y **Filtrar por estado...**.

## Usos habituales

| Pregunta                                       | Cómo responderla                                                          |
| ---------------------------------------------- | ------------------------------------------------------------------------- |
| ¿Qué está esperando a Dirección Financiera?    | Monitor de Solicitudes, estado `PENDIENTE`, mira la columna **Aprobador** |
| ¿Quién tiene fondos sin rendir?                | Monitor de Solicitudes, estado `DESEMBOLSADO`                             |
| ¿Qué contratos de consultoría siguen abiertos? | Monitor de Solicitudes, estado `EN_EJECUCION`                             |
| ¿Qué rendiciones esperan cierre?               | Monitor de Rendiciones, estado `PENDIENTE`                                |

Para saber **cómo** llegó un documento a su estado actual, usa el
[Centro de Auditoría](./centro-de-auditoria.md).
