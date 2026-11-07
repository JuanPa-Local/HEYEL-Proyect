import { useEffect, useState } from 'react';
import Brand from '../../components/layout/Brand';
import { analiticaService } from '../../api/services/analiticaService';

const CADA_CUANTO_MS = 10000;

const NOMBRES = {
  REGISTRO: 'Se registró un paciente',
  ACTIVACION: 'Un paciente se activó',
  REGRESO: 'Un paciente regresó',
};

const formatoHora = new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'short' });

// Arma los pasos del embudo y calcula cuánta gente pasa de un paso al siguiente.
export function armarEmbudo(datos) {
  const pasos = [
    { nombre: 'Visitas a la landing', valor: datos.visitasLanding },
    { nombre: 'Clics en «Crear mi cuenta»', valor: datos.clicsCrearCuenta },
    { nombre: 'Registros', valor: datos.registros },
    { nombre: 'Activados', valor: datos.activados },
    { nombre: 'Regresaron', valor: datos.regresaron },
  ];
  return pasos.map((paso, i) => {
    const anterior = i === 0 ? null : pasos[i - 1].valor;
    const porcentaje = anterior ? Math.min(100, Math.round((paso.valor / anterior) * 100)) : null;
    return { ...paso, pasaDelAnterior: porcentaje, seQuedan: porcentaje === null ? null : 100 - porcentaje };
  });
}

// El mayor abandono es el paso donde más porcentaje de gente se queda por el camino.
export function mayorAbandono(embudo) {
  return embudo.filter(p => p.seQuedan !== null)
    .reduce((peor, p) => (peor === null || p.seQuedan > peor.seQuedan ? p : peor), null);
}

export default function Panel() {
  const [estado, setEstado] = useState({ datos: null, error: '', actualizado: null });

  useEffect(() => {
    let activo = true;
    function cargar() {
      analiticaService.panel()
        .then(datos => activo && setEstado({ datos, error: '', actualizado: new Date() }))
        .catch(() => activo && setEstado(e => ({ ...e, error: 'No pudimos actualizar el panel. Lo intentamos de nuevo en unos segundos.' })));
    }
    cargar();
    const intervalo = setInterval(cargar, CADA_CUANTO_MS);
    return () => { activo = false; clearInterval(intervalo); };
  }, []);

  const { datos, error, actualizado } = estado;
  const embudo = datos ? armarEmbudo(datos) : [];
  const maximo = Math.max(1, ...embudo.map(p => p.valor));
  const peor = datos ? mayorAbandono(embudo) : null;

  return <div className="app">
    <header className="app-header"><Brand/><a className="logout" href="#">Ir a HEYEL</a></header>
    <main className="app-main panel">
      <p className="eyebrow">ANALÍTICA EN VIVO</p>
      <h1>Panel de HEYEL</h1>
      <p className="intro">Se actualiza solo cada 10 segundos. No muestra datos personales, solo cuántas personas llegan a cada paso.</p>
      {actualizado && <p className="hint" aria-live="polite">Última actualización: {formatoHora.format(actualizado)}</p>}
      {error && <p className="message error" role="alert">{error}</p>}
      {!datos && !error && <p role="status">Cargando el panel…</p>}

      {datos && <>
        <h2>Embudo</h2>
        <ol className="embudo">
          {embudo.map(p => <li key={p.nombre}>
            <div className="embudo-fila">
              <span>{p.nombre}</span>
              <strong>{p.valor}</strong>
            </div>
            <div className="embudo-barra" aria-hidden="true"><span style={{ width: `${(p.valor / maximo) * 100}%` }}/></div>
            {p.pasaDelAnterior !== null && <p className="embudo-paso">{p.pasaDelAnterior} % del paso anterior</p>}
          </li>)}
        </ol>
        {peor && peor.seQuedan > 0 && <p className="message demo">
          <strong>Mayor abandono:</strong> antes de «{peor.nombre}», donde se queda el {peor.seQuedan} % de la gente.
        </p>}
        <p className="hint">Registros, activados y regresaron se cuentan desde que se activó la medición (Release 3).</p>

        <h2>Últimos eventos</h2>
        {datos.ultimos.length === 0
          ? <p className="hint">Todavía no hay eventos.</p>
          : <ul className="eventos">
            {datos.ultimos.map((e, i) => <li key={i}>
              <span>{NOMBRES[e.tipo] ?? e.tipo}</span>
              <time dateTime={e.fecha}>{formatoHora.format(new Date(e.fecha))}</time>
            </li>)}
          </ul>}
      </>}
    </main>
  </div>;
}