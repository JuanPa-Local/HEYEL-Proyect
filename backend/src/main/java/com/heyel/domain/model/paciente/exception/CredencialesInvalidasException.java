package com.heyel.domain.model.paciente.exception;

public class CredencialesInvalidasException extends RuntimeException {
    public CredencialesInvalidasException() {
        super("Credenciales inválidas: email o contraseña incorrectos.");
    }
}
