---
title: Validación y errores
sidebar_position: 4
---

# Validación y errores

## Validación de entrada

Toda entrada pasa por el `ValidationPipe` global:

```ts title="src/main.ts"
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true, // descarta propiedades sin decorador
    forbidNonWhitelisted: true, // ...y además responde 400 si llegan
    transform: true, // convierte el body en la clase del DTO
  })
);
```

Consecuencia práctica: **un campo que el frontend envía y el DTO no declara hace fallar la
petición con 400**. Al agregar un campo al formulario hay que agregarlo también al DTO.

### DTOs

Viven en `src/<modulo>/dto/`. Convenciones:

- Cada campo lleva un decorador de `class-validator` (`@IsString`, `@IsInt`, `@IsEnum`,
  `@IsOptional`, `@IsUrl`, `@IsDateString`, `@Min`...).
- Los mensajes de validación van en español.
- Los objetos anidados usan `@ValidateNested()` con `@Type(() => OtroDto)`; el `@Type` es lo que
  hace que `transform` instancie la clase anidada y la valide.
- Los DTOs de actualización extienden el de creación con `PartialType(CreateXDto)`, importado de
  `@nestjs/swagger` para que Swagger herede la documentación.
- `@ApiProperty({ example })` documenta el campo en Swagger. El plugin de `@nestjs/swagger` está
  activo en `nest-cli.json` e infiere los tipos.

```ts title="src/solicitudes/dto/desembolsar-solicitud.dto.ts"
export class DesembolsarSolicitudDto {
  @ApiProperty({ example: 'TR4500' })
  @IsString()
  @IsNotEmpty({ message: 'El código de desembolso es obligatorio' })
  codigoDesembolso: string;

  @ApiProperty({ example: 'https://drive.google.com/file/d/abc123/view' })
  @IsNotEmpty({
    message: 'La URL del comprobante de transferencia es obligatoria',
  })
  @IsUrl({}, { message: 'La URL del comprobante no es válida' })
  urlComprobante: string;

  @ApiPropertyOptional({ example: 'Bisa 34-6839-020-4' })
  @IsOptional()
  @IsString()
  banco?: string;
}
```

### Validación de negocio

Lo que no se expresa en un DTO (estado actual, saldo del POA, propiedad del registro) se valida
**al principio del método del servicio**, antes de escribir:

```ts title="src/solicitudes/solicitudes.service.ts"
if (solicitud.estado !== EstadoSolicitud.PENDIENTE) {
  throw new BadRequestException(
    'La solicitud debe estar en estado PENDIENTE para ser desembolsada'
  );
}
```

Las validaciones que dependen de datos que pueden cambiar en paralelo (saldo del POA al crear,
techo del POA al aprobar una rendición) se hacen **dentro** de la transacción.

## Excepciones

Los servicios lanzan las excepciones HTTP de NestJS, con mensaje en español:

| Excepción                      | Código | Uso típico                                                                 |
| ------------------------------ | ------ | -------------------------------------------------------------------------- |
| `BadRequestException`          | 400    | Estado que no admite la transición, saldo insuficiente, datos incoherentes |
| `UnauthorizedException`        | 401    | Credenciales o sesión inválidas                                            |
| `ForbiddenException`           | 403    | No es el dueño, no está en la bandeja, rol insuficiente en el servicio     |
| `NotFoundException`            | 404    | Registro inexistente o borrado                                             |
| `InternalServerErrorException` | 500    | Fallos de Puppeteer o plantilla inexistente                                |

No se capturan errores para silenciarlos. La excepción a esa regla son las notificaciones, que se
envuelven en `try/catch` para no revertir la operación principal.

## Filtros globales

### `PrismaClientExceptionFilter`

Atiende solo `Prisma.PrismaClientKnownRequestError`:

| Código Prisma                              | Respuesta | Mensaje                                                               |
| ------------------------------------------ | --------- | --------------------------------------------------------------------- |
| `P2002` (unique)                           | 409       | `Ya existe un registro con esos datos únicos`                         |
| `P2025` (no encontrado en update o delete) | 404       | `El registro solicitado no fue encontrado`                            |
| Cualquier otro                             | 500       | `Error interno del servidor` (y se registra código, `meta` y mensaje) |

Nunca devuelve detalles internos de la base.

### `AllExceptionsFilter`

El de último recurso (`@Catch()` sin argumentos):

- `HttpException`: respeta el código. Si el mensaje es un arreglo (los errores del
  `ValidationPipe`), lo une con `. `. Registra los 4xx como `warn` y los 5xx como `error` con
  traza.
- Cualquier otro `Error`: 500 genérico. Registra la traza y el body de la petición
  **sanitizado** (`password`, `contrasena`, `token`, `accessToken`, `refreshToken` se reemplazan
  por `***`), truncado a 2000 caracteres.

Forma de la respuesta:

```json
{
  "statusCode": 400,
  "message": "La solicitud debe estar en estado PENDIENTE para ser desembolsada",
  "error": "BAD_REQUEST",
  "timestamp": "2026-10-30T14:00:00.000Z",
  "path": "/solicitudes/5/desembolsar"
}
```

:::info
`PrismaClientExceptionFilter` no incluye `timestamp` ni `path`. El frontend solo lee `message`,
así que la diferencia no se nota en la interfaz.
:::

## Cómo lo consume el frontend

El frontend muestra `error.response.data.message` con `toast.error`. Los mensajes del backend
llegan tal cual al usuario: deben ser comprensibles para alguien que no programa.
