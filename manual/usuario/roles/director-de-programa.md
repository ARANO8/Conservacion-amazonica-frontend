---
title: Director de Programa
sidebar_position: 1
---

# Director de Programa

El Director de Programa da el visto bueno técnico: confirma que lo que se pide o se informa
tiene sentido para el programa antes de que pase a Dirección Financiera.

## Quién es el Director de Programa

En AMZ Desk **no es un rol del sistema**. Es la persona que el emisor elige, documento por
documento:

- **En la solicitud de viaje**, al final del formulario, en la ventana **Revisar y Enviar
  Solicitud**, campo **Director de Programa**. Su nombre firma como "Revisado por" en el
  ANEXO 2.
- **En el Informe de Viaje y en la Liquidación de Viáticos**, campo **Revisado por — Director
  de Programa**.

Reglas de esa elección:

- La elección **vale solo para ese documento**. La siguiente solicitud se elige de nuevo.
- No puedes elegirte a ti mismo.
- No se puede elegir a Dirección Financiera (rol `TESORERO`): es quien aprueba después.
- Si la solicitud vuelve observada, al corregirla sigue yendo al mismo Director de Programa:
  no se puede cambiar.

:::info Cualquier persona puede ser Director de Programa
Tu cuenta puede tener el rol `USUARIO` (se muestra como **EMISOR** en la gestión de usuarios)
y aun así recibir documentos para revisar. Lo que cuenta es que el emisor te haya elegido.
:::

## Qué llega a tu bandeja

Todo llega a **Notificaciones** (la **Bandeja de Entrada**) en el panel lateral. Mientras
tengas algo asignado, en **Inicio** verás además la tarjeta **Revisión de Solicitudes** con el
botón **Ir a Revisión**.

| Etiqueta en la bandeja                      | Qué es                                                          | Dónde se abre                |
| ------------------------------------------- | --------------------------------------------------------------- | ---------------------------- |
| **Asignada**                                | Una solicitud de viaje nueva para tu revisión                   | El detalle de la solicitud   |
| **Asignada** (título "Solicitud corregida") | El emisor corrigió una solicitud que observaste                 | El detalle de la solicitud   |
| **Informe por revisar**                     | Un Informe de Viaje (ANEXO 7) enviado a tu revisión             | El detalle del informe       |
| **Liquidación por revisar**                 | Una Liquidación de Viáticos (ANEXO 5) enviada a tu revisión     | El detalle de la liquidación |
| **Rendición pendiente**                     | Una rendición en la que te eligieron en **Derivar Revisión A:** | El detalle de la rendición   |

Los informes y las liquidaciones pendientes también aparecen en la pestaña **Por revisar** de
**Viajes y Viáticos > Informe de Viaje** y **Viajes y Viáticos > Liquidación de Viáticos**. Si
tienes alguno pendiente, la pantalla se abre directamente en esa pestaña.

## Revisar una solicitud de viaje

1. Abre la notificación **Asignada**.
2. Revisa el detalle: datos del viaje, **Plan de Viaje** (con el botón **Ver ANEXO 1**),
   viáticos, hospedajes, gastos, presupuesto por partida y **Documentos de Respaldo**.
3. Decide:
   - **Enviar a Dirección Financiera**: confirmas que la solicitud está bien estructurada.
     Pulsa **Confirmar envío** en la ventana. No eliges a quién: el sistema la envía a
     Dirección Financiera.
   - **Observar / Devolver**: escribe el motivo y pulsa **Enviar Observación**. La solicitud
     pasa a `OBSERVADO` y vuelve al emisor, que recibe tu motivo.

![Detalle de una solicitud de viaje con los botones Enviar a Dirección Financiera y Observar / Devolver](/img/capturas/roles-director-solicitud.png)

Si en vez de los botones ves el aviso **Solicitud ya atendida**, la solicitud ya no está en tus
manos: ya decidiste o se movió a otra persona.

### Antes de enviar a Dirección Financiera, verifica

