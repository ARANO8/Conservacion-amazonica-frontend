import { z } from 'zod';

export const ordenCompraItemSchema = z.object({
  orden: z.number(),
  item: z.string().trim().min(1, 'La descripción es obligatoria').max(500),
  cantidad: z.coerce
    .number({ invalid_type_error: 'Cantidad inválida' })
    .positive('La cantidad debe ser mayor a 0'),
  unidad: z.string().trim().max(50).optional().or(z.literal('')),
  detalle: z.string().trim().max(1000).optional().or(z.literal('')),
  precioUnitario: z.coerce
    .number({ invalid_type_error: 'Precio inválido' })
    .nonnegative('El precio debe ser mayor o igual a 0'),
  cuadroItemId: z.number().optional().nullable(),
  sinCuadro: z.boolean().default(true),
});

export const ordenCompraSchema = z.object({
  cuadroComparativoId: z.number().optional().nullable(),
  proveedorNombre: z
    .string()
    .trim()
    .min(1, 'El nombre del proveedor es obligatorio')
    .max(200),
  proveedorDireccion: z.string().trim().max(300).optional().or(z.literal('')),
  proveedorTelefono: z.string().trim().max(50).optional().or(z.literal('')),
  lugarEntrega: z.string().trim().max(300).optional().or(z.literal('')),
  formaPago: z
    .string()
    .trim()
    .min(1, 'La forma de pago es obligatoria')
    .default('Transferencia bancaria'),
  garantia: z.string().trim().min(1, 'La garantía es obligatoria').default('N/A'),
  observaciones: z.string().trim().max(1000).optional().or(z.literal('')),
  items: z
    .array(ordenCompraItemSchema)
    .min(1, 'La orden debe tener al menos un ítem'),
});

export type OrdenCompraFormData = z.infer<typeof ordenCompraSchema>;
export type OrdenCompraItemFormData = z.infer<typeof ordenCompraItemSchema>;
