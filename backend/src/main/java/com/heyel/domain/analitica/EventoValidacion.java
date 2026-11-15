package com.heyel.domain.analitica;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

// Un evento de la prueba guiada. Solo guarda un código de sesión aleatorio: nada de nombre ni correo.
@Entity
@Table(name = "eventos_validacion")
@Getter
@NoArgsConstructor
public class EventoValidacion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 40)
    private String sesionId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TipoEventoValidacion tipo;

    private Integer tarea;

    private Integer segundos;

    @Column(nullable = false)
    private boolean ayuda;

    // Perfil de la persona (solo en el evento INICIO): relación con la salud y grupo de edad.
    private Boolean salud;

    @Column(length = 20)
    private String edad;

    @Column(nullable = false)
    private LocalDateTime fecha;

    public EventoValidacion(String sesionId, TipoEventoValidacion tipo, Integer tarea, Integer segundos,
            boolean ayuda, Boolean salud, String edad, LocalDateTime fecha) {
        this.sesionId = sesionId;
        this.tipo = tipo;
        this.tarea = tarea;
        this.segundos = segundos;
        this.ayuda = ayuda;
        this.salud = salud;
        this.edad = edad;
        this.fecha = fecha;
    }
}
