import { useEffect, useRef, useState } from 'react';
import { validacionService } from '../../api/services/validacionService';
import { historialService } from '../../api/services/historialService';
import { authService } from '../../api/services/authService';

// Prueba guiada para la validación final. Solo aparece con el enlace /?validacion=1.
// Registra por sesión anónima: tiempo por tarea, éxito (con o sin ayuda), tareas saltadas y salidas.
const CLAVE = 'heyel-prueba';
const CENTRO = 'Centro de Imágenes del Norte';

export const TAREAS = [
  { titulo: 'Crea una cuenta', texto: 'Crea una cuenta nueva en HEYEL aceptando las condiciones de uso.', pistas: ['.checkbox-label', '.landing-registrarme'] },
  { titulo: 'Sal y vuelve a entrar', texto: 'Cierra sesión y vuelve a entrar con la cuenta que acabas de crear.', pistas: ['.logout', 'form .primary'] },
  { titulo: 'Tu examen más reciente', texto: '¿Cuál es tu examen de laboratorio más reciente y en qué institución te lo hicieron? Escríbelo aquí abajo.', pistas: ['.ultimo-examen'], respuesta: true },
  { titulo: 'Una sola institución', texto: 'Deja en pantalla solo los registros del Centro de Imágenes del Norte.', pistas: ['.filtro-institucion', '.filtros'] },
  { titulo: 'Cierra sesión', texto: 'Cuando termines, cierra sesión.', pistas: ['.logout'] },
];

const VACIAS = new Set(['del', 'las', 'los', 'con', 'sin', 'por', 'para']);
const GENERICAS = new Set(['laboratorio', 'clinico', 'clinica', 'centro']);

function normalizar(texto) {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function palabras(texto, descartar) {
  return normalizar(texto).split(/[^a-z0-9]+/).filter(p => p.length >= 3 && !VACIAS.has(p) && !descartar.has(p));
}

// La respuesta es correcta si menciona una palabra del examen y una palabra propia de la institución.
export function respuestaCorrecta(respuesta, examen) {
  const r = normalizar(respuesta);
  const menciona = lista => lista.some(p => r.includes(p));
  return menciona(palabras(examen.titulo, new Set())) && menciona(palabras(examen.institucionNombre, GENERICAS));
}

function leer() {
  try { return JSON.parse(sessionStorage.getItem(CLAVE)); } catch { return null; }
}
function guardar(estado) {
  try { sessionStorage.setItem(CLAVE, JSON.stringify(estado)); } catch { /* sin sessionStorage */ }
}
function habilitada() {
  try {
    if (new URLSearchParams(location.search).get('validacion') === '1') sessionStorage.setItem('heyel-validacion', '1');
    return sessionStorage.getItem('heyel-validacion') === '1';
  } catch { return false; }
}
function nuevoId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}
const soloCentro = d => Boolean(d) && d.nombres.length === 1 && d.nombres[0] === CENTRO;

