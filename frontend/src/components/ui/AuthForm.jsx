
import { useEffect, useRef, useState } from 'react';
import { authService } from '../../api/services/authService';

const MINIMO_CONTRASENA = 12;

export default function AuthForm({ register = false, onLogin, onRegistered }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [visible, setVisible] = useState(false);
  const [terms, setTerms] = useState(null);
  const [termsLoadError, setTermsLoadError] = useState('');
  const [termsError, setTermsError] = useState('');
  // Largo de la contraseña mientras se escribe, para mostrar cuánto falta (hallazgo H1).
  const [passwordLength, setPasswordLength] = useState(0);
  const termsCheckbox = useRef(null);
  const faltan = Math.max(0, MINIMO_CONTRASENA - passwordLength);
  async function loadTerms() {
    setTermsLoadError('');
    try { setTerms(await authService.terms()); }
    catch { setTermsLoadError('No pudimos cargar las condiciones. Intenta nuevamente.'); }
  }
  useEffect(() => { if (register) loadTerms(); }, [register]);
  function missingTerms() {
    setTermsError('Para registrarte, debes leer y aceptar las condiciones de uso.');
    termsCheckbox.current?.focus();
  }
  async function submit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form));
    if (register && !termsCheckbox.current?.checked) { missingTerms(); return; }
    if (register && values.password !== values.confirmPassword) { setError('Las contraseñas no coinciden.'); return; }
    if (new TextEncoder().encode(values.password).length > 72) { setError('La contraseña supera el límite de 72 bytes. Usa menos caracteres.'); return; }
    delete values.confirmPassword;
    if (register) {
      if (!terms) return;
      values.termsAccepted = true;
      values.termsVersion = terms.version;
    }
    setPending(true); setError(''); setTermsError('');
    try {
      if (register) {
        await authService.register(values);
        // Entra con los mismos datos para que el paciente llegue directo a su historial.
        // Si ese login falla, la cuenta ya existe y se le pide iniciar sesión.
        const user = await authService.login({ email: values.email, password: values.password }).catch(() => null);
        form.reset(); setPasswordLength(0); onRegistered(user);
      }
      else { const user = await authService.login(values); form.reset(); onLogin(user); }
    } catch (err) {
      if (err.fields?.termsAccepted || err.fields?.termsVersion) {
        setTermsError(err.fields.termsAccepted || err.fields.termsVersion);
        termsCheckbox.current?.focus();
      } else {
        setError(err instanceof TypeError ? 'No hay conexión con el servidor. Intenta nuevamente.' : err.message);
      }
    }
    finally { setPending(false); }
  }
  return <form onSubmit={submit}>
    {register && <label>Nombre completo<input name="fullName" autoComplete="name" minLength={2} maxLength={100} required placeholder="Tu nombre y apellido"/></label>}
    <label>Correo electrónico<input name="email" type="email" autoComplete="email" maxLength={254} required placeholder="nombre@correo.com"/></label>
    <label>Contraseña<div className="password"><input name="password" type={visible ? 'text' : 'password'} autoComplete={register ? 'new-password' : 'current-password'} minLength={register ? MINIMO_CONTRASENA : 1} maxLength={64} required aria-describedby={register ? 'password-help password-counter' : undefined} onChange={register ? event => setPasswordLength(event.target.value.length) : undefined}/><button type="button" className="reveal" aria-pressed={visible} onClick={() => setVisible(!visible)}><span aria-hidden="true">{visible ? '◉' : '◎'}</span>{' '}{visible ? 'Ocultar' : 'Mostrar'}</button></div></label>
    {register && <>
      <p id="password-help" className="hint">Usa entre 12 y 64 caracteres. Una frase larga es una buena opción.</p>
      <p id="password-counter" className={`contador ${faltan === 0 ? 'contador-ok' : ''}`} aria-live="polite">
        {faltan === 0 ? '✓ Tu contraseña ya tiene los 12 caracteres mínimos.' : `Te ${faltan === 1 ? 'falta 1 carácter' : `faltan ${faltan} caracteres`} para llegar a 12.`}
      </p>
      <label>Confirma tu contraseña<input name="confirmPassword" type={visible ? 'text' : 'password'} autoComplete="new-password" maxLength={64} required/></label>
      <section className="terms" aria-label="Condiciones de registro">
        {terms ? <>
          <details><summary>Leer condiciones de uso</summary><h2>{terms.title}</h2>{terms.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}</details>
          <label className="checkbox-label"><input ref={termsCheckbox} name="termsAccepted" type="checkbox" required aria-invalid={Boolean(termsError)} aria-describedby="terms-help terms-error" onChange={() => setTermsError('')} onInvalid={event => { event.preventDefault(); missingTerms(); }}/><span>He leído y acepto las condiciones de uso del prototipo HEYEL. <strong className="obligatorio">Obligatorio</strong></span></label>
          <p id="terms-help" className="hint">Esta aceptación no autoriza consultas de registros médicos en instituciones.</p>
          <p id="terms-error" role={termsError ? 'alert' : undefined} className={termsError ? 'message error' : undefined}>{termsError}</p>
        </> : termsLoadError ? <><p role="alert" className="message error">{termsLoadError}</p><button type="button" className="retry" onClick={loadTerms}>Volver a cargar las condiciones</button></> : <p role="status">Cargando condiciones de uso…</p>}
      </section>
    </>}
    {error && <p role="alert" className="message error">{error}</p>}
    <button className="primary" disabled={pending || (register && !terms)}>{pending ? 'Un momento…' : register ? 'Registrarme' : 'Iniciar sesión'} <span aria-hidden="true">↗</span></button>
  </form>;
}
