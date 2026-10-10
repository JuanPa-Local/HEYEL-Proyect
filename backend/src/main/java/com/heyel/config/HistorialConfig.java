package com.heyel.config;

import com.heyel.domain.historial.HistorialService;
import com.heyel.infrastructure.instituciones.simuladas.CatalogoInstitucionesSimuladas;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class HistorialConfig {

    @Bean
    public HistorialService historialService() {
        return new HistorialService(CatalogoInstitucionesSimuladas.crear(), true);
    }
}