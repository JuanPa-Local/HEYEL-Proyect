package com.heyel.presentation.seguridad;

// Se superó el límite de intentos; la respuesta es 429 con la espera en Retry-After.
public class DemasiadosIntentosException extends RuntimeException {

    private final long segundosDeEspera;

    public DemasiadosIntentosException(long segundosDeEspera) {
        super("Hiciste demasiados intentos. Espera " + segundosDeEspera + " segundos e intenta de nuevo.");
        this.segundosDeEspera = segundosDeEspera;
    }

    public long segundosDeEspera() {
        return segundosDeEspera;
    }
}
