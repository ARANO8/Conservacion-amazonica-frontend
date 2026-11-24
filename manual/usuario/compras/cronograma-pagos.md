---
title: 'Consultorías: cronograma de pagos'
sidebar_position: 8
---

# Consultorías: cronograma de pagos

Un contrato de consultoría no se paga de una sola vez, sino por cuotas, a medida que el
consultor entrega sus productos. En AMZ Desk el contrato se registra como una solicitud de
fondos con un **Cronograma de Pagos**, y cada cuota se solicita, aprueba y paga por separado.

**Quién interviene:**

- Quien registra el contrato: cualquier persona, desde **Solicitudes de Fondos**.
- Quien solicita cada pago: Adquisiciones, según indica la pantalla.
- Quien aprueba cada pago: la persona a quien se envía la cuota.
- Quien registra el pago: Tesorería (`TESORERO`, también `EJECUTIVO` o `ADMIN`).

## Registrar el contrato

1. Crea una **Nueva Solicitud** en **Solicitudes de Fondos**, como en
   [Solicitud de fondos](./solicitud-fondos.md).
2. En **Partida Presupuestaria**, elige una partida de consultoría (su nombre contiene
   "consultor"). El formulario reemplaza la tabla de gastos por **Contrato de Consultoría**.
3. Completa:
   - **MONTO LÍQUIDO DEL CONTRATO (Bs)** (obligatorio): lo que recibe el consultor en mano, sin
     retenciones.
   - **TIPO DE DOCUMENTO**: **Factura** o **Recibo**. Con recibo, el sistema calcula la
     **Retención impositiva** y el monto bruto que se carga al POA.
4. En **Pagos parciales**, indica la **Cantidad de pagos** o usa **Agregar pago**. Para cada
   cuota, completa el monto, la **Fecha de pago** (no puede ser pasada) y, si quieres, el
   **Producto o hito**.
5. Pulsa **Revisar y Enviar**. El total se muestra como **Total Solicitado (Incl.
   Retenciones)**.
6. En la ventana de revisión no se elige destinatario: el aviso indica que el contrato queda
   registrado y en ejecución, y que la aprobación se hace al solicitar cada pago. Pulsa
   **Confirmar Envío**.

El contrato nace en estado **En ejecución** y reserva su monto en la partida hasta la última
cuota.

:::warning Las cuotas deben sumar el contrato
Si la suma de los pagos no coincide con el monto líquido, el sistema no deja continuar y
muestra cuánto suman los pagos y cuánto es el contrato. Tampoco acepta cuotas sin fecha.
:::

## Pagar una cuota

El detalle de la solicitud muestra la tarjeta **Cronograma de Pagos**, con cuántas cuotas van
pagadas, y una fila por cuota: **Pago**, **Producto / Hito**, **Fecha prevista**, **Monto
(Bs)**, **Estado** y **Acción**.

![Cronograma de Pagos con cuotas en distintos estados](/img/capturas/compras-cronograma.png)

### 1. Solicitar el pago (Adquisiciones)

1. Cuando el consultor entrega el producto, pulsa **Solicitar pago** en la fila de la cuota.
2. En la ventana **Solicitar pago**, completa:
   - **Comprobante del consultor** (obligatorio): enlace a la factura o recibo de este pago.
   - **Informe o producto entregado**: enlace al producto.
   - **Enviar a** (obligatorio): quién debe aprobar el pago. No puedes elegirte a ti mismo.
3. Pulsa **Enviar solicitud**. La cuota pasa a **Solicitado** y la persona elegida recibe
   **Pago por aprobar**.

### 2. Aprobar u observar (el aprobador)

En la fila de la cuota, quien la recibió ve dos botones (los demás ven **Esperando
aprobación**):

- **Aprobar**: la cuota pasa a **Aprobado**.
- **Observar**: en **Observar pago**, escribe el **Motivo de la observación** y pulsa
  **Devolver con observación**. La cuota pasa a **Observado** y quien la solicitó recibe
  **Pago observado**. El contrato sigue en ejecución.

### 3. Registrar el pago (Tesorería)

Con la cuota **Aprobado**, Tesorería ve el botón **Registrar pago** (los demás ven **Listo
para tesorería**). Al pulsarlo, la cuota pasa a **Pagado**, se guarda la fecha real de pago y
el emisor del contrato recibe **Pago registrado**.

Cuando se paga **la última cuota**, la solicitud pasa a **Ejecutado** y su monto se suma a lo
ejecutado de la partida del POA.

## Estados de una cuota

| Estado          | Qué significa                                       | Siguiente acción                         |
| --------------- | --------------------------------------------------- | ---------------------------------------- |
| **Planificado** | Cuota prevista, todavía no pedida                   | **Solicitar pago**                       |
| **Solicitado**  | Pedida, espera al aprobador                         | El aprobador: **Aprobar** u **Observar** |
| **Observado**   | Devuelta; se muestra la observación debajo del hito | **Corregir y reenviar**                  |
| **Aprobado**    | Aprobada, espera a Tesorería                        | Tesorería: **Registrar pago**            |
| **Pagado**      | Pagada; se muestra la fecha real de pago            | Ninguna                                  |

## Si te observan una cuota

1. Abre el contrato desde la notificación **Pago observado**.
2. En la fila de la cuota, lee la **Observación** y pulsa **Corregir y reenviar**.
3. Corrige los enlaces, elige a quién enviarla (puede ser otra persona) y pulsa **Enviar
   solicitud**.

## Corregir el contrato

El contrato se puede editar mientras **ninguna cuota** haya salido de **Planificado**. Desde
que se solicita el primer pago, ya no se puede editar ni eliminar.

:::caution Pendiente de confirmar
La pantalla indica que las solicitudes de pago las hace Adquisiciones, pero el sistema muestra
**Solicitar pago** a cualquier persona que pueda abrir el contrato. Falta confirmar si debe
quedar restringido a Adquisiciones.
:::

## Qué muestra el documento impreso

El ANEXO 3 del contrato incluye la sección **Cronograma de pagos** con **PAGO**, **PRODUCTO /
HITO**, **FECHA PREVISTA** (y la fecha real si ya se pagó), **ESTADO** y **MONTO**. Las firmas
son las de cualquier [solicitud de fondos](./solicitud-fondos.md).
