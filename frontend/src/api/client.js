export async function request(path, { method = 'GET', body } = {}) {
  const headers = {};
  if (method !== 'GET') {
    const response = await fetch('/api/auth/csrf', { credentials: 'same-origin' });
    if (!response.ok) throw new Error('No pudimos preparar la sesión. Intenta de nuevo.');
    const csrf = await response.json();
    headers[csrf.headerName] = csrf.token;
  }
  if (body) headers['Content-Type'] = 'application/json';
  const response = await fetch(path, { method, headers, credentials: 'same-origin', body: body ? JSON.stringify(body) : undefined });
  const data = response.status === 204 ? null : await response.json();
  if (!response.ok) {
    const error = new Error(data.error || 'No pudimos completar la solicitud.');
    error.status = response.status;
    error.fields = data.fields;
    throw error;
  }
  return data;
}
