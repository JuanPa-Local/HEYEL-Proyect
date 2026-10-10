package com.heyel.domain.historial;

import java.util.List;

// Resultado de consultar todas las instituciones de un paciente.
public record HistorialConsolidado(
        List<RegistroClinico> registros,
        List<InstitucionSalud> instituciones,
        List<InstitucionSalud> noDisponibles,
        boolean datosSimulados) {
}