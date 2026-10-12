package com.heyel.presentation.controller;

import com.heyel.domain.paciente.Paciente;
import com.heyel.domain.paciente.PacienteService;
import com.heyel.domain.paciente.RegistrationTerms;
import com.heyel.domain.paciente.exception.CredencialesInvalidasException;
import com.heyel.presentation.dto.AuthDtos.*;
import com.heyel.presentation.seguridad.LimiteDeIntentos;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.security.web.csrf.HttpSessionCsrfTokenRepository;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
public class AuthController {
    private final PacienteService service;
    private final SecurityContextRepository contexts;
    private final LimiteDeIntentos limite;
    public AuthController(PacienteService service, SecurityContextRepository contexts, LimiteDeIntentos limite) {
        this.service = service;
        this.contexts = contexts;
        this.limite = limite;
    }
    @GetMapping("/api/auth/csrf")
    public Map<String, String> csrf(CsrfToken token) {
        return Map.of("token", token.getToken(), "headerName", token.getHeaderName());
    }
    @GetMapping("/api/auth/terms")
    public Map<String, Object> terms() {
        return Map.of("version", RegistrationTerms.VERSION, "title", RegistrationTerms.TITLE,
                "paragraphs", RegistrationTerms.PARAGRAPHS);
    }
    @PostMapping({"/api/auth/register", "/api/pacientes/register"})
    public ResponseEntity<PatientResponse> register(@Valid @RequestBody RegisterRequest body, HttpServletRequest request) {
        limite.consumirRegistro(request.getRemoteAddr());
        return ResponseEntity.status(201).body(PatientResponse.from(
                service.register(body.fullName(), body.email(), body.password(), body.termsAccepted(), body.termsVersion())));
    }
    @PostMapping({"/api/auth/login", "/api/pacientes/login"})
    public PatientResponse login(@Valid @RequestBody LoginRequest body,
            HttpServletRequest request, HttpServletResponse response) {
        String ip = request.getRemoteAddr();
        limite.verificarLogin(ip, body.email());
        Paciente patient;
        try {
            patient = service.login(body.email(), body.password());
        } catch (CredencialesInvalidasException e) {
            limite.registrarFalloDeLogin(ip, body.email());
            throw e;
        }
        limite.reiniciarLogin(ip, body.email());
        // Rotate the session ID to prevent session fixation.
        request.getSession();
        request.changeSessionId();
        var authentication = UsernamePasswordAuthenticationToken.authenticated(
                patient.getId().toString(), null,
                List.of(new SimpleGrantedAuthority("ROLE_" + patient.getRole().name())));
        var context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(authentication);
        SecurityContextHolder.setContext(context);
        contexts.saveContext(context, request, response);
        new HttpSessionCsrfTokenRepository().saveToken(null, request, response);
        return PatientResponse.from(patient);
    }
    @GetMapping("/api/auth/me")
    public PatientResponse me(Authentication auth) {
        var patient = service.getPacienteById(UUID.fromString(auth.getName()));
        if (!patient.isActive()) throw new com.heyel.domain.paciente.exception.CredencialesInvalidasException();
        return PatientResponse.from(patient);
    }
}
