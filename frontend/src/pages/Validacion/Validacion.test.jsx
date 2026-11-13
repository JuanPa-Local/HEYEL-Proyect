import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import Validacion from './Validacion';
import Resultados, { resumir } from './Resultados';
import BarraValidacion from '../../components/validacion/BarraValidacion';
import { guardarSesion, leerSesion, nuevaSesion } from '../../validacion/sesion';
import { leerHistorial } from '../../validacion/csv';
import { validacionService } from '../../api/services/validacionService';

vi.mock('../../api/services/validacionService', () => ({ validacionService: { guardar: vi.fn(), resultados: vi.fn() } }));
vi.mock('../../api/services/authService', () => ({ authService: { logout: vi.fn().mockResolvedValue(null) } }));

const datos = { codigo: 'VF-02', perfil: 'Adulta mayor', probo: 'Sí (R1)', facilitador: 'Andrés', observador: 'Diego' };
const tareas = [1, 2, 3, 4, 5].map(n => ({ numero: n, segundos: 10 + n, conAyuda: false, completada: true }));

beforeEach(() => { localStorage.clear(); guardarSesion(null); });
afterEach(cleanup);

describe('Inicio de la sesión', () => {
  it('no empieza sin el consentimiento', () => {
    render(<Validacion/>);
    fireEvent.change(screen.getByLabelText('Código del participante'), { target: { value: 'VF-02' } });
    fireEvent.click(screen.getByRole('button', { name: /Empezar las tareas/ }));
    expect(screen.getByRole('alert').textContent).toContain('marca la casilla');
    expect(leerSesion()).toBeNull();
  });
});

describe('Barra de tareas', () => {
  it('empieza la tarea, marca la ayuda y pasa a la siguiente', () => {
    guardarSesion(nuevaSesion(datos));
    render(<BarraValidacion/>);
    expect(screen.getByText('Crea una cuenta y entra a tu historial.')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Empezar tarea 1' }));
    fireEvent.click(screen.getByRole('button', { name: 'Pidió ayuda' }));
    fireEvent.click(screen.getByRole('button', { name: 'Terminé' }));
    expect(leerSesion().resultados[0].conAyuda).toBe(true);
    expect(screen.getByText('Cierra sesión y vuelve a entrar con la cuenta que creaste.')).toBeTruthy();
  });
});

describe('Cuestionario y reseña', () => {
  async function responderTodo() {
    guardarSesion({ ...nuevaSesion(datos), fase: 'sus', resultados: tareas });
    render(<Validacion/>);
    for (let i = 0; i < 10; i++) {
      expect(screen.getByText(`CUESTIONARIO · ${i + 1} DE 10`)).toBeTruthy();
      fireEvent.click(screen.getByRole('button', { name: i % 2 === 0 ? '4' : '2' }));
    }
    fireEvent.click(screen.getByRole('button', { name: 'Enviar' }));
    expect(screen.getByRole('alert').textContent).toContain('estrellas');
    fireEvent.click(screen.getByRole('button', { name: '5 de 5 estrellas' }));
    fireEvent.change(screen.getByLabelText('¿Qué fue lo más difícil?'), { target: { value: 'Encontrar el filtro' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sí' }));
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Enviar' })); });
  }

  it('envía la sesión al servidor y la deja en el celular', async () => {
    validacionService.guardar.mockResolvedValueOnce({ id: 1 });
    await responderTodo();
    const enviado = validacionService.guardar.mock.calls[0][0];
    expect(enviado).toMatchObject({ codigo: 'VF-02', consentimiento: true, estrellas: 5, recomendaria: 'Sí', masDificil: 'Encontrar el filtro' });
    expect(enviado.susRespuestas).toEqual([4, 2, 4, 2, 4, 2, 4, 2, 4, 2]);
    expect(screen.getByText('Guardada en el servidor y en este celular.')).toBeTruthy();
    expect(screen.getByText('75')).toBeTruthy();
    expect(leerHistorial()).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'Descargar CSV de este celular (1)' })).toBeTruthy();
  });

  it('si el servidor falla, la guarda en el celular y deja reintentar', async () => {
    validacionService.guardar.mockRejectedValueOnce(new Error('sin red'));
    await responderTodo();
    expect(screen.getByRole('alert').textContent).toContain('Quedó guardada en este celular');
    expect(leerHistorial()[0].enviada).toBe(false);
    validacionService.guardar.mockResolvedValueOnce({ id: 2 });
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Intentar enviar de nuevo' })); });
    expect(leerHistorial()[0].enviada).toBe(true);
  });
});

describe('Resultados del equipo', () => {
  it('pide la clave y compara con el R1 y el R2', async () => {
    validacionService.resultados.mockResolvedValueOnce([
      { id: 1, codigo: 'VF-01', fecha: '2026-11-15T14:00:00Z', sus: 80, estrellas: 4, tareas, susRespuestas: [], masDificil: '' },
      { id: 2, codigo: 'VF-02', fecha: '2026-11-15T14:30:00Z', sus: 70, estrellas: 5, tareas: tareas.map(t => ({ ...t, conAyuda: t.numero === 4 })), susRespuestas: [], masDificil: 'Filtrar' },
    ]);
    render(<Resultados/>);
    fireEvent.change(screen.getByLabelText('Clave del equipo'), { target: { value: 'clave' } });
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: /Ver resultados/ })); });
    expect(validacionService.resultados).toHaveBeenCalledWith('clave');
    expect(screen.getByText('2 sesiones guardadas.')).toBeTruthy();
    expect(screen.getByText('75')).toBeTruthy();
    expect(resumir([{ sus: 80, tareas }]).tareas[3]).toEqual({ numero: 4, tiempo: 14, sinAyuda: 1, total: 1 });
  });
});
