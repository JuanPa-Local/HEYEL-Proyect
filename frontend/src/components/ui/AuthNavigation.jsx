export default function AuthNavigation({ register = false }) {
  return <>
    <nav className="auth-navigation" aria-label="Acceso a tu cuenta">
      <a href="#login" aria-current={!register ? 'page' : undefined}>Iniciar sesión</a>
      <a href="#registro" aria-current={register ? 'page' : undefined}>Registrarme</a>
    </nav>
    <details className="quick-guide">
      <summary>¿Es tu primera vez? Te guiamos</summary>
      <ol>
        <li>Elige <strong>Registrarme</strong> si aún no tienes una cuenta.</li>
        <li>Completa tus datos de prueba, lee las condiciones y marca la casilla para aceptarlas.</li>
        <li>Después elige <strong>Iniciar sesión</strong> y escribe tu correo y contraseña.</li>
      </ol>
    </details>
  </>;
}
