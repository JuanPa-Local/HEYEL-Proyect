package com.heyel.presentation.seguridad;

import io.github.bucket4j.Bucket;
import io.github.bucket4j.ConsumptionProbe;
import io.github.bucket4j.EstimationProbe;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

/**
 * Límite de intentos con cubos de Bucket4j, uno por clave.
 * Login: solo cuentan los intentos fallidos, por IP y correo. Así se frena a quien prueba
 * contraseñas, pero varios pacientes en la misma red (una universidad, un hogar) no se
 * bloquean entre sí, y nadie puede bloquear la cuenta de otro desde su propia IP.
 * Registro: cuenta cada intento por IP.
 */
@Component
public class LimiteDeIntentos {

    private static final Logger log = LoggerFactory.getLogger(LimiteDeIntentos.class);

    private final Map<String, Bucket> fallosDeLogin = new ConcurrentHashMap<>();
    private final Map<String, Bucket> registros = new ConcurrentHashMap<>();
    private final Map<String, Bucket> eventos = new ConcurrentHashMap<>();
    private final int fallosDeLoginPorMinuto;
    private final int registrosPorHora;
    private final int eventosPorHora;

    public LimiteDeIntentos(@Value("${heyel.limite.login-fallidos-por-minuto}") int fallosDeLoginPorMinuto,
                            @Value("${heyel.limite.registros-por-hora}") int registrosPorHora,
                            @Value("${heyel.limite.eventos-por-hora:60}") int eventosPorHora) {
        this.fallosDeLoginPorMinuto = fallosDeLoginPorMinuto;
        this.registrosPorHora = registrosPorHora;
        this.eventosPorHora = eventosPorHora;
    }

    public void verificarLogin(String ip, String email) {
        Bucket cubo = fallosDeLogin.get(claveLogin(ip, email));
        if (cubo == null) {
            return;
        }
        EstimationProbe sonda = cubo.estimateAbilityToConsume(1);
        if (!sonda.canBeConsumed()) {
            log.warn("Límite de inicios de sesión fallidos alcanzado desde la IP {}", ip);
            throw new DemasiadosIntentosException(segundos(sonda.getNanosToWaitForRefill()));
        }
    }

    public void registrarFalloDeLogin(String ip, String email) {
        fallosDeLogin.computeIfAbsent(claveLogin(ip, email),
                clave -> nuevoCubo(fallosDeLoginPorMinuto, Duration.ofMinutes(1))).tryConsume(1);
    }

    public void reiniciarLogin(String ip, String email) {
        fallosDeLogin.remove(claveLogin(ip, email));
    }

    public void consumirRegistro(String ip) {
        Bucket cubo = registros.computeIfAbsent(ip, clave -> nuevoCubo(registrosPorHora, Duration.ofHours(1)));
        ConsumptionProbe sonda = cubo.tryConsumeAndReturnRemaining(1);
        if (!sonda.isConsumed()) {
            log.warn("Límite de registros alcanzado desde la IP {}", ip);
            throw new DemasiadosIntentosException(segundos(sonda.getNanosToWaitForRefill()));
        }
    }

    // Analítica de la landing: evita que una sola IP infle las visitas.
    public void consumirEvento(String ip) {
        Bucket cubo = eventos.computeIfAbsent(ip, clave -> nuevoCubo(eventosPorHora, Duration.ofHours(1)));
        ConsumptionProbe sonda = cubo.tryConsumeAndReturnRemaining(1);
        if (!sonda.isConsumed()) {
            throw new DemasiadosIntentosException(segundos(sonda.getNanosToWaitForRefill()));
        }
    }

    private Bucket nuevoCubo(int capacidad, Duration periodo) {
        return Bucket.builder()
                .addLimit(limit -> limit.capacity(capacidad).refillGreedy(capacidad, periodo))
                .build();
    }

    private String claveLogin(String ip, String email) {
        return ip + "|" + email.strip().toLowerCase(Locale.ROOT);
    }

    private long segundos(long nanos) {
        return Math.max(1, TimeUnit.NANOSECONDS.toSeconds(nanos));
    }
}
