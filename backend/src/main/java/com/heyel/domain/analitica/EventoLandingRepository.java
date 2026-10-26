package com.heyel.domain.analitica;

import org.springframework.data.jpa.repository.JpaRepository;

public interface EventoLandingRepository extends JpaRepository<EventoLanding, Long> {
    long countByTipo(TipoEvento tipo);
}
