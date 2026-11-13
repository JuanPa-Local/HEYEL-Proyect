package com.heyel.presentation.controller;

import jakarta.servlet.http.HttpServletRequest;

// Durante una sesión de validación el frontend manda este encabezado. Así las cuentas y los
// eventos de las pruebas con usuarios no se mezclan con el embudo de los visitantes reales.
final class ModoValidacion {
    static final String ENCABEZADO = "X-Heyel-Validacion";

    private ModoValidacion() {}

    static boolean activo(HttpServletRequest request) {
        return "true".equalsIgnoreCase(request.getHeader(ENCABEZADO));
    }
}
