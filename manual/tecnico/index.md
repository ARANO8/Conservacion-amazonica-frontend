---
title: Introducción
sidebar_position: 1
slug: /
---

# Manual técnico de AMZ Desk

Documentación para quien desarrolla, despliega o mantiene AMZ Desk. Requiere la sesión de
AMZ Desk iniciada: describe la arquitectura, los datos y la infraestructura del sistema.

## El sistema en una frase

Una API REST en NestJS con PostgreSQL (Prisma) y una aplicación Next.js, publicadas como
contenedores detrás de un proxy nginx en un VPS bajo el prefijo `/amzdesk`. La API genera los
documentos oficiales (anexos) en HTML, PDF y Excel.

## Repositorios

| Repositorio                       | Contenido                                                                                      | Rama de trabajo |
| --------------------------------- | ---------------------------------------------------------------------------------------------- | --------------- |
| `Conservacion-amazonica-backend`  | API NestJS, Prisma, plantillas de documentos, `deploy/` (compose de producción y proxy `edge`) | `develop`       |
| `Conservacion-amazonica-frontend` | Aplicación Next.js y este manual (`manual/`)                                                   | `develop`       |

Solo un push a `main` despliega. La especificación de cada funcionalidad vive en `specs/`,
fuera de los repositorios (ver [Desarrollo](./desarrollo/)).

## Secciones

- [Arquitectura](./arquitectura/): piezas, stack y recorrido de una petición.
- [Backend](./backend/) y [Frontend](./frontend/): módulos, autenticación y convenciones.
- [Datos](./datos/): modelo, máquinas de estado y fórmulas fiscales.
- [Documentos](./documentos/): anexos en HTML, PDF y Excel; firmas y logos.
- [Desarrollo](./desarrollo/): entorno local, migraciones, tests y flujo de trabajo.
- [Despliegue](./despliegue/) y [Operación](./operacion/): CI/CD, VPS, proxy, logs y problemas
  conocidos.
