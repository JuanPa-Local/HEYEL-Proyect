import AuthForm from '../../components/ui/AuthForm';
import AuthNavigation from '../../components/ui/AuthNavigation';
export default function Login({ onLogin, notice }) {
  return <><AuthNavigation/><p className="eyebrow">BIENVENIDO A HEYEL</p><h1>Tu salud merece<br/>su propio espacio.</h1><p className="intro">Inicia sesión para entrar a tu cuenta.</p>{notice && <p role="status" className="message">{notice}</p>}<AuthForm onLogin={onLogin}/><div className="crear-cuenta"><p>¿Primera vez en HEYEL?</p><a className="boton-secundario" href="#registro">Crear una cuenta nueva</a></div></>;
}