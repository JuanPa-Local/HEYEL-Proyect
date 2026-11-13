import { afterEach, describe, expect, it, vi } from 'vitest';
import { aplicarLogro, empezarTarea, enValidacion, guardarSesion, marcarAyuda, nuevaSesion, terminarTarea } from './sesion';
import { calcularSus } from './tareas';
import { armarCsv } from './csv';
import { request } from '../api/client';

afterEach(() => { guardarSesion(null); vi.unstubAllGlobals(); });

const datos = { codigo: 'VF-01', perfil: 'Cuidadora', probo: 'No', facilitador: 'Diego', observador: 'Mateo' };

describe('Cálculo del SUS', () => {
  it('usa la regla de la Junta', () => {
    expect(calcularSus([5, 1, 5, 1, 5, 1, 5, 1, 5, 1])).toBe(100);
    expect(calcularSus([1, 5, 1, 5, 1, 5, 1, 5, 1, 5])).toBe(0);
    expect(calcularSus([4, 2, 4, 2, 4, 2, 4, 2, 4, 2])).toBe(75);
  });
});

describe('Tareas de la sesión', () => {
  it('toma el tiempo, guarda si pidió ayuda y pasa a la siguiente tarea', () => {
    let sesion = empezarTarea(nuevaSesion(datos), 1000);
    sesion = marcarAyuda(sesion);
    sesion = terminarTarea(sesion, true, 13500);
    expect(sesion.resultados).toEqual([{ numero: 1, segundos: 12.5, conAyuda: true, completada: true }]);
    expect(sesion.tarea).toBe(1);
    expect(sesion.inicio).toBeNull();
  });

  it('al terminar la quinta tarea pasa al cuestionario', () => {
    let sesion = nuevaSesion(datos);
    for (let i = 0; i < 5; i++) sesion = terminarTarea(empezarTarea(sesion, 0), i !== 2, 1000);
    expect(sesion.fase).toBe('sus');
    expect(sesion.resultados.map(r => r.completada)).toEqual([true, true, false, true, true]);
  });

  it('entrar a la cuenta cierra T1 solo si el tiempo está corriendo', () => {
    const sinEmpezar = nuevaSesion(datos);
    expect(aplicarLogro(sinEmpezar, 'login')).toBe(sinEmpezar);
    expect(aplicarLogro(empezarTarea(sinEmpezar, 0), 'login', undefined, 4000).resultados[0].segundos).toBe(4);
  });

  it('T2 se cierra al salir y volver a entrar, no solo al entrar', () => {
    const t2 = empezarTarea({ ...nuevaSesion(datos), tarea: 1 }, 0);
    expect(aplicarLogro(t2, 'login')).toBe(t2);
    const salio = aplicarLogro(t2, 'logout');
    expect(salio.salio).toBe(true);
    expect(aplicarLogro(salio, 'login', undefined, 9000).tarea).toBe(2);
  });

  it('T4 se cierra solo con la institución pedida y T3 solo con «Terminé»', () => {
    const t3 = empezarTarea({ ...nuevaSesion(datos), tarea: 2 }, 0);
    expect(aplicarLogro(t3, 'login')).toBe(t3);
    const t4 = empezarTarea({ ...nuevaSesion(datos), tarea: 3 }, 0);
    expect(aplicarLogro(t4, 'filtro-institucion', 'ips-salud-vital')).toBe(t4);
    expect(aplicarLogro(t4, 'filtro-institucion', 'imagenes-del-norte').tarea).toBe(4);
  });
});

describe('CSV para Excel', () => {
  it('usa punto y coma, coma decimal y escapa los textos', () => {
    const csv = armarCsv([{
      ...datos, fecha: '2026-11-15T14:05:00.000Z', sus: 77.5, estrellas: 4, masDificil: 'Filtrar; "rápido"',
      cambiaria: '', recomendaria: 'Sí', susRespuestas: [4, 2, 4, 2, 4, 2, 4, 2, 5, 1],
      tareas: [1, 2, 3, 4, 5].map(n => ({ numero: n, segundos: n + 0.5, conAyuda: n === 4, completada: true })),
    }]);
    const [encabezado, fila] = csv.replace('﻿', '').split('\r\n');
    expect(encabezado.startsWith('Código;Fecha;Perfil')).toBe(true);
    expect(fila).toContain('VF-01;');
    expect(fila).toContain(';4,5;Sí;Sí;');
    expect(fila).toContain(';77,5;4;"Filtrar; ""rápido""";');
    expect(fila.endsWith(';4;2;4;2;4;2;4;2;5;1')).toBe(true);
  });
});

describe('Encabezado de validación', () => {
  it('el cliente avisa al servidor solo mientras hay una sesión de validación', async () => {
    const fetch = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({}) });
    vi.stubGlobal('fetch', fetch);
    await request('/api/historial');
    expect(fetch.mock.calls[0][1].headers['X-Heyel-Validacion']).toBeUndefined();
    guardarSesion(nuevaSesion(datos));
    expect(enValidacion()).toBe(true);
    await request('/api/historial');
    expect(fetch.mock.calls[1][1].headers['X-Heyel-Validacion']).toBe('true');
  });
});
