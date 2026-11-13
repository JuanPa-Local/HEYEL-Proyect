package com.heyel.domain.validacion;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.Getter;
import lombok.NoArgsConstructor;

// Cómo le fue al participante en una tarea: cuánto tardó, si pidió ayuda y si la completó.
@Embeddable
@Getter
@NoArgsConstructor
public class ResultadoTarea {

    @Column(nullable = false)
    private int numero;

    @Column(nullable = false)
    private double segundos;

    @Column(nullable = false)
    private boolean conAyuda;

    @Column(nullable = false)
    private boolean completada;

    public ResultadoTarea(int numero, double segundos, boolean conAyuda, boolean completada) {
        this.numero = numero;
        this.segundos = segundos;
        this.conAyuda = conAyuda;
        this.completada = completada;
    }
}
