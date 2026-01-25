import api from '@/lib/api';
import { PresupuestoReserva } from '@/types/backend';

export const presupuestosService = {
  /**
   * Reserva una partida POA temporalmente
   */
  reservar: async (poaId: number): Promise<PresupuestoReserva> => {
    try {
      const { data } = await api.post<PresupuestoReserva>(
        '/presupuestos/reservar',
        {
          poaId,
        }
      );
      return data;
    } catch (error) {
      // Propagamos el error para que el componente pueda manejarlo (ej. mostrar toast)
      throw error;
    }
  },

  /**
   * Obtiene las reservas temporales del usuario actual
   */
  getMisReservas: async (): Promise<PresupuestoReserva[]> => {
    const { data } = await api.get<PresupuestoReserva[]>(
      '/presupuestos/my-active'
    );
    return data;
  },

  /**
   * Libera una reserva específica
   */
  liberar: async (id: number): Promise<void> => {
    await api.delete(`/presupuestos/${id}`);
  },
};
