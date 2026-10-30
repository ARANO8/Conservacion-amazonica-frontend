---
title: Firmas
sidebar_position: 3
---

# Firmas

Los documentos se firman **en papel**. El sistema imprime en cada casillero el nombre y, debajo, el
cargo de quien debe firmar (spec 025). Algunas firmas salen de los datos del registro; otras son
fijas: el Director Ejecutivo y la Dirección Financiera.

## Fuentes de los firmantes fijos

### `DESTINATARIO_ANEXOS` y `CARGO_DIRECTOR_EJECUTIVO`

```ts title="src/common/constants/financial.constants.ts"
/**
 * Campo "A:" de los anexos: todos los documentos van dirigidos al Director
 * Ejecutivo, escrito tal como lo pide ACEAA. También firma el VoBo del ANEXO 1.
 */
export const DESTINATARIO_ANEXOS = '...'; // nombre del Director Ejecutivo
export const CARGO_DIRECTOR_EJECUTIVO = 'DIRECTOR EJECUTIVO';
```

Se usa para el campo **"A:"** (ANEXOS 2, 4 y 7) y para la firma **"Aprobado por"** o **"VoBo"**
del Director Ejecutivo.

### `firmasDireccion()` (`src/pdf/firmas-direccion.ts`)

```ts title="src/pdf/firmas-direccion.ts"
export async function firmasDireccion(
  prisma: PrismaService
): Promise<FirmasDireccion> {
  const financiera = await prisma.usuario.findFirst({
    where: { rol: Rol.TESORERO, deletedAt: null },
    select: { nombreCompleto: true, cargo: true },
    orderBy: { id: 'asc' },
  });

  return {
    revisadoPor: {
      nombre: financiera?.nombreCompleto ?? '',
      cargo: financiera?.cargo ?? 'DIRECTOR FINANCIERO',
    },
    aprobadoPor: {
      nombre: DESTINATARIO_ANEXOS,
      cargo: CARGO_DIRECTOR_EJECUTIVO,
    },
  };
}
```

Es el formato de ACEAA para los anexos que revisa Administración: **revisa la Dirección Financiera**
(el primer usuario `TESORERO` activo, con su cargo de la base) y **aprueba el Director Ejecutivo**.

## Quién firma cada documento

| Documento                   | Casilleros                                                                                           | De dónde sale cada uno                                                                                                                                          |
| --------------------------- | ---------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ANEXO 1 Plan de Viaje       | Responsable de viaje · VoBo. Director Ejecutivo                                                      | Usuario del plan y el cargo guardado en el plan · `DESTINATARIO_ANEXOS` + `CARGO_DIRECTOR_EJECUTIVO`                                                            |
| ANEXO 2 Solicitud de viaje  | Solicitado por · Revisado por · Aprobado por                                                         | Emisor y su cargo · `Solicitud.directorPrograma` y su cargo · `DESTINATARIO_ANEXOS` + `CARGO_DIRECTOR_EJECUTIVO`                                                |
| ANEXO 3 Solicitud de compra | Emitido por · Director del proyecto · Aprobado por                                                   | Emisor · quien derivó la solicitud al `TESORERO`, sacado del historial (`obtenerDirectorProyecto`) · constante `DIRECTOR_EJECUTIVO` de `solicitudes.service.ts` |
| ANEXO 4 Rendición           | Elaborado por · Revisado por · Aprobado por                                                          | Emisor de la solicitud · `firmasDireccion().revisadoPor` · `firmasDireccion().aprobadoPor`                                                                      |
| ANEXO 5 Liquidación         | Revisado por · Aprobado por; al pie de cada hoja, firma, nombre, cargo y C.I. del beneficiario       | `firmasDireccion()` · datos del usuario de la hoja                                                                                                              |
| ANEXO 6 Movilidad           | Preparado por · Revisado por · Aprobado por                                                          | Declarante · `firmasDireccion()`                                                                                                                                |
| ANEXO 7 Informe de Viaje    | Preparado por · Revisado por · Aprobado por                                                          | Autor · `InformeViaje.directorPrograma` · `DESTINATARIO_ANEXOS` + `CARGO_DIRECTOR_EJECUTIVO`                                                                    |
| ANEXO 11 Cuadro comparativo | Preparado por · Revisado por · Aprobado por                                                          | Emisor (cargo por defecto "Resp. Cotización") · constante `REVISOR` · constante `APROBADOR` (ambas en `cuadros-comparativos.service.ts`)                        |
| ANEXO 12 Orden de compra    | Elaborado por · Dirección Financiera · Dirección Ejecutiva; al reverso, "Firma y sello de recepción" | Emisor · `DIRECTOR_FINANCIERO` · `DIRECTOR_EJECUTIVO` (ambas en `ordenes-compra.constants.ts`) · el proveedor                                                   |
| Cotización                  | sin firmas                                                                                           | —                                                                                                                                                               |

### Por qué el ANEXO 11 tiene tres firmas

El circuito del cuadro tiene cinco pasos (autor, `CONTADOR`, `VALIDADOR_COMPRAS`, `CONTADOR`,
`EJECUTIVO`), pero el formato impreso de ACEAA tiene **tres** casilleros: Responsable de
Cotización, Revisado por y Aprobado por. El PDF rellena esos tres y nada más. Los cinco pasos son
flujo interno; el papel no cambia.

## Firmantes duplicados en el código

:::warning
El Director Ejecutivo y la Dirección Financiera están escritos **en cuatro lugares**, con grafías
distintas del mismo nombre y cargos en mayúsculas o en minúsculas:

| Constante                                         | Archivo                                                | Documentos              |
| ------------------------------------------------- | ------------------------------------------------------ | ----------------------- |
| `DESTINATARIO_ANEXOS`, `CARGO_DIRECTOR_EJECUTIVO` | `common/constants/financial.constants.ts`              | ANEXOS 1, 2, 4, 5, 6, 7 |
| `DIRECTOR_EJECUTIVO`                              | `solicitudes/solicitudes.service.ts`                   | ANEXO 3                 |
| `REVISOR`, `APROBADOR`                            | `cuadros-comparativos/cuadros-comparativos.service.ts` | ANEXO 11                |
| `DIRECTOR_FINANCIERO`, `DIRECTOR_EJECUTIVO`       | `ordenes-compra/ordenes-compra.constants.ts`           | ANEXO 12                |

Además, ANEXOS 4, 5 y 6 toman la Dirección Financiera del usuario `TESORERO`, mientras que ANEXOS
11 y 12 la tienen fija. **Si cambia una de estas personas, hay que tocar todos los lugares.** Lo
ideal es que todos usen `firmasDireccion()` y `financial.constants.ts`.
:::

## Agregar o cambiar una firma

- Firma de Dirección Financiera + Director Ejecutivo: pasar `await firmasDireccion(this.prisma)`
  a los datos y, en la plantilla, usar `firmas.revisadoPor.nombre`, `firmas.revisadoPor.cargo`,
  `firmas.aprobadoPor.nombre` y `firmas.aprobadoPor.cargo`.
- Firma de una persona del registro: incluirla con `USER_SAFE_SELECT` y pasar `nombreCompleto` y
  `cargo`. Si `cargo` es nulo, pasar cadena vacía para que el casillero no imprima "null".
- Mantener siempre el cargo debajo del nombre (spec 025).
