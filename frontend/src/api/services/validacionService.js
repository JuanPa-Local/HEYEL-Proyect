import { request } from '../client';

// La prueba nunca debe romper la app: si falla el registro, se ignora.
// keepalive deja que el evento salga aunque la persona cierre la pestaña.
export const validacionService = {
  registrar: evento => {
    try {
      return fetch('/api/validacion/eventos', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(evento), keepalive: true, credentials: 'same-origin',
      }).catch(() => null);
    } catch { return Promise.resolve(null); }
  },
  panel: () => request('/api/validacion/panel'),
};
