package com.heyel;

import com.heyel.domain.analitica.EventoLandingRepository;
import com.heyel.domain.analitica.EventoUsuarioRepository;
import com.heyel.domain.paciente.PacienteRepository;
import com.heyel.domain.paciente.RegistrationTerms;
import com.heyel.domain.validacion.SesionValidacionRepository;
import com.heyel.domain.validacion.ValidacionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
    "spring.datasource.url=jdbc:h2:mem:heyel-validacion;MODE=PostgreSQL;DB_CLOSE_DELAY=-1",
    "spring.datasource.driver-class-name=org.h2.Driver",
    "spring.jpa.hibernate.ddl-auto=create-drop",
    "heyel.limite.login-fallidos-por-minuto=1000",
    "heyel.limite.registros-por-hora=1000",
    "heyel.limite.eventos-por-hora=1000",
    "heyel.validacion.clave=clave-de-prueba"
})
@AutoConfigureMockMvc
class ValidacionApiTests {
    @Autowired MockMvc mvc;
    @Autowired SesionValidacionRepository sesiones;
    @Autowired EventoUsuarioRepository eventosUsuario;
    @Autowired EventoLandingRepository eventosLanding;
    @Autowired PacienteRepository pacientes;

    @BeforeEach void limpiar() {
        sesiones.deleteAll();
        eventosUsuario.deleteAll();
        eventosLanding.deleteAll();
        pacientes.deleteAll();
    }

    private static String sesion(String consentimiento, String respuestas) {
        return """
            {"codigo":"VF-01","perfil":"Cuidadora","probo":"No","facilitador":"Diego","observador":"Mateo",
             "consentimiento":%s,
             "tareas":[{"numero":1,"segundos":40.5,"conAyuda":false,"completada":true},
                       {"numero":2,"segundos":11,"conAyuda":false,"completada":true},
                       {"numero":3,"segundos":6.2,"conAyuda":false,"completada":true},
                       {"numero":4,"segundos":19,"conAyuda":true,"completada":true},
                       {"numero":5,"segundos":5,"conAyuda":false,"completada":true}],
             "susRespuestas":%s,
             "estrellas":4,"masDificil":"Filtrar","cambiaria":"Nada","recomendaria":"Sí"}
            """.formatted(consentimiento, respuestas);
    }

    @Test void elSusSeCalculaConLaReglaDeLaJunta() {
        assertEquals(100.0, ValidacionService.calcularSus(List.of(5, 1, 5, 1, 5, 1, 5, 1, 5, 1)));
        assertEquals(0.0, ValidacionService.calcularSus(List.of(1, 5, 1, 5, 1, 5, 1, 5, 1, 5)));
        assertEquals(75.0, ValidacionService.calcularSus(List.of(4, 2, 4, 2, 4, 2, 4, 2, 4, 2)));
        assertThrows(IllegalArgumentException.class, () -> ValidacionService.calcularSus(List.of(3, 3)));
    }

    @Test void guardaLaSesionSinPedirCuentaYCalculaElSus() throws Exception {
        mvc.perform(post("/api/validacion/sesiones").with(csrf()).contentType("application/json")
                .content(sesion("true", "[4,2,4,2,4,2,4,2,4,2]")))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.codigo").value("VF-01"))
            .andExpect(jsonPath("$.sus").value(75.0))
            .andExpect(jsonPath("$.tareas[3].conAyuda").value(true));
        assertEquals(1, sesiones.count());
    }

    @Test void rechazaSinConsentimientoYRespuestasFueraDeRango() throws Exception {
        mvc.perform(post("/api/validacion/sesiones").with(csrf()).contentType("application/json")
                .content(sesion("false", "[4,2,4,2,4,2,4,2,4,2]")))
            .andExpect(status().isBadRequest());
        mvc.perform(post("/api/validacion/sesiones").with(csrf()).contentType("application/json")
                .content(sesion("true", "[6,2,4,2,4,2,4,2,4,2]")))
            .andExpect(status().isBadRequest());
        mvc.perform(post("/api/validacion/sesiones").with(csrf()).contentType("application/json")
                .content(sesion("true", "[4,2,4]")))
            .andExpect(status().isBadRequest());
        assertEquals(0, sesiones.count());
    }

    @Test void losResultadosPidenLaClaveDelEquipo() throws Exception {
        mvc.perform(post("/api/validacion/sesiones").with(csrf()).contentType("application/json")
                .content(sesion("true", "[4,2,4,2,4,2,4,2,4,2]")))
            .andExpect(status().isCreated());
        mvc.perform(get("/api/validacion/sesiones")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/validacion/sesiones").header("X-Clave-Equipo", "otra")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/validacion/sesiones").header("X-Clave-Equipo", "clave-de-prueba"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].codigo").value("VF-01"))
            .andExpect(jsonPath("$[0].susRespuestas.length()").value(10));
    }

    @Test void loQuePasaEnUnaSesionDeValidacionNoSumaAlEmbudo() throws Exception {
        mvc.perform(post("/api/auth/register").with(csrf()).header("X-Heyel-Validacion", "true")
                .contentType("application/json").content("""
                {"fullName":"Participante VF","email":"vf01@example.com","password":"Una frase segura 123","termsAccepted":true,"termsVersion":"%s"}
                """.formatted(RegistrationTerms.VERSION)))
            .andExpect(status().isCreated());
        mvc.perform(post("/api/analitica/eventos").with(csrf()).header("X-Heyel-Validacion", "true")
                .contentType("application/json").content("{\"tipo\":\"VISITA_LANDING\"}"))
            .andExpect(status().isNoContent());
        assertEquals(0, eventosUsuario.count());
        assertEquals(0, eventosLanding.count());
    }
}
