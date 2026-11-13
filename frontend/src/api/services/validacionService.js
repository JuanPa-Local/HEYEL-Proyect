import { request } from '../client';

export const validacionService = {
  guardar: sesion => request('/api/validacion/sesiones', { method: 'POST', body: sesion }),
  resultados: clave => request('/api/validacion/sesiones', { headers: { 'X-Clave-Equipo': clave } }),
};
