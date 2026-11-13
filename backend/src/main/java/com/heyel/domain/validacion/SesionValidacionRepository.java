package com.heyel.domain.validacion;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SesionValidacionRepository extends JpaRepository<SesionValidacion, Long> {

    List<SesionValidacion> findAllByOrderByFechaAsc();
}