export default function PruebaGuiada() {
  const [activa] = useState(habilitada);
  const [estado, setEstado] = useState(leer);
  const [hash, setHash] = useState(() => location.hash);
  const [respuesta, setRespuesta] = useState('');
  const [aviso, setAviso] = useState('');
  const [pista, setPista] = useState(false);
  const [preparando, setPreparando] = useState(false);
  const [paso, setPaso] = useState('intro');
  const [salud, setSalud] = useState('');
  const [edad, setEdad] = useState('');
  const ref = useRef(estado);

  function actualizar(nuevo) { ref.current = nuevo; setEstado(nuevo); guardar(nuevo); }
  function enviar(tipo, extra = {}) {
    const e = ref.current;
    if (e) validacionService.registrar({ sesionId: e.sid, tipo, ...extra });
  }

  // Cierra la tarea actual (éxito o salto), registra el tiempo y pasa a la siguiente.
  function cerrarTarea(tipo) {
    const e = ref.current;
    if (!e || e.fase !== 'tareas') return;
    const segundos = Math.min(7200, Math.round((Date.now() - e.inicioTarea) / 1000));
    enviar(tipo, { tarea: e.tarea, segundos, ayuda: e.ayuda });
    setRespuesta(''); setAviso(''); setPista(false);
    if (e.tarea === TAREAS.length) {
      enviar('FIN');
      actualizar({ ...e, fase: 'fin' });
      return;
    }
    const siguiente = e.tarea + 1;
    actualizar({ ...e, tarea: siguiente, inicioTarea: Date.now(), ayuda: false });
    enviar('TAREA_INICIO', { tarea: siguiente });
  }

  useEffect(() => {
    const alCambiarHash = () => setHash(location.hash);
    // La app avisa registro, login y logout; el historial avisa qué instituciones se ven.
    const alAutenticar = ev => {
      const e = ref.current;
      if (!e || e.fase !== 'tareas') return;
      if (ev.detail === 'registro' && e.tarea === 1) cerrarTarea('TAREA_OK');
      else if (ev.detail === 'login' && e.tarea === 2) cerrarTarea('TAREA_OK');
      else if (ev.detail === 'logout' && e.tarea === 5) cerrarTarea('TAREA_OK');
    };
    const alCambiarVisibles = ev => {
      const e = ref.current;
      if (e && e.fase === 'tareas' && e.tarea === 4 && soloCentro(ev.detail)) cerrarTarea('TAREA_OK');
    };
    window.addEventListener('hashchange', alCambiarHash);
    window.addEventListener('heyel:auth', alAutenticar);
    window.addEventListener('heyel:visibles', alCambiarVisibles);
    return () => {
      window.removeEventListener('hashchange', alCambiarHash);
      window.removeEventListener('heyel:auth', alAutenticar);
      window.removeEventListener('heyel:visibles', alCambiarVisibles);
    };
  }, []);

  // «Mostrar dónde»: resalta el objeto de la tarea y cuenta la tarea como hecha con ayuda.
  useEffect(() => {
    if (!pista || !estado || estado.fase !== 'tareas') return undefined;
    const selectores = TAREAS[estado.tarea - 1].pistas;
    let marcado = null;
    const poner = () => {
      const el = selectores.map(s => document.querySelector(s)).find(Boolean) ?? null;
      if (el === marcado) return;
      marcado?.classList.remove('recorrido-foco');
      el?.classList.add('recorrido-foco');
      el?.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
      marcado = el;
    };
    poner();
    const intervalo = setInterval(poner, 500);
    return () => { clearInterval(intervalo); marcado?.classList.remove('recorrido-foco'); };
  }, [pista, estado?.tarea, estado?.fase]);

  function saltarDemo() {
    const sid = nuevoId();
    ref.current = { sid };
    enviar('SALTO_DEMO');
    actualizar({ sid, fase: 'saltada' });
  }

  async function empezar() {
    setPreparando(true);
    const sid = nuevoId();
    ref.current = { sid, fase: 'preparando' };
    enviar('INICIO', { tarea: 1, salud: salud === 'si', edad });
    // Parte siempre desde cero: sin sesión y en la landing.
    try { await authService.logout(); } catch { /* sin sesión */ }
    window.dispatchEvent(new Event('heyel:reiniciar'));
    actualizar({ sid, fase: 'tareas', tarea: 1, inicioTarea: Date.now(), ayuda: false });
    enviar('TAREA_INICIO', { tarea: 1 });
    setPreparando(false);
  }

  function pedirPista() {
    const e = ref.current;
    if (!e.ayuda) { actualizar({ ...e, ayuda: true }); enviar('AYUDA', { tarea: e.tarea }); }
    setPista(true);
  }

  function salir() {
    const e = ref.current;
    enviar('ABANDONO', { tarea: e.tarea });
    actualizar({ ...e, fase: 'salio' });
  }

  async function comprobar() {
    if (!respuesta.trim()) return;
    try {
      const datos = await historialService.obtener();
      const examen = datos.registros.find(r => r.categoria === 'LABORATORIO');
      if (examen && respuestaCorrecta(respuesta, examen)) cerrarTarea('TAREA_OK');
      else {
        enviar('TAREA_FALLO', { tarea: 3 });
        setAviso('Revisa tu respuesta: escribe el examen y la institución donde te lo hicieron.');
      }
    } catch { setAviso('No pudimos comprobar tu respuesta. Inténtalo de nuevo.'); }
  }

  if (!activa || hash === '#panel') return null;

  if (!estado) {
    const opcion = (nombre, valor, actual, cambiar, texto) => <label className="prueba-opcion">
      <input type="radio" name={nombre} checked={actual === valor} onChange={() => cambiar(valor)}/> {texto}
    </label>;
    return <div className="prueba-fondo"><div className="prueba-modal" role="dialog" aria-modal="true" aria-labelledby="prueba-titulo">
      <p className="eyebrow">PROTOTIPO · DATOS DE DEMOSTRACIÓN</p>
      {paso === 'intro' ? <>
        <h2 id="prueba-titulo">¿Quieres probar HEYEL?</h2>
        <p>Te daremos 5 tareas cortas, de unos 5 minutos en total. Nadie te va a ayudar: haz lo que harías normalmente. Solo medimos cuánto tardas y si lograste cada tarea, de forma anónima.</p>
        <button type="button" className="primary" onClick={() => setPaso('perfil')}>Probar como usuario nuevo <span aria-hidden="true">↗</span></button>
        <button type="button" className="boton-secundario" onClick={saltarDemo}>Saltar la demo</button>
      </> : <>
        <h2 id="prueba-titulo">Antes de empezar</h2>
        <p>Dos preguntas para entender quién prueba HEYEL. No pedimos tu nombre.</p>
        <fieldset className="prueba-grupo">
          <legend>¿Tienes alguna relación con el área de la salud?</legend>
          {opcion('salud', 'si', salud, setSalud, 'Sí')}
          {opcion('salud', 'no', salud, setSalud, 'No')}
        </fieldset>
        <fieldset className="prueba-grupo">
          <legend>¿En qué grupo de edad estás?</legend>
          {opcion('edad', 'MENOR', edad, setEdad, 'Menor de 18 años')}
          {opcion('edad', 'JOVEN', edad, setEdad, 'Joven (18 a 29)')}
          {opcion('edad', 'ADULTO', edad, setEdad, 'Adulto (30 a 59)')}
          {opcion('edad', 'ADULTO_MAYOR', edad, setEdad, 'Adulto mayor (60 o más)')}
        </fieldset>
        <button type="button" className="primary" onClick={empezar} disabled={preparando || !salud || !edad}>{preparando ? 'Preparando…' : 'Empezar las tareas'} <span aria-hidden="true">↗</span></button>
        <button type="button" className="boton-secundario" onClick={() => setPaso('intro')} disabled={preparando}>Volver</button>
      </>}
    </div></div>;
  }

  if (estado.fase === 'fin') {
    return <div className="recorrido prueba" role="dialog" aria-labelledby="prueba-titulo">
      <p className="recorrido-paso">Prueba terminada</p>
      <h2 id="prueba-titulo">¡Gracias por probar HEYEL!</h2>
      <p>Terminaste las 5 tareas. Avísale a quien te compartió el enlace para responder una última encuesta.</p>
      <div className="recorrido-acciones">
        <button type="button" className="recorrido-siguiente" onClick={() => actualizar({ ...estado, fase: 'cerrada' })}>Cerrar</button>
      </div>
    </div>;
  }

  if (estado.fase !== 'tareas') return null;

  const tarea = TAREAS[estado.tarea - 1];
  return <div className="recorrido prueba" role="dialog" aria-labelledby="prueba-titulo" aria-describedby="prueba-texto">
    <p className="recorrido-paso">Tarea {estado.tarea} de {TAREAS.length}</p>
    <h2 id="prueba-titulo">{tarea.titulo}</h2>
    <p id="prueba-texto">{tarea.texto}</p>
    {tarea.respuesta && <input className="prueba-respuesta" aria-label="Tu respuesta" value={respuesta}
      placeholder="Examen y institución" onChange={e => setRespuesta(e.target.value)}
      onKeyDown={e => { if (e.key === 'Enter') comprobar(); }}/>}
    {aviso && <p role="alert" className="message error">{aviso}</p>}
    <div className="recorrido-acciones">
      <button type="button" className="recorrido-salir" onClick={salir}>Salir de la prueba</button>
      <button type="button" className="retry" onClick={pedirPista}>Mostrar dónde</button>
      <button type="button" className="retry" onClick={() => cerrarTarea('TAREA_SALTADA')}>Saltar tarea</button>
      {tarea.respuesta && <button type="button" className="recorrido-siguiente" onClick={comprobar}>Enviar respuesta</button>}
    </div>
  </div>;
}
