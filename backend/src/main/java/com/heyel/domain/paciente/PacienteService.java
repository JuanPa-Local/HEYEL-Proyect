package com.heyel.domain.paciente;

import com.heyel.domain.paciente.exception.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;

@Service
public class PacienteService {

    private final PacienteRepository pacienteRepository;
    private final PasswordEncoder passwordEncoder;
    private final String dummyHash;

    public PacienteService(PacienteRepository pacienteRepository, PasswordEncoder passwordEncoder) {
        this.pacienteRepository = pacienteRepository;
        this.passwordEncoder = passwordEncoder;
        this.dummyHash = passwordEncoder.encode(UUID.randomUUID().toString());
    }

    // US-001: Registro
    public Paciente register(String fullName, String email, String rawPassword,
            boolean termsAccepted, String termsVersion) {
        if (!termsAccepted || !RegistrationTerms.VERSION.equals(termsVersion)) {
            throw new TerminosInvalidosException();
        }
        email = email.strip().toLowerCase(Locale.ROOT);
        fullName = fullName.strip();
        if (pacienteRepository.existsByEmail(email)) {
            throw new EmailDuplicadoException(email);
        }
        Paciente paciente = Paciente.builder()
                .fullName(fullName)
                .email(email)
                .password(passwordEncoder.encode(rawPassword))
                .role(Paciente.Role.PACIENTE)
                .active(true)
                .termsAcceptedAt(java.time.LocalDateTime.now())
                .termsVersion(RegistrationTerms.VERSION)
                .build();

        return pacienteRepository.save(paciente);
    }

    // US-002: Inicio de sesión
    public Paciente login(String email, String rawPassword) {
        Optional<Paciente> pacienteOpt = pacienteRepository.findByEmail(email.strip().toLowerCase(Locale.ROOT));

        if (pacienteOpt.isEmpty()) {
            passwordEncoder.matches(rawPassword, dummyHash);
            throw new CredencialesInvalidasException();
        }
        Paciente paciente = pacienteOpt.get();
        if (!passwordEncoder.matches(rawPassword, paciente.getPassword())) {
            throw new CredencialesInvalidasException();
        }
        
        if (!paciente.isActive()) {
            throw new CredencialesInvalidasException();
        }

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
