---
title: Catálogo de documentos
sidebar_position: 2
---

# Catálogo de documentos

Todos los documentos que genera el sistema, con su plantilla, el código que arma los datos y sus
endpoints.

| Documento                                | Plantilla                        | Datos                                                          | Orientación | HTML                                                                       | PDF                                    |
| ---------------------------------------- | -------------------------------- | -------------------------------------------------------------- | ----------- | -------------------------------------------------------------------------- | -------------------------------------- |
| ANEXO 1 Plan de Viaje                    | `anexo1.hbs`                     | `planes-viaje/anexo1.builder.ts` (`construirAnexo1`)           | Vertical    | `GET /planes-viaje/:id/anexo1`                                             | `GET /planes-viaje/:id/pdf`            |
| ANEXO 2 Solicitud de fondos para viaje   | `anexo2.hbs`                     | `solicitudes/anexo2.builder.ts` (`construirAnexo2`)            | Vertical    | `GET /solicitudes/:id/anexo2` o `.../documento`                            | `GET /solicitudes/:id/pdf`             |
| ANEXO 3 Solicitud de fondos para compras | `solicitud.hbs` (con `esCompra`) | `SolicitudesService.armarDocumento`                            | Vertical    | `GET /solicitudes/:id/documento`                                           | `GET /solicitudes/:id/pdf`             |
| ANEXO 4 Rendición de fondos              | `anexo4.hbs`                     | `rendiciones/anexo4.builder.ts` (`construirAnexo4`)            | Apaisado    | `GET /rendiciones/:id/anexo4`                                              | `GET /rendiciones/:id/pdf`             |
| ANEXO 4 en Excel                         | sin plantilla                    | `rendiciones/anexo4.excel.ts` (`generarExcelAnexo4`)           | Apaisado    | —                                                                          | `GET /rendiciones/:id/excel`           |
| ANEXO 5 Liquidación de Viáticos          | `anexo5.hbs`                     | `liquidaciones-viaticos/anexo5.builder.ts` (`construirAnexo5`) | Vertical    | `GET /liquidaciones-viaticos/:id/documento`, `.../hojas/:hojaId/documento` | `.../:id/pdf`, `.../hojas/:hojaId/pdf` |
| ANEXO 6 Declaración Jurada de Movilidad  | `declaracion-movilidad.hbs`      | `DeclaracionesMovilidadService.armarDocumento`                 | Vertical    | `GET /declaraciones-movilidad/:id/documento`                               | `GET /declaraciones-movilidad/:id/pdf` |
| ANEXO 7 Informe de Viaje                 | `anexo7.hbs`                     | `informes-viaje/anexo7.builder.ts` (`construirAnexo7`)         | Vertical    | `GET /informes-viaje/:id/documento`                                        | `GET /informes-viaje/:id/pdf`          |
| ANEXO 11 Cuadro Comparativo              | `cuadro-comparativo.hbs`         | `CuadrosComparativosService.armarDocumento`                    | Apaisado    | `GET /cuadros-comparativos/:id/documento`                                  | `GET /cuadros-comparativos/:id/pdf`    |
| ANEXO 12 Orden de Compra / Servicio      | `orden-compra.hbs`               | `OrdenesCompraService.armarDocumento`                          | Vertical    | `GET /ordenes-compra/:id/documento`                                        | `GET /ordenes-compra/:id/pdf`          |
| Formulario de Solicitud de Cotizaciones  | `cotizacion.hbs`                 | `CotizacionesService.armarDocumento`                           | Vertical    | `GET /cotizaciones/:id/documento`                                          | `GET /cotizaciones/:id/pdf`            |

Notas por documento:

- **ANEXO 2 y ANEXO 3** comparten endpoint. `GET /solicitudes/:id/documento` y `.../pdf` eligen
  `anexo2.hbs` si `tipo = VIAJE` y `solicitud.hbs` si es compra. `solicitud.hbs` solo pone "ANEXO 3"
  en el encabezado cuando `esCompra` es verdadero.
- **ANEXO 4** se arma una sola vez (`armarAnexo4`) para el PDF, la vista y el Excel. Ver
  [ANEXO 4 en Excel](./anexo4-excel.md).
- **ANEXO 5** puede pedirse completo (todas las hojas) o de una sola persona (`hojaId`). Cada hoja
  lleva al pie la firma del beneficiario con su C.I.
- **ANEXO 11** es apaisado porque las cotizaciones son columnas. Marca la cotización ganadora por
  ítem.
- **ANEXO 12** imprime el NIT de ACEAA (`ACEAA_NIT`) y el tipo de cambio (`ACEAA_TC`), el código del
  cuadro de origen como referencia, y al reverso un recuadro de conformidad de recepción con "Firma
  y sello de recepción" del proveedor.
- La **cotización** no lleva bloque de firmas.

## Nombres de archivo

Los PDF se sirven con `Content-Disposition: inline` y un nombre fijo por tipo (`solicitud.pdf`,
`rendicion.pdf`, `plan-de-viaje.pdf`...). El nombre definitivo de la descarga lo pone el frontend
al llamar a `downloadBlob(..., fileName)`. El Excel va como `attachment` con
`Rendicion-<codigoSolicitud>.xlsx`.

## Acceso

Los endpoints de documento reutilizan el `findOne` del servicio con el usuario de la petición: quien
no puede ver el registro tampoco puede ver ni descargar su documento.
