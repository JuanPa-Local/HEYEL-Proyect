import { useState } from 'react';
import Brand from '../../components/layout/Brand';
import { validacionService } from '../../api/services/validacionService';
import { TAREAS } from '../../validacion/tareas';
import { armarCsv, descargarCsv, formatearFechaHora } from '../../validacion/csv';

// Resultados de los releases anteriores, para comparar la validación final con ellos.
export const REFERENCIA = {
  R1: { sus: 88.75, tiempos: [47.0, 14.9, 8.0, 18.9, 5.7] },
  R2: { sus: 64.0, tiempos: [43.0, 10.6, 7.0, 21.2, 6.8] },
};

const uno = n => (Math.round(n * 10) / 10).toString().replace('.', ',');

export function resumir(sesiones) {
  const promedio = valores => (valores.length ? valores.reduce((a, b) => a + b, 0) / valores.length : null);
  return {
    sus: promedio(sesiones.map(s => s.sus)),
    tareas: TAREAS.map(t => {
      const resultados = sesiones.map(s => s.tareas.find(x => x.numero === t.numero)).filter(Boolean);
      return {
        numero: t.numero,
        tiempo: promedio(resultados.map(r => r.segundos)),
        sinAyuda: resultados.filter(r => r.completada && !r.conAyuda).length,
        total: resultados.length,
      };
    }),
  };
}

export default function Resultados() {
  const [sesiones, setSesiones] = useState(null);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  async function consultar(event) {
    event.preventDefault();
    const clave = new FormData(event.currentTarget).get('clave');
    setCargando(true); setError('');
    try { setSesiones(await validacionService.resultados(clave)); }
    catch (err) { setError(err.message); }
    setCargando(false);
  }

  const resumen = sesiones ? resumir(sesiones) : null;

  return <div className="app">
    <header className="app-header"><Brand/><a className="logout" href="#validacion">Nueva sesión</a></header>
    <main className="app-main validacion">
      <p className="eyebrow">VALIDACIÓN CON USUARIOS</p>
      <h1>Resultados del equipo</h1>
      {!sesiones && <form onSubmit={consultar} className="validacion-form">
        <label>Clave del equipo<input name="clave" type="password" required autoComplete="off"/></label>
        {error && <p role="alert" className="message error">{error}</p>}
        <button className="primary" disabled={cargando}>{cargando ? 'Consultando…' : 'Ver resultados'} <span aria-hidden="true">↗</span></button>
      </form>}

      {sesiones && <>
        <p className="intro">{sesiones.length} {sesiones.length === 1 ? 'sesión guardada' : 'sesiones guardadas'}.</p>
        {sesiones.length > 0 && <>
          <table className="historial-tabla validacion-tabla">
            <caption className="visually-hidden">Promedio por tarea comparado con el R1 y el R2</caption>
            <thead><tr><th scope="col">Tarea</th><th scope="col">Sin ayuda</th><th scope="col">Tiempo (s)</th><th scope="col">R2 (s)</th><th scope="col">R1 (s)</th></tr></thead>
            <tbody>{resumen.tareas.map((t, i) => <tr key={t.numero}>
              <td data-label="Tarea">T{t.numero}</td>
              <td data-label="Sin ayuda">{t.sinAyuda} de {t.total}</td>
              <td data-label="Tiempo (s)">{t.tiempo === null ? '—' : uno(t.tiempo)}</td>
              <td data-label="R2 (s)">{uno(REFERENCIA.R2.tiempos[i])}</td>
              <td data-label="R1 (s)">{uno(REFERENCIA.R1.tiempos[i])}</td>
            </tr>)}</tbody>
          </table>
          <p className="resumen-sus">SUS promedio: <strong>{uno(resumen.sus)}</strong> · R2: {uno(REFERENCIA.R2.sus)} · R1: {uno(REFERENCIA.R1.sus)} · industria: 68</p>

          <h2>Sesiones</h2>
          <ul className="eventos">
            {sesiones.map(s => <li key={s.id}>
              <span><strong>{s.codigo}</strong> · SUS {uno(s.sus)} · {s.estrellas}★{s.masDificil ? ` · «${s.masDificil}»` : ''}</span>
              <time dateTime={s.fecha}>{formatearFechaHora(s.fecha)}</time>
            </li>)}
          </ul>
        </>}
        <div className="validacion-acciones">
          <button type="button" className="primary" disabled={!sesiones.length}
            onClick={() => descargarCsv('validacion-final-heyel.csv', armarCsv(sesiones))}>Descargar CSV <span aria-hidden="true">↗</span></button>
        </div>
      </>}
    </main>
  </div>;
}
