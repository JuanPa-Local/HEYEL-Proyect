package com.heyel.infrastructure.persistence.paciente;

import com.heyel.domain.paciente.Paciente;
import com.heyel.domain.paciente.PacienteRepository;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Adaptador de Persistencia para interactuar fácilmente con la base de datos PostgreSQL.
 */
@Component
public class PacientePersistenceAdapter {

    private final PacienteRepository pacienteRepository;

    public PacientePersistenceAdapter(PacienteRepository pacienteRepository) {
        this.pacienteRepository = pacienteRepository;
    }

    public Paciente guardar(Paciente paciente) {
        return pacienteRepository.save(paciente);
    }

    public Optional<Paciente> buscarPorId(UUID id) {
        return pacienteRepository.findById(id);
    }

    public Optional<Paciente> buscarPorEmail(String email) {
        return pacienteRepository.findByEmail(email);
    }

    public boolean existePorEmail(String email) {
        return pacienteRepository.existsByEmail(email);
    }

    public List<Paciente> obtenerTodos() {
        return pacienteRepository.findAll();
    }

    public void eliminarPorId(UUID id) {
        pacienteRepository.deleteById(id);
    }
}
