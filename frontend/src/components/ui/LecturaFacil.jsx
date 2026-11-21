import { useEffect, useState } from 'react';

// Modo de lectura fácil: agranda letra y botones en toda la app (hallazgo H12, adulto mayor).
// Se recuerda en este navegador para que no haya que activarlo cada vez.
const CLAVE = 'heyel-lectura-facil';

function leer() {
  try { return localStorage.getItem(CLAVE) === '1'; } catch { return false; }
}

export default function LecturaFacil({ sobreOscuro = false }) {
  const [activa, setActiva] = useState(leer);

  useEffect(() => {
    document.documentElement.classList.toggle('lectura-facil', activa);
    try { localStorage.setItem(CLAVE, activa ? '1' : '0'); } catch { /* sin almacenamiento */ }
  }, [activa]);

  return <button type="button" className={`boton-lectura${sobreOscuro ? ' sobre-oscuro' : ''}`}
    aria-pressed={activa} onClick={() => setActiva(a => !a)}>
    <span aria-hidden="true">A+</span> Letra grande
  </button>;
}