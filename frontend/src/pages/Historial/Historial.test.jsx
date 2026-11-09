import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import Historial, { formatearFecha } from './Historial';
import { historialService } from '../../api/services/historialService';
import { analiticaService } from '../../api/services/analiticaService';

vi.mock('../../api/services/historialService', () => ({ historialService: { obtener: vi.fn() } }));
afterEach(cleanup);
vi.mock('../../api/services/analiticaService', () => ({ analiticaService: { activacion: vi.fn(), registrar: vi.fn() } }));

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

  it('muestra la ayuda justo encima de los filtros (H9)', async () => {
    historialService.obtener.mockResolvedValueOnce(datos);
    render(<Historial/>);
    await screen.findByRole('table');
    const ayuda = screen.getByText('Toca una categoría o escoge una institución para filtrar tu historial.');
    const filtros = screen.getByRole('group', { name: 'Filtrar por categoría' }).closest('.filtros');
    expect(filtros.previousElementSibling).toBe(ayuda);
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

  it('muestra el último examen y los filtros encima de la gráfica plegable (H8)', async () => {
    historialService.obtener.mockResolvedValueOnce(datos);
    render(<Historial/>);
    await screen.findByRole('table');
    const tarjeta = screen.getByRole('article', { name: 'TU ÚLTIMO EXAMEN' });
    const filtros = screen.getByRole('group', { name: 'Filtrar por categoría' }).closest('.filtros');
    const desplegable = screen.getByText('Ver gráfica por institución').closest('details');
    expect(desplegable.open).toBe(false);
    expect(tarjeta.compareDocumentPosition(filtros) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(filtros.compareDocumentPosition(desplegable) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('la gráfica cuenta los registros por institución y filtra al tocar una', async () => {
    historialService.obtener.mockResolvedValueOnce(datos);
    render(<Historial/>);
    await screen.findByRole('table');
    const desplegable = screen.getByText('Ver gráfica por institución');
    expect(desplegable.closest('details').open).toBe(false);
    fireEvent.click(desplegable);
    expect(desplegable.closest('details').open).toBe(true);
    expect(screen.getByRole('img', { name: /IPS Salud Vital: 2 \(67 %\); Laboratorio Clínico Andino: 1 \(33 %\)/ })).toBeTruthy();
    const leyenda = within(screen.getByRole('list'));
    fireEvent.click(leyenda.getByRole('button', { name: /Laboratorio Clínico Andino/ }));
    expect(filas()).toEqual(['Hemograma completo']);
    fireEvent.click(leyenda.getByRole('button', { name: /Laboratorio Clínico Andino/ }));
    expect(filas()).toHaveLength(3);
  });
});

describe('Updates del Release 3', () => {
  it('muestra los filtros activos y deja quitar cada uno con su X (H6)', async () => {
    historialService.obtener.mockResolvedValueOnce(datos);
    render(<Historial/>);
    await screen.findByRole('table');
    expect(screen.queryByRole('group', { name: 'Filtros activos' })).toBeNull();
    fireEvent.change(screen.getByLabelText('Institución'), { target: { value: ips.id } });
    const activos = screen.getByRole('group', { name: 'Filtros activos' });
    expect(within(activos).getByText(/IPS Salud Vital/)).toBeTruthy();
    fireEvent.click(within(activos).getByRole('button', { name: 'Quitar filtro IPS Salud Vital' }));
    expect(screen.queryByRole('group', { name: 'Filtros activos' })).toBeNull();
    expect(filas()).toHaveLength(3);
  });

  it('la gráfica también se puede ver en barras y filtra al tocar una barra', async () => {
    historialService.obtener.mockResolvedValueOnce(datos);
    render(<Historial/>);
    await screen.findByRole('table');
    fireEvent.click(screen.getByText('Ver gráfica por institución'));
    fireEvent.click(screen.getByRole('button', { name: 'Barras' }));
    expect(screen.getByRole('button', { name: 'Barras' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.queryByRole('img', { name: /Registros por institución/ })).toBeNull();
    const barras = within(screen.getByRole('list', { name: /IPS Salud Vital: 2 \(67 %\)/ }));
    fireEvent.click(barras.getByRole('button', { name: /IPS Salud Vital/ }));
    expect(filas()).toEqual(['Consulta de medicina general', 'Glicemia en ayunas']);
    fireEvent.click(screen.getByRole('button', { name: 'Torta' }));
    expect(screen.getByRole('img', { name: /Registros por institución/ })).toBeTruthy();
  });

  it('abre el recorrido guiado paso a paso sin cambiar los filtros', async () => {
    historialService.obtener.mockResolvedValueOnce(datos);
    render(<Historial/>);
    await screen.findByRole('table');
    expect(screen.queryByRole('dialog')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: '¿Primera vez aquí? Ver recorrido guiado' }));
    const recorrido = within(screen.getByRole('dialog', { name: 'Tu último examen' }));
    expect(recorrido.getByText('Paso 1 de 4')).toBeTruthy();
    expect(document.querySelector('.ultimo-examen').classList.contains('recorrido-foco')).toBe(true);
    fireEvent.click(recorrido.getByRole('button', { name: 'Siguiente' }));
    expect(screen.getByRole('dialog', { name: 'Busca y filtra' })).toBeTruthy();
    expect(document.querySelector('.ultimo-examen').classList.contains('recorrido-foco')).toBe(false);
    fireEvent.click(screen.getByRole('button', { name: 'Salir' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(filas()).toHaveLength(3);
    expect(analiticaService.activacion).not.toHaveBeenCalled();
  });
});

describe('Instrumentación del historial', () => {
  it('avisa la activación una sola vez cuando el paciente usa un filtro o el buscador', async () => {
    historialService.obtener.mockResolvedValueOnce(datos);
    render(<Historial/>);
    await screen.findByRole('table');
    expect(analiticaService.activacion).not.toHaveBeenCalled();
    const grupo = screen.getByRole('group', { name: 'Filtrar por categoría' });
    fireEvent.click(within(grupo).getByRole('button', { name: 'Laboratorio' }));
    fireEvent.change(screen.getByLabelText('Buscar por nombre'), { target: { value: 'hemo' } });
    expect(analiticaService.activacion).toHaveBeenCalledTimes(1);
  });
});
