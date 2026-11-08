import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Soporte from './Soporte';

describe('Soporte (Release 3)', () => {
  it('muestra el correo y lo copia al tocar el botón', async () => {
    const writeText = vi.fn().mockResolvedValue();
    Object.assign(navigator, { clipboard: { writeText } });
    render(<Soporte/>);
    expect(screen.getByText('soporteheyel@gmail.com')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Copiar correo' }));
    expect(writeText).toHaveBeenCalledWith('soporteheyel@gmail.com');
    expect(await screen.findByRole('button', { name: 'Copiado ✓' })).toBeTruthy();
  });
});