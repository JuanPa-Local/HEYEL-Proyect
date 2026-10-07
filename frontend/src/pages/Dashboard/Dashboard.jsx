export default function Dashboard({ user, onLogout, error }) {
  return <><p className="eyebrow">TU CUENTA HEYEL</p><h1>Hola, {user.fullName}.</h1><p className="intro">Tu sesión está activa.</p><dl className="profile"><dt>Correo electrónico</dt><dd>{user.email}</dd><dt>Tipo de cuenta</dt><dd>Paciente</dd></dl><p className="hint">Pronto podrás consultar y organizar tu información de salud en este espacio.</p>{error && <p role="alert" className="message error">{error}</p>}<button className="primary" onClick={onLogout}>Cerrar sesión <span aria-hidden="true">↗</span></button></>;
}
