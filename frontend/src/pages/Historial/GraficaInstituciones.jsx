// Gráfica de pie con la cantidad de registros que aporta cada institución.
// Se dibuja con SVG propio, sin librerías. Tocar una porción o su fila de la leyenda
// filtra el historial por esa institución; tocarla de nuevo quita el filtro.

const COLORES = ['#193f36', '#4f8a6e', '#c48a2c', '#5b7fa6', '#9a5b7a', '#7a8a3a'];
const RADIO = 80;
const CENTRO = 100;

function punto(angulo) {
  // El ángulo 0 queda arriba y avanza en el sentido del reloj.
  return [CENTRO + RADIO * Math.sin(angulo), CENTRO - RADIO * Math.cos(angulo)];
}

function porcion(inicio, fin) {
  const [x1, y1] = punto(inicio);
  const [x2, y2] = punto(fin);
  const arcoGrande = fin - inicio > Math.PI ? 1 : 0;
  return `M ${CENTRO} ${CENTRO} L ${x1} ${y1} A ${RADIO} ${RADIO} 0 ${arcoGrande} 1 ${x2} ${y2} Z`;
}

export function contarPorInstitucion(registros, instituciones) {
  return instituciones
    .map((institucion, i) => ({
      id: institucion.id,
      nombre: institucion.nombre,
      color: COLORES[i % COLORES.length],
      cantidad: registros.filter(r => r.institucionId === institucion.id).length,
    }))
    .filter(dato => dato.cantidad > 0);
}

export default function GraficaInstituciones({ registros, instituciones, seleccionada, onSeleccionar }) {
  const datos = contarPorInstitucion(registros, instituciones);
  const total = datos.reduce((suma, dato) => suma + dato.cantidad, 0);
  if (total === 0) return null;

  let acumulado = 0;
  const porciones = datos.map(dato => {
    const inicio = (acumulado / total) * 2 * Math.PI;
    acumulado += dato.cantidad;
    const fin = (acumulado / total) * 2 * Math.PI;
    return { ...dato, inicio, fin, porcentaje: Math.round((dato.cantidad / total) * 100) };
  });

  function elegir(id) {
    onSeleccionar(seleccionada === id ? null : id);
  }

  const descripcion = porciones.map(p => `${p.nombre}: ${p.cantidad} (${p.porcentaje} %)`).join('; ');

  return <section className="grafica" aria-labelledby="grafica-titulo">
    <h2 id="grafica-titulo">¿Quién tiene tu información?</h2>
    <p className="hint">Registros por institución. Toca una para ver solo sus registros.</p>
    <div className="grafica-cuerpo">
      <svg viewBox="0 0 200 200" role="img" aria-label={`Registros por institución. ${descripcion}`}>
        {porciones.length === 1
          ? <circle cx={CENTRO} cy={CENTRO} r={RADIO} fill={porciones[0].color}
            onClick={() => elegir(porciones[0].id)}/>
          : porciones.map(p => <path key={p.id} d={porcion(p.inicio, p.fin)} fill={p.color}
            stroke="#fff" strokeWidth="2"
            opacity={seleccionada && seleccionada !== p.id ? 0.35 : 1}
            onClick={() => elegir(p.id)}/>)}
      </svg>
      <ul className="leyenda">
        {porciones.map(p => <li key={p.id}>
          <button type="button" aria-pressed={seleccionada === p.id} onClick={() => elegir(p.id)}>
            <span className="leyenda-color" style={{ background: p.color }} aria-hidden="true"/>
            <span className="leyenda-nombre">{p.nombre}</span>
            <span className="leyenda-dato">{p.cantidad} · {p.porcentaje} %</span>
          </button>
        </li>)}
      </ul>
    </div>
  </section>;
}
