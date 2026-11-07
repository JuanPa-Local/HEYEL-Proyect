import { request } from '../client';

// La analítica nunca debe romper la landing: si falla, se ignora.
export const analiticaService = {
  registrar: tipo => request('/api/analitica/eventos', { method: 'POST', body: { tipo } }).catch(() => null),
  // Números del embudo y últimos eventos, para el panel en vivo.
  panel: () => request('/api/analitica/panel'),
  // El paciente usó por primera vez un filtro, el buscador o la gráfica.
  activacion: () => request('/api/analitica/activacion', { method: 'POST' }).catch(() => null),
};
