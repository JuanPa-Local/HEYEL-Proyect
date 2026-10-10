package com.heyel.domain.historial;

import java.time.LocalDate;

//Un examen, imagen o consulta que una institución tiene registrado sobre el paciente.
public record RegistroClinico(
        String id,
        LocalDate fecha,
        String titulo,
        String detalle,
        Categoria categoria,
        InstitucionSalud institucion) {
}