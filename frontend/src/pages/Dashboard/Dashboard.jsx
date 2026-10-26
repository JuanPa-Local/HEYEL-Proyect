import Brand from '../../components/layout/Brand';
import Historial from '../Historial/Historial';

export default function Dashboard({ user, onLogout, error }) {
  return <div className="app">
    <header className="app-header">
      <Brand/>
      <div className="app-user">
        <span>{user.fullName}</span>
        <button type="button" className="logout" onClick={onLogout}>Cerrar sesión</button>
      </div>
    </header>
    <main className="app-main">
      {error && <p role="alert" className="message error">{error}</p>}
      <Historial/>
            <p className="soporte">¿Tienes dudas o algo no te funciona? <a href="mailto:soporteheyel@gmail.com?subject=Soporte%20HEYEL">Escríbenos</a> y te respondemos.</p>
    </main>
  </div>;
}