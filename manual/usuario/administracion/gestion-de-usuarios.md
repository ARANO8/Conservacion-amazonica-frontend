---
title: Gestión de usuarios
sidebar_position: 2
---

# Gestión de usuarios

Solo el rol `ADMIN` gestiona las cuentas. Nadie puede registrarse por su cuenta: la página de
registro está deshabilitada y lleva al ingreso.

Entra por **Gestion de Usuarios** en el panel lateral. Si otro rol abre esa dirección, la
aplicación lo devuelve a **Inicio**.

## La lista de usuarios

La tabla muestra **Nombre**, **Email**, **Rol**, **Cargo** y **Sede** de cada cuenta activa.
Arriba tienes tres filtros: **Filtrar por nombre...**, **Filtrar por email...** y **Filtrar por
rol...**.

En la columna **Rol**, el rol `USUARIO` se muestra como **EMISOR**.

![Gestion de Usuarios con la ventana Editar usuario abierta](/img/capturas/admin-usuarios.png)

## Crear un usuario

1. Pulsa **Nuevo usuario**.
2. Completa la ventana **Crear usuario**:

   | Campo        | Qué poner                                                           |
   | ------------ | ------------------------------------------------------------------- |
   | **Nombre**   | Nombre completo, tal como debe salir en las firmas                  |
   | **Email**    | El correo institucional; es el usuario para ingresar                |
   | **Password** | Contraseña inicial, mínimo 6 caracteres                             |
   | **Rol**      | **ADMIN**, **EJECUTIVO**, **CONTADOR**, **TESORERO** o **EMISOR**   |
   | **Cargo**    | El cargo de la planilla; se imprime bajo la firma en los anexos     |
   | **C.I.**     | Número y expedición, por ejemplo "4876543 LP"; máximo 30 caracteres |
   | **Sede**     | **La Paz**, **Trinidad**, **Cobija** o **Sin sede**                 |

3. Pulsa **Crear usuario**.

Comunica la contraseña a la persona por un canal seguro.

## Editar un usuario

1. Pulsa **Editar** en la fila del usuario.
2. Cambia lo necesario en la ventana **Editar usuario**.
3. Pulsa **Guardar cambios**.

**Password** es opcional al editar: si lo dejas vacío, se mantiene la contraseña actual. Si
escribes una nueva, reemplaza la anterior. Es la única forma de restablecer una contraseña
olvidada: no existe recuperación por correo.

## Qué hace cada dato

| Dato      | Dónde se usa                                                                                                                                                                             |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Rol**   | Qué ve la persona en el panel lateral y qué puede aprobar. Ver [Guías por rol](../roles/personal.md)                                                                                     |
| **Cargo** | Se imprime bajo el nombre en cada firma. El Plan de Viaje y la Declaración de Movilidad guardan el cargo del momento en que se crearon: cambiarlo después no altera documentos ya hechos |
| **C.I.**  | Se imprime en la firma del beneficiario del ANEXO 5 (Liquidación de Viáticos). Solo `ADMIN` lo ve                                                                                        |
| **Sede**  | Propone el "Lugar de emisión" al crear un Plan de Viaje (ANEXO 1). Sin sede, propone "La Paz"                                                                                            |

## Desactivar un usuario

1. Pulsa **Desactivar** en la fila del usuario.
2. Confirma en la ventana **Desactivar usuario** con **Confirmar**.

La cuenta deja de aparecer en las listas activas y la persona ya no puede ingresar. Sus
documentos se conservan: nada se borra físicamente.

:::caution Pendiente de confirmar
La aplicación no tiene un botón para reactivar una cuenta desactivada. Si te equivocas, pide
al equipo técnico que la restaure.
:::

## Cuidado con los roles de una sola persona

- **Dirección Financiera (`TESORERO`)**: las solicitudes de viaje se envían automáticamente al
  único `TESORERO` activo. Si no hay ninguno, el Director de Programa verá "No hay un usuario
  activo de Dirección Financiera (Tesorero) para recibir la solicitud". Si hay más de uno,
  verá "Hay más de un usuario de Dirección Financiera: indica a cuál enviar la solicitud", y
  la aplicación no ofrece cómo elegir. Mantén **un solo** `TESORERO` activo.
- **Contabilidad (`CONTADOR`)**: es el único rol que cierra rendiciones. Los avisos de cuadros
  comparativos llegan a **todos** los contadores activos.
- **Validador de compras y Dirección Ejecutiva**: los avisos de cuadros llegan a todas las
  personas con ese rol.

:::danger El rol VALIDADOR_COMPRAS no está en el formulario
El selector **Rol** no ofrece `VALIDADOR_COMPRAS`. Al editar una cuenta con ese rol, el
formulario lo muestra como **EMISOR**, y al pulsar **Guardar cambios** la persona pierde su rol
de validador. No edites la cuenta del Validador de compras desde esta pantalla; pide el
cambio al equipo técnico.
:::
