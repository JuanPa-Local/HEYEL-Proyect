import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import Panel, { armarEmbudo, mayorAbandono } from './Panel';
import { analiticaService } from '../../api/services/analiticaService';

vi.mock('../../api/services/analiticaService', () => ({ analiticaService: { panel: vi.fn() } }));
afterEach(cleanup);

const datos = {
  visitasLanding: 40, clicsCrearCuenta: 10, registros: 8, activados: 6, regresaron: 2,
  ultimos: [{ tipo: 'ACTIVACION', fecha: '2026-11-07T10:00:00' }, { tipo: 'REGISTRO', fecha: '2026-11-07T09:58:00' }],
};

describe('Panel de analítica', () => {
  it('calcula cuánto pasa de un paso al siguiente y encuentra el mayor abandono', () => {
    const embudo = armarEmbudo(datos);
    expect(embudo.map(p => p.pasaDelAnterior)).toEqual([null, 25, 80, 75, 33]);
    expect(mayorAbandono(embudo).nombre).toBe('Clics en «Crear mi cuenta»');
  });

  it('muestra el embudo y los últimos eventos', async () => {
    analiticaService.panel.mockResolvedValue(datos);
    render(<Panel/>);
    expect(await screen.findByText('Visitas a la landing')).toBeTruthy();
    expect(screen.getByText('40')).toBeTruthy();
    expect(screen.getByText(/Mayor abandono/)).toBeTruthy();
    expect(screen.getByText('Un paciente se activó')).toBeTruthy();
  });
});