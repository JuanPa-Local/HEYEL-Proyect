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
        <li>Al terminar entras directo a tu historial. Las próximas veces usa <strong>Iniciar sesión</strong> con tu correo y contraseña.</li>
      </ol>
    </details>
  </>;
}
