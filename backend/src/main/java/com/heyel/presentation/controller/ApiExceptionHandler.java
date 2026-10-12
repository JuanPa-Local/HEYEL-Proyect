package com.heyel.presentation.controller;

import com.heyel.domain.paciente.exception.*;
import com.heyel.presentation.seguridad.DemasiadosIntentosException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import java.util.Map;
import java.util.TreeMap;

@RestControllerAdvice
public class ApiExceptionHandler {
    @ExceptionHandler({EmailDuplicadoException.class, DataIntegrityViolationException.class})
    public ResponseEntity<?> duplicate(RuntimeException ex) {
        return ResponseEntity.status(409).body(Map.of("error", "No fue posible registrar la cuenta con esos datos."));
    }
    @ExceptionHandler(CredencialesInvalidasException.class)
    public ResponseEntity<?> credentials(RuntimeException ex) {
        return ResponseEntity.status(401).body(Map.of("error", "Correo o contraseña incorrectos."));
    }
    @ExceptionHandler(DemasiadosIntentosException.class)
    public ResponseEntity<?> tooManyAttempts(DemasiadosIntentosException ex) {
        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                .header(HttpHeaders.RETRY_AFTER, String.valueOf(ex.segundosDeEspera()))
                .body(Map.of("error", ex.getMessage()));
    }
    @ExceptionHandler(TerminosInvalidosException.class)
    public ResponseEntity<?> terms(TerminosInvalidosException ex) {
        return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage(),
                "fields", Map.of("termsAccepted", ex.getMessage())));
    }
    @ExceptionHandler(PacienteNoEncontradoException.class)
    public ResponseEntity<?> missing(RuntimeException ex) {
        return ResponseEntity.status(404).body(Map.of("error", "Paciente no encontrado."));
    }
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<?> validation(MethodArgumentNotValidException ex) {
        var fields = new TreeMap<String, String>();
        ex.getBindingResult().getFieldErrors().forEach(error -> fields.put(error.getField(), error.getDefaultMessage()));
        return ResponseEntity.badRequest().body(Map.of("error", "Revisa los datos del formulario.", "fields", fields));
    }
    @ExceptionHandler({HttpMessageNotReadableException.class, MethodArgumentTypeMismatchException.class})
    public ResponseEntity<?> malformed(Exception ex) {
        return ResponseEntity.badRequest().body(Map.of("error", "La solicitud contiene datos inválidos."));
    }
}
