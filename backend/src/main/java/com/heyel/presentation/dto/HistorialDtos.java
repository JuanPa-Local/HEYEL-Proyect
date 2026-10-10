package com.heyel.presentation.dto;

import com.heyel.domain.historial.HistorialConsolidado;
import com.heyel.domain.historial.InstitucionSalud;
import com.heyel.domain.historial.RegistroClinico;

import java.util.List;

public final class HistorialDtos {
    private HistorialDtos() {}

    public record InstitucionResponse(String id, String nombre, String tipo) {
        static InstitucionResponse from(InstitucionSalud institucion) {
            return new InstitucionResponse(institucion.id(), institucion.nombre(), institucion.tipo());
        }
    }

    public record RegistroResponse(String id, String fecha, String titulo, String detalle,
            String categoria, String categoriaEtiqueta, String institucionId, String institucionNombre) {
        static RegistroResponse from(RegistroClinico registro) {
            return new RegistroResponse(registro.id(), registro.fecha().toString(), registro.titulo(),
                    registro.detalle(), registro.categoria().name(), registro.categoria().etiqueta(),
                    registro.institucion().id(), registro.institucion().nombre());
        }
    }

    public record HistorialResponse(List<RegistroResponse> registros, List<InstitucionResponse> instituciones,
            List<InstitucionResponse> noDisponibles, boolean datosSimulados) {
        public static HistorialResponse from(HistorialConsolidado historial) {
            return new HistorialResponse(
                    historial.registros().stream().map(RegistroResponse::from).toList(),
                    historial.instituciones().stream().map(InstitucionResponse::from).toList(),
                    historial.noDisponibles().stream().map(InstitucionResponse::from).toList(),
                    historial.datosSimulados());
        }
    }
}