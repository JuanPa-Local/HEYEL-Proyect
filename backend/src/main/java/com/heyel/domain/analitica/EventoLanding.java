package com.heyel.domain.analitica;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

// Una visita a la landing o un clic en su llamado a la acción. No guarda IP, correo ni nada que
// identifique a la persona: solo qué pasó y cuándo.
@Entity
@Table(name = "eventos_landing")
@Getter
@NoArgsConstructor
public class EventoLanding {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private TipoEvento tipo;

    @Column(nullable = false)
    private LocalDateTime fecha;

    public EventoLanding(TipoEvento tipo, LocalDateTime fecha) {
        this.tipo = tipo;
        this.fecha = fecha;
    }
}
