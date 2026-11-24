# AMZ Desk — Frontend

Interfaz web de **AMZ Desk**, el sistema de gestión administrativa y financiera de
**ACEAA** (Asociación de Conservación Amazónica). Cubre el ciclo completo de solicitudes
de gasto y viaje, aprobaciones, desembolsos, rendiciones de cuentas, el subflujo de
compras (cotizaciones → cuadro comparativo → orden de compra) y el presupuesto anual (POA).

Consume la API REST de [`Conservacion-amazonica-backend`](../Conservacion-amazonica-backend).

---

## Stack

|               |                                    |
| ------------- | ---------------------------------- |
| Framework     | Next.js 16 (App Router) · React 19 |
| Lenguaje      | TypeScript en modo estricto        |
| Estilos       | Tailwind CSS v4 + shadcn/ui        |
| Formularios   | React Hook Form + Zod              |
| Estado global | Zustand                            |
| HTTP          | Axios con interceptor de 401       |

---

## Puesta en marcha

Requiere **pnpm** y el backend corriendo en el puerto 3000.

```bash
pnpm install
cp .env.example .env.local   # si no existe, crearlo con el contenido de abajo
pnpm run dev
```

La aplicación queda en **http://localhost:3001** (no en el 3000: ese puerto es del backend).

### Variables de entorno

`.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### Comandos

```bash
pnpm run dev        # servidor de desarrollo, puerto 3001
pnpm run lint       # ESLint — usar esto para verificar, no build
pnpm run build      # solo en la etapa de despliegue
pnpm run spec:sync  # regenerar backend-spec.json desde el backend en marcha
```

---

## Estructura

Las rutas de la aplicación viven bajo `app/app/*`; `app/login` y `app/signup` son públicas.

La autenticación usa una cookie httpOnly emitida por el backend. **No hay `middleware.ts`**:
la protección es reactiva — el interceptor de 401 en `lib/api.ts` junto con
`components/auth/auth-expired-listener.tsx` redirigen a `/login` cuando la sesión caduca.
La autorización real la impone el backend con `@Roles()`.

`types/backend.ts` se deriva de `backend-spec.json`, el volcado OpenAPI del backend
(`/doc-json`). Tras cambiar contratos en el backend, regenerarlo con `pnpm run spec:sync`.

El detalle de convenciones, patrones y estructura de directorios está en
[`AGENTS.md`](./AGENTS.md).

---

## Notas

- No hay framework de tests configurado en este repositorio.
- Rama de trabajo: `develop`. El despliegue se dispara con un push a `main`.
- Commits con Conventional Commits (validados por commitlint en pre-commit).
