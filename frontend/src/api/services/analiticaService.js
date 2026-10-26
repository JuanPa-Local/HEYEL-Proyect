import { request } from '../client';

// La analítica nunca debe romper la landing: si falla, se ignora.
export const analiticaService = {
  registrar: tipo => request('/api/analitica/eventos', { method: 'POST', body: { tipo } }).catch(() => null),
};
