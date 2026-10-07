package com.heyel.domain.paciente;

import com.heyel.domain.paciente.exception.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class PacienteService {

    private final PacienteRepository pacienteRepository;
    private final PasswordEncoder passwordEncoder;

    public PacienteService(PacienteRepository pacienteRepository, PasswordEncoder passwordEncoder) {
        this.pacienteRepository = pacienteRepository;
        this.passwordEncoder = passwordEncoder;
    }

    // US-001: Registro
    public Paciente register(String fullName, String email, String rawPassword) {
        if (pacienteRepository.existsByEmail(email)) {
            throw new EmailDuplicadoException(email);
        }
        Paciente paciente = Paciente.builder()
                .fullName(fullName)
                .email(email)
                .password(passwordEncoder.encode(rawPassword))
                .role(Paciente.Role.PACIENTE)
                .active(true)
                .build();

        return pacienteRepository.save(paciente);
    }

    // US-002: Inicio de sesión
    public Paciente login(String email, String rawPassword) {
        Optional<Paciente> pacienteOpt = pacienteRepository.findByEmail(email);

        if (pacienteOpt.isEmpty()) {
            throw new CredencialesInvalidasException();
        }
        Paciente paciente = pacienteOpt.get();
        if (!passwordEncoder.matches(rawPassword, paciente.getPassword())) {
            throw new CredencialesInvalidasException();
        }
        
        // TODO: Si deseas activar o desactivar cuentas más adelante, descomenta esta validación:
        /*
        if (!paciente.isActive()) {
            throw new CuentaInactivaException(email);
        }
        */

        return paciente;
    }

    public Paciente getPacienteById(UUID id) {
        return pacienteRepository.findById(id)
                .orElseThrow(() -> new PacienteNoEncontradoException(id));
    }

    public List<Paciente> getAllPacientes() {
        return pacienteRepository.findAll();
    }

    public Paciente getProfile(UUID id) {
        return getPacienteById(id);
    }

    public String generarHash(String password) {
        return passwordEncoder.encode(password);
    }

    // TODO: Implementar métodos adicionales de PacienteService cuando sea necesario (ej. actualización de perfil, reseteo de contraseña)
}
