package com.heyel.presentation.controller;

import com.heyel.domain.analitica.AnaliticaService;
import com.heyel.domain.analitica.AnaliticaService.Resumen;
import com.heyel.domain.analitica.TipoEvento;
import com.heyel.presentation.seguridad.LimiteDeIntentos;
import com.heyel.domain.analitica.EventosUsuarioService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.core.Authentication;
import java.util.UUID;

// Analítica propia de la landing: no usa cookies de terceros ni guarda datos de la persona.
@RestController
public class AnaliticaController {
    private final AnaliticaService service;
    private final LimiteDeIntentos limite;
    private final EventosUsuarioService eventosUsuario;

    public AnaliticaController(AnaliticaService service, LimiteDeIntentos limite, EventosUsuarioService eventosUsuario) {
        this.service = service;
        this.limite = limite;
        this.eventosUsuario = eventosUsuario;
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
    
    // El paciente usó por primera vez un filtro, el buscador o la gráfica. Pide sesión iniciada
    // y el servicio se asegura de contarlo una sola vez por paciente.
    @PostMapping("/api/analitica/activacion")
    public ResponseEntity<Void> activacion(Authentication auth) {
        eventosUsuario.activacion(UUID.fromString(auth.getName()));
        return ResponseEntity.noContent().build();
    }
    
    @GetMapping("/api/analitica/panel")
    public EventosUsuarioService.Panel panel() {
        Resumen resumen = service.resumen();
        return eventosUsuario.panel(resumen.visitas(), resumen.clicsCrearCuenta());
    }
}
