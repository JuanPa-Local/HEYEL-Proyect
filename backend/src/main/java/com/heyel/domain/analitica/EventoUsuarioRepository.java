package com.heyel.domain.analitica;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface EventoUsuarioRepository extends JpaRepository<EventoUsuario, Long> {

    boolean existsByPacienteIdAndTipo(UUID pacienteId, TipoEventoUsuario tipo);

    boolean existsByPacienteIdAndTipoAndFechaGreaterThanEqual(UUID pacienteId, TipoEventoUsuario tipo, LocalDateTime desde);

    // Cuántos pacientes distintos tienen al menos un evento de ese tipo.
    @Query("select count(distinct e.pacienteId) from EventoUsuario e where e.tipo = :tipo")
    long contarPacientes(@Param("tipo") TipoEventoUsuario tipo);

    // Los últimos eventos, para mostrarlos en el panel en vivo.
    List<EventoUsuario> findTop20ByOrderByFechaDesc();
}