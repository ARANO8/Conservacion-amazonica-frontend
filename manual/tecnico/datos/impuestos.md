---
title: Impuestos y retenciones
sidebar_position: 4
---

# Impuestos y retenciones

## Idea central

Cuando ACEAA paga con **recibo** (el proveedor o la persona no emite factura), la institución
**retiene** los impuestos y los paga ella. Para que la persona reciba el monto acordado (el
**líquido** o **neto**), el gasto real para el presupuesto es mayor: el **bruto** o
**presupuestado**.

El sistema parte siempre del líquido y calcula el bruto con un **factor de grossing-up**:

```text
bruto     = líquido / factor
impuestos = bruto - líquido
```

No es un porcentaje plano sobre el líquido: con factor 0,84, retener "16 %" significa que los
impuestos son el 16 % **del bruto**, que es un 19,05 % del líquido.

Impuestos bolivianos que intervienen:

| Sigla        | Tasa | Nombre                                                        |
| ------------ | ---- | ------------------------------------------------------------- |
| IVA / RC-IVA | 13 % | IVA; RC-IVA es su régimen complementario para personas        |
| IT           | 3 %  | Impuesto a las Transacciones                                  |
| IUE          | 5 %  | Impuesto sobre las Utilidades, retención por compra de bienes |

`FACTURA` **nunca retiene**: el proveedor declara sus impuestos y bruto = líquido.

## Tabla de factores vigente

Sale del código del backend:

| Caso                                           | Factor | Impuestos sobre el bruto     | Dónde                               |
| ---------------------------------------------- | ------ | ---------------------------- | ----------------------------------- |
| Cualquier `FACTURA`                            | 1,00   | ninguno                      | todos los helpers                   |
| Viático `INSTITUCIONAL`                        | 0,87   | RC-IVA 13 %                  | `calcularMontosViaticos`            |
| Viático `TERCEROS`                             | 0,87   | RC-IVA 13 %                  | `calcularMontosViaticos`            |
| Gasto `RECIBO` + `COMPRA`                      | 0,92   | IUE 5 % + IT 3 %             | `calcularMontosGastos`              |
| Gasto `RECIBO` + `SERVICIO` o `ALQUILER`       | 0,84   | 13 % + IT 3 %                | `calcularMontosGastos`              |
| Gasto `RECIBO` + `PEAJE`, `AUTO_COMPRA` u otro | 1,00   | ninguno                      | `calcularMontosGastos`              |
| Hospedaje con `RECIBO`                         | 0,84   | IVA 13 % + IT 3 %            | `calcularMontosHospedaje`           |
| Compra o consultoría con `RECIBO`              | 0,84   | RC-IVA 13 % + IT 3 %         | `calcularMontosCompra`              |
| Liquidación de viáticos (ANEXO 5)              | 0,87   | RC-IVA 13 %                  | `liquidacion.helper.ts`             |
| Declaración de movilidad (ANEXO 6)             | 0,84   | retención por servicios 16 % | `declaraciones-movilidad.helper.ts` |

Los cinco primeros helpers están en `src/solicitudes/solicitudes.helper.ts`.

:::warning
La tabla de `Conservacion-amazonica-backend/AGENTS.md` está desactualizada en dos filas: da 0,84
para viáticos de terceros y 0,845 (IUE 12,5 % + IT 3 %) para movilidad. El código usa 0,87 para
todos los viáticos (Instructivo de Viaje y Viáticos del 03/08/2026) y 0,84 con 16 % para
movilidad. Manda el código.
:::

## Constantes

```ts title="src/common/constants/financial.constants.ts"
export const IVA_RATE = new Prisma.Decimal(0.13);
export const IT_RATE = new Prisma.Decimal(0.03);
export const IUE_COMPRA_RATE = new Prisma.Decimal(0.05);
export const RETENCION_MOVILIDAD_RATE = new Prisma.Decimal(0.16);
export const FACTOR_MOVILIDAD = new Prisma.Decimal(0.84);
export const FACTOR_RETENCION_VIATICOS = new Prisma.Decimal(0.87);
export const TIPO_CAMBIO_USD_BOB = new Prisma.Decimal(6.96);
```

