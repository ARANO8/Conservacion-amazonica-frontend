---
title: Este manual
sidebar_position: 5
---

# Este manual

Los manuales de AMZ Desk (usuario y técnico) son un proyecto Docusaurus 3 en la carpeta
`manual/` del repo del frontend (spec 026). Es un proyecto independiente: tiene su propio
`package.json` y su propio `pnpm-workspace.yaml`, y no entra al bundle de Next ni a su lint.

## Estructura

```text
Conservacion-amazonica-frontend/manual/
  docusaurus.config.ts     un proyecto, dos sitios (DOCS_SITIO)
  sidebars.ts              barra lateral autogenerada desde las carpetas
  GUIA-REDACCION.md        reglas de redacción (no se publica)
  usuario/                 contenido del manual de usuario
  tecnico/                 contenido del manual técnico
  src/css/custom.css       colores de la app
  static/img/              logos y capturas (static/img/capturas/)
  scripts/                 script de capturas con Playwright
  Dockerfile               imagen de producción (nginx con los dos sitios)
```

## Por qué dos sitios

Docusaurus es una SPA: al navegar dentro del sitio, el contenido de las páginas se descarga en
paquetes JS de `/assets/`, no desde la URL de cada página. Si usuario y técnico fueran un solo
sitio con la ruta `/tecnico/` protegida, el contenido técnico se podría leer igualmente desde
los JS del sitio público.

Por eso el mismo proyecto se compila **dos veces**, cada una con su `baseUrl`, sus assets y su
índice de búsqueda. La variable `DOCS_SITIO` elige cuál:

```ts title="manual/docusaurus.config.ts (extracto)"
const sitio: Sitio =
  process.env.DOCS_SITIO === 'tecnico' ? 'tecnico' : 'usuario';

const SITIOS = {
  usuario: { titulo: 'Manual de usuario', baseUrl: '/amzdesk/manual/' },
  tecnico: { titulo: 'Manual técnico', baseUrl: '/amzdesk/manual/tecnico/' },
};
```

| `DOCS_SITIO`              | Carpeta de contenido | `baseUrl`                  | Acceso en producción   |
| ------------------------- | -------------------- | -------------------------- | ---------------------- |
| `usuario` (o sin definir) | `usuario/`           | `/amzdesk/manual/`         | público                |
| `tecnico`                 | `tecnico/`           | `/amzdesk/manual/tecnico/` | con sesión de AMZ Desk |

Tema, logos, colores e idioma (`es`) son comunes. El buscador es local
(`@easyops-cn/docusaurus-search-local`): el índice viaja dentro de cada build, sin servicios
externos. Los diagramas usan Mermaid (`@docusaurus/theme-mermaid`).

Cómo se protege el sitio técnico en producción: ver
[El manual en producción](../despliegue/manual-en-produccion.md).

## Comandos

Se ejecutan dentro de `manual/`, después de `pnpm install` en esa carpeta.

| Comando                                            | Qué hace                                                  |
| -------------------------------------------------- | --------------------------------------------------------- |
| `pnpm start`                                       | Manual de usuario en modo desarrollo, puerto **3002**     |
| `pnpm run start:tecnico`                           | Manual técnico en modo desarrollo, puerto **3003**        |
| `pnpm run build`                                   | Compila los dos sitios: `build/usuario` y `build/tecnico` |
| `pnpm run build:usuario`, `pnpm run build:tecnico` | Compila uno solo                                          |
| `pnpm run serve`                                   | Sirve el build del manual de usuario en el puerto 3002    |
| `pnpm run typecheck`                               | Chequeo de tipos de la configuración                      |
| `pnpm run capturas`                                | Regenera las capturas con Playwright                      |

En desarrollo cada sitio se abre en su `baseUrl`:

```text
http://localhost:3002/amzdesk/manual/
http://localhost:3003/amzdesk/manual/tecnico/
```

:::info Enlaces entre los dos manuales
Los enlaces de la barra superior ("Manual técnico", "Manual de usuario", "Ir a AMZ Desk") son
rutas absolutas de producción (`/amzdesk/...`). En desarrollo, con cada sitio en su puerto, no
llevan al otro manual: es lo esperado. El buscador local tampoco funciona con `pnpm start`; se
prueba con un build y `pnpm run serve`.
:::

:::tip Verificar sin build
Igual que en el resto del proyecto, mientras se escribe basta con `pnpm start`: recarga en
caliente y muestra los errores de MDX. El build lo hace la imagen en el CI. La configuración
tiene `onBrokenLinks: 'throw'`, así que un enlace roto entre páginas **rompe el build** y, con
él, el despliegue del frontend.
:::

## Capturas

`manual/scripts/capturas.ts` recorre la app local con Playwright, entra con usuarios de prueba
de cada rol y guarda las imágenes en `manual/static/img/capturas/`. Usa los datos de
`prisma/seed-test-data.ts` del backend (ver [Base de datos](./base-de-datos.md)).

Requisitos: base sembrada con el seed principal y los datos de prueba, backend en el puerto 3000
y frontend en el 3001.

```bash
cd Conservacion-amazonica-frontend/manual
pnpm run capturas
```

Las páginas del manual de usuario referencian las capturas como
`/img/capturas/<seccion>-<nombre>.png`. Cuando cambia una pantalla, se vuelven a generar en
lugar de retocarlas a mano.

:::info Capturas
`pnpm capturas` (o `pnpm capturas viajes-` para un grupo) lee `scripts/capturas.json` (archivo,
ruta, rol, clics opcionales) y entra con el primer usuario activo de cada rol, firmando la
sesión con el `JWT_SECRET` del `.env` del backend, como las pruebas E2E. Necesita el backend y
el frontend de desarrollo corriendo y la base en el contenedor `amazonica_db` (variables
`CAPTURAS_DOCKER=podman`, `CAPTURAS_FRONT_URL`, `CAPTURAS_DB_CONTAINER` para cambiarlo).
Antes de cada captura reemplaza en pantalla los nombres, correos y C.I. reales por datos
ficticios: el manual de usuario es público. Las capturas se commitean en
`static/img/capturas/`.
:::

## Cómo escribir

Las reglas están en `manual/GUIA-REDACCION.md` (no se publica). Lo esencial:

- Cada sección es una carpeta con `_category_.json` (`label`, `position`,
  `link: generated-index`).
- Cada página lleva front matter con `title` y `sidebar_position`, y un `# Título` igual.
- Todo sale del código, de `AGENTS.md` y de `specs/`. Lo que no se puede confirmar se marca con
  `:::caution Pendiente de confirmar`.
- Sin secretos ni datos personales: ni contraseñas, ni `JWT_SECRET`, ni IP o usuario del VPS,
  ni C.I. ni nombres de la planilla.
- MDX: nada de `<` ni llaves sueltas en el texto; usar código entre comillas invertidas.
- Los enlaces son relativos al `.md` y solo dentro del mismo manual. Usuario y técnico son
  sitios distintos y no se enlazan entre sí.
- Nombres de botones, pestañas y estados exactamente como en la app, sacados del código.

## Mantenerlo al día

El manual envejece con cada cambio. Por eso forma parte de la
[definición de hecho](./convenciones.md#definición-de-hecho):

- Si cambia un **flujo, una pantalla o un estado**, se actualiza el manual de usuario y, si
  cambió lo que se ve, se regeneran las capturas.
- Si cambia la **arquitectura, el despliegue o la operación**, se actualiza el manual técnico.
- El manual se publica con el frontend: no hay un despliegue aparte. Al hacer push a `main` del
  frontend, el CI construye también la imagen del manual.
