package com.heyel;

import com.heyel.domain.analitica.EventoLandingRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties = {
    "spring.datasource.url=jdbc:h2:mem:heyel-analitica;MODE=PostgreSQL;DB_CLOSE_DELAY=-1",
    "spring.datasource.driver-class-name=org.h2.Driver",
    "spring.jpa.hibernate.ddl-auto=create-drop",
    "heyel.limite.eventos-por-hora=3"
})
@AutoConfigureMockMvc
class AnaliticaApiTests {
    @Autowired MockMvc mvc;
    @Autowired EventoLandingRepository eventos;

    @BeforeEach void clear() { eventos.deleteAll(); }

    private void evento(String tipo, String ip) throws Exception {
        mvc.perform(post("/api/analitica/eventos").with(csrf())
                .with(request -> { request.setRemoteAddr(ip); return request; })
                .contentType("application/json").content("{\"tipo\":\"" + tipo + "\"}"))
            .andExpect(status().isNoContent());
    }

    @Test void cuentaVisitasYClicsSinIniciarSesion() throws Exception {
        evento("VISITA_LANDING", "10.1.0.1");
        evento("VISITA_LANDING", "10.1.0.2");
        evento("CLIC_CREAR_CUENTA", "10.1.0.2");
        mvc.perform(get("/api/analitica/resumen")).andExpect(status().isOk())
            .andExpect(jsonPath("visitas").value(2))
            .andExpect(jsonPath("clicsCrearCuenta").value(1))
            .andExpect(jsonPath("cuentasCreadas").isNumber());
    }

    @Test void rechazaTiposDesconocidosYExigeCsrf() throws Exception {
        mvc.perform(post("/api/analitica/eventos").with(csrf()).contentType("application/json")
                .content("{\"tipo\":\"OTRO\"}"))
            .andExpect(status().isBadRequest());
        mvc.perform(post("/api/analitica/eventos").contentType("application/json")
                .content("{\"tipo\":\"VISITA_LANDING\"}"))
            .andExpect(status().isForbidden());
    }

    @Test void unaMismaIpNoPuedeInflarLasVisitas() throws Exception {
        for (int i = 0; i < 3; i++) {
            evento("VISITA_LANDING", "10.1.0.9");
        }
        mvc.perform(post("/api/analitica/eventos").with(csrf())
                .with(request -> { request.setRemoteAddr("10.1.0.9"); return request; })
                .contentType("application/json").content("{\"tipo\":\"VISITA_LANDING\"}"))
            .andExpect(status().isTooManyRequests());
    }
}
