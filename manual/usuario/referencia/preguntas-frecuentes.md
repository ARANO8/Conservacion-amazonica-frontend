---
title: Preguntas frecuentes
sidebar_position: 3
---

# Preguntas frecuentes

Las preguntas están agrupadas por tema. Los mensajes entre comillas son los que muestra la
aplicación, tal cual; donde dice "X", la aplicación pone el código o el dato concreto.

## Cuenta y notificaciones

### Olvidé mi contraseña. ¿Cómo la recupero?

No hay recuperación por correo. Pide al administrador del sistema (rol `ADMIN`) que te asigne
una contraseña nueva desde **Gestion de Usuarios**. Ver
[Gestión de usuarios](../administracion/gestion-de-usuarios.md#editar-un-usuario).

### ¿Por qué no me llegó un correo cuando observaron mi solicitud?

AMZ Desk no envía correos. Todas las notificaciones viven dentro de la aplicación, en
**Notificaciones**, y se actualizan solas mientras la tienes abierta. Entra al sistema para
enterarte de tus pendientes.

### Abrí una solicitud desde la bandeja y dice "Solicitud ya atendida". ¿Qué pasó?

Ya no la tienes en tus manos: o ya decidiste sobre ella, o pasó a otra persona. La
notificación queda en la bandeja como historial. Para ver dónde está ahora, abre la solicitud
desde la lista o, si tu rol lo permite, desde **Monitores**.

### Me aparece "No tienes permiso para acceder a esta solicitud". ¿Por qué?

Con el rol `USUARIO` solo ves las solicitudes que emitiste y aquellas en las que eres el
aprobador asignado. Cuando la solicitud sale de tu bandeja, dejas de verla si no es tuya.

## Solicitudes

### Al crear la solicitud me dice "Saldo insuficiente en el POA especificado"

La línea del POA que elegiste no tiene saldo disponible para ese monto. El saldo descuenta lo
ya ejecutado y lo comprometido por otras solicitudes en curso. Elige otra línea, baja el
monto, o pide a Administración que revise el POA. Nadie puede saltarse este control. Ver
[POA](../administracion/poa.md).

### "Una solicitud de viaje debe nacer de un plan de viaje (ANEXO 1)"

Toda solicitud de viaje necesita un plan de viaje propio, completo y libre. Crea el plan en
**Viajes y Viáticos > Planes de Viaje** y elígelo al empezar la solicitud.

### "El plan de viaje X está incompleto" o "El plan de viaje ya respalda la solicitud X"

En el primer caso, a alguna actividad del plan le falta la salida, la llegada, o el personal
institucional elegido no cuadra con la cantidad declarada; el mensaje dice qué falta. En el
segundo, ese plan ya está usado: cada plan respalda una sola solicitud. Crea otro plan.

### "La cantidad de personas excede lo planificado"

Un viático declara más personas de las que el plan de viaje tiene para esa actividad
(institucionales más terceros). Corrige la cantidad del viático o la del plan.

### "En X el plan declara N tercero(s) pero la nómina registra M"

La nómina de terceros de la solicitud debe tener tantas personas como terceros declara el
plan para esa actividad. Completa o recorta la nómina.

### No encuentro a Dirección Financiera para elegirla como Director de Programa

Es a propósito: Dirección Financiera aprueba después y no puede ser también quien revisa
("Dirección Financiera aprueba la solicitud: no puede ser designada como Director de
Programa"). Tampoco puedes elegirte a ti mismo.

### Quiero corregir una solicitud que ya envié, pero no me deja

Solo se puede editar una solicitud en estado `OBSERVADO` ("Solo se pueden editar solicitudes
en estado OBSERVADO"). Pide a quien la tiene en su bandeja que la observe, corrígela y
reenvíala.

### Observaron mi solicitud. ¿Qué hago?

1. Abre la notificación **Observada**: te lleva directo al formulario de corrección.
2. Lee el motivo y corrige.
3. Envíala de nuevo. Una solicitud de viaje vuelve al mismo Director de Programa; una de compra
   te pide elegir a quién enviarla ("Debes asignar un aprobador para subsanar la
   observación").

### "No se puede eliminar una solicitud que ya ha sido desembolsada"

Una vez entregados los fondos, la solicitud queda en el registro contable y debe rendirse. Si
el viaje o la compra se cancelaron, habla con Dirección Financiera.

### Soy Director de Programa y al enviar me sale "No hay un usuario activo de Dirección Financiera" o "Hay más de un usuario de Dirección Financiera"

El sistema envía las solicitudes de viaje al único usuario con rol `TESORERO`. Si no hay
ninguno, o hay más de uno, no puede decidir a quién. Avisa al administrador del sistema para
que deje un solo `TESORERO` activo.

### Soy de Dirección Financiera y no me deja desembolsar: "El Director de Programa aún no envió la solicitud a Dirección Financiera"

La solicitud de viaje sigue en la bandeja del Director de Programa. Hasta que él pulse
**Enviar a Dirección Financiera**, no se puede desembolsar.

## Rendiciones

### "Solo se puede rendir una solicitud en estado DESEMBOLSADO" o "La solicitud ya tiene una rendición registrada"

Solo se rinde una solicitud cuyos fondos ya se entregaron, y cada solicitud tiene una sola
rendición. Si ya la creaste, búscala en **Viajes y Viáticos > Mis Rendiciones**.

### El botón Aprobar / Derivar de la rendición está gris

Para aprobar o derivar hay que marcar **todos** los gastos como correctos (un clic en la
columna de validación de cada gasto). Si alguno está mal, márcalo con doble clic como
observado y usa **Observar / Devolver**.

### "Solo un CONTADOR puede cerrar la rendición. Debes derivarla al siguiente aprobador o contador"

Si no eres Contabilidad, no puedes cerrar una rendición: solo derivarla. Al pulsar **Aprobar /
Derivar**, elige a la siguiente persona; lo normal es Contabilidad.

### Al aprobar una rendición dice "La aprobación excede el presupuesto del POA X"

Lo que se rinde contra esa línea supera lo que le queda de su costo total. Revisa que cada
gasto esté en la partida correcta; si lo está, el POA necesita una corrección antes de cerrar
la rendición.

### ¿Puedo enviar la rendición sin el Informe de Viaje?

Sí. La rendición muestra el informe si existe, o avisa que falta, pero no te bloquea. Igual
conviene presentarlo: el manual de procedimientos lo exige.

### No veo mi liquidación de viáticos para importarla a la rendición

Solo se importa una liquidación **Revisada** por el Director de Programa. Si está **Por
revisar** u **Observada**, todavía no aparece.

## Informe de Viaje y Liquidación de Viáticos

### "La solicitud aún no fue desembolsada: el informe se hace después del viaje"

El informe y la liquidación nacen de una solicitud de viaje propia ya desembolsada. Espera al
desembolso.

### "La solicitud X ya tiene su informe de viaje" (o "su liquidación de viáticos")

Cada solicitud tiene un solo informe y una sola liquidación. Búscalo en la lista y edítalo si
está en **Borrador** u **Observado**.

### "La liquidación está esperando la revisión del Director de Programa y no se puede editar"

Mientras está **Por revisar** no se edita. Si necesitas cambiar algo, pide al Director de
Programa que la observe.

### "Una persona no puede tener dos hojas en la misma liquidación"

La liquidación lleva una hoja por persona institucional. Si una persona tuvo dos tramos, van
en la misma hoja.

### Quiero borrar un informe o una liquidación revisados y no puedo

"Un informe revisado respalda la rendición y no se puede eliminar". Lo mismo vale para una
liquidación revisada.

## Compras

### "El cuadro no es editable en estado X. Solo se puede editar en BORRADOR u OBSERVADO"

Un cuadro enviado ya está en revisión. Para corregirlo, quien lo tiene debe observarlo.

### No me aparece el botón Crear Orden de Compra

La orden de compra solo se emite desde un cuadro comparativo **Aprobado** ("Solo se puede
prellenar desde un cuadro comparativo APROBADO"), y el cuadro debe tener una cotización
recomendada.

### "La suma de los pagos parciales no coincide con el total del gasto"

En un contrato de consultoría, las cuotas del cronograma deben sumar exactamente el total del
contrato. Ajusta los montos de las cuotas.

### "No se puede editar el contrato: ya hay pagos solicitados o realizados"

Un contrato de consultoría se puede corregir solo mientras todas sus cuotas están
**Planificado**.

## Aprobadores

### "No puedes asignarte a ti mismo como aprobador"

En ningún documento puedes ser tu propio revisor. Elige a otra persona.

### Me eligieron como Director de Programa pero mi cuenta es de personal. ¿Puedo revisar?

Sí. El Director de Programa no es un rol del sistema: es quien el emisor elige en cada
documento. Ver [Director de Programa](../roles/director-de-programa.md).
