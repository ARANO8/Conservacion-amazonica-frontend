---
title: Dirección Ejecutiva
sidebar_position: 5
---

# Dirección Ejecutiva

Dirección Ejecutiva (rol `EJECUTIVO`) da la **aprobación final de los cuadros comparativos** y
tiene una vista de control sobre todo el sistema. En el circuito de viajes no aprueba en la
aplicación: firma en papel.

## Lo que firmas en papel

Todos los anexos van dirigidos al Director Ejecutivo (campo "A:") y su nombre y cargo se
imprimen en los PDF:

- **ANEXO 1 — Plan de Viaje**: el visto bueno lo firma el Director Ejecutivo sobre el
  impreso. El plan no tiene flujo de aprobación en el sistema.
- **ANEXO 2 y demás**: el circuito digital se cierra entre el Director de Programa y Dirección
  Financiera; la firma "Aprobado por" del Director Ejecutivo se pone en el papel.

## Qué llega a tu bandeja

| Etiqueta en **Notificaciones** | Título                           | Qué es                                             |
| ------------------------------ | -------------------------------- | -------------------------------------------------- |
| **Cuadro por revisar**         | "Cuadro comparativo por aprobar" | Contabilidad envió un cuadro a tu aprobación final |
| **Rendición pendiente**        | "Rendición derivada"             | Alguien te derivó una rendición                    |
| **Asignada** o **Derivada**    | —                                | Te eligieron como aprobador de una solicitud       |

:::info La etiqueta dice "por revisar"
La notificación de un cuadro que espera tu aprobación lleva la etiqueta **Cuadro por
revisar**, aunque el título dice "Cuadro comparativo por aprobar". Es la misma etiqueta que
usa Contabilidad.
:::

## Aprobar un cuadro comparativo

1. Abre la notificación o el cuadro desde **Compras y Servicios > Cuadros Comparativos**. Tú
   ves todos los cuadros del sistema.
2. Revisa el **Anexo 11 — Cuadro Comparativo de Cotizaciones**, la **Comparación de totales**
   y el historial: debe mostrar la revisión de Contabilidad y la validación del Validador de
   compras.
3. Decide:
   - **Aprobar**: el cuadro pasa a **Aprobado** y su autor recibe el aviso. Desde ese momento
     se puede **Crear Orden de Compra**.
   - **Observar**: escribe el motivo y confirma. El cuadro vuelve a su autor en estado
     **Observado** y tendrá que recorrer de nuevo todo el circuito.

![Cuadro comparativo en aprobación con los botones Aprobar y Observar](/img/capturas/roles-ejecutiva-cuadro.png)

Solo puedes aprobar u observar un cuadro mientras está **En aprobación**.

### Antes de aprobar, verifica

- [ ] El historial muestra el paso por Contabilidad y por el Validador de compras.
- [ ] La cotización recomendada y su justificación.
- [ ] El monto total es coherente con el presupuesto del proyecto.
- [ ] Si hay menos de tres cotizaciones en una compra que las exige, que exista la nota
      interna de excepción con tu visto bueno, como pide el manual de procedimientos.

## Rendiciones y solicitudes

Si te derivan una rendición o te eligen como aprobador de una solicitud, actúas desde la
notificación igual que cualquier aprobador: **Aprobar / Derivar** u **Observar / Devolver**.
Una rendición no puedes cerrarla: el cierre definitivo es del rol `CONTADOR`.

## Vista de control

Tu rol ve la información de todos, no solo la propia:

| Pantalla               | Ruta en el panel lateral    | Qué ves                                             |
| ---------------------- | --------------------------- | --------------------------------------------------- |
| Monitor de Solicitudes | **Monitores > Solicitudes** | Todas las solicitudes, solo lectura                 |
| Monitor de Rendiciones | **Monitores > Rendiciones** | Todas las rendiciones, solo lectura                 |
| Centro de Auditoria    | **Centro de Auditoria**     | La línea de tiempo de cada solicitud y rendición    |
| Analítica Avanzada     | **Analítica**               | Tendencias de gasto y partidas con mayor gasto      |
| Inicio                 | **Inicio**                  | El indicador **Salud Financiera del POA Global**    |
| Compras                | **Compras y Servicios**     | Todas las cotizaciones, cuadros y órdenes de compra |

Ver [Monitores](../administracion/monitores.md), [Centro de Auditoría](../administracion/centro-de-auditoria.md),
[Analítica](../administracion/analitica.md) y [POA](../administracion/poa.md).
