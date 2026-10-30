---
title: Impuestos y retenciones
sidebar_position: 2
---

# Impuestos y retenciones

Cuando ACEAA paga a alguien que **no entrega factura**, la ley boliviana obliga a ACEAA a
retener los impuestos y pagarlos por esa persona. AMZ Desk calcula esas retenciones solo:
esta página explica de dónde salen los montos que ves.

## Los impuestos

| Impuesto                                                | Tasa | Cuándo aparece                                                                   |
| ------------------------------------------------------- | ---- | -------------------------------------------------------------------------------- |
| **IVA** — Impuesto al Valor Agregado                    | 13 % | En hospedajes y alquileres pagados con recibo                                    |
| **RC-IVA** — Régimen Complementario al IVA              | 13 % | En viáticos y en servicios pagados con recibo                                    |
| **IT** — Impuesto a las Transacciones                   | 3 %  | Junto con el IVA, el RC-IVA o el IUE, cuando se paga con recibo (no en viáticos) |
| **IUE** — Impuesto sobre las Utilidades de las Empresas | 5 %  | En compras de bienes pagadas con recibo                                          |

## Líquido y bruto

Cada monto tiene dos caras:

- **Líquido** (o neto): lo que la persona recibe en la mano.
- **Bruto** (o presupuestado): lo que le cuesta a ACEAA, impuestos incluidos. Es lo que se
  descuenta del POA.

AMZ Desk parte siempre del líquido y calcula el bruto **dividiendo por un factor**:

> bruto = líquido ÷ factor
>
> retención = bruto − líquido

Por eso la retención **no** es "líquido + 16 %". Con un factor de 0,84, un líquido de Bs 840 da
un bruto de Bs 1.000: se retienen Bs 160, que son el 16 % del bruto, no del líquido.

## Con factura no hay retención

Si el proveedor entrega **factura**, él mismo declara sus impuestos: el factor es 1,00 y el
bruto es igual al líquido. Solo el **recibo** (y los documentos que lo reemplazan) generan
retención.

## Tabla de factores

### En la solicitud

| Caso                                                  | Factor | Retención | Desglose             |
| ----------------------------------------------------- | ------ | --------- | -------------------- |
| Cualquier gasto con **factura**                       | 1,00   | Ninguna   | —                    |
| Recibo, tipo de gasto **Compra**                      | 0,92   | 8 %       | IUE 5 % + IT 3 %     |
| Recibo, tipo de gasto **Servicio** o **Alquiler**     | 0,84   | 16 %      | 13 % + IT 3 %        |
| Recibo, tipo de gasto **Peaje** o **AutoCompra**      | 1,00   | Ninguna   | —                    |
| Hospedaje con recibo                                  | 0,84   | 16 %      | IVA 13 % + IT 3 %    |
| Compra o contrato de consultoría con recibo           | 0,84   | 16 %      | RC-IVA 13 % + IT 3 % |
| **Viáticos** del personal institucional y de terceros | 0,87   | 13 %      | RC-IVA 13 %, sin IT  |

### En la rendición

En la rendición, la retención depende del **tipo de documento** de cada gasto y de la partida
a la que se carga:

| Tipo de documento                                      | Factor | Retención            |
| ------------------------------------------------------ | ------ | -------------------- |
| `FACTURA`                                              | 1,00   | Ninguna              |
| `DJ` — Declaración Jurada                              | 1,00   | Ninguna              |
| `PPT` — Planilla de Pasajes de Terceros (ANEXO 9)      | 1,00   | Ninguna              |
| `LV` — Liquidación de Viáticos (ANEXO 5)               | 0,87   | RC-IVA 13 %          |
| `PVT` — Planilla de Viáticos de Terceros (ANEXO 8A)    | 0,87   | RC-IVA 13 %          |
| `RECIBO` en una partida de viáticos                    | 0,87   | RC-IVA 13 %          |
| `PAT` — Planilla de Alimentación de Terceros (ANEXO 8) | 0,84   | RC-IVA 13 % + IT 3 % |
| `RECIBO` en una partida de hospedaje                   | 0,84   | IVA 13 % + IT 3 %    |
| `RECIBO` o `BOLETA` de una compra de bienes            | 0,92   | IUE 5 % + IT 3 %     |
| `RECIBO` o `BOLETA` de un servicio o un alquiler       | 0,84   | 13 % + IT 3 %        |

:::tip Elige bien el tipo de documento
Es el dato que más cambia el resultado. Un gasto con factura marcado como recibo infla el
costo para ACEAA en un 16 %; un recibo marcado como factura deja de retener lo que la ley
exige.
:::

## Ejemplos

| Caso                        | Líquido     | Factor | Bruto       | Retenciones                  |
| --------------------------- | ----------- | ------ | ----------- | ---------------------------- |
| Viático                     | Bs 870,00   | 0,87   | Bs 1.000,00 | RC-IVA Bs 130,00             |
| Servicio con recibo         | Bs 840,00   | 0,84   | Bs 1.000,00 | 13 % Bs 130,00 + IT Bs 30,00 |
| Compra de bienes con recibo | Bs 920,00   | 0,92   | Bs 1.000,00 | IUE Bs 50,00 + IT Bs 30,00   |
| Compra con factura          | Bs 1.000,00 | 1,00   | Bs 1.000,00 | Ninguna                      |

Los montos se redondean a dos decimales. Cuando una retención se reparte entre dos impuestos,
el último se calcula por diferencia, para que la suma cierre exacta.

## Liquidación de Viáticos (ANEXO 5)

Cada hoja de la liquidación sigue la misma regla de los viáticos:

- **Líquido** = tarifa del destino × días × 100 % (viático completo) o 50 % (medio viático).
- **Bruto** = líquido ÷ 0,87.
- **RC-IVA** = bruto − líquido.

El servidor recalcula siempre estos montos al guardar: lo que ves en pantalla es solo una
vista previa.

## Declaración Jurada de Movilidad (ANEXO 6)

Cada traslado declarado se lleva a bruto dividiendo lo gastado por 0,84. Sobre el total bruto
se retiene el 16 %, y el total líquido es lo que el declarante gastó.

:::caution Pendiente de confirmar
La documentación interna del sistema describe para el ANEXO 6 una retención de 15,5 % (IUE
12,5 % + IT 3 %, factor 0,845), pero el sistema calcula 16 % (factor 0,84), como la planilla
Excel de origen. Lo mismo ocurre con los viáticos de terceros: la documentación interna dice
16 %, y el sistema aplica 13 % según el Instructivo de Viaje y Viáticos del 03/08/2026. Esta
página describe lo que el sistema calcula hoy.
:::
