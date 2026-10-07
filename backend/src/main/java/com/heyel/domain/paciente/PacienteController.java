package com.heyel.domain.paciente;

import com.heyel.presentation.dto.AuthDtos.PatientResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.*;
import java.util.UUID;

@RestController
@RequestMapping("/api/pacientes")
public class PacienteController {
    private final PacienteService service;
    public PacienteController(PacienteService service) { this.service = service; }
    @GetMapping({"/{id}", "/{id}/profile"})
    public PatientResponse profile(@PathVariable UUID id, Authentication auth) {
        if (!id.toString().equals(auth.getName())) throw new AccessDeniedException("Acceso denegado");
        return PatientResponse.from(service.getPacienteById(id));
    }
}
