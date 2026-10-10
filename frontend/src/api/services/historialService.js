import { request } from '../client';

export const historialService = {
  obtener: () => request('/api/historial'),
};