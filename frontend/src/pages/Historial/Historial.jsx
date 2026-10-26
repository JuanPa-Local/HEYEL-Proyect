import { useEffect, useMemo, useState } from 'react';
import { historialService } from '../../api/services/historialService';
import GraficaInstituciones from './GraficaInstituciones';

const formatoFecha = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
const TODAS = 'TODAS';

export function formatearFecha(iso) {
  return formatoFecha.format(new Date(`${iso}T00:00:00Z`));
}

// Quita tildes y mayúsculas para que «hemograma», «Hemograma» y «HEMOGRAMA» den lo mismo.
export function normalizar(texto) {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

export default function Historial() {
  const [estado, setEstado] = useState({ cargando: true, error: '', datos: null });
  const [categoria, setCategoria] = useState(TODAS);
  const [institucion, setInstitucion] = useState(TODAS);
  const [busqueda, setBusqueda] = useState('');

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

  // Los registros llegan del más reciente al más antiguo: el primero de laboratorio es el último examen (hallazgo H3).
  const ultimoExamen = registros.find(r => r.categoria === 'LABORATORIO');

  // La gráfica usa la categoría y la búsqueda, pero no la institución, para seguir mostrando todas las porciones.
  const texto = normalizar(busqueda);
  const porCategoriaYBusqueda = registros.filter(r =>
    (categoria === TODAS || r.categoria === categoria) &&
    (texto === '' || normalizar(r.titulo).includes(texto)));
  const visibles = porCategoriaYBusqueda.filter(r => institucion === TODAS || r.institucionId === institucion);

  function quitarFiltros() {
    setCategoria(TODAS);
    setInstitucion(TODAS);
    setBusqueda('');
  }

  if (estado.cargando) return <p role="status">Consultando tus instituciones…</p>;

  if (estado.error) {
    return <div className="message error" role="alert">
      <p>{estado.error}</p>
      <button type="button" className="retry" onClick={cargar}>Intentar de nuevo</button>
    </div>;
  }

  const { instituciones, noDisponibles, datosSimulados } = estado.datos;
  const filtrando = categoria !== TODAS || institucion !== TODAS || texto !== '';

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

    {ultimoExamen && <article className="ultimo-examen" aria-labelledby="ultimo-examen-titulo">
      <p className="eyebrow" id="ultimo-examen-titulo">TU ÚLTIMO EXAMEN</p>
      <strong>{ultimoExamen.titulo}</strong>
      <span><time dateTime={ultimoExamen.fecha}>{formatearFecha(ultimoExamen.fecha)}</time> · {ultimoExamen.institucionNombre}</span>
      <span className="detalle">{ultimoExamen.detalle}</span>
    </article>}

    {registros.length > 0 && <GraficaInstituciones registros={porCategoriaYBusqueda}
      instituciones={instituciones} seleccionada={institucion === TODAS ? null : institucion}
      onSeleccionar={id => setInstitucion(id ?? TODAS)}/>}

    {registros.length > 0 && <div className="filtros">
      <label className="buscador">Buscar por nombre
        <input type="search" value={busqueda} onChange={e => setBusqueda(e.target.value)}
          placeholder="Por ejemplo, hemograma" autoComplete="off"/>
      </label>
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
      {filtrando && <button type="button" className="retry" onClick={quitarFiltros}>Quitar filtros</button>}
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