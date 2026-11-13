package com.heyel.presentation.controller;

import com.heyel.domain.validacion.ValidacionService;
import com.heyel.presentation.dto.ValidacionDtos.SesionRequest;
import com.heyel.presentation.dto.ValidacionDtos.SesionResponse;
import com.heyel.presentation.dto.ValidacionDtos.TareaRequest;
import com.heyel.presentation.seguridad.LimiteDeIntentos;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Comparator;
import java.util.Map;

// Sesiones de validación con usuarios. Guardar una sesión no pide cuenta, porque el celular
// pasa de mano en mano; ver los resultados pide la clave del equipo.
@RestController
public class ValidacionController {
    private final ValidacionService service;
    private final LimiteDeIntentos limite;
    private final String claveEquipo;

    public ValidacionController(ValidacionService service, LimiteDeIntentos limite,
            @Value("${heyel.validacion.clave:}") String claveEquipo) {
        this.service = service;
        this.limite = limite;
        this.claveEquipo = claveEquipo;
    }

    @PostMapping("/api/validacion/sesiones")
    public ResponseEntity<SesionResponse> guardar(@Valid @RequestBody SesionRequest body, HttpServletRequest request) {
        limite.consumirEvento(request.getRemoteAddr());
        var tareas = body.tareas().stream()
                .sorted(Comparator.comparingInt(TareaRequest::numero))
                .map(TareaRequest::aResultado)
                .toList();
        var sesion = service.guardar(body.codigo().strip(), body.perfil(), body.probo(), body.facilitador(),
                body.observador(), tareas, body.susRespuestas(), body.estrellas(),
                body.masDificil(), body.cambiaria(), body.recomendaria());
        return ResponseEntity.status(201).body(SesionResponse.from(sesion));
    }

    @GetMapping("/api/validacion/sesiones")
    public ResponseEntity<?> listar(@RequestHeader(value = "X-Clave-Equipo", required = false) String clave) {
        if (claveEquipo.isBlank()) {
            return ResponseEntity.status(403).body(Map.of("error", "Los resultados no están activados en este servidor."));
        }
        if (clave == null || !iguales(clave, claveEquipo)) {
            return ResponseEntity.status(401).body(Map.of("error", "La clave del equipo no es correcta."));
        }
        return ResponseEntity.ok(service.listar().stream().map(SesionResponse::from).toList());
    }

    // Compara en tiempo constante para no dar pistas de la clave por lo que tarda la respuesta.
    private static boolean iguales(String a, String b) {
        return MessageDigest.isEqual(a.getBytes(StandardCharsets.UTF_8), b.getBytes(StandardCharsets.UTF_8));
    }
}
