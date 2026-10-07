import AuthForm from '../../components/ui/AuthForm';
import AuthNavigation from '../../components/ui/AuthNavigation';
export default function Register({ onRegistered }) {
  return <><AuthNavigation register/><p className="eyebrow">EMPECEMOS CONTIGO</p><h1>Un lugar para<br/>cuidar de ti.</h1><p className="intro">Crea tu cuenta de paciente en HEYEL.</p><AuthForm register onRegistered={onRegistered}/><p className="switch">¿Ya tienes cuenta? <a href="#login">Inicia sesión</a></p></>;
}
