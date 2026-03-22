import api from '@/lib/api';

export type UsuarioRol =
  | 'ADMIN'
  | 'EJECUTIVO'
  | 'CONTADOR'
  | 'TESORERO'
  | 'USUARIO'
  | 'APROBADOR'
  | 'EMISOR'
  | 'AUDITOR';

export interface UsuarioListItem {
  id: number;
  nombreCompleto: string;
  email: string;
  rol: UsuarioRol | string;
  cargo?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateUsuarioInput {
  nombre: string;
  email: string;
  password: string;
  rol: 'ADMIN' | 'EJECUTIVO' | 'CONTADOR' | 'TESORERO' | 'USUARIO';
  cargo?: string;
}

export interface UpdateUsuarioInput {
  nombre: string;
  email: string;
  password?: string;
  rol: 'ADMIN' | 'EJECUTIVO' | 'CONTADOR' | 'TESORERO' | 'USUARIO';
  cargo?: string;
}

interface UsuarioPayload {
  nombreCompleto?: string;
  email?: string;
  password?: string;
  rol?: 'ADMIN' | 'EJECUTIVO' | 'CONTADOR' | 'TESORERO' | 'USUARIO';
  cargo?: string;
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

  if (input.password && input.password.trim().length > 0) {
    payload.password = input.password.trim();
  }

  return payload;
}

export const usuariosService = {
  async getAll(): Promise<UsuarioListItem[]> {
    const { data } = await api.get<UsuarioListItem[]>('/usuarios');
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
