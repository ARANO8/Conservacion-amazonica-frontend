---
title: Cuadro comparativo (ANEXO 11)
sidebar_position: 3
---

# Cuadro comparativo (ANEXO 11)

El cuadro comparativo pone lado a lado las cotizaciones de varios proveedores, ítem por ítem,
y deja constancia de cuál se recomienda. Es el ANEXO 11 del _Manual de Procedimientos
Administrativos_ y pasa por revisión, validación y aprobación antes de emitir la orden de
compra.

**Quién lo hace:** quien necesita la compra (el autor del cuadro). Necesitas tener registradas
al menos dos [cotizaciones](./cotizaciones.md), o agregarlas desde el mismo cuadro.

## Armar el cuadro

1. En el panel lateral, abre **Compras y Servicios** y luego **Cuadros Comparativos**.
2. Pulsa **Nuevo Cuadro**.
3. **1. Selecciona las cotizaciones a comparar**: marca las casillas de las cotizaciones que
   entran al cuadro. El contador indica cuántas llevas del mínimo (**2**).
   - Si un proveedor no está registrado, pulsa **Cotización externa rápida**: carga el
     proveedor, la **URL** de su documento y los ítems, y pulsa **Crear y agregar al cuadro**.
4. **2. Ítems y precios por cotización**: elige un proveedor en **Cargar ítems desde...** y
   pulsa **Cargar ítems**. El sistema copia sus ítems y busca el precio de cada uno en las
   demás cotizaciones.
   - Revisa cada fila: **Descripción**, **Cant.**, **Unid.** y el precio unitario en la
     columna de cada proveedor.
   - Si un proveedor no cotizó un ítem, marca **No menciona** en su celda.
   - En **Ganador**, elige qué proveedor gana ese ítem (o deja **Sin selección**).
   - Con **Agregar ítem** sumas filas a mano.
     La fila **TOTALES** suma lo de cada proveedor.
5. **3. Recomendación y observaciones**:
   - **Cotización recomendada**: el proveedor que propones para la compra (o **Sin
     recomendación**).
   - **Lugar y Fecha**: por ejemplo "La Paz, 23 de octubre de 2025".
   - **Observaciones**: la justificación de tu elección.
6. Pulsa **Registrar cuadro comparativo**. El cuadro queda en **Borrador**, con un código del
   tipo `CUA-2026-001`.

![Constructor del cuadro comparativo con tres proveedores y la recomendación](/img/capturas/compras-cuadro-builder.png)

:::warning Elige la cotización recomendada
La orden de compra se prellena con los precios de la **cotización recomendada**. Si el cuadro
se aprueba sin recomendada, no se podrá generar la orden desde él.
:::

## Revisar y enviar

1. Abre el cuadro desde **Ver detalle** en la lista.
2. Revisa la vista previa del **Anexo 11 — Cuadro Comparativo de Cotizaciones** y el análisis
   **Recomendación del sistema**, que sugiere un proveedor por cobertura (cotiza todos los
   ítems) y menor total. Si tu recomendada es otra, aparece un aviso para que revises tus
   criterios. La sugerencia no obliga: decide quien arma y quien aprueba el cuadro.
3. Si hace falta, pulsa **Editar** y corrige.
4. Pulsa **Enviar a revisión**. El cuadro pasa a **En revisión** y Contabilidad recibe la
   notificación **Cuadro por revisar**.

Desde que lo envías, ya no puedes editarlo, salvo que te lo observen.

## Estados del cuadro comparativo

| Estado en la lista | Estado en el detalle                | Qué significa                             | Quién actúa                                        |
| ------------------ | ----------------------------------- | ----------------------------------------- | -------------------------------------------------- |
| **Borrador**       | **Borrador**                        | Recién creado, editable                   | El autor: **Enviar a revisión**                    |
| **En revisión**    | **En revisión (Contador)**          | Contabilidad lo revisa                    | `CONTADOR`: **Enviar a validación** u **Observar** |
| **En validación**  | **En validación**                   | Adquisiciones valida las cotizaciones     | `VALIDADOR_COMPRAS`: **Validar** u **Observar**    |
| **Validado**       | **Validado — pendiente aprobación** | Validado, vuelve a Contabilidad           | `CONTADOR`: **Enviar a aprobación** u **Observar** |
| **En aprobación**  | **En aprobación (Directora)**       | Espera la aprobación final                | `EJECUTIVO`: **Aprobar** u **Observar**            |
| **Observado**      | **Observado**                       | Devuelto al autor con un motivo, editable | El autor: corregir y **Enviar a revisión**         |
| **Aprobado**       | **Aprobado**                        | Listo para emitir la orden                | El autor: **Crear Orden de Compra**                |

`ADMIN` puede actuar en cualquiera de esos pasos. Ver
[Revisión y validación](./revision-validacion.md) y [Aprobación](./aprobacion.md).

## Si te lo observan

1. Recibes la notificación **Cuadro observado** con el motivo.
2. Abre el cuadro: arriba aparece el recuadro **Cuadro observado** con el motivo.
3. Pulsa **Editar**, corrige lo señalado y guarda con **Guardar cambios**.
4. Pulsa **Enviar a revisión**. El cuadro vuelve a empezar por Contabilidad, aunque lo hayan
   observado en un paso posterior.

## Historial

El detalle muestra la tarjeta **Historial** con cada movimiento: la acción (`ENVIADO`,
`DERIVADO`, `VALIDADO`, `OBSERVADO`, `APROBADO`), el comentario, quién la hizo y cuándo.

## El documento impreso (ANEXO 11)

El cuadro se imprime **en hoja apaisada** y lleva:

- El encabezado con el logo de ACEAA a la izquierda, el de AMZ Desk a la derecha, **ANEXO 11**,
  el título **Cuadro Comparativo de Cotizaciones**, la nota **(Expresado en Bolivianos)** y el
  código del cuadro.
- La tabla con **ITEM**, **DESCRIPCIÓN**, **CANT.**, **UNID.** y, bajo **COTIZACIONES**, una
  columna doble (**P/UNIT.** y **TOTAL**) por proveedor. Las celdas no cotizadas dicen **No
  menciona**. El proveedor recomendado y los precios ganadores van resaltados.
- La fila **TOTALES** por proveedor.
- **Lugar y fecha** y el recuadro **Observaciones**.
- Tres firmas, cada una con nombre y cargo:
  - **Preparado por resp. cotización**: el autor del cuadro.
  - **Revisado por**: el Director Financiero.
  - **Aprobado por**: el Director Ejecutivo.

:::info Cinco pasos en el sistema, tres firmas en el papel
El circuito interno tiene cinco pasos (revisión, validación, nueva revisión, envío y
aprobación), pero el ANEXO 11 impreso conserva los tres casilleros del manual. Los firmantes de
"Revisado por" y "Aprobado por" salen impresos siempre; la firma real se pone a mano.
:::

## Consejos

- Antes de enviar, compara la **Recomendación del sistema** con tu recomendada y explica en
  **Observaciones** por qué eliges otra, si es el caso.
- No elimines un cuadro que ya se envió: la opción **Eliminar** está en la lista, pero borra el
  respaldo del expediente.
