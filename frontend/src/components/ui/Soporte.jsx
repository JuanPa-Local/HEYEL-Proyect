import { useState } from 'react';

const CORREO = 'soporteheyel@gmail.com';

export default function Soporte() {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(CORREO);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 3000);
    } catch {
      setCopiado(false);
    }
  }

  return <section className="soporte" aria-label="Soporte">
    <p>¿Tienes dudas o algo no te funciona? Escríbenos a:</p>
    <div className="soporte-correo">
      <strong>{CORREO}</strong>
      <button type="button" className="boton-copiar" onClick={copiar}>{copiado ? 'Copiado ✓' : 'Copiar correo'}</button>
    </div>
    <p className="soporte-nota" aria-live="polite">{copiado ? 'Listo, ya puedes pegarlo en tu correo.' : 'Te respondemos lo antes posible.'}</p>
  </section>;
}