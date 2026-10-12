package com.heyel;

import com.heyel.domain.paciente.PacienteRepository;
import com.heyel.domain.paciente.RegistrationTerms;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

// Usa los límites reales de application.properties salvo el de registros, que se baja a 3 para no
// crear diez cuentas. Cada prueba sale de una IP distinta para que sus cubos no se mezclen.
@SpringBootTest(properties = {
    "spring.datasource.url=jdbc:h2:mem:heyel-limites;MODE=PostgreSQL;DB_CLOSE_DELAY=-1",
    "spring.datasource.driver-class-name=org.h2.Driver",
    "spring.jpa.hibernate.ddl-auto=create-drop",
    "heyel.limite.registros-por-hora=3"
})
@AutoConfigureMockMvc
class LimiteDeIntentosTests {
    private static final String CLAVE = "Una frase segura 123";

    @Autowired MockMvc mvc;
    @Autowired PacienteRepository patients;

    @BeforeEach void clear() { patients.deleteAll(); }

    private RequestPostProcessor desde(String ip) {
        return request -> { request.setRemoteAddr(ip); return request; };
    }

    private ResultActions registrar(String email, String ip) throws Exception {
        String cuenta = """
            {"fullName":"Paciente de prueba","email":"%s","password":"%s","termsAccepted":true,"termsVersion":"%s"}
            """.formatted(email, CLAVE, RegistrationTerms.VERSION);
        return mvc.perform(post("/api/auth/register").with(csrf()).with(desde(ip))
            .contentType("application/json").content(cuenta));
    }

    private ResultActions entrar(String email, String clave, String ip) throws Exception {
        return mvc.perform(post("/api/auth/login").with(csrf()).with(desde(ip)).contentType("application/json")
            .content("{\"email\":\"" + email + "\",\"password\":\"" + clave + "\"}"));
    }

    @Test void elSextoLoginFallidoDevuelve429ConRetryAfter() throws Exception {
        registrar("ana@example.com", "10.0.0.1").andExpect(status().isCreated());
        for (int i = 0; i < 5; i++) {
            entrar("ana@example.com", "incorrecta", "10.0.0.1").andExpect(status().isUnauthorized());
        }
        // Ni siquiera con la clave correcta: mientras dure la espera no se revisa la contraseña.
        entrar("ana@example.com", CLAVE, "10.0.0.1")
            .andExpect(status().isTooManyRequests())
            .andExpect(header().exists("Retry-After"))
            .andExpect(jsonPath("error").value(containsString("Espera")))
            .andExpect(jsonPath("password").doesNotExist());
    }

    @Test void unLoginExitosoReiniciaLosFallos() throws Exception {
        registrar("ana@example.com", "10.0.0.2").andExpect(status().isCreated());
        for (int i = 0; i < 4; i++) {
            entrar("ana@example.com", "incorrecta", "10.0.0.2").andExpect(status().isUnauthorized());
        }
        entrar("ana@example.com", CLAVE, "10.0.0.2").andExpect(status().isOk());
        for (int i = 0; i < 4; i++) {
            entrar("ana@example.com", "incorrecta", "10.0.0.2").andExpect(status().isUnauthorized());
        }
    }

    @Test void losFallosContraOtraCuentaNoBloqueanAOtroPacienteDeLaMismaRed() throws Exception {
        registrar("ana@example.com", "10.0.0.3").andExpect(status().isCreated());
        registrar("luis@example.com", "10.0.0.3").andExpect(status().isCreated());
        for (int i = 0; i < 5; i++) {
            entrar("ana@example.com", "incorrecta", "10.0.0.3").andExpect(status().isUnauthorized());
        }
        entrar("luis@example.com", CLAVE, "10.0.0.3").andExpect(status().isOk());
    }

    @Test void detrasDelProxySeUsaLaIpDeXForwardedFor() throws Exception {
        registrar("ana@example.com", "10.0.0.4").andExpect(status().isCreated());
        for (int i = 0; i < 5; i++) {
            mvc.perform(post("/api/auth/login").with(csrf()).with(desde("10.0.0.4"))
                    .header("X-Forwarded-For", "203.0.113.7").contentType("application/json")
                    .content("{\"email\":\"ana@example.com\",\"password\":\"incorrecta\"}"))
                .andExpect(status().isUnauthorized());
        }
        // Mismo proxy, otro cliente: no hereda el bloqueo del primero.
        mvc.perform(post("/api/auth/login").with(csrf()).with(desde("10.0.0.4"))
                .header("X-Forwarded-For", "198.51.100.9").contentType("application/json")
                .content("{\"email\":\"ana@example.com\",\"password\":\"" + CLAVE + "\"}"))
            .andExpect(status().isOk());
    }

    @Test void elRegistroSeLimitaPorIp() throws Exception {
        for (int i = 1; i <= 3; i++) {
            registrar("paciente" + i + "@example.com", "10.0.0.5").andExpect(status().isCreated());
        }
        registrar("paciente4@example.com", "10.0.0.5")
            .andExpect(status().isTooManyRequests())
            .andExpect(header().exists("Retry-After"));
        // Desde otra IP se puede seguir registrando.
        registrar("paciente4@example.com", "10.0.0.6").andExpect(status().isCreated());
    }
}
