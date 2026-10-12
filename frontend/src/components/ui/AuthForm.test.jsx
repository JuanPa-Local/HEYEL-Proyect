import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import AuthForm from './AuthForm';
import Login from '../../pages/Login/Login';
import Register from '../../pages/Register/Register';
import { authService } from '../../api/services/authService';

vi.mock('../../api/services/authService', () => ({ authService: {
  terms: vi.fn(), register: vi.fn(), login: vi.fn(),
} }));
const terms = { version: 'version-de-prueba', title: 'Condiciones del prototipo', paragraphs: ['Condiciones visibles.'] };
afterEach(cleanup);
beforeEach(() => {
  authService.terms.mockResolvedValue(terms);
  authService.register.mockResolvedValue({});
});
function fillRegistration() {
  fireEvent.change(screen.getByLabelText('Nombre completo'), { target: { value: 'Ana Pérez' } });
  fireEvent.change(screen.getByLabelText('Correo electrónico'), { target: { value: 'ana@example.com' } });
  fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'Una frase segura 123' } });
  fireEvent.change(screen.getByLabelText('Confirma tu contraseña'), { target: { value: 'Una frase segura 123' } });
}
describe('Registro según el ajuste de roadmap', () => {
  it('separa registro y login con enlaces identificables y guía breve', async () => {
    render(<Register onRegistered={vi.fn()}/>);
    expect(screen.getByRole('navigation', { name: 'Acceso a tu cuenta' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Registrarme' }).getAttribute('aria-current')).toBe('page');
    expect(screen.getAllByRole('link', { name: 'Iniciar sesión' })[0].getAttribute('href')).toBe('#login');
    expect(screen.getByText('¿Es tu primera vez? Te guiamos')).toBeTruthy();
    await screen.findByRole('checkbox');
  });
  it('no marca la aceptación automáticamente y muestra el aviso en el mismo formulario', async () => {
    const { container } = render(<AuthForm register onRegistered={vi.fn()}/>);
    const checkbox = await screen.findByRole('checkbox');
    expect(checkbox.checked).toBe(false);
    fillRegistration();
    // Covers both native constraint feedback and submission bypass attempts.
    fireEvent.invalid(checkbox);
    fireEvent.submit(container.querySelector('form'));
    expect(screen.getByRole('alert').textContent).toContain('debes leer y aceptar');
    expect(checkbox.getAttribute('aria-invalid')).toBe('true');
    expect(document.activeElement).toBe(checkbox);
    expect(authService.register).not.toHaveBeenCalled();
  });
  it('envía aceptación explícita y la versión de las condiciones mostradas', async () => {
    const done = vi.fn();
    const user = { id: 'patient', fullName: 'Ana Pérez' };
    authService.login.mockResolvedValueOnce(user);
    const { container } = render(<AuthForm register onRegistered={done}/>);
    const checkbox = await screen.findByRole('checkbox');
    fillRegistration();
    fireEvent.click(checkbox);
    fireEvent.submit(container.querySelector('form'));
    await waitFor(() => expect(done).toHaveBeenCalledOnce());
    expect(authService.register).toHaveBeenCalledWith({
      fullName: 'Ana Pérez', email: 'ana@example.com', password: 'Una frase segura 123',
      termsAccepted: true, termsVersion: terms.version,
    });
    // Tras registrarse entra solo, sin volver a escribir sus datos.
    expect(authService.login).toHaveBeenCalledWith({ email: 'ana@example.com', password: 'Una frase segura 123' });
    expect(done).toHaveBeenCalledWith(user);
  });
  it('si el ingreso automático falla, avisa que la cuenta quedó creada', async () => {
    const done = vi.fn();
    authService.login.mockRejectedValueOnce(new Error('Sin conexión'));
    const { container } = render(<AuthForm register onRegistered={done}/>);
    const checkbox = await screen.findByRole('checkbox');
    fillRegistration(); fireEvent.click(checkbox); fireEvent.submit(container.querySelector('form'));
    await waitFor(() => expect(done).toHaveBeenCalledWith(null));
    expect(screen.queryByRole('alert')).toBeNull();
  });
  it('muestra el rechazo de términos de la API junto a la casilla', async () => {
    const done = vi.fn();
    authService.register.mockRejectedValueOnce(Object.assign(new Error('Revisa las condiciones'), {
      fields: { termsAccepted: 'Debes aceptar las condiciones vigentes.' },
    }));
    const { container } = render(<AuthForm register onRegistered={done}/>);
    const checkbox = await screen.findByRole('checkbox');
    fillRegistration(); fireEvent.click(checkbox); fireEvent.submit(container.querySelector('form'));
    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain('condiciones vigentes');
    expect(document.activeElement).toBe(checkbox);
    expect(done).not.toHaveBeenCalled();
  });
  it('el login no pide aceptar términos ni modifica la autorización', async () => {
    const user = { id: 'patient', fullName: 'Ana' };
    authService.login.mockResolvedValueOnce(user);
    const onLogin = vi.fn();
    const { container } = render(<Login onLogin={onLogin}/>);
    expect(screen.queryByRole('checkbox')).toBeNull();
    expect(authService.terms).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText('Correo electrónico'), { target: { value: 'ana@example.com' } });
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'Una frase segura 123' } });
    fireEvent.submit(container.querySelector('form'));
    await waitFor(() => expect(onLogin).toHaveBeenCalledWith(user));
  });
});
