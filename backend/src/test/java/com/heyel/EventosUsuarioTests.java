package com.heyel;

import com.heyel.domain.analitica.EventoUsuarioRepository;
import com.heyel.domain.analitica.TipoEventoUsuario;
import com.heyel.domain.paciente.PacienteRepository;
import com.heyel.domain.paciente.RegistrationTerms;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.mock.web.MockHttpSession;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;

@SpringBootTest(properties = {
    "spring.datasource.url=jdbc:h2:mem:heyel-eventos;MODE=PostgreSQL;DB_CLOSE_DELAY=-1",
    "spring.datasource.driver-class-name=org.h2.Driver",
    "spring.jpa.hibernate.ddl-auto=create-drop",
    "heyel.limite.login-fallidos-por-minuto=1000",
    "heyel.limite.registros-por-hora=1000"
})
@AutoConfigureMockMvc
class EventosUsuarioTests {
    @Autowired MockMvc mvc;
    @Autowired EventoUsuarioRepository eventos;
    @Autowired PacienteRepository pacientes;

    private static final String CORREO = "ana@example.com";

    @BeforeEach void limpiar() {
        eventos.deleteAll();
        pacientes.deleteAll();
    }

    private void registrar() throws Exception {
        mvc.perform(post("/api/auth/register").with(csrf()).contentType("application/json").content("""
                {"fullName":"Ana Pérez","email":"%s","password":"Una frase segura 123","termsAccepted":true,"termsVersion":"%s"}
                """.formatted(CORREO, RegistrationTerms.VERSION)))
            .andExpect(status().isCreated());
    }

    private MockHttpSession iniciarSesion() throws Exception {
        return (MockHttpSession) mvc.perform(post("/api/auth/login").with(csrf()).contentType("application/json").content("""
                {"email":"%s","password":"Una frase segura 123"}
                """.formatted(CORREO)))
            .andExpect(status().isOk())
            .andReturn().getRequest().getSession();
    }

    private long contar(TipoEventoUsuario tipo) {
        return eventos.findAll().stream().filter(e -> e.getTipo() == tipo).count();
    }

    @Test void registrarseAnotaElEventoDeRegistro() throws Exception {
        registrar();
        assertEquals(1, contar(TipoEventoUsuario.REGISTRO));
    }

    @Test void entrarElMismoDiaDelRegistroNoEsRegreso() throws Exception {
        registrar();
        iniciarSesion();
        assertEquals(0, contar(TipoEventoUsuario.REGRESO));
    }

    @Test void volverOtroDiaCuentaComoRegresoUnaSolaVezPorDia() throws Exception {
        registrar();
        var paciente = pacientes.findByEmail(CORREO).orElseThrow();
        paciente.setCreatedAt(LocalDateTime.now().minusDays(2));
        pacientes.save(paciente);

        iniciarSesion();
        iniciarSesion();

        assertEquals(1, contar(TipoEventoUsuario.REGRESO));
    }
    
    @Test void laActivacionPideSesionYCuentaUnaSolaVez() throws Exception {
        mvc.perform(post("/api/analitica/activacion").with(csrf()))
            .andExpect(status().isUnauthorized());

        registrar();
        MockHttpSession sesion = iniciarSesion();
        for (int i = 0; i < 2; i++) {
            mvc.perform(post("/api/analitica/activacion").session(sesion).with(csrf()))
                .andExpect(status().isNoContent());
        }

        assertEquals(1, contar(TipoEventoUsuario.ACTIVACION));
    }
    
    @Test void elPanelEsPublicoYNoMuestraQuienEsElPaciente() throws Exception {
        registrar();
        MockHttpSession sesion = iniciarSesion();
        mvc.perform(post("/api/analitica/activacion").session(sesion).with(csrf()))
            .andExpect(status().isNoContent());

        mvc.perform(get("/api/analitica/panel"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("registros").value(1))
            .andExpect(jsonPath("activados").value(1))
            .andExpect(jsonPath("ultimos.length()").value(2))
            .andExpect(jsonPath("ultimos[0].pacienteId").doesNotExist());
    }
}