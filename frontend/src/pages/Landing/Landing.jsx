import { useEffect } from 'react';
import LecturaFacil from '../../components/ui/LecturaFacil';
import Brand from '../../components/layout/Brand';
import { analiticaService } from '../../api/services/analiticaService';
import captura from '../../assets/historial-mvp.png';

// Una visita por pestaña: recargar la landing no la vuelve a contar.
function contarVisita() {
  try {
    if (sessionStorage.getItem('heyel-visita')) return;
    sessionStorage.setItem('heyel-visita', '1');
  } catch {
    // Sin sessionStorage (modo privado estricto) se cuenta igual.
  }
  analiticaService.registrar('VISITA_LANDING');
}

// La landing solo cuenta lo que la app hace hoy: nada de EPS reales ni de compartir con médicos.
export default function Landing() {
  useEffect(contarVisita, []);

  return <div className="landing">
    <header className="landing-header">
      <Brand/>
      <nav className="landing-acceso" aria-label="Acceso">
        <LecturaFacil sobreOscuro/>
        <a className="landing-entrar" href="#login">Iniciar sesión</a>
        <a className="landing-registrarme" href="#registro"
          onClick={() => analiticaService.registrar('CLIC_CREAR_CUENTA')}>Crear cuenta</a>
      </nav>
    </header>

    <main>
      <section className="landing-hero">
        <div>
          <p className="eyebrow">TU HISTORIAL CLÍNICO</p>
          <h1>Tus exámenes y consultas están regados entre la EPS, la IPS y el laboratorio.</h1>
          <p className="landing-propuesta">HEYEL te muestra en un solo lugar lo que tus instituciones de salud tienen registrado sobre ti.</p>
          <a className="primary landing-cta" href="#registro"
            onClick={() => analiticaService.registrar('CLIC_CREAR_CUENTA')}>
            Crear mi cuenta <span aria-hidden="true">↗</span>
          </a>
          <p className="hint">Prototipo: las instituciones y los registros son de demostración. Todavía no se conecta con EPS reales.</p>
        </div>
        <img className="landing-captura" src={captura} width="1160" height="842"
          alt="Historial de HEYEL en la versión final: filtros por tipo de registro y por institución con botones, los filtros activos con su X y la tabla ordenada del más reciente al más antiguo con la fecha completa"/>
      </section>

      <section className="landing-pasos" aria-labelledby="pasos-titulo">
        <h2 id="pasos-titulo">Cómo funciona</h2>
        <ol>
          <li><strong>Crea tu cuenta</strong><span>Con tu nombre, correo y una contraseña. Toma menos de un minuto.</span></li>
          <li><strong>Ve tu historial en un solo lugar</strong><span>Exámenes, imágenes y consultas de varias instituciones, del más reciente al más antiguo.</span></li>
          <li><strong>Encuentra lo que necesitas</strong><span>Tu último examen aparece primero, y puedes buscar por nombre o tocar el tipo de registro y la institución donde te atendieron.</span></li>
          <li><strong>Léelo sin esfuerzo</strong><span>Con el botón «A+ Letra grande» toda la app se ve más grande, para que cualquiera la pueda usar.</span></li>
        </ol>
        <a className="primary landing-cta" href="#registro"
          onClick={() => analiticaService.registrar('CLIC_CREAR_CUENTA')}>
          Empezar ahora <span aria-hidden="true">↗</span>
        </a>
      </section>
    </main>

    <footer>HEYEL · Proyecto de Innovación en TI · Pontificia Universidad Javeriana</footer>
  </div>;
}
