package com.heyel.domain.analitica;

import com.heyel.domain.paciente.PacienteRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

// Visitas a la landing / Clics en «Crear mi cuenta» y las cuentas creadas.
@Service
public class AnaliticaService {

    private final EventoLandingRepository eventos;
    private final PacienteRepository pacientes;

    public AnaliticaService(EventoLandingRepository eventos, PacienteRepository pacientes) {
        this.eventos = eventos;
        this.pacientes = pacientes;
    }

    @Transactional
    public void registrar(TipoEvento tipo) {
        eventos.save(new EventoLanding(tipo, LocalDateTime.now()));
    }

    @Transactional(readOnly = true)
    public Resumen resumen() {
        return new Resumen(eventos.countByTipo(TipoEvento.VISITA_LANDING),
                eventos.countByTipo(TipoEvento.CLIC_CREAR_CUENTA), pacientes.count());
    }

    public record Resumen(long visitas, long clicsCrearCuenta, long cuentasCreadas) {
    }
}
