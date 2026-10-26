package com.heyel;

import com.heyel.domain.paciente.PacienteRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
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
class BackendApplicationTests {
    @Autowired MockMvc mvc;
    @Autowired PacienteRepository patients;
    @Autowired PasswordEncoder encoder;
    private final String account = """
        {"fullName":"Ana Pérez","email":"ANA@example.com","password":"Una frase segura 123","termsAccepted":true,"termsVersion":"prototipo-2026-10-25"}
        """;
    @BeforeEach void clear() { patients.deleteAll(); }
    private void register() throws Exception {
        mvc.perform(post("/api/auth/register").with(csrf()).contentType("application/json").content(account))
            .andExpect(status().isCreated()).andExpect(jsonPath("password").doesNotExist())
            .andExpect(jsonPath("email").value("ana@example.com"));
    }
    private MockHttpSession login() throws Exception {
        var result = mvc.perform(post("/api/auth/login").with(csrf()).contentType("application/json")
                .content("{\"email\":\"ana@example.com\",\"password\":\"Una frase segura 123\"}"))
            .andExpect(status().isOk()).andExpect(jsonPath("password").doesNotExist()).andReturn();
        return (MockHttpSession) result.getRequest().getSession(false);
    }
    @Test void registerHashesAndRejectsDuplicates() throws Exception {
        register();
        var p = patients.findByEmail("ana@example.com").orElseThrow();
        assertNotEquals("Una frase segura 123", p.getPassword());
        assertTrue(encoder.matches("Una frase segura 123", p.getPassword()));
        assertNotNull(p.getTermsAcceptedAt());
        assertEquals(com.heyel.domain.paciente.RegistrationTerms.VERSION, p.getTermsVersion());
        mvc.perform(post("/api/auth/register").with(csrf()).contentType("application/json").content(account))
            .andExpect(status().isConflict());
    }
    @Test void validatesRequestsAndCsrf() throws Exception {
        mvc.perform(post("/api/auth/register").contentType("application/json").content(account))
            .andExpect(status().isForbidden());
        mvc.perform(get("/api/auth/csrf")).andExpect(status().isOk())
            .andExpect(jsonPath("token").isString()).andExpect(jsonPath("headerName").value("X-CSRF-TOKEN"));
        mvc.perform(post("/api/auth/register").with(csrf()).contentType("application/json")
            .content("{\"fullName\":\"\",\"email\":\"bad\",\"password\":\"123\"}"))
            .andExpect(status().isBadRequest()).andExpect(jsonPath("fields.email").exists());
        mvc.perform(post("/api/auth/register").with(csrf()).contentType("application/json")
            .content("{\"fullName\":\"Ana\",\"email\":\"a@example.com\",\"password\":\"" + "ñ".repeat(40) + "\"}"))
            .andExpect(status().isBadRequest());
    }
    @Test void sessionOwnershipAndLogout() throws Exception {
        register();
        mvc.perform(get("/api/auth/me")).andExpect(status().isUnauthorized());
        var session = login();
        mvc.perform(get("/api/auth/me").session(session)).andExpect(status().isOk())
            .andExpect(jsonPath("fullName").value("Ana Pérez"));
        var id = patients.findByEmail("ana@example.com").orElseThrow().getId();
        mvc.perform(get("/api/pacientes/" + id).session(session)).andExpect(status().isOk())
            .andExpect(jsonPath("password").doesNotExist());
        mvc.perform(get("/api/pacientes/" + java.util.UUID.randomUUID()).session(session))
            .andExpect(status().isForbidden());
        mvc.perform(post("/api/auth/logout").session(session).with(csrf())).andExpect(status().isNoContent());
        assertTrue(session.isInvalid());
        mvc.perform(get("/api/auth/me")).andExpect(status().isUnauthorized());
    }
    @Test void registrationRequiresExplicitCurrentTerms() throws Exception {
        mvc.perform(get("/api/auth/terms")).andExpect(status().isOk())
            .andExpect(jsonPath("version").value("prototipo-2026-10-25"))
            .andExpect(jsonPath("paragraphs").isArray());
        for (String body : new String[] {
                account.replace("\"termsAccepted\":true,", ""),
                account.replace("\"termsAccepted\":true", "\"termsAccepted\":false"),
                account.replace("\"termsAccepted\":true", "\"termsAccepted\":null") }) {
            mvc.perform(post("/api/auth/register").with(csrf()).contentType("application/json").content(body))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("fields.termsAccepted").exists());
        }
        mvc.perform(post("/api/pacientes/register").with(csrf()).contentType("application/json")
            .content(account.replace("prototipo-2026-10-25", "old-version")))
            .andExpect(status().isBadRequest());
        assertEquals(0, patients.count());
    }
    @Test void realCsrfHeaderAndSessionRotation() throws Exception {
        var csrfResult = mvc.perform(get("/api/auth/csrf")).andReturn();
        var session = (MockHttpSession) csrfResult.getRequest().getSession(false);
        var token = (org.springframework.security.web.csrf.CsrfToken)
            csrfResult.getRequest().getAttribute(org.springframework.security.web.csrf.CsrfToken.class.getName());
        mvc.perform(post("/api/auth/register").session(session).header(token.getHeaderName(), token.getToken())
            .contentType("application/json").content(account)).andExpect(status().isCreated());
        String previousId = session.getId();
        mvc.perform(post("/api/auth/login").session(session).header(token.getHeaderName(), token.getToken())
            .contentType("application/json")
            .content("{\"email\":\"ana@example.com\",\"password\":\"Una frase segura 123\"}"))
            .andExpect(status().isOk());
        assertNotEquals(previousId, session.getId());
        mvc.perform(get("/api/auth/me").session(session)).andExpect(status().isOk());
        // A token from before authentication is no longer valid.
        mvc.perform(post("/api/auth/logout").session(session).header(token.getHeaderName(), token.getToken()))
            .andExpect(status().isForbidden());
        var fresh = mvc.perform(get("/api/auth/csrf").session(session)).andReturn();
        var freshToken = (org.springframework.security.web.csrf.CsrfToken)
            fresh.getRequest().getAttribute(org.springframework.security.web.csrf.CsrfToken.class.getName());
        mvc.perform(post("/api/auth/logout").session(session).header(freshToken.getHeaderName(), freshToken.getToken()))
            .andExpect(status().isNoContent());
    }
    @Test void wrongPasswordAndInactiveAccountCannotLogin() throws Exception {
        register();
        mvc.perform(post("/api/auth/login").with(csrf()).contentType("application/json")
            .content("{\"email\":\"ana@example.com\",\"password\":\"incorrecta\"}"))
            .andExpect(status().isUnauthorized());
        var patient = patients.findByEmail("ana@example.com").orElseThrow();
        patient.setActive(false); patients.save(patient);
        mvc.perform(post("/api/auth/login").with(csrf()).contentType("application/json")
            .content("{\"email\":\"ana@example.com\",\"password\":\"Una frase segura 123\"}"))
            .andExpect(status().isUnauthorized());
    }
}
