package com.heyel.domain.historial;

// Institución de salud que tiene registros del paciente (EPS, IPS, laboratorio, etc.)
public record InstitucionSalud(String id, String nombre, String tipo) {
}