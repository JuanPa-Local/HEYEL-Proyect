import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import Historial, { formatearFecha } from './Historial';
import { historialService } from '../../api/services/historialService';

vi.mock('../../api/services/historialService', () => ({ historialService: { obtener: vi.fn() } }));
afterEach(cleanup);

const lab = { id: 'lab-1', nombre: 'Laboratorio Clínico Andino', tipo: 'Laboratorio' };
const ips = { id: 'ips-1', nombre: 'IPS Salud Vital', tipo: 'IPS' };
const datos = {
  datosSimulados: true,
  noDisponibles: [],
  instituciones: [ips, lab],
  registros: [
    { id: 'r1', fecha: '2026-08-15', titulo: 'Hemograma completo', detalle: 'Valores normales.', categoria: 'LABORATORIO', categoriaEtiqueta: 'Laboratorio', institucionId: lab.id, institucionNombre: lab.nombre },
    { id: 'r2', fecha: '2026-06-02', titulo: 'Consulta de medicina general', detalle: 'Control anual.', categoria: 'CONSULTA', categoriaEtiqueta: 'Consulta', institucionId: ips.id, institucionNombre: ips.nombre },
    { id: 'r3', fecha: '2025-01-20', titulo: 'Glicemia en ayunas', detalle: 'Dentro del rango.', categoria: 'LABORATORIO', categoriaEtiqueta: 'Laboratorio', institucionId: ips.id, institucionNombre: ips.nombre },
  ],
};

function filas() {
  return screen.getAllByRole('row').slice(1).map(fila => within(fila).getAllByRole('cell')[1].querySelector('strong').textContent);
}

describe('Historial consolidado (US-03, US-05)', () => {
  it('muestra los registros de todas las instituciones en el orden recibido y avisa que son simulados', async () => {
    historialService.obtener.mockResolvedValueOnce(datos);
    render(<Historial/>);
    expect(await screen.findByText('Hemograma completo')).toBeTruthy();
    expect(filas()).toEqual(['Hemograma completo', 'Consulta de medicina general', 'Glicemia en ayunas']);
    expect(screen.getByText('3 registros de 2 instituciones')).toBeTruthy();
    expect(screen.getByText('Datos de demostración.')).toBeTruthy();
    expect(screen.getAllByText('IPS Salud Vital')).toHaveLength(2);
  });

  it('muestra el error y permite reintentar', async () => {
    historialService.obtener.mockRejectedValueOnce(new Error('No pudimos completar la solicitud.'));
    historialService.obtener.mockResolvedValueOnce(datos);
    render(<Historial/>);
    expect((await screen.findByRole('alert')).textContent).toContain('No pudimos completar la solicitud.');
    fireEvent.click(screen.getByRole('button', { name: 'Intentar de nuevo' }));
    expect(await screen.findByText('Hemograma completo')).toBeTruthy();
  });

  it('formatea la fecha sin correrse de día', () => {
    expect(formatearFecha('2026-08-15')).toMatch(/15/);
  });
});