Solo `FACTOR_RETENCION_VIATICOS`, `FACTOR_MOVILIDAD`, `RETENCION_MOVILIDAD_RATE` y
`TIPO_CAMBIO_USD_BOB` se usan en los cálculos. Los factores 0,92 y 0,84 de gastos, hospedaje y
compras están escritos como literales en `solicitudes.helper.ts`, y `IVA_RATE`, `IT_RATE` e
`IUE_COMPRA_RATE` no se importan en ningún helper. Al cambiar una tasa hay que buscar también los
literales.

## Reparto entre impuestos

Cuando el total retenido combina dos impuestos, se reparte en proporción a sus tasas y **el segundo
se calcula por resta** para que la suma cierre:

```ts title="src/solicitudes/solicitudes.helper.ts"
if (codigoTipoGasto === 'COMPRA') {
  // totalTax = 8 % del bruto: IUE 5/8, IT 3/8
  iue = redondear(totalTax.mul(5).div(8));
  it = redondear(totalTax.sub(iue));
} else if (codigoTipoGasto === 'SERVICIO' || codigoTipoGasto === 'ALQUILER') {
  // totalTax = 16 % del bruto: 13/16 y 3/16
  iva = redondear(totalTax.mul(13).div(16));
  it = redondear(totalTax.sub(iva));
}
```

Ejemplo, servicio con recibo por Bs 840 líquidos:

```text
bruto     = 840 / 0,84         = 1.000,00
impuestos = 1.000,00 - 840     =   160,00
IVA       = 160 x 13 / 16      =   130,00
IT        = 160 - 130          =    30,00
```

La excepción es el hospedaje con recibo, que calcula IVA e IT por separado sobre el bruto y suma:

```ts title="calcularMontosHospedaje"
const montoBruto = redondear(costoTotal.div(0.84));
const iva = redondear(montoBruto.mul(0.13));
const it = redondear(montoBruto.mul(0.03));
return { iva, it, montoPresupuestado: redondear(costoTotal.add(iva).add(it)) };
```

Puede diferir un centavo de `costoTotal / 0,84` por redondeo.

## En la rendición: `desglosarRetenciones`

`GastoRendicion` guarda `montoBruto`, `montoImpuestos` y `montoNeto`. Para el ANEXO 4 hay que
separar `montoImpuestos` en las columnas RC-IVA, IUE e IT. Lo hace
`src/rendiciones/rendiciones.helper.ts`, con la misma técnica de fracciones:

| Documento y categoría                                               | Reparto               |
| ------------------------------------------------------------------- | --------------------- |
| `FACTURA`, `DJ`, `PPT`                                              | Sin retención         |
| `LV`, `PVT`, o `RECIBO` en partida de viáticos                      | Todo RC-IVA           |
| `RECIBO` o `BOLETA` con `tipoRetencion = 'BIEN'` en partida general | IUE 5/8, IT 3/8       |
| Resto                                                               | RC-IVA 13/16, IT 3/16 |

La categoría se deduce del **nombre de la partida** del POA: si contiene "VIATICO" es viático; si
contiene "HOSPEDAJE" o "ALOJAMIENTO", hospedaje; si no, general.

## Viáticos en dólares

Las tarifas del catálogo `Concepto` pueden estar en `USD`. `tarifaEnBolivianos(precio, moneda)`
las convierte con `TIPO_CAMBIO_USD_BOB` (6,96, fijo) y redondea a 2 decimales.

## Liquidación de viáticos (ANEXO 5)

```text
líquido de la fila = tarifa líquida x días x (100 % o 50 %)
bruto de la fila   = líquido / 0,87
RC-IVA de la hoja  = bruto - líquido
```

`PORCENTAJES_VIATICO = [100, 50]`: viático completo o medio viático. El servidor recalcula siempre
al guardar.

## Declaración de movilidad (ANEXO 6)

```text
monto de cada fila = gastado / 0,84
total bruto        = suma de los montos
retención (16 %)   = total bruto x 0,16
total líquido      = total bruto - retención
```

## Espejos en el frontend

El frontend repite estas reglas para mostrar montos en vivo, con `number`:

| Backend                                          | Frontend                       |
| ------------------------------------------------ | ------------------------------ |
| `solicitudes.helper.ts`, `rendiciones.helper.ts` | `lib/tax-calculator.ts`        |
| `liquidacion.helper.ts`                          | `lib/liquidacion-viaticos.ts`  |
| `declaraciones-movilidad.helper.ts`              | `lib/declaracion-movilidad.ts` |

**Si cambia una regla, hay que cambiar los dos lados.** Nada lo verifica automáticamente.
