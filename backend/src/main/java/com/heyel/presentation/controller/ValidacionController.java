package com.heyel.presentation.controller;

import com.heyel.domain.analitica.TipoEventoValidacion;
import com.heyel.domain.analitica.ValidacionService;
import com.heyel.presentation.seguridad.LimiteDeIntentos;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

// Prueba guiada de la validación final. Anónima: solo un código de sesión aleatorio.
@RestController
public class ValidacionController {
    private final ValidacionService service;
    private final LimiteDeIntentos limite;

    public ValidacionController(ValidacionService service, LimiteDeIntentos limite) {
        this.service = service;
        this.limite = limite;
    }

    public record EventoRequest(
            @NotBlank @Pattern(regexp = "[A-Za-z0-9-]{8,40}") String sesionId,
            @NotNull TipoEventoValidacion tipo,
            @Min(1) @Max(5) Integer tarea,
            @Min(0) @Max(7200) Integer segundos,
            Boolean ayuda,
            Boolean salud,
            @Pattern(regexp = "MENOR|JOVEN|ADULTO|ADULTO_MAYOR") String edad) {
    }

    @PostMapping("/api/validacion/eventos")
    public ResponseEntity<Void> registrar(@Valid @RequestBody EventoRequest body, HttpServletRequest request) {
        limite.consumirValidacion(request.getRemoteAddr());
        service.registrar(body.sesionId(), body.tipo(), body.tarea(), body.segundos(), body.ayuda(),
                body.salud(), body.edad());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/api/validacion/panel")
    public ValidacionService.Panel panel() {
        return service.panel();
    }
}
