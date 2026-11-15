import { useEffect, useState } from 'react';
import { validacionService } from '../../api/services/validacionService';

const CADA_CUANTO_MS = 10000;
const formatoHora = new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'short' });
const EDADES = { MENOR: 'Menor', JOVEN: 'Joven', ADULTO: 'Adulto', ADULTO_MAYOR: 'Adulto mayor' };
const num = v => (v === null || v === undefined ? '—' : String(v).replace('.', ','));

// Resultados de la prueba guiada de la validación final. Sin datos personales.
export default function PanelValidacion() {
  const [estado, setEstado] = useState({ datos: null, error: '' });

  useEffect(() => {
    let activo = true;
    function cargar() {
      validacionService.panel()
        .then(datos => activo && setEstado({ datos, error: '' }))
        .catch(() => activo && setEstado(e => ({ ...e, error: 'No pudimos actualizar la prueba guiada.' })));
    }
    cargar();
    const intervalo = setInterval(cargar, CADA_CUANTO_MS);
    return () => { activo = false; clearInterval(intervalo); };
  }, []);

  const { datos, error } = estado;
  return <section aria-labelledby="val-titulo">
    <h2 id="val-titulo">Prueba guiada (validación final)</h2>
    <p className="hint">Enlace para participantes: {location.origin}/?validacion=1</p>
    {error && <p className="message error" role="alert">{error}</p>}
    {datos && <>
      <ul className="val-resumen">
        <li><span>Iniciaron</span><strong>{datos.sesionesIniciadas}</strong></li>
        <li><span>Saltaron la demo</span><strong>{datos.saltaronDemo}</strong></li>
        <li><span>Completaron</span><strong>{datos.completaron}</strong></li>
        <li><span>Se salieron</span><strong>{datos.abandonaron}</strong></li>
        <li><span>En curso</span><strong>{datos.enCurso}</strong></li>
        <li><span>Recorrido promedio (s)</span><strong>{num(datos.recorridoPromedioSegundos)}</strong></li>
      </ul>
      <table className="historial-tabla">
        <caption className="visually-hidden">Resultado por tarea</caption>
        <thead><tr><th scope="col">Tarea</th><th scope="col">Intentaron</th><th scope="col">Éxito sin ayuda</th><th scope="col">Éxito con ayuda</th><th scope="col">Saltaron</th><th scope="col">Se salieron</th><th scope="col">Respuestas erradas</th><th scope="col">Tiempo prom. sin ayuda (s)</th></tr></thead>
        <tbody>
          {datos.tareas.map(t => <tr key={t.tarea}>
            <td data-label="Tarea">{t.tarea}</td>
            <td data-label="Intentaron">{t.intentaron}</td>
            <td data-label="Éxito sin ayuda">{t.exitoSinAyuda}</td>
            <td data-label="Éxito con ayuda">{t.exitoConAyuda}</td>
            <td data-label="Saltaron">{t.saltadas}</td>
            <td data-label="Se salieron">{t.abandonaron}</td>
            <td data-label="Respuestas erradas">{t.respuestasErradas}</td>
            <td data-label="Tiempo prom. sin ayuda (s)">{num(t.tiempoPromedioSinAyuda)}</td>
          </tr>)}
        </tbody>
      </table>
      <h3>Últimas sesiones</h3>
      {datos.sesiones.length === 0
        ? <p className="hint">Todavía no hay sesiones.</p>
        : <table className="historial-tabla">
          <caption className="visually-hidden">Últimas sesiones de la prueba guiada</caption>
          <thead><tr><th scope="col">Sesión</th><th scope="col">Estado</th><th scope="col">Inicio</th><th scope="col">Salud</th><th scope="col">Edad</th>{datos.tareas.map((t, i) => <th key={t.tarea} scope="col">T{i + 1}</th>)}</tr></thead>
          <tbody>
            {datos.sesiones.map(s => <tr key={s.codigo + s.inicio}>
              <td data-label="Sesión">{s.codigo}</td>
              <td data-label="Estado">{s.estado}</td>
              <td data-label="Inicio">{formatoHora.format(new Date(s.inicio))}</td>
              <td data-label="Salud">{s.salud}</td>
              <td data-label="Edad">{EDADES[s.edad] ?? '—'}</td>
              {s.tareas.map((r, i) => <td key={i} data-label={`T${i + 1}`}>{r}</td>)}
            </tr>)}
          </tbody>
        </table>}
    </>}
  </section>;
}
