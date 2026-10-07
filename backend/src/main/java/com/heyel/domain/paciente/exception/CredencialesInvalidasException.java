package com.heyel.domain.paciente.exception;

public class CredencialesInvalidasException extends RuntimeException {
    public CredencialesInvalidasException() {
        super("Credenciales inválidas: Email o contraseña incorrectos.");
    }
}
