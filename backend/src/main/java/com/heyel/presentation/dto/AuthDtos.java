package com.heyel.presentation.dto;

import com.heyel.domain.paciente.Paciente;
import jakarta.validation.constraints.*;
import java.util.UUID;

public final class AuthDtos {
    private AuthDtos() {}
    public record RegisterRequest(
            @NotBlank @Size(min = 2, max = 100) String fullName,
            @NotBlank @Email @Size(max = 254) String email,
            @NotBlank @Size(min = 12, max = 64) String password,
            @NotNull(message = "Debes aceptar las condiciones para registrarte.")
            @AssertTrue(message = "Debes aceptar las condiciones para registrarte.") Boolean termsAccepted,
            @NotBlank(message = "Revisa las condiciones vigentes antes de registrarte.")
            @Size(max = 50) String termsVersion) {
        public RegisterRequest {
            if (fullName != null) fullName = fullName.strip();
            if (email != null) email = email.strip();
        }
        @AssertTrue(message = "La contraseña no puede superar 72 bytes UTF-8.")
        public boolean isPasswordWithinByteLimit() {
            return password == null || password.getBytes(java.nio.charset.StandardCharsets.UTF_8).length <= 72;
        }
    }
    public record LoginRequest(
            @NotBlank @Email @Size(max = 254) String email,
            @NotBlank @Size(max = 64) String password) {
        @AssertTrue(message = "La contraseña no puede superar 72 bytes UTF-8.")
        public boolean isPasswordWithinByteLimit() {
            return password == null || password.getBytes(java.nio.charset.StandardCharsets.UTF_8).length <= 72;
        }
    }
    public record PatientResponse(UUID id, String fullName, String email, String role) {
        public static PatientResponse from(Paciente p) {
            return new PatientResponse(p.getId(), p.getFullName(), p.getEmail(), p.getRole().name());
        }
    }
}
