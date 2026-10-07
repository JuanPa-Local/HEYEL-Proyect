package com.heyel.domain.paciente.exception;

public class EmailDuplicadoException extends RuntimeException {
    public EmailDuplicadoException(String message) {
        super("Email duplicado: Email ya esta registrado");
    }
}
