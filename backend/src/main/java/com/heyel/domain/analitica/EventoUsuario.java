package com.heyel.domain.analitica;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

// Un evento de un paciente. Solo guarda el tipo, el id del paciente y la fecha:
// nada de su nombre, su correo ni su historial clínico.
@Entity
@Table(name = "eventos_usuario")
@Getter
@NoArgsConstructor
public class EventoUsuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TipoEventoUsuario tipo;

    @Column(nullable = false)
    private UUID pacienteId;

    @Column(nullable = false)
    private LocalDateTime fecha;

    public EventoUsuario(TipoEventoUsuario tipo, UUID pacienteId, LocalDateTime fecha) {
        this.tipo = tipo;
        this.pacienteId = pacienteId;
        this.fecha = fecha;
    }
}