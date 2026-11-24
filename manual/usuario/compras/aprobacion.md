---
title: Aprobación del cuadro
sidebar_position: 5
---

# Aprobación del cuadro

La aprobación es el último paso del cuadro comparativo: Dirección confirma la compra al
proveedor recomendado. Con el cuadro **Aprobado**, el autor puede emitir la orden de compra.

**Quién lo hace:**

- Envía a aprobación: el `CONTADOR`, cuando el cuadro está **Validado**.
- Aprueba: el rol `EJECUTIVO`. También puede hacerlo `ADMIN`.

:::caution Pendiente de confirmar
En el sistema aprueba el rol `EJECUTIVO` (Dirección Ejecutiva y Administración General), pero
la pantalla muestra el estado como **En aprobación (Directora)** y el ANEXO 11 imprime al
Director Ejecutivo en "Aprobado por". Falta confirmar qué persona aprueba los cuadros en la
práctica.
:::

## Enviar a aprobación (Contabilidad)

1. Abre el cuadro en estado **Validado** (en el detalle: **Validado — pendiente aprobación**).
2. Pulsa **Enviar a aprobación**. Aparece el aviso **Cuadro enviado a la Directora para
   aprobación.**
3. El cuadro pasa a **En aprobación** y todas las cuentas `EJECUTIVO` reciben la notificación
   **Cuadro por revisar** con el mensaje "requiere tu aprobación final".

## Aprobar (Dirección)

1. Pulsa la notificación, o abre **Compras y Servicios**, luego **Cuadros Comparativos**. El
   rol `EJECUTIVO` ve todos los cuadros; busca los que están **En aprobación**.
2. Abre el cuadro con **Ver detalle** y revisa:
   - la vista previa del ANEXO 11 y la cotización recomendada,
   - la **Recomendación del sistema** y, si aparece, el aviso de que la recomendada difiere de
     la sugerida,
   - el **Historial**, para ver quién revisó y validó.
3. Decide:
   - **Aprobar**: el cuadro pasa a **Aprobado** y el autor recibe **Cuadro aprobado**.
   - **Observar**: escribe el **Motivo de la observación** y confirma con **Observar**. El
     cuadro vuelve al autor en **Observado**.

![Detalle de un cuadro En aprobación con los botones Aprobar y Observar](/img/capturas/compras-cuadro-aprobar.png)

## Estados de este paso

| Estado            | Qué significa                                  | Siguiente acción                                   |
| ----------------- | ---------------------------------------------- | -------------------------------------------------- |
| **Validado**      | Adquisiciones lo validó; espera a Contabilidad | `CONTADOR`: **Enviar a aprobación** u **Observar** |
| **En aprobación** | Espera la decisión de Dirección                | `EJECUTIVO`: **Aprobar** u **Observar**            |
| **Aprobado**      | Compra aprobada; ya no se edita                | El autor: **Crear Orden de Compra**                |
| **Observado**     | Devuelto al autor                              | El autor corrige y vuelve a **Enviar a revisión**  |

## Si se observa en este paso

Una observación en aprobación devuelve el cuadro **al inicio del circuito**: el autor corrige,
lo envía a revisión, y pasa otra vez por Contabilidad, Adquisiciones y Dirección. Si el
problema es menor, conviene explicarlo bien en el motivo para que la segunda vuelta sea rápida.

## Después de aprobar

- El cuadro queda fijo: no se puede editar ni volver a enviar.
- En su detalle aparece el botón **Crear Orden de Compra**. Ver
  [Orden de compra](./orden-compra.md).
- El ANEXO 11 impreso lleva en "Aprobado por" el nombre y el cargo del Director Ejecutivo, que
  firma a mano.
