import { useEffect, useState } from 'react';
import { TAREAS } from './tareas';

// La sesión de validación vive en sessionStorage: aguanta recargas y cambios de pantalla
// mientras el celular pasa de mano, y se borra sola al cerrar la pestaña.
const CLAVE = 'heyel-validacion';
const EVENTO = 'heyel-validacion-cambio';
let enMemoria = null; // Respaldo si el navegador no deja usar sessionStorage.

export function leerSesion() {
  try {
    const guardada = sessionStorage.getItem(CLAVE);
    return guardada ? JSON.parse(guardada) : null;
  } catch {
    return enMemoria;
  }
}

export function guardarSesion(sesion) {
  enMemoria = sesion;
  try {
    if (sesion) sessionStorage.setItem(CLAVE, JSON.stringify(sesion));
    else sessionStorage.removeItem(CLAVE);
  } catch {
    // Sin sessionStorage queda en memoria.
  }
  window.dispatchEvent(new Event(EVENTO));
}

export function enValidacion() {
  return Boolean(leerSesion());
}

export function useSesionValidacion() {
  const [sesion, setSesion] = useState(leerSesion);
  useEffect(() => {
    const cambio = () => setSesion(leerSesion());
    window.addEventListener(EVENTO, cambio);
    return () => window.removeEventListener(EVENTO, cambio);
  }, []);
  return sesion;
}

export function nuevaSesion(datos) {
  return { fase: 'tareas', datos, tarea: 0, inicio: null, ayuda: false, salio: false, resultados: [], sus: [] };
}

export function empezarTarea(sesion, ahora = Date.now()) {
  return { ...sesion, inicio: ahora, ayuda: false, salio: false };
}

export function marcarAyuda(sesion) {
  return { ...sesion, ayuda: !sesion.ayuda };
}

export function terminarTarea(sesion, completada = true, ahora = Date.now()) {
  const resultado = {
    numero: sesion.tarea + 1,
    segundos: Math.round((ahora - sesion.inicio) / 100) / 10,
    conAyuda: sesion.ayuda,
    completada,
  };
  const resultados = [...sesion.resultados, resultado];
  const siguiente = sesion.tarea + 1;
  return siguiente < TAREAS.length
    ? { ...sesion, resultados, tarea: siguiente, inicio: null, ayuda: false, salio: false }
    : { ...sesion, resultados, fase: 'sus', inicio: null };
}

// Lo que hizo el participante en la app (entrar, salir, filtrar) puede cerrar la tarea actual.
// Solo cuenta si el tiempo ya está corriendo.
export function aplicarLogro(sesion, tipo, valor, ahora = Date.now()) {
  if (!sesion || sesion.fase !== 'tareas' || sesion.inicio == null) return sesion;
  const tarea = TAREAS[sesion.tarea];
  if (tarea.logro === 'volver-a-entrar') {
    if (tipo === 'logout') return { ...sesion, salio: true };
    if (tipo === 'login' && sesion.salio) return terminarTarea(sesion, true, ahora);
    return sesion;
  }
  if (tarea.logro === tipo && (tarea.valor === undefined || tarea.valor === valor)) {
    return terminarTarea(sesion, true, ahora);
  }
  return sesion;
}

// Guarda el cambio y, si ya terminaron las tareas, lleva al cuestionario.
export function avanzar(sesion) {
  guardarSesion(sesion);
  if (sesion && sesion.fase !== 'tareas' && !location.hash.startsWith('#validacion')) location.hash = 'validacion';
}

export function avisarLogro(tipo, valor) {
  const sesion = leerSesion();
  const nueva = aplicarLogro(sesion, tipo, valor);
  if (nueva !== sesion) avanzar(nueva);
}
