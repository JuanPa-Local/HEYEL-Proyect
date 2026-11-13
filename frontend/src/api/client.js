import { enValidacion } from '../validacion/sesion';

const SIN_SERVIDOR = 'No pudimos conectar con el servidor. Intenta de nuevo en un momento.';

// Mientras el servidor arranca, Render responde una página HTML en vez de JSON.
// En ese caso no hay datos que leer y se muestra un mensaje claro, no el error del navegador.
async function leerJson(response) {
  if (response.status === 204) return null;
  try { return await response.json(); }
  catch { return undefined; }
}

export async function request(path, { method = 'GET', body, headers: extra = {} } = {}) {
  const headers = { ...extra };
  // En una sesión de validación el servidor no suma estas acciones al embudo de visitantes reales.
  if (enValidacion()) headers['X-Heyel-Validacion'] = 'true';
  if (method !== 'GET') {
    const response = await fetch('/api/auth/csrf', { credentials: 'same-origin' });
    if (!response.ok) throw new Error('No pudimos preparar la sesión. Intenta de nuevo.');
    const csrf = await leerJson(response);
    if (!csrf) throw new Error(SIN_SERVIDOR);
    headers[csrf.headerName] = csrf.token;
  }
  if (body) headers['Content-Type'] = 'application/json';
  const response = await fetch(path, { method, headers, credentials: 'same-origin', body: body ? JSON.stringify(body) : undefined });
  const data = await leerJson(response);
  if (data === undefined) {
    const error = new Error(SIN_SERVIDOR);
    error.status = response.status;
    throw error;
  }
  if (!response.ok) {
    const error = new Error(data?.error || 'No pudimos completar la solicitud.');
    error.status = response.status;
    error.fields = data?.fields;
    throw error;
  }
  return data;
}
