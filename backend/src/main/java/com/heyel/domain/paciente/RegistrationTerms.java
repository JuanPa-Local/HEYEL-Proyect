package com.heyel.domain.paciente;

import java.util.List;

/** Conditions for the academic prototype; replace/version before a public launch. */
public final class RegistrationTerms {
    public static final String VERSION = "prototipo-2026-10-07";
    public static final String TITLE = "Condiciones de uso del prototipo HEYEL";
    public static final List<String> PARAGRAPHS = List.of(
        "HEYEL es un prototipo académico. Esta versión permite crear una cuenta de paciente, iniciar sesión y consultar los datos básicos de esa cuenta.",
        "Para crear la cuenta se guardan tu nombre, correo electrónico, una contraseña protegida mediante hash y la fecha y versión de las condiciones que aceptaste.",
        "Usa datos de prueba. No ingreses documentos de identidad, exámenes ni información médica real en este prototipo.",
        "Crear una cuenta no autoriza a HEYEL a consultar registros en instituciones de salud ni a compartirlos con terceros. Esas funciones requerirán una autorización separada."
    );
    private RegistrationTerms() {}
}
