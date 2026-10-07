package com.heyel.domain.paciente.exception;

public class TerminosInvalidosException extends RuntimeException {
    public TerminosInvalidosException() {
        super("Debes leer y aceptar las condiciones vigentes para registrarte.");
    }
}
