import { useEffect, useRef, useState } from 'react';

// Recorrido guiado por el historial. Solo se abre si el paciente lo pide: resalta cada parte
// de la pantalla, la lleva a la vista y explica para qué sirve. No cambia filtros ni datos.
export const PASOS = [
  { selector: '.ultimo-examen', titulo: 'Tu último examen', texto: 'Aquí ves tu examen de laboratorio más reciente, la fecha y la institución donde te lo hicieron.' },
  { selector: '.filtros', titulo: 'Busca y filtra', texto: 'Escribe el nombre de un examen, toca una categoría o escoge una institución para ver solo esos registros.' },
  { selector: '.grafica-plegable', titulo: 'Gráfica por institución', texto: 'Ábrela para ver cuántos registros tiene cada institución, en torta o en barras. Toca una para ver solo sus registros.' },
  { selector: '.historial-tabla', titulo: 'Tu historial', texto: 'Todos tus registros, del más reciente al más antiguo. Cuando filtras, arriba aparece «Mostrando:» y cada filtro se quita con su X.' },
  { selector: '.soporte', titulo: '¿Necesitas ayuda?', texto: 'Copia el correo de soporte y escríbenos si algo no te funciona.' },
];

export default function Recorrido({ onCerrar }) {
  // Solo se muestran los pasos cuya parte está en pantalla en este momento.
  const [pasos] = useState(() => PASOS.filter(p => document.querySelector(p.selector)));
  const [actual, setActual] = useState(0);
  const siguiente = useRef(null);
  const paso = pasos[actual];
  const ultimo = actual === pasos.length - 1;

  useEffect(() => {
    const parte = paso && document.querySelector(paso.selector);
    if (!parte) return undefined;
    parte.classList.add('recorrido-foco');
    parte.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
    siguiente.current?.focus();
    return () => parte.classList.remove('recorrido-foco');
  }, [paso]);

  useEffect(() => {
    const conEscape = event => { if (event.key === 'Escape') onCerrar(); };
    window.addEventListener('keydown', conEscape);
    return () => window.removeEventListener('keydown', conEscape);
  }, [onCerrar]);

  if (!paso) return null;

  return <div className="recorrido" role="dialog" aria-labelledby="recorrido-titulo" aria-describedby="recorrido-texto">
    <p className="recorrido-paso">Paso {actual + 1} de {pasos.length}</p>
    <h2 id="recorrido-titulo">{paso.titulo}</h2>
    <p id="recorrido-texto">{paso.texto}</p>
    <div className="recorrido-acciones">
      <button type="button" className="recorrido-salir" onClick={onCerrar}>Salir</button>
      {actual > 0 && <button type="button" className="retry" onClick={() => setActual(actual - 1)}>Anterior</button>}
      <button type="button" ref={siguiente} className="recorrido-siguiente"
        onClick={() => (ultimo ? onCerrar() : setActual(actual + 1))}>{ultimo ? 'Terminar' : 'Siguiente'}</button>
    </div>
  </div>;
}
