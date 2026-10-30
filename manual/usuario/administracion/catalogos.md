---
title: Catálogos
sidebar_position: 3
---

# Catálogos

Los catálogos son las listas fijas que alimentan los formularios: proyectos, partidas, tarifas
de viático, tipos de gasto y demás.

:::info Los catálogos no se editan desde la aplicación
AMZ Desk solo **lee** los catálogos. Se cargan con la carga inicial del sistema y no hay
pantalla para crear, modificar ni eliminar sus valores, tampoco para `ADMIN`. Para cambiar un
valor, pide el cambio al equipo técnico.
:::

## Qué contiene cada catálogo

| Catálogo                    | Qué contiene                                                                                                                                          | Dónde lo ves                                                       |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| **Proyectos**               | Los proyectos de ACEAA, cada uno con su cuenta bancaria                                                                                               | Al elegir el presupuesto de una solicitud                          |
| **Grupos**                  | Los grupos de gasto dentro de cada proyecto                                                                                                           | Segundo nivel del selector de presupuesto                          |
| **Partidas**                | Las partidas presupuestarias dentro de cada grupo (por ejemplo, hospedaje nacional o combustible)                                                     | Tercer nivel del selector de presupuesto                           |
| **Códigos presupuestarios** | El código completo de cada línea del POA                                                                                                              | En el detalle del presupuesto y en los anexos                      |
| **Partidas contables**      | El plan de cuentas contable, con su jerarquía                                                                                                         | En la revisión de la rendición, para clasificar cada gasto         |
| **Conceptos**               | Las tarifas diarias de viático por destino, con un monto para personal institucional y otro para terceros. Las de países extranjeros están en dólares | Al cargar viáticos en la solicitud y en la Liquidación de Viáticos |
| **Tipos de gasto**          | **Compra**, **Alquiler**, **Servicio**, **Peaje** y **AutoCompra**                                                                                    | Al cargar un gasto: define la retención si se paga con recibo      |
| **Cuentas bancarias**       | Las cuentas de ACEAA, con banco y moneda                                                                                                              | En el detalle de la solicitud                                      |

Los proyectos, grupos y partidas forman la **estructura programática** sobre la que se arma
el [POA](./poa.md).

## Por qué importa el tipo de gasto

Con factura no hay retención. Con recibo, el tipo de gasto define cuánto se retiene: **Compra**
retiene 8 %, **Servicio** y **Alquiler** 16 %, **Peaje** y **AutoCompra** nada. Ver
[Impuestos y retenciones](../referencia/impuestos-y-retenciones.md).

:::caution Pendiente de confirmar
Las tarifas de viático cargadas en el catálogo de conceptos deben coincidir con el Cuadro 1A
del manual de procedimientos vigente. Confirma con Administración cuál rige antes de usar el
sistema con datos reales.
:::

## El tipo de cambio

Las tarifas en dólares se convierten a bolivianos con un tipo de cambio fijo de 6,96. Tampoco
se edita desde la aplicación.
