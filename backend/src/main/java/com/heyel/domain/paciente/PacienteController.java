package com.heyel.domain.paciente;

import com.heyel.domain.paciente.exception.CredencialesInvalidasException;
import com.heyel.domain.paciente.exception.EmailDuplicadoException;
import com.heyel.domain.paciente.exception.PacienteNoEncontradoException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/pacientes")
public class PacienteController {

    private final PacienteService pacienteService;

    public PacienteController(PacienteService pacienteService) {
        this.pacienteService = pacienteService;
    }

    // US-001 Registrarse
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> body) {
        try {
            Paciente paciente = pacienteService.register(
                    body.get("fullName"),
                    body.get("email"),
                    body.get("password")
            );
            return ResponseEntity.status(HttpStatus.CREATED).body(paciente);
        } catch (EmailDuplicadoException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        }
    }

    // GET /api/pacientes/{id}
    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable UUID id) {
        try {
            return ResponseEntity.ok(pacienteService.getPacienteById(id));
        } catch (PacienteNoEncontradoException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }

    // GET /api/pacientes
    @GetMapping
    public List<Paciente> getAll() {
        return pacienteService.getAllPacientes();
    }

    // US-002: Login con validación
    @PostMapping("/login")
    public ResponseEntity<Map<String, String>> login(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String password = body.get("password");

        try {
            Paciente paciente = pacienteService.login(email, password);
            return ResponseEntity.ok(Map.of(
                    "email",    paciente.getEmail(),
                    "fullName", paciente.getFullName(),
                    "role",     paciente.getRole().name(),
                    "id",       paciente.getId().toString()
                    // TODO: Implementar generación de Token JWT aquí más adelante
            ));
        } catch (CredencialesInvalidasException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/hash-test")
    public String hashTest() {
        return pacienteService.generarHash("openlib123");
    }

    // US-005: Ver perfil
    @GetMapping("/{id}/profile")
    public ResponseEntity<?> getProfile(@PathVariable UUID id) {
        try {
            return ResponseEntity.ok(pacienteService.getProfile(id));
        } catch (PacienteNoEncontradoException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }

    // TODO: Implementar actualización de perfil (PUT /api/pacientes/{id}/profile) más adelante
}
