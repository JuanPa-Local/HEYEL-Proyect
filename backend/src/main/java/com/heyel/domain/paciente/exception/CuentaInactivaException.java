package com.heyel.domain.paciente.exception;

public class CuentaInactivaException extends RuntimeException {
    public CuentaInactivaException(String email) {
        super("La cuenta del paciente con email " + email + " no está activa.");
    }
}
