---
title: Centro de Auditoría
sidebar_position: 5
---

# Centro de Auditoría

El **Centro de Auditoria** muestra la trazabilidad de cada solicitud y de cada rendición:
quién hizo qué, y en qué fecha y hora exactas.

**Quién lo ve:** `ADMIN`, `EJECUTIVO`, `CONTADOR` y `TESORERO`. Está en el panel lateral como
**Centro de Auditoria**.

## Consultar el historial

1. En **Modulo a Auditar**, elige **Solicitudes** o **Rendiciones**.
2. En la tabla de abajo, busca el documento:
   - Solicitudes: **Buscar por codigo, emisor o estado...**
   - Rendiciones: **Buscar por codigo de solicitud, estado o aprobador...**
3. Pulsa **Ver historial** en la fila.
4. La tarjeta **Linea de Tiempo de Aprobaciones** muestra cada paso, del más antiguo al más
   reciente.

![Centro de Auditoria con la línea de tiempo de una solicitud](/img/capturas/admin-auditoria.png)

## Qué significa cada paso

| Paso          | Qué pasó                                                                                                                 |
| ------------- | ------------------------------------------------------------------------------------------------------------------------ |
| **Creado**    | El emisor creó el documento                                                                                              |
| **Derivado**  | Alguien lo pasó a la siguiente persona (por ejemplo, el Director de Programa a Dirección Financiera)                     |
| **Aprobado**  | En una solicitud, el desembolso (el comentario es el código de desembolso). En una rendición, el cierre por Contabilidad |
| **Observado** | Alguien lo devolvió al emisor; el comentario es el motivo                                                                |
| **Corregido** | El emisor corrigió y reenvió                                                                                             |
| **Rechazado** | Rechazo definitivo                                                                                                       |

## Para qué sirve

- Responder "¿quién aprobó esta solicitud y cuándo?".
- Ver cuántas veces se observó un documento y por qué.
- Saber en qué operaciones participó una persona como Director de Programa o aprobador.

:::info Solo solicitudes y rendiciones
Los cuadros comparativos tienen su propio historial en su pantalla de detalle. Los informes de
viaje, las liquidaciones de viáticos y los planes de viaje no aparecen en el Centro de
Auditoría.
:::
