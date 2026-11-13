package com.heyel.domain.validacion;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

// Guarda las sesiones de validación y calcula el SUS en el servidor, para que el puntaje
// no dependa de lo que calcule cada celular.
@Service
public class ValidacionService {

    private final SesionValidacionRepository sesiones;

    public ValidacionService(SesionValidacionRepository sesiones) {
        this.sesiones = sesiones;
    }

    // Regla del SUS: a las afirmaciones impares (1, 3, 5, 7, 9) se les resta 1, a las pares se les
    // resta de 5; se suman y se multiplican por 2,5. El resultado va de 0 a 100.
    public static double calcularSus(List<Integer> respuestas) {
        if (respuestas.size() != 10) {
            throw new IllegalArgumentException("El SUS necesita 10 respuestas.");
        }
        int suma = 0;
        for (int i = 0; i < respuestas.size(); i++) {
            int respuesta = respuestas.get(i);
            suma += (i % 2 == 0) ? respuesta - 1 : 5 - respuesta;
        }
        return suma * 2.5;
    }

    @Transactional
    public SesionValidacion guardar(String codigo, String perfil, String probo, String facilitador, String observador,
            List<ResultadoTarea> tareas, List<Integer> susRespuestas, int estrellas,
            String masDificil, String cambiaria, String recomendaria) {
        SesionValidacion sesion = new SesionValidacion(codigo, LocalDateTime.now(), perfil, probo, facilitador,
                observador, tareas, susRespuestas, calcularSus(susRespuestas), estrellas,
                masDificil, cambiaria, recomendaria);
        return sesiones.save(sesion);
    }

    @Transactional(readOnly = true)
    public List<SesionValidacion> listar() {
        return sesiones.findAllByOrderByFechaAsc();
    }
}
