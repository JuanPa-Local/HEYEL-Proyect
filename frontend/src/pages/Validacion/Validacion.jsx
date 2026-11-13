import { useState } from 'react';
import Brand from '../../components/layout/Brand';
import { authService } from '../../api/services/authService';
import { validacionService } from '../../api/services/validacionService';
import { TAREAS, PREGUNTAS_SUS, calcularSus } from '../../validacion/tareas';
import { guardarSesion, nuevaSesion, useSesionValidacion } from '../../validacion/sesion';
import { actualizarEnHistorial, agregarAlHistorial, armarCsv, descargarCsv, leerHistorial } from '../../validacion/csv';
import { formatearTiempo } from '../../components/validacion/BarraValidacion';

const CONSENTIMIENTO = [
  'Vamos a probar una aplicación para mejorarla. No te estamos evaluando a ti: si algo no sale, es un problema de la app.',
  'Te daremos 5 tareas cortas y tomaremos el tiempo de cada una. Nadie del equipo te va a explicar cómo funciona mientras lo intentas.',
  'Al final responderás 10 afirmaciones y nos dirás tu opinión. No guardamos tu nombre ni tu correo: puedes crear la cuenta con un correo de prueba.',
  'Puedes parar cuando quieras.',
];

function Marco({ children }) {
  return <div className="app">
    <header className="app-header"><Brand/><span className="validacion-etiqueta">Modo validación</span></header>
    <main className="app-main validacion">{children}</main>
  </div>;
}

function Datos() {
  const [error, setError] = useState('');
  async function empezar(event) {
    event.preventDefault();
    const valores = Object.fromEntries(new FormData(event.currentTarget));
    if (!valores.consentimiento) { setError('Lee el consentimiento y marca la casilla cuando la persona acepte.'); return; }
    guardarSesion(nuevaSesion({
      codigo: valores.codigo.trim(), perfil: valores.perfil.trim(), probo: valores.probo,
      facilitador: valores.facilitador.trim(), observador: valores.observador.trim(),
    }));
    // El participante empieza como alguien que llega por primera vez: sin sesión y en la landing.
    await authService.logout().catch(() => null);
    location.hash = '';
    location.reload();
  }
  return <Marco>
    <p className="eyebrow">VALIDACIÓN CON USUARIOS</p>
    <h1>Nueva sesión</h1>
    <p className="intro">Llena estos datos, lee el consentimiento en voz alta y pásale el celular a la persona.</p>
    <form onSubmit={empezar} className="validacion-form">
      <label>Código del participante<input name="codigo" required maxLength={20} placeholder="VF-01"/></label>
      <label>Perfil<input name="perfil" maxLength={200} placeholder="Por ejemplo, cuidadora de 58 años"/></label>
      <label>¿Probó una versión anterior?
        <select name="probo" defaultValue="No"><option>No</option><option>Sí (R1)</option><option>Sí (R2)</option></select>
      </label>
      <label>Facilitador<input name="facilitador" maxLength={100}/></label>
      <label>Observador<input name="observador" maxLength={100}/></label>
      <section className="terms" aria-label="Consentimiento">
        <h2>Consentimiento (léelo en voz alta)</h2>
        {CONSENTIMIENTO.map(p => <p key={p}>{p}</p>)}
        <label className="checkbox-label"><input name="consentimiento" type="checkbox" onChange={() => setError('')}/>
          <span>La persona aceptó participar.</span></label>
      </section>
      {error && <p role="alert" className="message error">{error}</p>}
      <button className="primary">Empezar las tareas <span aria-hidden="true">↗</span></button>
    </form>
    <p className="hint">Al tocar el botón la app vuelve al inicio y aparece la primera tarea abajo.</p>
    <p className="switch"><a href="#validacion/resultados">Ver resultados del equipo</a></p>
  </Marco>;
}

function EnCurso({ sesion }) {
  return <Marco>
    <h1>Sesión en curso</h1>
    <p className="intro">{sesion.datos.codigo} va en la tarea {sesion.tarea + 1} de {TAREAS.length}.</p>
    <button type="button" className="primary" onClick={() => { location.hash = ''; }}>Volver a la app</button>
    <button type="button" className="retry validacion-cancelar" onClick={() => guardarSesion(null)}>Cancelar esta sesión</button>
  </Marco>;
}

function Sus({ sesion }) {
  const [actual, setActual] = useState(Math.min(sesion.sus.length, PREGUNTAS_SUS.length - 1));
  function responder(valor) {
    const sus = [...sesion.sus];
    sus[actual] = valor;
    if (actual + 1 < PREGUNTAS_SUS.length) {
      guardarSesion({ ...sesion, sus });
      setActual(actual + 1);
    } else {
      guardarSesion({ ...sesion, sus, fase: 'resena' });
    }
  }
  return <Marco>
    <p className="eyebrow">CUESTIONARIO · {actual + 1} DE {PREGUNTAS_SUS.length}</p>
    <h1 className="validacion-pregunta">{PREGUNTAS_SUS[actual]}</h1>
    <div className="escala" role="group" aria-label="Qué tan de acuerdo estás">
      {[1, 2, 3, 4, 5].map(v => <button key={v} type="button" aria-pressed={sesion.sus[actual] === v}
        onClick={() => responder(v)}>{v}</button>)}
    </div>
    <div className="escala-extremos"><span>Muy en desacuerdo</span><span>Muy de acuerdo</span></div>
    {actual > 0 && <button type="button" className="retry" onClick={() => setActual(actual - 1)}>Anterior</button>}
  </Marco>;
}

