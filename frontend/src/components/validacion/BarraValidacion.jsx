import { useEffect, useState } from 'react';
import { TAREAS } from '../../validacion/tareas';
import { avanzar, empezarTarea, marcarAyuda, terminarTarea, useSesionValidacion } from '../../validacion/sesion';

export function formatearTiempo(segundos) {
  const s = Math.max(0, Math.floor(segundos));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

// Barra fija abajo mientras el participante hace las tareas en la app real: dice qué hacer,
// toma el tiempo y deja al observador marcar si la persona pidió ayuda.
export default function BarraValidacion() {
  const sesion = useSesionValidacion();
  const [ahora, setAhora] = useState(Date.now());
  const inicio = sesion?.inicio;

  useEffect(() => {
    if (!inicio) return undefined;
    setAhora(Date.now());
    const reloj = setInterval(() => setAhora(Date.now()), 1000);
    return () => clearInterval(reloj);
  }, [inicio]);

  useEffect(() => {
    document.body.classList.add('con-barra-validacion');
    return () => document.body.classList.remove('con-barra-validacion');
  }, []);

  if (!sesion || sesion.fase !== 'tareas') return null;
  const tarea = TAREAS[sesion.tarea];

  return <aside className="barra-validacion" aria-label="Sesión de validación" aria-live="polite">
    <p className="barra-validacion-paso">
      Tarea {tarea.numero} de {TAREAS.length}
      {inicio && <span className="barra-validacion-reloj"> · {formatearTiempo((ahora - inicio) / 1000)}</span>}
    </p>
    <p className="barra-validacion-tarea">{tarea.texto}</p>
    <div className="barra-validacion-acciones">
      {!inicio
        ? <button type="button" className="barra-empezar" onClick={() => avanzar(empezarTarea(sesion))}>Empezar tarea {tarea.numero}</button>
        : <>
          <button type="button" className="barra-secundario" aria-pressed={sesion.ayuda}
            onClick={() => avanzar(marcarAyuda(sesion))}>{sesion.ayuda ? 'Pidió ayuda ✓' : 'Pidió ayuda'}</button>
          <button type="button" className="barra-secundario" onClick={() => avanzar(terminarTarea(sesion, false))}>No pudo</button>
          <button type="button" className="barra-termine" onClick={() => avanzar(terminarTarea(sesion, true))}>Terminé</button>
        </>}
    </div>
  </aside>;
}
