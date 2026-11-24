---
title: Kit de UI y formularios
sidebar_position: 4
---

# Kit de UI y formularios

## Kit de componentes

`components/ui/` contiene las primitivas de **shadcn/ui**. `components.json` define el estilo
`radix-vega`, color base `zinc`, variables CSS e íconos `lucide`. Se apoyan en `radix-ui`,
`@base-ui/react`, `cmdk` (combobox), `vaul` (drawer) y `react-day-picker` (calendario).

Primitivas disponibles: `alert`, `alert-dialog`, `avatar`, `badge`, `breadcrumb`, `button`,
`calendar`, `card`, `chart`, `checkbox`, `collapsible`, `combobox`, `command`, `dialog`, `drawer`,
`dropdown-menu`, `field`, `form`, `input`, `input-group`, `label`, `popover`, `progress`,
`scroll-area`, `select`, `separator`, `sheet`, `sidebar`, `skeleton`, `slider`, `sonner`, `table`,
`textarea`, `toggle`, `tooltip`, más `nav-main`, `nav-projects` y `nav-secondary` para la barra
lateral.

:::tip
Para agregar una primitiva nueva se usa la CLI de shadcn, que respeta `components.json`. Las de
`components/ui/` no se editan salvo para personalizarlas a propósito.
:::

### Componentes compartidos (`components/shared/`)

| Componente                                 | Uso                                                                                                    |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| `estado-badge.tsx`                         | Badge de color por estado                                                                              |
| `observacion-alert.tsx`                    | Aviso con el motivo de una observación                                                                 |
| `audit-timeline.tsx`                       | Línea de tiempo del `HistorialAprobacion`                                                              |
| `director-programa-select.tsx`             | Selector del Director de Programa (solicitud, informe, liquidación)                                    |
| `anexo-viewer.tsx`, `documento-viewer.tsx` | Vista del documento tal como sale en el PDF. Ver [Documentos en pantalla](./documentos-en-pantalla.md) |

### Estilos

Tailwind CSS v4, sin archivos CSS propios salvo `app/globals.css`. `cn()` de `lib/utils.ts` combina
clases condicionales. Prettier ordena las clases con `prettier-plugin-tailwindcss`.

### Mensajes al usuario

`sonner`: `toast.success`, `toast.error`, `toast.info`. Los errores de la API se muestran con el
`message` que devuelve el backend.

## Formularios

Los formularios usan **React Hook Form** con **zod** a través de `zodResolver`. El `useForm` con
el resolver vive en el formulario principal; las secciones (por ejemplo `solicitud-viaticos.tsx`,
`paso2-gastos.tsx`) trabajan sobre el mismo formulario con `useFormContext` o reciben `control`.

Esquemas junto al formulario:

| Esquema                                                        | Formulario                     |
| -------------------------------------------------------------- | ------------------------------ |
| `components/solicitudes/solicitud-schema.ts`                   | Solicitud de viaje             |
| `components/solicitudes-compra/solicitud-compra-schema.ts`     | Solicitud de compra o servicio |
| `components/planes-viaje/plan-viaje-schema.ts`                 | Plan de Viaje                  |
| `components/cotizaciones/cotizacion-schema.ts`                 | Cotización                     |
| `components/cuadros-comparativos/cuadro-comparativo-schema.ts` | Cuadro comparativo             |
| `components/ordenes-compra/orden-compra-schema.ts`             | Orden de compra                |

Y en `types/` los que se comparten entre pantallas: `rendicion-schema.ts`,
`informe-viaje-schema.ts`, `liquidacion-viaticos-schema.ts`, `declaracion-movilidad-schema.ts`.

Patrón:

```tsx
const form = useForm<z.infer<typeof solicitudSchema>>({
  resolver: zodResolver(solicitudSchema),
  defaultValues,
});
```

- El tipo del formulario se deriva del esquema con `z.infer`, no se escribe a mano.
- Los errores de campo se muestran en línea bajo cada input.
- Antes de enviar, un adaptador de `lib/adapters/` convierte los datos al payload del DTO.
- El servidor vuelve a validar todo con `class-validator`. El esquema zod es para guiar al usuario,
  no para proteger la API.

### Hooks de apoyo

| Hook                            | Para qué                                                                          |
| ------------------------------- | --------------------------------------------------------------------------------- |
| `use-catalogos.ts`              | Carga los catálogos que necesitan los formularios                                 |
| `use-prevent-navigation.ts`     | Avisa antes de salir o recargar con un formulario modificado                      |
| `use-sync-terceros.ts`          | Mantiene la lista de terceros de cada actividad al ritmo de la cantidad declarada |
| `use-mobile.ts`                 | Detecta pantallas chicas (lo usa la barra lateral)                                |
| `use-notificaciones-polling.ts` | Polling de notificaciones                                                         |

### Montos

Los formularios calculan montos en vivo con los espejos de `lib/` (`tax-calculator.ts` y
similares). Ver [Servicios, adaptadores y tipos](./servicios-y-tipos.md).
El valor definitivo es el que guarda el backend.
