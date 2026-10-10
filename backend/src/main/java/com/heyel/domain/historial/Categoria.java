package com.heyel.domain.historial;

//Tipo de registro clínico que muestra el historial
public enum Categoria {
    LABORATORIO("Laboratorio"),
    IMAGENOLOGIA("Imagenología"),
    CONSULTA("Consulta");

    private final String etiqueta;

    Categoria(String etiqueta) {
        this.etiqueta = etiqueta;
    }

    public String etiqueta() {
        return etiqueta;
    }
}