function armarRegistro(sesion, resena) {
  return {
    ...sesion.datos, consentimiento: true, tareas: sesion.resultados, susRespuestas: sesion.sus,
    estrellas: resena.estrellas, masDificil: resena.masDificil, cambiaria: resena.cambiaria, recomendaria: resena.recomendaria,
  };
}

function Resena({ sesion }) {
  const [estrellas, setEstrellas] = useState(0);
  const [recomendaria, setRecomendaria] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  async function enviar(event) {
    event.preventDefault();
    if (!estrellas) { setError('Elige de 1 a 5 estrellas.'); return; }
    const valores = Object.fromEntries(new FormData(event.currentTarget));
    const registro = armarRegistro(sesion, { estrellas, recomendaria, masDificil: valores.masDificil.trim(), cambiaria: valores.cambiaria.trim() });
    const local = { ...registro, idLocal: String(Date.now()), fecha: new Date().toISOString(), sus: calcularSus(registro.susRespuestas) };
    setEnviando(true);
    let enviada = false;
    try { await validacionService.guardar(registro); enviada = true; } catch { enviada = false; }
    agregarAlHistorial({ ...local, enviada });
    guardarSesion({ ...sesion, fase: 'resumen', registro: local, enviada });
  }
  return <Marco>
    <p className="eyebrow">TU OPINIÓN</p>
    <h1>¿Cómo te pareció HEYEL?</h1>
    <form onSubmit={enviar} className="validacion-form">
      <div className="estrellas" role="group" aria-label="Calificación de 1 a 5 estrellas">
        {[1, 2, 3, 4, 5].map(v => <button key={v} type="button" aria-label={`${v} de 5 estrellas`} aria-pressed={estrellas === v}
          className={v <= estrellas ? 'estrella llena' : 'estrella'} onClick={() => { setEstrellas(v); setError(''); }}>★</button>)}
      </div>
      <label>¿Qué fue lo más difícil?<textarea name="masDificil" maxLength={1000} rows={3}/></label>
      <label>¿Qué cambiarías?<textarea name="cambiaria" maxLength={1000} rows={3}/></label>
      <div className="chips" role="group" aria-label="¿Nos recomendarías?">
        <span className="validacion-subtitulo">¿Nos recomendarías?</span>
        {['Sí', 'Tal vez', 'No'].map(v => <button key={v} type="button" className="chip" aria-pressed={recomendaria === v}
          onClick={() => setRecomendaria(v)}>{v}</button>)}
      </div>
      {error && <p role="alert" className="message error">{error}</p>}
      <button className="primary" disabled={enviando}>{enviando ? 'Guardando…' : 'Enviar'} <span aria-hidden="true">↗</span></button>
    </form>
  </Marco>;
}

function Resumen({ sesion }) {
  const [enviada, setEnviada] = useState(sesion.enviada);
  const [reintentando, setReintentando] = useState(false);
  const { registro } = sesion;
  const historial = leerHistorial();
  async function reintentar() {
    setReintentando(true);
    try {
      const { idLocal, fecha, sus, ...cuerpo } = registro;
      await validacionService.guardar(cuerpo);
      actualizarEnHistorial(idLocal, { enviada: true });
      setEnviada(true);
    } catch { setEnviada(false); }
    setReintentando(false);
  }
  return <Marco>
    <p className="eyebrow">SESIÓN TERMINADA · {registro.codigo}</p>
    <h1>¡Gracias por participar!</h1>
    <p className="intro">Devuélvele el celular al equipo.</p>
    {enviada
      ? <p className="message demo">Guardada en el servidor y en este celular.</p>
      : <div className="message error" role="alert"><p>No se pudo enviar al servidor. Quedó guardada en este celular.</p>
        <button type="button" className="retry" onClick={reintentar} disabled={reintentando}>{reintentando ? 'Enviando…' : 'Intentar enviar de nuevo'}</button></div>}
    <table className="historial-tabla validacion-tabla">
      <thead><tr><th scope="col">Tarea</th><th scope="col">Tiempo</th><th scope="col">Resultado</th></tr></thead>
      <tbody>{registro.tareas.map(t => <tr key={t.numero}>
        <td data-label="Tarea">T{t.numero}</td>
        <td data-label="Tiempo">{formatearTiempo(t.segundos)} ({String(t.segundos).replace('.', ',')} s)</td>
        <td data-label="Resultado">{!t.completada ? 'No pudo' : t.conAyuda ? 'Con ayuda' : 'Sin ayuda'}</td>
      </tr>)}</tbody>
    </table>
    <p className="resumen-sus">SUS: <strong>{String(registro.sus).replace('.', ',')}</strong> · {registro.estrellas} de 5 estrellas</p>
    <div className="validacion-acciones">
      <button type="button" className="retry" onClick={() => descargarCsv(`validacion-${registro.codigo}.csv`, armarCsv([registro]))}>Descargar CSV de esta sesión</button>
      <button type="button" className="retry" onClick={() => descargarCsv('validacion-este-celular.csv', armarCsv(historial))}>Descargar CSV de este celular ({historial.length})</button>
      <button type="button" className="primary" onClick={() => guardarSesion(null)}>Nueva sesión <span aria-hidden="true">↗</span></button>
    </div>
  </Marco>;
}

export default function Validacion() {
  const sesion = useSesionValidacion();
  if (!sesion) return <Datos/>;
  if (sesion.fase === 'tareas') return <EnCurso sesion={sesion}/>;
  if (sesion.fase === 'sus') return <Sus sesion={sesion}/>;
  if (sesion.fase === 'resena') return <Resena sesion={sesion}/>;
  return <Resumen sesion={sesion}/>;
}
