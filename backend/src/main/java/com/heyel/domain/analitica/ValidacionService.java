package com.heyel.domain.analitica;

import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static com.heyel.domain.analitica.TipoEventoValidacion.*;

// Registra la prueba guiada y arma el resumen para /#panel.
// Una sesión está abandonada si el usuario tocó «Salir» o si lleva 15 minutos sin actividad sin terminar.
@Service
public class ValidacionService {

    public static final List<String> TAREAS = List.of(
            "T1. Crear una cuenta", "T2. Salir y volver a entrar", "T3. Decir cuál fue el último examen",
            "T4. Ver solo una institución", "T5. Cerrar sesión");
    private static final Duration INACTIVIDAD = Duration.ofMinutes(15);

    private final EventoValidacionRepository eventos;

    public ValidacionService(EventoValidacionRepository eventos) {
        this.eventos = eventos;
    }

    public record ResumenTarea(String tarea, long intentaron, long exitoSinAyuda, long exitoConAyuda, long saltadas,
            long abandonaron, long respuestasErradas, Double tiempoPromedioSinAyuda) {
    }

    public record SesionResumen(String codigo, String estado, OffsetDateTime inicio, String salud, String edad,
            List<String> tareas) {
    }

    public record Panel(long sesionesIniciadas, long saltaronDemo, long completaron, long abandonaron, long enCurso,
            Double recorridoPromedioSegundos, List<ResumenTarea> tareas, List<SesionResumen> sesiones) {
    }

    @Transactional
    public void registrar(String sesionId, TipoEventoValidacion tipo, Integer tarea, Integer segundos, Boolean ayuda,
            Boolean salud, String edad) {
        eventos.save(new EventoValidacion(sesionId, tipo, tarea, segundos, Boolean.TRUE.equals(ayuda), salud, edad,
                LocalDateTime.now()));
    }

    private static boolean tiene(List<EventoValidacion> evs, TipoEventoValidacion tipo) {
        return evs.stream().anyMatch(e -> e.getTipo() == tipo);
    }

    private static Double promedio(long suma, long cantidad) {
        return cantidad == 0 ? null : Math.round(suma * 10.0 / cantidad) / 10.0;
    }

    @Transactional(readOnly = true)
    public Panel panel() {
        int n = TAREAS.size();
        Map<String, List<EventoValidacion>> porSesion = new LinkedHashMap<>();
        for (EventoValidacion e : eventos.findAll(Sort.by("id"))) {
            porSesion.computeIfAbsent(e.getSesionId(), k -> new ArrayList<>()).add(e);
        }
        LocalDateTime ahora = LocalDateTime.now();
        long iniciadas = 0, saltaron = 0, completaron = 0, abandonaron = 0, enCurso = 0;
        long sumaRecorridos = 0, recorridos = 0;
        long[] okSin = new long[n], okCon = new long[n], saltadas = new long[n];
        long[] salieron = new long[n], erradas = new long[n], segundosSin = new long[n];
        List<SesionResumen> sesiones = new ArrayList<>();

        for (Map.Entry<String, List<EventoValidacion>> entrada : porSesion.entrySet()) {
            List<EventoValidacion> evs = entrada.getValue();
            if (tiene(evs, SALTO_DEMO)) saltaron++;
            if (!tiene(evs, INICIO)) continue;
            iniciadas++;
            EventoValidacion ultimo = evs.get(evs.size() - 1);
            String estado;
            if (tiene(evs, FIN)) {
                estado = "COMPLETADA";
                completaron++;
            } else if (tiene(evs, ABANDONO) || Duration.between(ultimo.getFecha(), ahora).compareTo(INACTIVIDAD) > 0) {
                estado = "ABANDONADA";
                abandonaron++;
            } else {
                estado = "EN_CURSO";
                enCurso++;
            }

            String[] resultado = new String[n];
            long segundosTotal = 0;
            int exitos = 0;
            for (EventoValidacion e : evs) {
                if (e.getTarea() == null || e.getTarea() < 1 || e.getTarea() > n) continue;
                int t = e.getTarea() - 1;
                TipoEventoValidacion tipo = e.getTipo();
                if (tipo == TAREA_FALLO) {
                    erradas[t]++;
                } else if (resultado[t] != null) {
                    continue;
                } else if (tipo == TAREA_SALTADA) {
                    saltadas[t]++;
                    resultado[t] = "Saltada";
                } else if (tipo == TAREA_OK) {
                    int s = e.getSegundos() == null ? 0 : e.getSegundos();
                    if (e.isAyuda()) {
                        okCon[t]++;
                        resultado[t] = "OK con ayuda · " + s + " s";
                    } else {
                        okSin[t]++;
                        segundosSin[t] += s;
                        resultado[t] = "OK · " + s + " s";
                    }
                    segundosTotal += s;
                    exitos++;
                }
            }
            if ("ABANDONADA".equals(estado)) {
                int actual = ultimo.getTarea() == null ? 1 : ultimo.getTarea();
                if (ultimo.getTipo() == TAREA_OK || ultimo.getTipo() == TAREA_SALTADA) actual++;
                if (actual >= 1 && actual <= n && resultado[actual - 1] == null) {
                    salieron[actual - 1]++;
                    resultado[actual - 1] = "Se salió";
                }
            }
            if (exitos == n) {
                recorridos++;
                sumaRecorridos += segundosTotal;
            }
            List<String> celdas = new ArrayList<>();
            for (String r : resultado) celdas.add(r == null ? "—" : r);
            String id = entrada.getKey();
            EventoValidacion inicio = evs.stream().filter(e -> e.getTipo() == INICIO).findFirst().orElse(evs.get(0));
            String salud = inicio.getSalud() == null ? "—" : (inicio.getSalud() ? "Sí" : "No");
            sesiones.add(new SesionResumen(id.substring(0, Math.min(6, id.length())), estado,
                    inicio.getFecha().atZone(ZoneId.systemDefault()).toOffsetDateTime(), salud, inicio.getEdad(), celdas));
        }

        List<ResumenTarea> tareas = new ArrayList<>();
        for (int t = 0; t < n; t++) {
            tareas.add(new ResumenTarea(TAREAS.get(t), okSin[t] + okCon[t] + saltadas[t] + salieron[t],
                    okSin[t], okCon[t], saltadas[t], salieron[t], erradas[t], promedio(segundosSin[t], okSin[t])));
        }
        Collections.reverse(sesiones);
        return new Panel(iniciadas, saltaron, completaron, abandonaron, enCurso,
                promedio(sumaRecorridos, recorridos), tareas, sesiones.subList(0, Math.min(30, sesiones.size())));
    }
}
