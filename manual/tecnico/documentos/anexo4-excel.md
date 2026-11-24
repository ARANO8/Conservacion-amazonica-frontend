---
title: ANEXO 4 en Excel
sidebar_position: 4
---

# ANEXO 4 en Excel

La rendición es el único documento que además del PDF se entrega en Excel. Contabilidad lo pide así
para poder ajustar un importe y que el resto se recalcule.

|           |                                                                                                                       |
| --------- | --------------------------------------------------------------------------------------------------------------------- |
| Endpoint  | `GET /rendiciones/:id/excel` (`@SkipThrottle()`)                                                                      |
| Servicio  | `RendicionesService.generateExcel`                                                                                    |
| Generador | `src/rendiciones/anexo4.excel.ts`, función `generarExcelAnexo4(anexo, logos)`                                         |
| Librería  | ExcelJS `^4.4.0`                                                                                                      |
| Respuesta | `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`, `attachment`, `Rendicion-<codigoSolicitud>.xlsx` |

## Mismos datos que el PDF

```ts title="src/rendiciones/rendiciones.service.ts"
async generateExcel(id: number, usuario?: { id: number; rol: Rol }) {
  const anexo = await this.armarAnexo4(id, usuario);
  return {
    buffer: await generarExcelAnexo4(anexo, this.pdfService.leerLogos()),
    nombre: `Rendicion-${anexo.codigoSolicitud}.xlsx`,
  };
}
```

`armarAnexo4` es la misma función que alimenta el PDF y la vista HTML (`construirAnexo4` con el
destinatario y las firmas de `firmasDireccion`). El Excel no recalcula nada por su cuenta: escribe
los valores del objeto `Anexo4` y, donde corresponde, una fórmula con su resultado ya calculado.

## Estructura de la hoja

Una sola hoja llamada **`REND. FONDOS BS`**, A4 apaisado y ajustada a una página de ancho. Calca
la grilla del formulario de ACEAA: columnas A a O, con el bloque de retenciones desde la J.

| Bloque                            | Contenido                                                                                                                 |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Fila 1                            | Logo de ACEAA (columna A) y de AMZ desk (columnas N-O)                                                                    |
| Títulos y datos generales         | Anexo, título, destinatario, solicitante, código                                                                          |
| Encabezado de tabla (filas 14-15) | FECHA, N° DOCTO., TIPO DOCTO., PARTIDA, DESCRIPCIÓN, importes, SALDO, TOTAL, columnas de impuestos, TOTAL IMPUESTOS, NETO |
| Movimientos                       | Una fila por gasto; la primera es el fondo recibido                                                                       |
| Totales                           | Sumas de la tabla                                                                                                         |
| Observaciones                     | Texto libre                                                                                                               |
| Liquidación y documentos          | Importe recibido, total gastado, saldo, y el resumen de documentos por tipo                                               |
| Resumen contable                  | Monto por partida contable                                                                                                |
| Firmas                            | Elaborado por, Revisado por, Aprobado por                                                                                 |

Estilo: fuente Bookman Old Style, grises del formulario y formato numérico
`#,##0.00;-#,##0.00;"-"` (los ceros se ven como `-`, igual que el helper `bs` del PDF).

## Fórmulas

Los cálculos derivados van como fórmula, con el resultado precalculado para que el archivo se vea
bien aunque no se recalcule al abrir:

```ts title="src/rendiciones/anexo4.excel.ts"
const formula = (f: string, resultado: number | string | null) => ({
  formula: f,
  result: resultado,
});
```

| Celda                          | Fórmula                                         |
| ------------------------------ | ----------------------------------------------- |
| Saldo de la primera fila       | `F{r}-G{r}`                                     |
| Saldo de las siguientes        | `H{r-1}+F{r}-G{r}` (saldo acumulado)            |
| Total impuestos de la fila     | `SUM(K{r}:M{r})`                                |
| Neto de la fila                | `J{r}-N{r}`                                     |
| Totales, liquidación y resumen | `SUM(...)` y restas entre celdas de los bloques |

## Logos

`PdfService.leerLogos()` devuelve los dos logos como `Buffer` (`aceaa` de `logo-aceaa.jpg`, `amz`
de `logo.png`, leídos de la raíz del proceso). Si falta alguno, el Excel se genera sin él.

## Al cambiar el ANEXO 4

El PDF y el Excel dibujan lo mismo por caminos distintos (`anexo4.hbs` y `anexo4.excel.ts`). Un
cambio de columnas o de bloques en uno **hay que replicarlo en el otro**. El spec
`rendiciones.service.spec.ts` tiene casos que leen el Excel generado con ExcelJS y comprueban la
grilla y las fórmulas: actualizarlos junto con el cambio.
