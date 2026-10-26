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
    await screen.findByRole('table');
    expect(filas()).toEqual(['Hemograma completo', 'Consulta de medicina general', 'Glicemia en ayunas']);
    expect(screen.getByText('3 registros de 2 instituciones')).toBeTruthy();
    expect(screen.getByText('Datos de demostración.')).toBeTruthy();
    expect(within(screen.getByRole('table')).getAllByText('IPS Salud Vital')).toHaveLength(2);
  });

  it('muestra el error y permite reintentar', async () => {
    historialService.obtener.mockRejectedValueOnce(new Error('No pudimos completar la solicitud.'));
    historialService.obtener.mockResolvedValueOnce(datos);
    render(<Historial/>);
    expect((await screen.findByRole('alert')).textContent).toContain('No pudimos completar la solicitud.');
    fireEvent.click(screen.getByRole('button', { name: 'Intentar de nuevo' }));
    await screen.findByRole('table');
  });

  it('formatea la fecha sin correrse de día', () => {
    expect(formatearFecha('2026-08-15')).toMatch(/15/);
  });
});

describe('Filtros del historial (US-04, US-05)', () => {
  it('filtra por categoría y solo ofrece las categorías que existen', async () => {
    historialService.obtener.mockResolvedValueOnce(datos);
    render(<Historial/>);
    await screen.findByRole('table');
    const grupo = screen.getByRole('group', { name: 'Filtrar por categoría' });
    expect(within(grupo).queryByRole('button', { name: 'Imagenología' })).toBeNull();
    fireEvent.click(within(grupo).getByRole('button', { name: 'Laboratorio' }));
    expect(filas()).toEqual(['Hemograma completo', 'Glicemia en ayunas']);
    expect(within(grupo).getByRole('button', { name: 'Laboratorio' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByText('Mostrando 2 de 3 registros')).toBeTruthy();
  });

  it('filtra por institución', async () => {
    historialService.obtener.mockResolvedValueOnce(datos);
    render(<Historial/>);
    await screen.findByRole('table');
    fireEvent.change(screen.getByLabelText('Institución'), { target: { value: ips.id } });
    expect(filas()).toEqual(['Consulta de medicina general', 'Glicemia en ayunas']);
  });

  it('combina filtros, avisa cuando no hay resultados y permite quitarlos', async () => {
    historialService.obtener.mockResolvedValueOnce(datos);
    render(<Historial/>);
    await screen.findByRole('table');
    fireEvent.change(screen.getByLabelText('Institución'), { target: { value: lab.id } });
    fireEvent.click(screen.getByRole('button', { name: 'Consulta' }));
    expect(screen.getByText('No hay registros con estos filtros.')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Quitar filtros' }));
    expect(filas()).toHaveLength(3);
    expect(screen.getByText('3 registros de 2 instituciones')).toBeTruthy();
  });
});
describe('Updates del Release 2', () => {
  it('muestra arriba el último examen de laboratorio y dónde se lo hicieron (H3)', async () => {
    historialService.obtener.mockResolvedValueOnce(datos);
    render(<Historial/>);
    const tarjeta = await screen.findByRole('article', { name: 'TU ÚLTIMO EXAMEN' });
    expect(within(tarjeta).getByText('Hemograma completo')).toBeTruthy();
    expect(within(tarjeta).getByText(/Laboratorio Clínico Andino/)).toBeTruthy();
  });

  it('busca por nombre sin importar mayúsculas ni tildes y se combina con los filtros (H3)', async () => {
    historialService.obtener.mockResolvedValueOnce(datos);
    render(<Historial/>);
    await screen.findByRole('table');
    fireEvent.change(screen.getByLabelText('Buscar por nombre'), { target: { value: 'GLICEMIA' } });
    expect(filas()).toEqual(['Glicemia en ayunas']);
    expect(screen.getByText('Mostrando 1 de 3 registros')).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Institución'), { target: { value: lab.id } });
    expect(screen.getByText('No hay registros con estos filtros.')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Quitar filtros' }));
    expect(screen.getByLabelText('Buscar por nombre').value).toBe('');
    expect(filas()).toHaveLength(3);
  });

  it('la gráfica cuenta los registros por institución y filtra al tocar una', async () => {
    historialService.obtener.mockResolvedValueOnce(datos);
    render(<Historial/>);
    await screen.findByRole('table');
    expect(screen.getByRole('img', { name: /IPS Salud Vital: 2 \(67 %\); Laboratorio Clínico Andino: 1 \(33 %\)/ })).toBeTruthy();
    const leyenda = within(screen.getByRole('list'));
    fireEvent.click(leyenda.getByRole('button', { name: /Laboratorio Clínico Andino/ }));
    expect(filas()).toEqual(['Hemograma completo']);
    fireEvent.click(leyenda.getByRole('button', { name: /Laboratorio Clínico Andino/ }));
    expect(filas()).toHaveLength(3);
  });
});
