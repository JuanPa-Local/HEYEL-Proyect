package com.heyel.presentation.dto;

import com.heyel.domain.validacion.ResultadoTarea;
import com.heyel.domain.validacion.SesionValidacion;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.List;

public final class ValidacionDtos {
    private ValidacionDtos() {}

    public record TareaRequest(
            @Min(1) @Max(5) int numero,
            @NotNull @DecimalMin("0") @DecimalMax("3600") Double segundos,
            boolean conAyuda,
            boolean completada) {
        public ResultadoTarea aResultado() {
            return new ResultadoTarea(numero, segundos, conAyuda, completada);
        }
    }

    public record SesionRequest(
            @NotBlank @Size(max = 20) String codigo,
            @Size(max = 200) String perfil,
            @Size(max = 20) String probo,
            @Size(max = 100) String facilitador,
            @Size(max = 100) String observador,
            @NotNull(message = "La persona debe aceptar el consentimiento.")
            @AssertTrue(message = "La persona debe aceptar el consentimiento.") Boolean consentimiento,
            @NotNull @Size(min = 5, max = 5) List<@Valid @NotNull TareaRequest> tareas,
            @NotNull @Size(min = 10, max = 10) List<@NotNull @Min(1) @Max(5) Integer> susRespuestas,
            @NotNull @Min(1) @Max(5) Integer estrellas,
            @Size(max = 1000) String masDificil,
            @Size(max = 1000) String cambiaria,
            @Size(max = 20) String recomendaria) {
    }

    public record TareaResponse(int numero, double segundos, boolean conAyuda, boolean completada) {
        static TareaResponse from(ResultadoTarea tarea) {
            return new TareaResponse(tarea.getNumero(), tarea.getSegundos(), tarea.isConAyuda(), tarea.isCompletada());
        }
    }

    public record SesionResponse(Long id, String codigo, OffsetDateTime fecha, String perfil, String probo,
            String facilitador, String observador, List<TareaResponse> tareas, List<Integer> susRespuestas,
            double sus, int estrellas, String masDificil, String cambiaria, String recomendaria) {
        public static SesionResponse from(SesionValidacion s) {
            return new SesionResponse(s.getId(), s.getCodigo(),
                    s.getFecha().atZone(ZoneId.systemDefault()).toOffsetDateTime(), s.getPerfil(), s.getProbo(),
                    s.getFacilitador(), s.getObservador(),
                    s.getTareas().stream().map(TareaResponse::from).toList(), s.respuestasSus(), s.getSus(),
                    s.getEstrellas(), s.getMasDificil(), s.getCambiaria(), s.getRecomendaria());
        }
    }
}
