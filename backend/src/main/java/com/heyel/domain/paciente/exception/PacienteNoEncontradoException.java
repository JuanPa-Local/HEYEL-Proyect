package com.heyel.domain.paciente.exception;

import java.util.UUID;

public class PacienteNoEncontradoException extends RuntimeException {
    public PacienteNoEncontradoException(UUID id) {
        super("Paciente no encontrado con id: " + id);
    }
}
