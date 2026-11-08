import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import Landing from './Landing';
import { analiticaService } from '../../api/services/analiticaService';

vi.mock('../../api/services/analiticaService', () => ({ analiticaService: { registrar: vi.fn() } }));
afterEach(cleanup);

describe('Landing (Release 3)', () => {
  it('muestra «Crear cuenta» en el encabezado y cuenta el clic (H7)', () => {
    render(<Landing/>);
    const enlace = screen.getByRole('link', { name: 'Crear cuenta' });
    expect(enlace.getAttribute('href')).toBe('#registro');
    fireEvent.click(enlace);
    expect(analiticaService.registrar).toHaveBeenCalledWith('CLIC_CREAR_CUENTA');
  });
});