package com.heyel.domain.paciente;

import com.heyel.domain.paciente.exception.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;
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

    // US-001: Registro. Consulta si el correo existe y luego guarda: van en una sola transacción.
    @Transactional
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
    @Transactional(readOnly = true)
    public Paciente login(String email, String rawPassword) {
        Paciente paciente = pacienteRepository.findByEmail(email.strip().toLowerCase(Locale.ROOT))
                .orElseThrow(() -> {
                    // Se compara igual contra un hash ficticio para que la respuesta tarde lo mismo
                    // exista o no el correo, y no se pueda averiguar qué correos están registrados.
                    passwordEncoder.matches(rawPassword, dummyHash);
                    return new CredencialesInvalidasException();
                });
        if (!passwordEncoder.matches(rawPassword, paciente.getPassword())) {
            throw new CredencialesInvalidasException();
        }
        
        if (!paciente.isActive()) {
            throw new CredencialesInvalidasException();
        }

        return paciente;
    }

    @Transactional(readOnly = true)
    public Paciente getPacienteById(UUID id) {
        return pacienteRepository.findById(id)
                .orElseThrow(() -> new PacienteNoEncontradoException(id));
    }

    // TODO: Implementar métodos adicionales de PacienteService cuando sea necesario (ej. actualización de perfil, reseteo de contraseña)
}
