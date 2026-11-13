package com.heyel.domain.validacion;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

// Una sesión de validación con un participante. Se identifica con un código (VF-01, VF-02…):
// no guarda nombre, correo ni datos de contacto de la persona.
@Entity
@Table(name = "sesiones_validacion")
@Getter
@NoArgsConstructor
public class SesionValidacion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 20)
    private String codigo;

    @Column(nullable = false)
    private LocalDateTime fecha;

    @Column(length = 200)
    private String perfil;

    @Column(length = 20)
    private String probo;

    @Column(length = 100)
    private String facilitador;

    @Column(length = 100)
    private String observador;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "sesiones_validacion_tareas", joinColumns = @JoinColumn(name = "sesion_id"))
    @OrderColumn(name = "orden")
    private List<ResultadoTarea> tareas = new ArrayList<>();

    // Las 10 respuestas del SUS separadas por coma, en el orden del cuestionario.
    @Column(nullable = false, length = 30)
    private String susRespuestas;

    @Column(nullable = false)
    private double sus;

    @Column(nullable = false)
    private int estrellas;

    @Column(length = 1000)
    private String masDificil;

    @Column(length = 1000)
    private String cambiaria;

    @Column(length = 20)
    private String recomendaria;

    public SesionValidacion(String codigo, LocalDateTime fecha, String perfil, String probo, String facilitador,
            String observador, List<ResultadoTarea> tareas, List<Integer> susRespuestas, double sus, int estrellas,
            String masDificil, String cambiaria, String recomendaria) {
        this.codigo = codigo;
        this.fecha = fecha;
        this.perfil = perfil;
        this.probo = probo;
        this.facilitador = facilitador;
        this.observador = observador;
        this.tareas = new ArrayList<>(tareas);
        this.susRespuestas = String.join(",", susRespuestas.stream().map(String::valueOf).toList());
        this.sus = sus;
        this.estrellas = estrellas;
        this.masDificil = masDificil;
        this.cambiaria = cambiaria;
        this.recomendaria = recomendaria;
    }

    public List<Integer> respuestasSus() {
        return Arrays.stream(susRespuestas.split(",")).map(Integer::valueOf).toList();
    }
}
