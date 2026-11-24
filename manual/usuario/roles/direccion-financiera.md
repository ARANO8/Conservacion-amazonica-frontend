---
title: Dirección Financiera (Tesorería)
sidebar_position: 2
---

# Dirección Financiera (Tesorería)

Dirección Financiera aprueba las solicitudes y libera los fondos. En AMZ Desk la ocupa el rol
`TESORERO`. Es la última firma digital antes del desembolso.

## Qué llega a tu bandeja

| Etiqueta en **Notificaciones** | Qué es                                                                                                           |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| **Derivada**                   | Una solicitud de viaje que el Director de Programa revisó y te envió, o una solicitud de compra que te derivaron |
| **Rendición pendiente**        | Una rendición que alguien te derivó para revisión                                                                |
| **Pago por aprobar**           | Una cuota de un contrato de consultoría en la que te eligieron como aprobador                                    |

En **Inicio** ves la tarjeta **Revisión de Solicitudes** y, además, el indicador **Salud
Financiera del POA Global**.

## Desembolsar una solicitud

1. Abre la notificación **Derivada**.
2. Revisa el detalle de la solicitud (ver la lista de verificación de abajo).
3. Pulsa **Desembolsar**. En la ventana **Desembolsar Solicitud** completa:
   - **Código de Transferencia / Comprobante** (obligatorio), por ejemplo el número de la
     transferencia bancaria.
   - **URL del Comprobante** (obligatorio): el enlace al comprobante en Google Drive, OneDrive
     u otro.
4. Pulsa **Confirmar Desembolso**.

La solicitud pasa a `DESEMBOLSADO` y el emisor recibe un aviso con el código, que lo lleva a
registrar su rendición. En el detalle aparece la tarjeta **Datos del Desembolso** con el
código y el botón **Ver Comprobante Adjunto**.

![Ventana Desembolsar Solicitud con el código de transferencia y la URL del comprobante](/img/capturas/roles-tesoreria-desembolso.png)

Si algo no está bien, usa **Observar / Devolver**: escribe el motivo y pulsa **Enviar
Observación**. La solicitud pasa a `OBSERVADO` y vuelve al emisor.

:::info En Dirección Financiera no se deriva
Una solicitud de viaje que llega a Dirección Financiera solo se desembolsa u observa. No
puedes pasarla a otra persona.
:::

### Antes de desembolsar, verifica

- [ ] En una solicitud de viaje, que el Director de Programa la haya revisado: si no, el
      sistema no te deja desembolsar.
- [ ] El presupuesto por partida: cada monto sale de una partida del POA con saldo.
- [ ] Los impuestos calculados (columnas de líquido y presupuestado) son coherentes con el tipo
      de documento de cada gasto. Ver [Impuestos y retenciones](../referencia/impuestos-y-retenciones.md).
- [ ] La cuenta bancaria y el monto líquido a transferir.
- [ ] En compras, los enlaces de cotizaciones y cuadro comparativo de **Documentos de
      Respaldo**.
- [ ] Tienes el comprobante de la transferencia guardado y su enlace abre para quien lo
      revise.

:::caution El desembolso no se deshace
Una vez `DESEMBOLSADO`, la solicitud ya no puede eliminarse ni volver atrás. El siguiente paso
es la rendición del emisor.
:::

## Pagos de contratos de consultoría

Un contrato de consultoría no se desembolsa de una vez: nace en `EN_EJECUCION` y se paga por
cuotas desde **Compras y Servicios > Solicitudes de Fondos**, en el detalle del contrato,
tarjeta **Cronograma de Pagos**.

- Si te eligieron como aprobador de una cuota (**Pago por aprobar**), verás **Aprobar** y
  **Observar** en la fila de la cuota.
- Cuando una cuota está **Aprobado**, tú ves el botón **Registrar pago**. Quien no es de
  Tesorería ve "Listo para tesorería".
- Al registrar la última cuota, el contrato pasa a `EJECUTADO` y su monto se suma a lo
  ejecutado del POA.

:::caution Pendiente de confirmar
Cuando el aprobador aprueba una cuota, el sistema no envía ninguna notificación a Tesorería.
Para encontrar cuotas listas para pagar, revisa los contratos en `EN_EJECUCION` en
**Monitores > Solicitudes**.
:::

## Rendiciones

Si una rendición te llega derivada, puedes revisarla, marcar sus gastos y **Aprobar /
Derivar** u **Observar / Devolver**, igual que el Director de Programa (ver
[Director de Programa](./director-de-programa.md#revisar-una-rendición)). No puedes cerrarla:
el cierre definitivo lo hace solo el rol `CONTADOR`, así que debes derivarla a Contabilidad.

## Pantallas que usas

| Pantalla               | Ruta en el panel lateral    | Para qué                              |
| ---------------------- | --------------------------- | ------------------------------------- |
| Bandeja de Entrada     | **Notificaciones**          | Solicitudes por desembolsar           |
| Monitor de Solicitudes | **Monitores > Solicitudes** | Ver todas las solicitudes y su estado |
| Monitor de Rendiciones | **Monitores > Rendiciones** | Seguir las rendiciones pendientes     |
| Centro de Auditoria    | **Centro de Auditoria**     | Ver quién hizo qué y cuándo           |
| Analítica Avanzada     | **Analítica**               | Tendencias de gasto y partidas        |

Ver [Monitores](../administracion/monitores.md), [Centro de Auditoría](../administracion/centro-de-auditoria.md)
y [Analítica](../administracion/analitica.md).
