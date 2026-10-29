import api from '@/lib/api';
import type { Sede } from '@/lib/sedes';

export type UsuarioRol =
  | 'ADMIN'
  | 'EJECUTIVO'
  | 'CONTADOR'
  | 'TESORERO'
  | 'USUARIO'
  | 'APROBADOR'
  | 'EMISOR';

export interface UsuarioListItem {
  id: number;
  nombreCompleto: string;
  email: string;
  rol: UsuarioRol | string;
  cargo?: string | null;
  /** Cédula de identidad; la usa el ANEXO 5 */
  ci?: string | null;
  sede?: Sede | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateUsuarioInput {
  nombre: string;
  email: string;
  password: string;
  rol: 'ADMIN' | 'EJECUTIVO' | 'CONTADOR' | 'TESORERO' | 'USUARIO';
  cargo?: string;
  ci?: string;
  /** Vacío = sin sede */
  sede?: Sede | '';
}

export interface UpdateUsuarioInput {
  nombre: string;
  email: string;
  password?: string;
  rol: 'ADMIN' | 'EJECUTIVO' | 'CONTADOR' | 'TESORERO' | 'USUARIO';
  cargo?: string;
  ci?: string;
  /** Vacío = sin sede */
  sede?: Sede | '';
}

interface UsuarioPayload {
  nombreCompleto?: string;
  email?: string;
  password?: string;
  rol?: 'ADMIN' | 'EJECUTIVO' | 'CONTADOR' | 'TESORERO' | 'USUARIO';
  cargo?: string;
  ci?: string;
  sede?: Sede | null;
}

function buildPayload(
  input: CreateUsuarioInput | UpdateUsuarioInput
): UsuarioPayload {
  const payload: UsuarioPayload = {
    nombreCompleto: input.nombre.trim(),
    email: input.email.trim(),
    rol: input.rol,
  };

  const cargo = input.cargo?.trim();
  if (cargo) {
    payload.cargo = cargo;
  }

  // Se envía aunque quede vacía, para poder borrarla
  if (input.ci !== undefined) {
    payload.ci = input.ci.trim();
  }

  // Igual que el C.I.: vacía se envía como null para poder quitarla
  if (input.sede !== undefined) {
    payload.sede = input.sede || null;
  }

  if (input.password && input.password.trim().length > 0) {
    payload.password = input.password.trim();
  }

  return payload;
}

export const usuariosService = {
  async getAll(signal?: AbortSignal): Promise<UsuarioListItem[]> {
    const { data } = await api.get<UsuarioListItem[]>('/usuarios', { signal });
    return data;
  },

  async create(input: CreateUsuarioInput): Promise<UsuarioListItem> {
    const payload = buildPayload(input);
    const { data } = await api.post<UsuarioListItem>('/usuarios', payload);
    return data;
  },

  async update(
    id: number,
    input: UpdateUsuarioInput
  ): Promise<UsuarioListItem> {
    const payload = buildPayload(input);
    const { data } = await api.patch<UsuarioListItem>(
      `/usuarios/${id}`,
      payload
    );
    return data;
  },

  async delete(id: number): Promise<UsuarioListItem> {
    const { data } = await api.delete<UsuarioListItem>(`/usuarios/${id}`);
    return data;
  },
};

export default usuariosService;
