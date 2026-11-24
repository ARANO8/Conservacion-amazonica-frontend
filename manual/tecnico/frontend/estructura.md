---
title: Estructura y rutas
sidebar_position: 1
---

# Estructura y rutas

Next.js 16 con App Router, React 19 y TypeScript estricto. Alias `@/` a la raíz del repo.

## Carpetas

```text
app/                 Rutas (App Router)
  app/               Rutas de la aplicación, con el layout de la barra lateral
  login/  signup/    Públicas
components/
  ui/                Kit shadcn (primitivas)
  shared/            Visores de documentos, badges de estado, línea de tiempo de auditoría
  auth/  layout/     Login, listener de 401, barra lateral, polling de notificaciones
  solicitudes/ rendiciones/ planes-viaje/ informes-viaje/ liquidaciones-viaticos/
  declaraciones-movilidad/ solicitudes-compra/ cotizaciones/ cuadros-comparativos/
  ordenes-compra/ dashboard/
hooks/               use-catalogos, use-notificaciones-polling, use-prevent-navigation, ...
lib/
  api.ts             Instancia Axios y su interceptor
  services/          Un objeto por dominio que habla con la API
  adapters/          Formulario a payload y respuesta a formulario
  mappers/           Transformaciones para componentes de desglose
  utils/             download-blob.ts
  tax-calculator.ts  liquidacion-viaticos.ts  declaracion-movilidad.ts  rendicion-anexo4.ts
  cuadro-analisis.ts sedes.ts  manual.ts  theme-context.tsx  utils.ts
store/               Zustand: auth-store.ts, useNotificacionesStore.ts
types/               Contratos con el backend y esquemas zod compartidos
public/              Logo y docs/ (PDF de la Base Documental)
e2e/                 Pruebas Playwright
manual/              Este sitio (Docusaurus), proyecto aparte
```

Convenciones de nombres: archivos `kebab-case.tsx` con export `PascalCase`; hooks `use-*.ts`
exportando `useAlgo`; servicios `algo-service.ts` exportando `algoService`.

## Rutas públicas

| Ruta      | Archivo               | Qué hace                                                                             |
| --------- | --------------------- | ------------------------------------------------------------------------------------ |
| `/`       | `app/page.tsx`        | `redirect('/login')`                                                                 |
| `/login`  | `app/login/page.tsx`  | Formulario de acceso, indicador de conexión con la API y enlace al manual de usuario |
| `/signup` | `app/signup/page.tsx` | Registro deshabilitado: `redirect('/login')`                                         |

## Rutas de la aplicación (`app/app/*`)

`app/app/layout.tsx` monta la barra lateral, las migas de pan, `AuthExpiredListener` y el
proveedor de polling de notificaciones. `app/app/page.tsx` redirige a `/app/inicio`.

| Ruta                     | Qué es                                                                                |
| ------------------------ | ------------------------------------------------------------------------------------- |
| `inicio`                 | Dashboard                                                                             |
| `analitica`              | Analítica avanzada                                                                    |
| `planes-viaje`           | Plan de Viaje (ANEXO 1): lista, `nueva`, `[id]`, `[id]/editar`                        |
| `solicitudes`            | Solicitudes de viaje (ANEXO 2): lista, `nueva`, `[id]`, `[id]/editar`                 |
| `solicitudes-compra`     | Solicitudes de compras y servicios (ANEXO 3)                                          |
| `aprobaciones`           | Bandeja: lo que el usuario tiene que derivar, observar o desembolsar; `[id]`          |
| `rendiciones`            | Rendiciones (ANEXO 4): lista, `nueva`, `[id]`, `[id]/editar`, `detalle/[solicitudId]` |
| `informes-viaje`         | Informe de Viaje (ANEXO 7)                                                            |
| `liquidaciones-viaticos` | Liquidación de Viáticos (ANEXO 5)                                                     |
| `declaracion-movilidad`  | Declaración Jurada de Movilidad (ANEXO 6)                                             |
| `cotizaciones`           | Cotizaciones                                                                          |
| `cuadros-comparativos`   | Cuadro Comparativo (ANEXO 11)                                                         |
| `ordenes-compra`         | Orden de Compra (ANEXO 12)                                                            |
| `monitor`                | Seguimiento de solicitudes para roles administrativos                                 |
| `monitor-rendiciones`    | Seguimiento de rendiciones                                                            |
| `auditoria`              | Centro de auditoría                                                                   |
| `documentos`             | Base Documental: PDF estáticos de `public/docs/`                                      |
| `usuarios`               | Gestión de usuarios (`ADMIN`)                                                         |

Son 18 carpetas. La barra lateral (`components/layout/app-sidebar.tsx`) decide qué entradas ve
cada rol; eso es orientación, no seguridad. Ver [Autenticación](./autenticacion.md).

### Patrón de las páginas

- Las `page.tsx` son la entrada; muchas son `'use client'` porque cargan datos desde el
  navegador con la cookie de sesión.
- Donde la página es Server Component, la parte interactiva va en un `client-wrapper.tsx` hermano
  (`cotizaciones/[id]`, `rendiciones/[id]`, `ordenes-compra/[id]`...).
- Las tablas usan `@tanstack/react-table` con `columns.tsx` y `data-table.tsx` en la carpeta de
  la ruta.

## basePath `/amzdesk`

En producción la aplicación vive en `/amzdesk`. `next.config.ts` lo toma de una variable:

```ts title="next.config.ts"
const basePath = process.env.NEXT_PUBLIC_BASE_PATH;

const nextConfig: NextConfig = {
  output: 'standalone',
  ...(basePath ? { basePath } : {}),
  images: { unoptimized: true },
};
```

- En desarrollo `NEXT_PUBLIC_BASE_PATH` no existe y la app sirve en la raíz.
- El `Dockerfile` lo fija como `ARG` en `/amzdesk` y también `NEXT_PUBLIC_API_URL=/amzdesk/api`.
  Las dos se **hornean en el build**: cambiarlas exige reconstruir la imagen.
- `Link`, `router.push` y `redirect` agregan el prefijo solos. Lo que no pasa por Next (atributos
  `src` de imágenes, enlaces absolutos, URLs que se copian) usa `withBasePath()` de `lib/utils.ts`.
- `images.unoptimized` evita que el optimizador de Next busque los archivos en la raíz y responda 400.

```ts title="lib/utils.ts"
export function withBasePath(path: string): string {
  return `${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}${path}`;
}
```

## Tema

`lib/theme-context.tsx` es un proveedor propio de modo oscuro (reemplazó a `next-themes`). El
`html` arranca con la clase `dark`. Los componentes usan los tokens semánticos de shadcn
(`bg-background`, `text-muted-foreground`), no colores fijos.
