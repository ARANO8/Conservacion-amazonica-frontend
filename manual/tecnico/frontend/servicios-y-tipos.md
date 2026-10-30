---
title: Servicios, adaptadores y tipos
sidebar_position: 3
---

# Servicios, adaptadores y tipos

## Servicios (`lib/services/`)

Un archivo por dominio, cada uno exporta un **objeto plano** (no una clase) con métodos `async`
que usan la instancia `api`:

| Servicio                             | Recurso del backend                                                      |
| ------------------------------------ | ------------------------------------------------------------------------ |
| `solicitudes-service.ts`             | `/solicitudes` (viajes, compras, cuotas de consultoría, PDF y documento) |
| `planes-viaje-service.ts`            | `/planes-viaje`                                                          |
| `rendiciones-service.ts`             | `/rendiciones` (PDF, Excel, HTML del ANEXO 4)                            |
| `informes-viaje-service.ts`          | `/informes-viaje`                                                        |
| `liquidaciones-viaticos-service.ts`  | `/liquidaciones-viaticos`                                                |
| `declaraciones-movilidad-service.ts` | `/declaraciones-movilidad`                                               |
| `cotizaciones-service.ts`            | `/cotizaciones`                                                          |
| `cuadros-comparativos-service.ts`    | `/cuadros-comparativos`                                                  |
| `ordenes-compra-service.ts`          | `/ordenes-compra`                                                        |
| `notificaciones-service.ts`          | `/notificaciones`                                                        |
| `usuarios-service.ts`                | `/usuarios`                                                              |
| `dashboard-service.ts`               | `/dashboard`                                                             |
| `catalogos-service.ts`               | Catálogos y búsquedas del POA                                            |

```ts title="lib/services/solicitudes-service.ts (extracto)"
export const solicitudesService = {
  async getSolicitudById(id: string | number, signal?: AbortSignal) {
    const response = await api.get<SolicitudResponse>(`/solicitudes/${id}`, {
      signal,
    });
    return response.data;
  },
  // ...
};
```

Reglas:

- **No poner cabeceras de autenticación.** La cookie la manda el navegador por `withCredentials`.
  Algunos comentarios de los servicios todavía hablan de "token Bearer inyectado por el
  interceptor": es texto viejo, `lib/api.ts` ya no tiene interceptor de petición.
- **No capturar el 401.** Lo hace el interceptor.
- Aceptar un `AbortSignal` opcional y pasarlo a Axios: los componentes cancelan la petición al
  desmontarse o al cambiar de registro.
- Los PDF y el Excel se piden con `responseType: 'blob'` y se descargan con `downloadBlob()` de
  `lib/utils/download-blob.ts`, que rechaza la respuesta si el `Content-Type` no es el esperado
  (así un JSON de error no se descarga como archivo roto).
- Las vistas HTML se piden con `responseType: 'text'`.

Hay llamadas a `api` fuera de los servicios (por ejemplo `app/app/aprobaciones/inbox-actions.tsx`
y `components/solicitudes-compra/solicitud-compra-form.tsx`). Al tocarlas, conviene moverlas al
servicio del dominio.

## Adaptadores y mappers

| Carpeta         | Archivos                                                                                                 | Para qué                                                                                                                                                                                                                                                                          |
| --------------- | -------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `lib/adapters/` | `solicitud-adapter.ts`, `rendicion-adapter.ts`, `cotizacion-adapter.ts`, `cuadro-comparativo-adapter.ts` | Convertir los datos del formulario al payload del DTO del backend y la respuesta del backend a valores iniciales del formulario. Por ejemplo `adaptFormToPayload` y `adaptResponseToFormData` en solicitudes, `adaptCuadroFormToPayload` y `adaptCuadroResponseToForm` en cuadros |
| `lib/mappers/`  | `breakdown-mapper.ts`                                                                                    | Datos del formulario al formato del componente de desglose presupuestario                                                                                                                                                                                                         |

Como el backend usa `forbidNonWhitelisted`, **el payload no puede llevar campos de más**. El
adaptador es el lugar para quitar lo que solo existe en el formulario.

## Lógica de dominio en `lib/`

| Archivo                    | Espejo de                                        | Uso                                                            |
| -------------------------- | ------------------------------------------------ | -------------------------------------------------------------- |
| `tax-calculator.ts`        | `solicitudes.helper.ts`, `rendiciones.helper.ts` | Montos bruto, neto e impuestos mientras se llena el formulario |
| `liquidacion-viaticos.ts`  | `liquidacion.helper.ts`                          | Vista previa del ANEXO 5                                       |
| `declaracion-movilidad.ts` | `declaraciones-movilidad.helper.ts`              | `FACTOR_MOVILIDAD = 0.84`                                      |
| `rendicion-anexo4.ts`      | `anexo4.builder.ts`                              | Cálculos del ANEXO 4 en pantalla                               |
| `cuadro-analisis.ts`       | sin espejo                                       | Recomienda la cotización: cobertura y menor total              |
| `sedes.ts`                 | `sede.constants.ts`                              | Texto de cada sede                                             |

Estos cálculos usan `number` de JavaScript con redondeo a 2 decimales: sirven para la vista previa.
El monto que vale es el que recalcula el backend con `Prisma.Decimal`. Si cambia una regla fiscal
en el backend, hay que cambiar el espejo.

## Tipos (`types/`)

| Archivo                       | Contenido                                                                                                                                                        |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `backend.ts`                  | Tipos base (`Role`, `Usuario`, `LoginResponse`...), escritos a mano a partir de `backend-spec.json`                                                              |
| `*-backend.ts`                | Respuestas y payloads de cada dominio (`solicitud-backend.ts`, `rendicion-backend.ts`...)                                                                        |
| `*-schema.ts`                 | Esquemas zod compartidos entre pantallas (`rendicion-schema.ts`, `informe-viaje-schema.ts`, `liquidacion-viaticos-schema.ts`, `declaracion-movilidad-schema.ts`) |
| `catalogs.ts`, `breakdown.ts` | Catálogos y desglose                                                                                                                                             |

`backend-spec.json` es un volcado del OpenAPI del backend. Se regenera con el backend en marcha:

```bash
pnpm run spec:sync   # curl http://localhost:3000/doc-json -o backend-spec.json
```

:::caution
Los tipos **no se generan solos** a partir de ese archivo: se mantienen a mano. Nada avisa si el
backend cambia un DTO. Al cambiar un contrato hay que actualizar el tipo correspondiente.
:::

Los enums del backend se representan como uniones de literales (`'VIAJE' | 'COMPRA_SERVICIO'`), en
`SCREAMING_SNAKE_CASE`, igual que en Prisma.

## Estado global

Solo dos stores de Zustand en `store/`:

- `auth-store.ts`: sesión. Ver [Autenticación](./autenticacion.md).
- `useNotificacionesStore.ts`: notificaciones, contador de no leídas y polling. El hook
  `use-notificaciones-polling.ts` lo arranca con un intervalo de 60 segundos al haber usuario y lo
  detiene al salir.

El resto del estado es local de cada componente (`useState`) o del formulario.
