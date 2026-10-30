---
title: El rol ADMIN
sidebar_position: 1
---

# El rol ADMIN

El rol `ADMIN` es para quien administra AMZ Desk: TI y Monitoreo y Evaluación. Es el único que
gestiona las cuentas de usuario y el que tiene la vista más amplia del sistema.

## Qué ve en el panel lateral

Todo lo que ven los demás roles, más **Gestion de Usuarios**:

| Sección                 | Para qué                                                                                              |
| ----------------------- | ----------------------------------------------------------------------------------------------------- |
| **Gestion de Usuarios** | Crear, editar y desactivar cuentas. Ver [Gestión de usuarios](./gestion-de-usuarios.md)               |
| **Centro de Auditoria** | La línea de tiempo de cada solicitud y rendición. Ver [Centro de Auditoría](./centro-de-auditoria.md) |
| **Monitores**           | Todas las solicitudes y rendiciones, solo lectura. Ver [Monitores](./monitores.md)                    |
| **Analítica**           | Tendencias y partidas con mayor gasto. Ver [Analítica](./analitica.md)                                |
| **Base Documental**     | Documentos de referencia. Ver [Base Documental](./base-documental.md)                                 |

## Qué puede hacer en los flujos

`ADMIN` puede reemplazar a varias personas cuando faltan, pero no a todas:

| Flujo                                      | Qué puede hacer `ADMIN`                                                                                                                                                                                                     |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cuadro comparativo                         | Actuar en los tres papeles: **Enviar a validación** y **Enviar a aprobación** (Contabilidad), **Validar** (Validador de compras) y **Aprobar** (Dirección Ejecutiva), además de **Observar** en cualquier estado intermedio |
| Informe de Viaje y Liquidación de Viáticos | Revisar u observar cualquiera que esté **Por revisar**, aunque no sea el Director de Programa elegido. En la pestaña **Por revisar** ve todos los pendientes                                                                |
| Solicitudes                                | Actuar solo si es el aprobador asignado, como cualquier otra persona                                                                                                                                                        |
| Rendiciones                                | Revisar y **derivar** si se la asignan. **No puede cerrarla**: el cierre definitivo es solo del rol `CONTADOR`                                                                                                              |
| Compras                                    | Ve todas las cotizaciones, cuadros y órdenes de compra                                                                                                                                                                      |

:::warning Ausencias en roles de una sola persona
Dirección Financiera, Contabilidad y el Validador de compras son una persona cada uno. Si
Contabilidad falta, ninguna rendición se puede cerrar, ni siquiera por un `ADMIN`. La salida
es asignar el rol `CONTADOR` a una segunda persona desde [Gestión de usuarios](./gestion-de-usuarios.md).
:::

:::caution Pendiente de confirmar
El servidor también permite a `ADMIN` desembolsar una solicitud que no tiene en su bandeja,
pero la aplicación no muestra el botón **Desembolsar** a ese rol. Hoy, en la práctica, solo
Dirección Financiera desembolsa.
:::
