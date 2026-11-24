# Guía de redacción de los manuales

Reglas para escribir en `usuario/` y `tecnico/`. Este archivo no se publica.

## Idioma y tono

- Español, de "tú" en el manual de usuario (como los textos de la app), impersonal en el técnico.
- Términos del dominio sin traducir: solicitud, rendición, viático, desembolso, observar,
  partida, POA, cuadro comparativo, cotización. Ver el glosario de `CLAUDE.md`.
- Los nombres de botones, pestañas, estados y menús, **exactamente** como aparecen en la app,
  en negrita: **Crear solicitud de viaje**. Sacarlos del código del frontend, no de memoria.
- Frases cortas, pasos numerados para los procedimientos.

## Verdad

- Todo sale del código (`Conservacion-amazonica-frontend`, `Conservacion-amazonica-backend`), de
  `AGENTS.md` y de `specs/`. Si el código y una spec no coinciden, manda el código.
- Lo que no se pueda confirmar no se inventa: se escribe con una advertencia
  `:::caution Pendiente de confirmar` y se reporta.
- Sin secretos ni datos personales: nada de contraseñas, `JWT_SECRET`, IP o usuario del VPS,
  C.I. ni nombres de la planilla. Las personas se nombran por su rol ("el Director de
  Programa"). Excepción: los firmantes fijos que ya imprimen los documentos (Director
  Ejecutivo, Dirección Financiera) se nombran por cargo, no por nombre.

## Formato (Docusaurus 3, MDX)

- Cada sección es una carpeta con `_category_.json`:
  `{ "label": "Viajes y viáticos", "position": 2, "link": { "type": "generated-index" } }`
- Cada página: front matter con `title` y `sidebar_position`, y un `# Título` igual al título.
- MDX: no escribir `<` ni `{` sueltos en el texto (usar `menor que` o código entre comillas
  invertidas). Nada de HTML salvo `<details>`.
- Admoniciones: `:::tip`, `:::info`, `:::warning`, `:::caution`, `:::danger`.
- Diagramas: bloques ```mermaid (flowchart, stateDiagram-v2, sequenceDiagram).
- Enlaces entre páginas: relativos al archivo `.md` (`../viajes/solicitud.md`). Solo dentro del
  mismo manual; usuario y técnico son sitios distintos y no se enlazan entre sí.

## Capturas (solo manual de usuario)

- Referencia: `![Texto alternativo](/img/capturas/<seccion>-<nombre>.png)`.
- No hace falta que la captura exista: se generan después con Playwright. Por eso, al terminar,
  cada redactor entrega la lista de capturas que usó: archivo, ruta de la app, rol con el que
  se entra, y qué debe verse (por ejemplo "el formulario con la pestaña Viáticos abierta").
- Una o dos capturas por flujo, en el momento clave; no una por paso.
