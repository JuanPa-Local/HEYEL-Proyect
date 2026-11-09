import { afterEach, describe, expect, it, vi } from 'vitest';
import { request } from './client';

function respuesta(status, cuerpo, json = true) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: json ? async () => cuerpo : async () => { throw new SyntaxError('Unexpected token <'); },
  };
}

afterEach(() => vi.unstubAllGlobals());

describe('Cliente de la API', () => {
  it('devuelve los datos cuando la respuesta es JSON', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(respuesta(200, { registros: [] })));
    await expect(request('/api/historial')).resolves.toEqual({ registros: [] });
  });

  it('conserva el mensaje y el estado que manda la API', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(respuesta(401, { error: 'Inicia sesión para continuar.' })));
    await expect(request('/api/historial')).rejects.toMatchObject({ message: 'Inicia sesión para continuar.', status: 401 });
  });

  it('muestra un mensaje claro si el servidor responde una página en vez de JSON', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(respuesta(502, null, false)));
    await expect(request('/api/historial')).rejects.toMatchObject({
      message: 'No pudimos conectar con el servidor. Intenta de nuevo en un momento.',
      status: 502,
    });
  });
});