- [ ] El plan de viaje (ANEXO 1) corresponde al motivo y a las fechas de la solicitud.
- [ ] Las personas del viaje (institucionales y terceros) son las que planificó el plan.
- [ ] Los días de viático cuadran con las fechas de salida y llegada.
- [ ] Los hospedajes corresponden a las noches del viaje.
- [ ] Cada gasto está cargado a la partida presupuestaria correcta del proyecto.
- [ ] Los enlaces de **Documentos de Respaldo** abren y muestran lo que dicen.
- [ ] El monto total es razonable para la actividad.

:::tip Observar no es rechazar
Observar devuelve la solicitud para que se corrija; no la anula. Escribe un motivo concreto
("faltan los terceros de la actividad 2"): es lo único que el emisor verá.
:::

## Revisar un Informe de Viaje o una Liquidación de Viáticos

Los dos documentos se revisan igual. Solo puedes actuar mientras están **Por revisar** (estado
`ENVIADO`).

1. Abre la notificación, o la pestaña **Por revisar** de la lista, y elige **Revisar**.
2. Decide:
   - **Dar por revisado** (informe) o **Dar por revisada** (liquidación). El autor recibe un
     aviso.
   - **Observar**: escribe el motivo y confirma con **Observar**. El documento vuelve a su
     autor para que lo corrija y lo reenvíe.

Una liquidación revisada ya puede importarse a la rendición como gastos `LV`. Un informe o una
liquidación revisados no se pueden eliminar.

### Antes de dar por revisado un informe, verifica

- [ ] Las actividades informadas son las del plan de viaje, o se explica por qué cambiaron.
- [ ] Los resultados están descritos con suficiente detalle.
- [ ] Las fechas coinciden con las del viaje.

### Antes de dar por revisada una liquidación, verifica

- [ ] Hay una hoja por cada persona institucional que viajó.
- [ ] Las fechas y horas de salida y retorno de cada hoja son correctas: definen si
      corresponde viático completo (100 %) o medio viático (50 %).
- [ ] La tarifa elegida corresponde al destino.
- [ ] Cada fila está cargada a una partida de la solicitud.

## Revisar una rendición

Si el emisor te eligió en **Derivar Revisión A:**, la rendición llega a tu bandeja como
**Rendición pendiente**. Tu papel es verificar que el gasto se hizo; el cierre lo hace
Contabilidad.

1. Abre la rendición. Verás el ANEXO 4, la solicitud de origen y la lista de gastos.
2. Marca cada gasto en la columna de validación: **un clic** lo marca como correcto; **doble
   clic** lo marca como observado y abre un campo para escribir la observación.
3. Si hace falta, corrige la partida contable o la partida presupuestaria de un gasto.
4. Decide:
   - **Aprobar / Derivar**: solo se activa cuando **todos** los gastos están marcados como
     correctos. Elige al siguiente aprobador o contador y pulsa **Confirmar**.
   - **Observar / Devolver**: el comentario se llena con las observaciones que marcaste en los
     gastos. Pulsa **Enviar Observación** y la rendición vuelve al emisor.

:::warning Tú no cierras la rendición
Solo el rol `CONTADOR` puede aprobarla de forma definitiva. Si no eres contador, siempre
tienes que derivarla a alguien; lo habitual es derivarla a Contabilidad.
:::

## Si te eligen como aprobador de una solicitud de compra

En las solicitudes de compra y servicio el emisor elige a su aprobador en **Enviar solicitud
a:**. No es el Director de Programa del viaje, pero la pantalla es la misma: la notificación
**Asignada** abre el detalle con los botones **Aprobar / Derivar** y **Observar / Devolver**.

- **Aprobar / Derivar** te pide **Seleccionar aprobador...**: la persona que sigue en la
  cadena. Para que la solicitud se desembolse, en algún momento debe llegar a Dirección
  Financiera.
- **Observar / Devolver** funciona igual que en viajes.

## Pantallas que usas

| Pantalla                          | Ruta en el panel lateral                                                 |
| --------------------------------- | ------------------------------------------------------------------------ |
| Bandeja de Entrada                | **Notificaciones**                                                       |
| Detalle de la solicitud a revisar | Desde la notificación                                                    |
| Informes por revisar              | **Viajes y Viáticos > Informe de Viaje**, pestaña **Por revisar**        |
| Liquidaciones por revisar         | **Viajes y Viáticos > Liquidación de Viáticos**, pestaña **Por revisar** |
| Rendición a revisar               | Desde la notificación                                                    |
