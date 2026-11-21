import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import LecturaFacil from './LecturaFacil';

afterEach(() => { cleanup(); document.documentElement.classList.remove('lectura-facil'); localStorage.clear(); });

describe('Lectura fácil (MVP final, H12)', () => {
  it('agranda la letra de toda la app y lo recuerda', () => {
    render(<LecturaFacil/>);
    const boton = screen.getByRole('button', { name: /Letra grande/ });
    expect(boton.getAttribute('aria-pressed')).toBe('false');
    fireEvent.click(boton);
    expect(boton.getAttribute('aria-pressed')).toBe('true');
    expect(document.documentElement.classList.contains('lectura-facil')).toBe(true);
    expect(localStorage.getItem('heyel-lectura-facil')).toBe('1');
    fireEvent.click(boton);
    expect(document.documentElement.classList.contains('lectura-facil')).toBe(false);
  });
});