package com.heyel.domain.analitica;

import com.heyel.domain.paciente.Paciente;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.List;

// Anota los eventos del embudo. El registro y el regreso los dispara el servidor;
// la activación la avisa el frontend, pero aquí se asegura que cuente una sola vez.
@Service
public class EventosUsuarioService {

    private final EventoUsuarioRepository eventos;

    public EventosUsuarioService(EventoUsuarioRepository eventos) {
        this.eventos = eventos;
    }

    @Transactional
    public void registro(UUID pacienteId) {
        eventos.save(new EventoUsuario(TipoEventoUsuario.REGISTRO, pacienteId, LocalDateTime.now()));
    }

    // Devuelve true solo la primera vez que el paciente se activa.
    @Transactional
    public boolean activacion(UUID pacienteId) {
        if (eventos.existsByPacienteIdAndTipo(pacienteId, TipoEventoUsuario.ACTIVACION)) {
            return false;
        }
        eventos.save(new EventoUsuario(TipoEventoUsuario.ACTIVACION, pacienteId, LocalDateTime.now()));
        return true;
    }

    // Un inicio de sesión cuenta como regreso si es otro día distinto al del registro,
    // y solo se anota una vez por día.
    @Transactional
    public void inicioDeSesion(Paciente paciente) {
        LocalDate hoy = LocalDate.now();
        if (!paciente.getCreatedAt().toLocalDate().isBefore(hoy)) {
            return;
        }
        if (eventos.existsByPacienteIdAndTipoAndFechaGreaterThanEqual(
                paciente.getId(), TipoEventoUsuario.REGRESO, hoy.atStartOfDay())) {
            return;
        }
        eventos.save(new EventoUsuario(TipoEventoUsuario.REGRESO, paciente.getId(), LocalDateTime.now()));
    }
    
    public record EventoReciente(TipoEventoUsuario tipo, OffsetDateTime fecha) {
    }

    public record Panel(long visitasLanding, long clicsCrearCuenta, long registros, long activados,
            long regresaron, List<EventoReciente> ultimos) {
    }

    // Los números del embudo y los últimos eventos. No devuelve el id del paciente ni nada que lo identifique.
    @Transactional(readOnly = true)
    public Panel panel(long visitasLanding, long clicsCrearCuenta) {
        List<EventoReciente> ultimos = eventos.findTop20ByOrderByFechaDesc().stream()
                .map(e -> new EventoReciente(e.getTipo(), e.getFecha().atZone(ZoneId.systemDefault()).toOffsetDateTime()))
                .toList();
        return new Panel(visitasLanding, clicsCrearCuenta,
                eventos.contarPacientes(TipoEventoUsuario.REGISTRO),
                eventos.contarPacientes(TipoEventoUsuario.ACTIVACION),
                eventos.contarPacientes(TipoEventoUsuario.REGRESO),
                ultimos);
    }
}