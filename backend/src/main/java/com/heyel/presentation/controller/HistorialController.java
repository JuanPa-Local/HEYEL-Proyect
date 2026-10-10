package com.heyel.presentation.controller;

import com.heyel.domain.historial.HistorialService;
import com.heyel.domain.paciente.PacienteService;
import com.heyel.domain.paciente.exception.CredencialesInvalidasException;
import com.heyel.presentation.dto.HistorialDtos.HistorialResponse;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
public class HistorialController {
    private final HistorialService historialService;
    private final PacienteService pacienteService;

    public HistorialController(HistorialService historialService, PacienteService pacienteService) {
        this.historialService = historialService;
        this.pacienteService = pacienteService;
    }

    /** US-03 y US-05: historial consolidado del paciente que tiene la sesión abierta. */
    @GetMapping("/api/historial")
    public HistorialResponse historial(Authentication auth) {
        var paciente = pacienteService.getPacienteById(UUID.fromString(auth.getName()));
        if (!paciente.isActive()) throw new CredencialesInvalidasException();
        return HistorialResponse.from(historialService.consolidar(paciente.getId()));
    }
}