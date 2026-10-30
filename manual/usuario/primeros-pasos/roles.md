---
title: Roles y qué ve cada uno
sidebar_position: 3
---

# Roles y qué ve cada uno

Cada cuenta de AMZ Desk tiene **un rol**. El rol decide qué entradas ves en el panel lateral
y, sobre todo, qué acciones te deja hacer el sistema. Puedes ver tu rol en el menú de tu
cuenta, al pie del panel lateral, en la línea **Cuenta**.

:::info Quién decide de verdad
El panel lateral solo orienta. Quien controla los permisos es el servidor: si una pantalla se
abre pero la acción no te corresponde, el sistema la rechaza con un mensaje.
:::

## Los seis roles

| Rol                 | Quién lo tiene, en general                            | Qué hace en el sistema                                                                                                                                            |
| ------------------- | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `USUARIO`           | Especialistas, coordinadores y directores de programa | Planifica viajes, pide fondos, rinde, registra cotizaciones y cuadros comparativos. Revisa lo que otra persona le asigna (por ejemplo, como Director de Programa) |
| `TESORERO`          | Dirección Financiera                                  | Desembolsa las solicitudes y registra los pagos de las cuotas de consultoría                                                                                      |
| `CONTADOR`          | Contabilidad                                          | Aprueba rendiciones. En compras, revisa el cuadro comparativo y lo pasa a validación y a aprobación                                                               |
| `VALIDADOR_COMPRAS` | Responsable de Adquisiciones y Logística              | Valida el cuadro comparativo                                                                                                                                      |
| `EJECUTIVO`         | Dirección Ejecutiva y Administración General          | Aprueba el cuadro comparativo. Puede desembolsar y ve todas las cotizaciones, cuadros y órdenes                                                                   |
| `ADMIN`             | Administración del sistema                            | Gestiona usuarios y roles. Puede actuar en cualquier paso de cualquier flujo                                                                                      |

El papel de **Director de Programa** no es un rol: es la persona que el emisor elige al enviar
su solicitud. Cualquier cuenta puede recibir ese encargo.

## Qué entradas del menú ve cada rol

| Entrada del panel                        | `USUARIO` | `VALIDADOR_COMPRAS` | `CONTADOR` | `TESORERO` | `EJECUTIVO` | `ADMIN` |
| ---------------------------------------- | :-------: | :-----------------: | :--------: | :--------: | :---------: | :-----: |
| **Inicio**                               |    Sí     |         Sí          |     Sí     |     Sí     |     Sí      |   Sí    |
| **Viajes y Viáticos**                    |    Sí     |         Sí          |     Sí     |     Sí     |     Sí      |   Sí    |
| **Compras y Servicios**                  |    Sí     |         Sí          |     Sí     |     Sí     |     Sí      |   Sí    |
| **Notificaciones**                       |    Sí     |         Sí          |     Sí     |     Sí     |     Sí      |   Sí    |
| **Base Documental**                      |    Sí     |         Sí          |     Sí     |     Sí     |     Sí      |   Sí    |
| **Centro de Auditoria**                  |    No     |         No          |     Sí     |     Sí     |     Sí      |   Sí    |
| **Monitores** (Solicitudes, Rendiciones) |    No     |         No          |     Sí     |     Sí     |     Sí      |   Sí    |
| **Analítica**                            |    No     |         No          |     Sí     |     Sí     |     Sí      |   Sí    |
| **Gestion de Usuarios**                  |    No     |         No          |     No     |     No     |     No      |   Sí    |

**Manual de usuario**, **Manual técnico**, **Soporte** y **Feedback** están siempre, para todos.

:::caution Pendiente de confirmar
El rol `VALIDADOR_COMPRAS` ve **Mis Rendiciones** en el menú, pero el servidor no le permite
consultar ni crear rendiciones. Falta confirmar si esa persona debe poder rendir.
:::

## Qué datos ve cada rol

Ver una entrada del menú no significa ver todos los datos. Cada lista se filtra así:

| Lista                               | Qué muestra                                                                                                                                                           |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Mis Solicitudes** (viajes)        | Solo las tuyas, para todos los roles                                                                                                                                  |
| **Solicitudes de Fondos** (compras) | `USUARIO`: las tuyas y las que tienes asignadas para revisar. Los demás roles: todas las solicitudes de compra                                                        |
| **Mis Cotizaciones**                | Las tuyas. `EJECUTIVO` y `ADMIN` ven todas                                                                                                                            |
| **Cuadros Comparativos**            | Los tuyos. Además, `CONTADOR` ve los que están **En revisión** o **Validado**, `VALIDADOR_COMPRAS` los que están **En validación**, y `EJECUTIVO` y `ADMIN` ven todos |
| **Órdenes de Compra**               | Las tuyas. `EJECUTIVO` y `ADMIN` ven todas                                                                                                                            |
| **Notificaciones**                  | Siempre las tuyas                                                                                                                                                     |

## Quién actúa en cada paso

| Paso                                                     | Rol que actúa                                                        |
| -------------------------------------------------------- | -------------------------------------------------------------------- |
| Revisar una solicitud y derivarla u observarla           | La persona asignada (cualquier rol)                                  |
| Desembolsar una solicitud                                | `TESORERO` (también `EJECUTIVO` y `ADMIN`)                           |
| Aprobar una rendición                                    | `CONTADOR`, `TESORERO`, `EJECUTIVO`, `ADMIN` o el aprobador asignado |
| Enviar el cuadro comparativo a validación y a aprobación | `CONTADOR` (o `ADMIN`)                                               |
| Validar el cuadro comparativo                            | `VALIDADOR_COMPRAS` (o `ADMIN`)                                      |
| Aprobar el cuadro comparativo                            | `EJECUTIVO` (o `ADMIN`)                                              |
| Aprobar el pago de una cuota de consultoría              | La persona a quien se envió la cuota                                 |
| Registrar el pago de una cuota                           | `TESORERO`, `EJECUTIVO` o `ADMIN`                                    |
| Crear, editar y dar de baja cuentas                      | `ADMIN`                                                              |

:::tip Si te falta un permiso
Si necesitas una entrada o una acción que no ves, pide al administrador del sistema que revise
tu rol. No compartas tu cuenta con otra persona: cada acción queda registrada a tu nombre.
:::
