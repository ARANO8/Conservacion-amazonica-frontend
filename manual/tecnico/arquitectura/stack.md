---
title: Stack y versiones
sidebar_position: 2
---

# Stack y versiones

Las versiones salen del `package.json` de cada repo. Entre paréntesis, la versión instalada en
`node_modules` cuando el rango del `package.json` es abierto.

## Comunes

| Pieza                            | Versión                                               | Dónde se fija                           |
| -------------------------------- | ----------------------------------------------------- | --------------------------------------- |
| Node.js                          | `>=20.9.0`; las imágenes usan `node:20-bookworm-slim` | `engines` y `Dockerfile` de ambos repos |
| pnpm                             | `10.14.0`                                             | `packageManager` de ambos repos         |
| TypeScript                       | `^5.7.3` backend, `^5` frontend                       | `devDependencies`                       |
| ESLint                           | `^9` (flat config)                                    | `devDependencies`                       |
| Prettier                         | `^3`                                                  | `devDependencies`                       |
| Husky + lint-staged + commitlint | `^9` / `^16` / `^20`                                  | `devDependencies`                       |

## Backend

`Conservacion-amazonica-backend/package.json`

| Pieza                                             | Versión                   | Para qué                                   |
| ------------------------------------------------- | ------------------------- | ------------------------------------------ |
| `@nestjs/core`, `common`, `platform-express`      | `^11.0.1` (11.1.11)       | Framework HTTP                             |
| `@nestjs/config`                                  | `^4.0.2`                  | `ConfigModule.forRoot({ isGlobal: true })` |
| `@nestjs/jwt`, `@nestjs/passport`, `passport-jwt` | `^11` / `^11` / `^4`      | Autenticación JWT                          |
| `@nestjs/throttler`                               | `^6.5.0`                  | Rate limiting global                       |
| `@nestjs/swagger`, `swagger-ui-express`           | `^11.2.3` / `^5`          | OpenAPI en `/doc`                          |
| `prisma`, `@prisma/client`                        | `5.21.0` (fijo)           | ORM y migraciones                          |
| `class-validator`, `class-transformer`            | `^0.14.3` / `^0.5.1`      | Validación de DTOs                         |
| `bcrypt`                                          | `^6.0.0`                  | Hash de contraseñas                        |
| `helmet`                                          | `^8.2.0`                  | Cabeceras de seguridad                     |
| `cookie-parser`                                   | `^1.4.7`                  | Leer la cookie del JWT                     |
| `handlebars`                                      | `4.7.9` (fijo)            | Plantillas de documentos                   |
| `puppeteer`                                       | `^24.40.0`                | HTML a PDF                                 |
| `exceljs`                                         | `^4.4.0`                  | ANEXO 4 en Excel                           |
| `jest`, `ts-jest`, `@nestjs/testing`              | `^30` / `^29.2.5` / `^11` | Tests unitarios                            |
| `prisma-erd-generator`                            | `^2.4.2`                  | Genera `ERD.md`                            |

## Frontend

`Conservacion-amazonica-frontend/package.json`

| Pieza                                     | Versión                        | Para qué                              |
| ----------------------------------------- | ------------------------------ | ------------------------------------- |
| `next`                                    | `16.2.7` (fijo)                | App Router, salida `standalone`       |
| `react`, `react-dom`                      | `19.2.3` (fijo)                | UI                                    |
| `tailwindcss`                             | `^4` (4.1.18)                  | Estilos                               |
| `shadcn` + `radix-ui` + `@base-ui/react`  | `^3.6.2` / `^1.4.3` / `^1.0.0` | Kit de componentes en `components/ui` |
| `axios`                                   | `^1.17.0`                      | Cliente HTTP (`lib/api.ts`)           |
| `zustand`                                 | `^5.0.9`                       | Estado global (`store/`)              |
| `react-hook-form` + `@hookform/resolvers` | `^7.71.0` / `^3.10.0`          | Formularios                           |
| `zod`                                     | `^3.24.1` (3.25.76)            | Esquemas de validación                |
| `@tanstack/react-table`                   | `^8.21.3`                      | Tablas de datos                       |
| `recharts`                                | `2.15.4` (fijo)                | Gráficos de analítica                 |
| `sonner`                                  | `^2.0.7`                       | Toasts                                |
| `date-fns`, `react-day-picker`            | `^4.1.0` / `^9.14.0`           | Fechas                                |
| `lucide-react`                            | `^0.562.0`                     | Íconos                                |
| `@playwright/test`                        | `^1.63.0`                      | Pruebas E2E (`e2e/`)                  |

## Manuales

`manual/package.json` usa Docusaurus `^3.9.2` con `@docusaurus/theme-mermaid` y búsqueda local.
Un solo proyecto compila dos sitios (usuario y técnico) según `DOCS_SITIO`.

## Infraestructura

| Pieza      | Versión                                                                        |
| ---------- | ------------------------------------------------------------------------------ |
| PostgreSQL | `postgres:15-alpine`, en producción y en el `docker-compose.yml` de desarrollo |
| Proxy      | `nginx:alpine` (stack `edge`)                                                  |
| Chromium   | paquete `chromium` de Debian bookworm en la imagen del backend                 |
