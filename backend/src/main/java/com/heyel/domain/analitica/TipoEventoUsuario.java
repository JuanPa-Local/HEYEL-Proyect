package com.heyel.domain.analitica;

// Lo que hace un paciente dentro de la app. Con esto se arma el embudo:
// visitas a la landing -> registros -> activados -> regresaron.
public enum TipoEventoUsuario {
    REGISTRO,
    ACTIVACION,
    REGRESO
}