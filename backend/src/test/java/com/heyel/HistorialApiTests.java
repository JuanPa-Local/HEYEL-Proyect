package com.heyel;

import com.heyel.domain.paciente.PacienteRepository;
import com.heyel.domain.paciente.RegistrationTerms;
import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties = {
    "spring.datasource.url=jdbc:h2:mem:heyel;MODE=PostgreSQL;DB_CLOSE_DELAY=-1",
    "spring.datasource.driver-class-name=org.h2.Driver",
    "spring.jpa.hibernate.ddl-auto=create-drop",
    // Estas pruebas registran e inician sesión muchas veces; el límite se prueba en LimiteDeIntentosTests.
    "heyel.limite.login-fallidos-por-minuto=1000",
    "heyel.limite.registros-por-hora=1000"
})
@AutoConfigureMockMvc
class HistorialApiTests {
    @Autowired MockMvc mvc;
    @Autowired PacienteRepository patients;

    @BeforeEach void clear() { patients.deleteAll(); }

    private MockHttpSession registrarYEntrar(String email) throws Exception {
        String cuenta = """
            {"fullName":"Paciente de prueba","email":"%s","password":"Una frase segura 123","termsAccepted":true,"termsVersion":"%s"}
            """.formatted(email, RegistrationTerms.VERSION);
        mvc.perform(post("/api/auth/register").with(csrf()).contentType("application/json").content(cuenta))
            .andExpect(status().isCreated());
        var result = mvc.perform(post("/api/auth/login").with(csrf()).contentType("application/json")
                .content("{\"email\":\"" + email + "\",\"password\":\"Una frase segura 123\"}"))
            .andExpect(status().isOk()).andReturn();
        return (MockHttpSession) result.getRequest().getSession(false);
    }

    @Test void historialRequiereSesion() throws Exception {
        mvc.perform(get("/api/historial")).andExpect(status().isUnauthorized());
    }

    @Test void historialConsolidaInstitucionesYOrdenaPorFecha() throws Exception {
        var session = registrarYEntrar("ana@example.com");
        String json = mvc.perform(get("/api/historial").session(session))
            .andExpect(status().isOk())
            .andExpect(jsonPath("datosSimulados").value(true))
            .andExpect(jsonPath("instituciones.length()").value(4))
            .andExpect(jsonPath("noDisponibles.length()").value(0))
            .andExpect(jsonPath("registros[0].titulo").isString())
            .andExpect(jsonPath("registros[0].institucionNombre").isString())
            .andExpect(jsonPath("registros[0].categoriaEtiqueta").isString())
            .andReturn().getResponse().getContentAsString();

        List<String> fechas = JsonPath.read(json, "$.registros[*].fecha");
        assertTrue(fechas.size() >= 6, "Debe traer registros de varias instituciones");
        for (int i = 1; i < fechas.size(); i++) {
            assertTrue(fechas.get(i - 1).compareTo(fechas.get(i)) >= 0, "Debe ir del más reciente al más antiguo");
        }

        // El mismo paciente ve siempre el mismo historial.
        String otraVez = mvc.perform(get("/api/historial").session(session))
            .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        assertEquals(json, otraVez);
    }
}