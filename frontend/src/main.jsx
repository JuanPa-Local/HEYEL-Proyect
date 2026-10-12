import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import Login from './pages/Login/Login';
import Register from './pages/Register/Register';
import Dashboard from './pages/Dashboard/Dashboard';
import { authService } from './api/services/authService';
import Brand from './components/layout/Brand';
import heyelMark from './assets/heyel-mark.png';
import './style.css';
function App() {
  const [page, setPage] = useState(location.hash);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    const change = () => setPage(location.hash);
    window.addEventListener('hashchange', change);
    authService.me().then(setUser).catch(err => { if (err.status !== 401) setError('No pudimos conectar con el servidor. Recarga la página para intentar de nuevo.'); }).finally(() => setLoading(false));
    return () => window.removeEventListener('hashchange', change);
  }, []);
  async function logout() {
    try { await authService.logout(); setUser(null); setError(''); location.hash = 'login'; }
    catch (err) { setError(err.message); }
  }
  if (!loading && user) return <Dashboard user={user} onLogout={logout} error={error}/>;
  return <main className="shell"><aside className="story"><Brand/><div className="story-copy"><span className="pill">CONTIGO, EN CADA PASO</span><h2>Cuidarte empieza<br/>por conocerte.</h2><p>Un espacio pensado para ti.<br/>El primer paso es crear tu cuenta.</p><div className="orbit" aria-hidden="true"><img src={heyelMark} alt="" width="190" height="190"/></div></div><p className="story-footer">HECHO PARA LAS PERSONAS.</p></aside><section className="content"><div className="form-wrap">{loading ? <p role="status">Preparando tu espacio…</p> : <>{error && <p role="alert" className="message error">{error}</p>}{page === '#registro' ? <Register onRegistered={u => { if (u) { setUser(u); setError(''); return; } setNotice('Tu cuenta está lista. Inicia sesión para continuar.'); location.hash = 'login'; setPage('#login'); }}/> : <Login notice={notice} onLogin={u => { setUser(u); setError(''); }}/>}</>}</div><footer>HEYEL · Un paso más cerca de tu bienestar.</footer></section></main>;
}
createRoot(document.getElementById('root')).render(<App/>);
