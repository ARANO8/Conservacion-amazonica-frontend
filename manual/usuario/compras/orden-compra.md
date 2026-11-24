---
title: Orden de compra (ANEXO 12)
sidebar_position: 6
---

# Orden de compra (ANEXO 12)

La orden de compra o de servicio comunica al proveedor elegido qué se le compra, a qué precio,
dónde se entrega y cómo se paga. Es el ANEXO 12 y lleva al reverso la **conformidad de
recepción**, que se firma cuando llega el bien o se presta el servicio.

**Quién lo hace:** quien necesita la compra, normalmente el autor del cuadro comparativo.

## Crear la orden desde un cuadro aprobado (lo habitual)

1. Abre el cuadro comparativo en estado **Aprobado**.
2. Pulsa **Crear Orden de Compra**. Se abre **Nueva Orden de Compra / Servicio** ya prellenada:
   - el proveedor de la **cotización recomendada**, con su dirección, teléfono y garantía,
   - los ítems que ese proveedor cotizó, con sus cantidades y precios,
   - **Forma de pago**: "Transferencia bancaria".
     Un aviso confirma **Prellenado desde CUA-...** y te pide revisar antes de guardar.
3. Revisa y completa la sección **Proveedor**:
   - **Nombre del proveedor / empresa** (obligatorio), **Dirección**, **Teléfono**.
   - **Lugar de entrega / prestación**.
   - **Forma de pago** y **Garantía**.
   - **Observaciones**.
4. Revisa **Ítems de la orden**. En cada fila puedes ajustar **Artículo / Servicio**,
   **Cantidad**, **Unidad**, **Detalle** (especificaciones) y **Precio Unit. (Bs)**. El
   **Total (Bs)** se recalcula solo.
5. Pulsa **Crear orden**. El sistema le asigna un código del tipo `OC-2026-001` y confirma
   **Orden OC-... creada correctamente.**

![Formulario de nueva orden de compra prellenada desde un cuadro aprobado](/img/capturas/compras-orden-form.png)

## Otras formas de armar la orden

También puedes empezar desde **Compras y Servicios**, luego **Órdenes de Compra**, botón
**Nueva Orden**, y cargar los ítems con:

- **Agregar desde cuadro**: abre **Agregar ítems desde cuadro comparativo**. Eliges un cuadro
  aprobado, marcas los ítems y pulsas **Agregar**. Se toman los precios de la cotización
  recomendada de ese cuadro.
- **Ítem nuevo (sin cuadro)**: una fila en blanco para algo que no pasó por un cuadro.

:::warning Ítems sin cuadro
Si la orden tiene ítems sin cuadro comparativo, aparece el aviso "Uno o más ítems no tienen
cuadro comparativo de respaldo" y en el PDF esos ítems salen marcados **sin cuadro**. Úsalo
solo para compras que el manual exime del cuadro comparativo.
:::

## La lista Órdenes de Compra

Muestra **Código**, **Fecha**, **Proveedor**, **Cuadro Ref.**, **Ítems** y **Total**. Desde
**Acciones**: **Ver detalle**, **Editar**, **Descargar PDF** y **Eliminar**.

El detalle muestra la vista previa **Anexo 12 — Orden de Compra / Servicio**, un enlace al
cuadro de origen y los botones **Editar** y **Descargar PDF (ANEXO 12)**.

Ves tus propias órdenes. `EJECUTIVO` y `ADMIN` ven todas.

## Estados

La orden de compra **no tiene estados ni flujo de aprobación** en el sistema: la aprobación de
la compra ya ocurrió en el cuadro comparativo. Las firmas de Dirección se ponen a mano sobre el
documento impreso.

Por eso no puede ser observada. Si hay un error, el autor la corrige con **Editar** y vuelve a
descargar el PDF.

:::caution Pendiente de confirmar
El sistema permite editar o eliminar una orden en cualquier momento, también después de
entregada al proveedor. Falta confirmar si debe quedar fija una vez emitida.
:::

## El documento impreso (ANEXO 12)

- Encabezado con el logo de ACEAA a la izquierda, el de AMZ Desk a la derecha, **ANEXO 12**,
  el título **Orden de Compra / Servicio**, la nota **(Expresado en Bolivianos)**, el código de
  la orden y, si salió de un cuadro, la referencia a su código (**Ref: CUA-...**).
- **Fecha** y el tipo de cambio (**T/C**: 1 USD = Bs 6,96).
- **Proveedor / Empresa**, **Dirección** y **Teléfono**.
- **Factura a nombre de**: ACEAA, con el **NIT** de la institución, para que el proveedor
  facture correctamente.
- La tabla **N°**, **ARTÍCULO / SERVICIO**, **CANTIDAD**, **UNIDAD**, **DETALLE**,
  **PRECIO UNIT. (Bs)**, **TOTAL (Bs)** y el **TOTAL**.
- **Son** (el total en letras), **Lugar de entrega / prestación**, **Forma de pago**,
  **Garantía** y, si hay, **Observaciones**.
- Tres firmas, con nombre y cargo: **Elaborado por** (quien creó la orden), la **Directora
  Financiera** y el **Director Ejecutivo**.
- El recuadro **CONFORMIDAD DE RECEPCIÓN**: **Fecha de recepción**, **Observaciones** y
  **Firma y sello de recepción** con nombre y cargo de quien recibe.

## Consejos

- Antes de entregar la orden, verifica que el proveedor y el NIT de facturación estén bien: el
  sistema no guarda el NIT del proveedor, así que revisa sus datos con su cotización.
- Guarda el ANEXO 12 firmado y con la conformidad de recepción completa: es respaldo de la
  rendición de la compra.
- Después de emitir la orden, pide los fondos con una
  [Solicitud de fondos](./solicitud-fondos.md) y anota el código de la orden en sus
  observaciones.
