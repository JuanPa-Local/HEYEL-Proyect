import { useEffect, useState } from 'react';
import { historialService } from '../../api/services/historialService';

const formatoFecha = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

export function formatearFecha(iso) {
  return formatoFecha.format(new Date(`${iso}T00:00:00Z`));
}

export default function Historial() {
  const [estado, setEstado] = useState({ cargando: true, error: '', datos: null });

  function cargar() {
    setEstado({ cargando: true, error: '', datos: null });
    historialService.obtener()
      .then(datos => setEstado({ cargando: false, error: '', datos }))
      .catch(err => setEstado({ cargando: false, error: err.message, datos: null }));
  }

  useEffect(() => { cargar(); }, []);

  if (estado.cargando) return <p role="status">Consultando tus instituciones…</p>;

  if (estado.error) {
    return <div className="message error" role="alert">
      <p>{estado.error}</p>
      <button type="button" className="retry" onClick={cargar}>Intentar de nuevo</button>
    </div>;
  }

  const { registros, instituciones, noDisponibles, datosSimulados } = estado.datos;

  return <section className="historial" aria-labelledby="historial-titulo">
    <p className="eyebrow">TU HISTORIAL CLÍNICO</p>
    <h1 id="historial-titulo">Todo tu historial, en un solo lugar.</h1>
    <p className="intro">Reunimos lo que tus instituciones de salud tienen registrado sobre ti, del más reciente al más antiguo.</p>

    {datosSimulados && <p className="message demo">
      <strong>Datos de demostración.</strong> Las instituciones y los registros de este prototipo son ficticios.
    </p>}
    {noDisponibles.length > 0 && <p className="message error" role="status">
      No pudimos consultar: {noDisponibles.map(i => i.nombre).join(', ')}. El resto de tu historial sí está actualizado.
    </p>}

    <p className="resumen">{registros.length} registros de {instituciones.length} instituciones</p>

    {registros.length === 0
      ? <p className="hint">Todavía no encontramos registros a tu nombre en tus instituciones.</p>
      : <table className="historial-tabla">
        <caption className="visually-hidden">Registros clínicos ordenados del más reciente al más antiguo</caption>
        <thead><tr><th scope="col">Fecha</th><th scope="col">Registro</th><th scope="col">Institución</th><th scope="col">Categoría</th></tr></thead>
        <tbody>
          {registros.map(registro => <tr key={registro.id}>
            <td data-label="Fecha"><time dateTime={registro.fecha}>{formatearFecha(registro.fecha)}</time></td>
            <td data-label="Registro"><strong>{registro.titulo}</strong><span className="detalle">{registro.detalle}</span></td>
            <td data-label="Institución">{registro.institucionNombre}</td>
            <td data-label="Categoría"><span className={`tag tag-${registro.categoria.toLowerCase()}`}>{registro.categoriaEtiqueta}</span></td>
          </tr>)}
        </tbody>
      </table>}
  </section>;
}