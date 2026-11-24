---
title: Notificaciones
sidebar_position: 4
---

# Notificaciones

Las notificaciones te avisan cuando algo cambia en tus trámites o cuando un trámite espera tu
acción: una solicitud que te asignaron, un cuadro comparativo por validar, una rendición
observada. Viven solo dentro de AMZ Desk: **no se envían por correo**.

## Dónde verlas

- **Notificaciones**, en el panel lateral, abre la **Bandeja de Entrada**.
- En el menú de tu cuenta (tu nombre, al pie del panel lateral) aparecen las **Notificaciones
  Recientes**: las tres últimas sin leer, con un contador rojo. **Ver todas las
  notificaciones** abre la Bandeja de Entrada.
- Mientras trabajas, el sistema consulta si hay novedades **cada minuto**. Si llega algo
  nuevo, aparece un aviso flotante **Tienes nuevas notificaciones pendientes** con la cantidad
  sin leer.

![Bandeja de Entrada con notificaciones leídas y sin leer](/img/capturas/inicio-notificaciones.png)

## Usar la Bandeja de Entrada

La Bandeja de Entrada separa las notificaciones en **No leídas** y **Leídas**, cada una con su
cantidad. Las no leídas se destacan con un punto de color.

Cada notificación muestra:

- El **título** y una **etiqueta** con el tipo de aviso.
- El **mensaje**, por ejemplo el motivo de una observación.
- El **código** del trámite (por ejemplo `SOL-2026-012`), si corresponde.
- Hace cuánto llegó ("hace 5 minutos").

Para atender una notificación:

1. Pulsa la notificación. Se marca como leída.
2. El sistema te lleva directo a la pantalla donde debes actuar: el detalle para revisar, o el
   formulario de corrección si te observaron algo.

Para limpiar la bandeja, pulsa **Marcar todas como leídas**.

## Tipos de notificación

| Etiqueta                                                                           | Quién la recibe                             | Cuándo                                                                     |
| ---------------------------------------------------------------------------------- | ------------------------------------------- | -------------------------------------------------------------------------- |
| **Asignada**                                                                       | La persona elegida para revisar             | Alguien le envió una solicitud                                             |
| **Derivada**                                                                       | El siguiente revisor                        | Quien revisaba la derivó a otra persona                                    |
| **Observada**                                                                      | El emisor                                   | Le devolvieron la solicitud con observaciones                              |
| **Aprobada**                                                                       | El emisor                                   | Su solicitud fue desembolsada                                              |
| **Rendición pendiente**                                                            | Quien revisa la rendición                   | Le enviaron una rendición                                                  |
| **Rendición observada**                                                            | Quien rindió                                | Le devolvieron la rendición                                                |
| **Informe por revisar** / **Informe revisado** / **Informe observado**             | Director de Programa / autor                | Movimientos del Informe de Viaje                                           |
| **Liquidación por revisar** / **Liquidación revisada** / **Liquidación observada** | Director de Programa / autor                | Movimientos de la Liquidación de Viáticos                                  |
| **Cuadro por revisar**                                                             | Todos los `CONTADOR`; todos los `EJECUTIVO` | Un cuadro comparativo llegó a revisión, fue validado, o llegó a aprobación |
| **Cuadro por validar**                                                             | Todos los `VALIDADOR_COMPRAS`               | Contabilidad envió un cuadro a validación                                  |
| **Cuadro observado**                                                               | El autor del cuadro                         | Le devolvieron el cuadro con observaciones                                 |
| **Cuadro aprobado**                                                                | El autor del cuadro                         | Su cuadro fue aprobado                                                     |
| **Pago por aprobar**                                                               | La persona elegida                          | Le enviaron una cuota de consultoría para aprobar                          |
| **Pago observado**                                                                 | Quien pidió el pago                         | La cuota fue devuelta con observaciones                                    |
| **Pago registrado**                                                                | El emisor del contrato                      | Tesorería registró el pago de una cuota                                    |

:::info Avisos al rol, no a la persona
Los avisos del cuadro comparativo para Contabilidad, Validación y Dirección Ejecutiva llegan a
**todas** las cuentas que tienen ese rol. Si dos personas comparten rol, la primera que actúa
resuelve el trámite y la otra verá que ya cambió de estado.
:::

:::tip Entra seguido
Como no hay aviso por correo, quien no entra al sistema no se entera de que su trámite fue
observado. Si tienes trámites en curso, revisa la Bandeja de Entrada al menos una vez al día.
:::
