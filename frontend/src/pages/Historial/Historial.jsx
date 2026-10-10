import { useEffect, useMemo, useState } from 'react';
import { historialService } from '../../api/services/historialService';

const formatoFecha = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
const TODAS = 'TODAS';

export function formatearFecha(iso) {
  return formatoFecha.format(new Date(`${iso}T00:00:00Z`));
}

export default function Historial() {
  const [estado, setEstado] = useState({ cargando: true, error: '', datos: null });
  const [categoria, setCategoria] = useState(TODAS);
  const [institucion, setInstitucion] = useState(TODAS);

  function cargar() {
    setEstado({ cargando: true, error: '', datos: null });
    historialService.obtener()
      .then(datos => setEstado({ cargando: false, error: '', datos }))
      .catch(err => setEstado({ cargando: false, error: err.message, datos: null }));
  }

  useEffect(() => { cargar(); }, []);

  const registros = estado.datos?.registros ?? [];

  // Solo se ofrecen las categorías que de verdad aparecen en el historial.
  const categorias = useMemo(() => {
    const vistas = new Map();
    registros.forEach(r => vistas.set(r.categoria, r.categoriaEtiqueta));
    return [...vistas].map(([valor, etiqueta]) => ({ valor, etiqueta }));
  }, [registros]);

  const visibles = registros.filter(r =>
    (categoria === TODAS || r.categoria === categoria) &&
    (institucion === TODAS || r.institucionId === institucion));

  function quitarFiltros() {
    setCategoria(TODAS);
    setInstitucion(TODAS);
  }

  if (estado.cargando) return <p role="status">Consultando tus instituciones…</p>;

  if (estado.error) {
    return <div className="message error" role="alert">
      <p>{estado.error}</p>
      <button type="button" className="retry" onClick={cargar}>Intentar de nuevo</button>
    </div>;
  }

  const { instituciones, noDisponibles, datosSimulados } = estado.datos;
  const filtrando = categoria !== TODAS || institucion !== TODAS;

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

    {registros.length > 0 && <div className="filtros">
      <div className="chips" role="group" aria-label="Filtrar por categoría">
        <button type="button" className="chip" aria-pressed={categoria === TODAS} onClick={() => setCategoria(TODAS)}>Todos</button>
        {categorias.map(c => <button key={c.valor} type="button" className="chip"
          aria-pressed={categoria === c.valor} onClick={() => setCategoria(c.valor)}>{c.etiqueta}</button>)}
      </div>
      <label className="filtro-institucion">Institución
        <select value={institucion} onChange={e => setInstitucion(e.target.value)}>
          <option value={TODAS}>Todas las instituciones</option>
          {instituciones.map(i => <option key={i.id} value={i.id}>{i.nombre}</option>)}
        </select>
      </label>
    </div>}

    <p className="resumen" aria-live="polite">
      {filtrando
        ? `Mostrando ${visibles.length} de ${registros.length} registros`
        : `${registros.length} registros de ${instituciones.length} instituciones`}
    </p>

    {registros.length === 0
      ? <p className="hint">Todavía no encontramos registros a tu nombre en tus instituciones.</p>
      : visibles.length === 0
        ? <div className="vacio">
          <p>No hay registros con estos filtros.</p>
          <button type="button" className="retry" onClick={quitarFiltros}>Quitar filtros</button>
        </div>
        : <table className="historial-tabla">
          <caption className="visually-hidden">Registros clínicos ordenados del más reciente al más antiguo</caption>
          <thead><tr><th scope="col">Fecha</th><th scope="col">Registro</th><th scope="col">Institución</th><th scope="col">Categoría</th></tr></thead>
          <tbody>
            {visibles.map(registro => <tr key={registro.id}>
              <td data-label="Fecha"><time dateTime={registro.fecha}>{formatearFecha(registro.fecha)}</time></td>
              <td data-label="Registro"><strong>{registro.titulo}</strong><span className="detalle">{registro.detalle}</span></td>
              <td data-label="Institución">{registro.institucionNombre}</td>
              <td data-label="Categoría"><span className={`tag tag-${registro.categoria.toLowerCase()}`}>{registro.categoriaEtiqueta}</span></td>
            </tr>)}
          </tbody>
        </table>}
  </section>;
}