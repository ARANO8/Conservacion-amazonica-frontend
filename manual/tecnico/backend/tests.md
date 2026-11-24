---
title: Tests
sidebar_position: 5
---

# Tests

## Configuración

Jest se configura dentro de `package.json`:

| Clave               | Valor           |
| ------------------- | --------------- |
| `rootDir`           | `src`           |
| `testRegex`         | `.*\.spec\.ts$` |
| `transform`         | `ts-jest`       |
| `testEnvironment`   | `node`          |
| `coverageDirectory` | `../coverage`   |

Los specs van junto al archivo que prueban. Los E2E usan otra configuración, `test/jest-e2e.json`.

```bash
pnpm run test                                         # todos
pnpm run test -- src/rendiciones/rendiciones.service.spec.ts
pnpm run test -- --testPathPattern="liquidacion.helper"
pnpm run test -- --testNamePattern="IDOR"
pnpm run test:cov                                     # con cobertura
```

## Qué hay

| Spec                                                             | Qué cubre                                                                                                      |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `auth/auth.controller.spec.ts`                                   | Metadatos de `GET /auth/sesion`: ruta, método, dos guards y `@SkipThrottle`                                    |
| `solicitudes/solicitudes.service.spec.ts`                        | Autorización de lectura (IDOR), plan de viaje obligatorio, corrección de una solicitud observada               |
| `solicitudes/tarifas-viaticos.spec.ts`                           | `calcularMontosViaticos`, `tarifaEnBolivianos` y la planilla `PVT` en la rendición                             |
| `rendiciones/rendiciones.service.spec.ts`                        | Aprobación por `CONTADOR` y techo del POA, autorización de lectura (IDOR), cálculos del ANEXO 4 en PDF y Excel |
| `cuadros-comparativos/cuadros-comparativos.service.spec.ts`      | Atomicidad de la edición y autorización de lectura según el estado                                             |
| `informes-viaje/informes-viaje.service.spec.ts`                  | Precarga del informe, armado del ANEXO 7 y la solicitud de la que nace                                         |
| `liquidaciones-viaticos/liquidacion.helper.spec.ts`              | Cálculo del ANEXO 5                                                                                            |
| `declaraciones-movilidad/declaraciones-movilidad.helper.spec.ts` | Grossing-up del ANEXO 6                                                                                        |
| `planes-viaje/planes-viaje.service.spec.ts`                      | `planCompleto`, listado y reglas de edición del plan                                                           |
| `planes-viaje/anexo1.builder.spec.ts`                            | Armado del ANEXO 1                                                                                             |

Son 10 archivos. No cubren la mayoría de los servicios: no hay que asumir que un cambio queda
protegido por la suite.

:::warning
`test/app.e2e-spec.ts` es el ejemplo que genera Nest: espera `GET /` con `Hello World!`, ruta que
no existe. Además levanta `AppModule` completo, que necesita base de datos y `JWT_SECRET`. No sirve
como prueba hasta reescribirlo.
:::

## Cómo se simula Prisma

Ningún spec toca la base. Se arma un módulo de prueba con `Test.createTestingModule` y se
reemplaza `PrismaService` por un objeto con **solo** los métodos que usa el código probado:

```ts title="src/rendiciones/rendiciones.service.spec.ts (resumen)"
type MockTx = {
  rendicion: { findUnique: jest.Mock; update: jest.Mock };
  solicitudPresupuesto: { findMany: jest.Mock };
  poa: { findMany: jest.Mock; update: jest.Mock };
  solicitud: { update: jest.Mock };
  historialAprobacion: { create: jest.Mock };
};

prismaMock = {
  // $transaction ejecuta el callback con el cliente transaccional simulado
  $transaction: jest
    .fn()
    .mockImplementation((cb: (tx: MockTx) => unknown) => cb(mockTx)),
  rendicion: { findFirst: jest.fn() },
  usuario: { findFirst: jest.fn().mockResolvedValue({ ... }) },
};

const module = await Test.createTestingModule({
  providers: [
    RendicionesService,
    { provide: PrismaService, useValue: prismaMock },
    { provide: PdfService, useValue: pdfServiceMock },
    {
      provide: NotificacionesService,
      useValue: { crearNotificacion: jest.fn() },
    },
  ],
}).compile();
```

Claves del patrón:

- **`$transaction` se simula ejecutando el callback** con un `mockTx` aparte. Así se prueban las
  escrituras dentro de la transacción y se puede comprobar que, si una validación falla, no se
  llamó a `update`.
- Los importes se construyen con `new Prisma.Decimal(...)`, igual que los devuelve Prisma.
- `PdfService` y `NotificacionesService` se reemplazan por mocks: los tests no lanzan Chromium ni
  escriben notificaciones.
- Para leer lo que recibió un mock, el spec de rendiciones usa un helper
  `primerArgumento<T>(mock)` que devuelve tipado el primer argumento de la primera llamada.

Los helpers puros (`*.helper.ts`, `*.builder.ts`) se prueban sin módulo de Nest: se importan y se
llaman directamente.

## Frontend

El frontend no tiene tests unitarios. Sí tiene **Playwright** (`playwright.config.ts`, carpeta
`e2e/`, `pnpm test:e2e`) con un caso de liquidación de viáticos que corre contra los servidores de
desarrollo ya levantados y el Chrome instalado, de a un caso por vez porque comparten la base.
