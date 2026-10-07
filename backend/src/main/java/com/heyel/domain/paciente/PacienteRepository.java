package com.heyel.domain.paciente;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface PacienteRepository extends JpaRepository<Paciente, UUID> {
    boolean existsByEmail(String email);
    Optional<Paciente> findByEmail(String email);
}
