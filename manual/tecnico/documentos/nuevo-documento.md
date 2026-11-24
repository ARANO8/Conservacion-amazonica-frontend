---
title: Cómo agregar un documento
sidebar_position: 5
---

# Cómo agregar un documento

Receta para un documento nuevo (por ejemplo, una planilla de terceros). Sigue el patrón de
`documentoPdf`, que es el actual; los ANEXOS 1, 2 y 4 son anteriores y no conviene copiarlos.

## 1. Plantilla

Crear `src/templates/<nombre>.hbs`. Partir de una plantilla parecida (`anexo7.hbs` es corta y
sigue el patrón completo):

```handlebars title="src/templates/planilla-ejemplo.hbs"
<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <title>ANEXO 8 {{codigoPlanilla}}</title>
    {{> estilos-documento}}
    <style>
      /* solo lo propio de este documento */
    </style>
  </head>
  <body>
    <div class="hoja">
      {{> encabezado anexo="ANEXO 8" titulo="PLANILLA DE ALIMENTACIÓN" codigo=codigoPlanilla}}

      <!-- cuerpo: tablas con {{#each filas}} ... {{/each}} -->

      <table class="firmas no-romper">
        <tr>
          <td>
            <div class="firma-linea">Revisado por</div>
            <div class="firma-nombre">
              {{firmas.revisadoPor.nombre}}
              <div class="firma-cargo">{{firmas.revisadoPor.cargo}}</div>
            </div>
          </td>
        </tr>
      </table>
    </div>
  </body>
</html>
```

Reglas:

- Encabezado siempre con el parcial `encabezado`: logo de ACEAA a la izquierda, AMZ desk a la
  derecha.
- No usar `anexo`, `titulo`, `nota`, `codigo` ni `referencia` como nombres de datos propios.
- Importes con el helper `bs` (`{{bs total}}`) o ya formateados por el builder.
- Usar `{{dato}}`, nunca `{{{dato}}}`: el triple bigote no escapa el HTML.
- La clase `no-romper` evita que un bloque (firmas, totales) quede partido entre páginas.
- Todo nombre con firma lleva el cargo debajo (spec 025).

No hace falta registrar la plantilla: `PdfService` la busca por nombre de archivo, y
`nest-cli.json` ya copia `templates/**/*.hbs` a `dist/`.

## 2. Builder

Si el armado de datos tiene lógica (filas mínimas, totales, formatos), separarlo en una función pura
`src/<modulo>/<nombre>.builder.ts`:

```ts title="src/<modulo>/planilla.builder.ts"
export interface PlanillaDoc {
  codigoPlanilla: string;
  filas: { fecha: string; nombre: string; monto: string }[];
  firmas: FirmasDireccion;
}

export function construirPlanilla(
  fuente: PlanillaCompleta,
  firmas: FirmasDireccion
): PlanillaDoc {
  // sin Prisma, sin Nest: solo transformar datos
}
```

Al ser pura, se prueba con Jest sin módulo de Nest (como `anexo1.builder.spec.ts`).

## 3. Servicio

En el servicio del módulo, un `armarDocumento` privado y los dos métodos públicos:

```ts
private async armarDocumento(id: number, user: UsuarioContexto): Promise<DocumentoPdf> {
  const registro = await this.findOne(id, user); // aplica los permisos de lectura
  return documentoPdf(
    'planilla-ejemplo.hbs',
    construirPlanilla(registro, await firmasDireccion(this.prisma)),
    // { landscape: true } si el formato es apaisado
  );
}

async generatePdf(id: number, user: UsuarioContexto): Promise<Buffer> {
  return this.pdfService.pdfDe(await this.armarDocumento(id, user));
}

async getDocumentoHtml(id: number, user: UsuarioContexto): Promise<string> {
  return this.pdfService.htmlDe(await this.armarDocumento(id, user));
}
```

El módulo debe importar `PdfModule`.

## 4. Controlador

Dos endpoints, copiados del patrón de `informes-viaje.controller.ts`:

```ts title="Patrón de informes-viaje.controller.ts"
function contexto(req: RequestWithUser) {
  return { id: req.user.userId, rol: req.user.rol };
}

@Get(':id/documento')
@ApiProduces('text/html')
@Header('Content-Type', 'text/html; charset=utf-8')
getDocumento(
  @Param('id', ParseIntPipe) id: number,
  @Req() req: RequestWithUser,
): Promise<string> {
  return this.service.getDocumentoHtml(id, contexto(req));
}

@SkipThrottle()
@Get(':id/pdf')
@ApiProduces('application/pdf')
async generatePdf(
  @Param('id', ParseIntPipe) id: number,
  @Req() req: RequestWithUser,
  @Res() res: Response,
) {
  const buffer = await this.service.generatePdf(id, contexto(req));
  res.set({
    'Content-Type': 'application/pdf',
    'Content-Disposition': 'inline; filename="planilla.pdf"',
  });
  res.send(buffer);
}
```

El controlador lleva `@UseGuards(JwtAuthGuard, RolesGuard)` a nivel de clase, como el resto.

## 5. Frontend

1. En el servicio del dominio (`lib/services/...`), un método que pida el PDF con
   `responseType: 'blob'`.
2. En la página de detalle, el visor:

```tsx
<DocumentoViewer
  titulo="ANEXO 8 — Planilla de alimentación"
  ruta={`/planillas/${id}/documento`}
  recargarCon={registro.updatedAt}
  acciones={<Button onClick={descargar}>Descargar PDF</Button>}
/>
```

3. El botón de descarga usa `downloadBlob(() => servicio.downloadPdf(id), nombreArchivo)`.

## 6. Verificar

- Abrir la vista HTML y el PDF y compararlos con el formulario de ACEAA.
- Probar un registro con muchas filas: que los bloques `no-romper` no queden cortados.
- Probar con un usuario sin permiso: debe recibir 403 también en `documento` y `pdf`.
- Si hay cálculos, un test del builder.
