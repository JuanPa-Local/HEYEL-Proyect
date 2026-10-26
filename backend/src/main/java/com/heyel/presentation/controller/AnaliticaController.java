package com.heyel.presentation.controller;

import com.heyel.domain.analitica.AnaliticaService;
import com.heyel.domain.analitica.AnaliticaService.Resumen;
import com.heyel.domain.analitica.TipoEvento;
import com.heyel.presentation.seguridad.LimiteDeIntentos;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

// Analítica propia de la landing: no usa cookies de terceros ni guarda datos de la persona.
@RestController
public class AnaliticaController {
    private final AnaliticaService service;
    private final LimiteDeIntentos limite;

    public AnaliticaController(AnaliticaService service, LimiteDeIntentos limite) {
        this.service = service;
        this.limite = limite;
    }

    public record EventoRequest(@NotNull TipoEvento tipo) {
    }

    @PostMapping("/api/analitica/eventos")
    public ResponseEntity<Void> registrar(@Valid @RequestBody EventoRequest body, HttpServletRequest request) {
        limite.consumirEvento(request.getRemoteAddr());
        service.registrar(body.tipo());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/api/analitica/resumen")
    public Resumen resumen() {
        return service.resumen();
    }
}
