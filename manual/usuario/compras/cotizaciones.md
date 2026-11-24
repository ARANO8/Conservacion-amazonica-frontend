---
title: Cotizaciones
sidebar_position: 2
---

# Cotizaciones

La cotización es el precio que ofrece un proveedor por lo que necesitas comprar. Registras una
por proveedor; después las comparas en el [cuadro comparativo](./cuadro-comparativo.md).

**Quién lo hace:** quien necesita la compra (cualquier rol).

## Dos formas de registrar una cotización

| Tipo                   | Cuándo usarla                                                                                 | Qué genera                                                 |
| ---------------------- | --------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| **Cotización Propia**  | Vas a pedir precio al proveedor con el formulario de ACEAA, o transcribes una oferta completa | El **Formulario de Solicitud de Cotizaciones** en PDF      |
| **Cotización Externa** | El proveedor ya te mandó su propia cotización (PDF, foto, correo)                             | Nada nuevo: se guarda el enlace al documento del proveedor |

## Registrar una cotización

1. En el panel lateral, abre **Compras y Servicios** y luego **Mis Cotizaciones**.
2. Pulsa **Nueva Cotización**. Se abre el **Formulario de Solicitud de Cotizaciones**.
3. Elige el tipo arriba: **Cotización Propia** o **Cotización Externa**.
4. En **Datos del Proveedor**, completa:
   - **Fecha** (obligatoria).
   - **Señor(es) / Proveedor**: nombre o razón social (obligatorio).
   - **Teléfono**, **Dirección** y **Correo Electrónico** (opcionales).
   - Solo en externa: **URL del documento externo** (obligatoria), el enlace al PDF, imagen o
     escaneo del proveedor.
5. En **Detalle de Servicios o Materiales**, carga cada ítem con **Cantidad**, **Unidad**,
   **Detalle** y **P/Unit. (Bs)**. El **Total (Bs)** de cada fila y el **Total** general se
   calculan solos. Usa **Agregar ítem** para sumar filas.
6. Solo en propia: en **Condiciones de la Cotización**, completa **Garantía**,
   **Disponibilidad**, **Duración Cotización**, **Emite Factura** y **Observaciones**. En
   externa solo hay **Observaciones**.
7. Pulsa **Registrar cotización**. El sistema le asigna un código del tipo `COT-2026-001` y
   vuelve a la lista.

![Formulario de cotización propia con ítems cargados](/img/capturas/compras-cotizacion-form.png)

:::tip Describe los ítems igual en todas las cotizaciones
Al armar el cuadro comparativo, el sistema busca los precios de cada proveedor comparando el
texto del **Detalle**. Si escribes "Laptop Dell 15" en una cotización y "Laptop Dell
Inspiron 15" en otra, tendrás que cargar el precio a mano.
:::

## La lista Mis Cotizaciones

Muestra **Código**, **Fecha**, **Proveedor**, **Tipo** (**Propia** o **Externa**), **Ítems** y
**Total (Bs)**. Desde el menú **Acciones** de cada fila:

- **Ver detalle**.
- **Editar**.
- **Descargar PDF** (propia) o **Ver documento** (externa).
- **Eliminar**: pide confirmación.

Ves tus propias cotizaciones. `EJECUTIVO` y `ADMIN` ven las de todos.

## Estados

La cotización **no tiene estados ni aprobación propia**: es un respaldo. Su aprobación ocurre a
través del cuadro comparativo donde la uses. Por eso, tampoco puede ser observada.

:::warning Antes de editar o eliminar
El sistema permite editar o eliminar una cotización en cualquier momento, incluso si ya la
usaste en un cuadro comparativo. El cuadro conserva los precios que se cargaron en él, pero el
respaldo deja de coincidir. No modifiques una cotización que ya está en un cuadro enviado.
:::

## El documento impreso

El **Formulario de Solicitud de Cotizaciones** (solo para cotizaciones propias) lleva:

- El encabezado con el logo de ACEAA a la izquierda, el de AMZ Desk a la derecha, el título y
  el código de la cotización. Montos expresados en bolivianos.
- **Fecha**, **Señor(es)**, **Teléfono**, **Dirección** y **Correo electrónico** del proveedor.
- El texto "Por nuestra cuenta agradeceremos cotizar los siguientes servicios o materiales de
  acuerdo a detalle adjunto."
- La tabla **CANTIDAD**, **UNIDAD**, **DETALLE**, **P/UNIT.**, **TOTAL BS.**, el **TOTAL** y
  el monto en letras (**SON:**).
- **Garantía**, **Disponibilidad**, **Duración cotización**, **Emite factura** y
  **Observaciones**.
- Al pie, el espacio **POR EL PROVEEDOR** con **FIRMA** y **SELLO DE LA EMPRESA**. Este
  documento lo firma el proveedor, no el personal de ACEAA.

:::tip Úsalo para pedir precios
Puedes registrar la cotización propia solo con los ítems y cantidades, descargar el PDF y
enviarlo al proveedor para que lo complete, firme y selle. Cuando lo devuelva, edita la
cotización con los precios.
:::
