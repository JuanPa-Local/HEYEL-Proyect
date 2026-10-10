package com.heyel.infrastructure.instituciones.simuladas;

import com.heyel.domain.historial.Categoria;
import com.heyel.domain.historial.FuenteInstitucional;
import com.heyel.domain.historial.InstitucionSalud;
import com.heyel.domain.historial.RegistroClinico;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Random;
import java.util.UUID;

/**
 * Institución ficticia que responde con registros de demostración.
 * Los registros dependen solo del paciente y la institución, así que el mismo paciente
 * ve siempre el mismo historial y dos pacientes ven historiales distintos.
 */
public class InstitucionSimulada implements FuenteInstitucional {

    // Fecha fija de referencia para que el historial no cambie de un día a otro. 
    static final LocalDate FECHA_REFERENCIA = LocalDate.of(2026, 9, 30);
    private static final int DIAS_HACIA_ATRAS = 3 * 365;

    public record Plantilla(String titulo, String detalle, Categoria categoria) {
    }

    private final InstitucionSalud institucion;
    private final List<Plantilla> plantillas;
    private final int minimo;
    private final int maximo;

    public InstitucionSimulada(InstitucionSalud institucion, List<Plantilla> plantillas, int minimo, int maximo) {
        if (minimo < 0 || maximo < minimo || maximo > plantillas.size()) {
            throw new IllegalArgumentException("Rango de registros inválido para " + institucion.nombre());
        }
        this.institucion = institucion;
        this.plantillas = List.copyOf(plantillas);
        this.minimo = minimo;
        this.maximo = maximo;
    }

    @Override
    public InstitucionSalud institucion() {
        return institucion;
    }

    @Override
    public List<RegistroClinico> consultarRegistros(UUID pacienteId) {
        Random aleatorio = new Random(pacienteId.getMostSignificantBits()
                ^ pacienteId.getLeastSignificantBits()
                ^ institucion.id().hashCode());

        List<Plantilla> elegidas = new ArrayList<>(plantillas);
        Collections.shuffle(elegidas, aleatorio);
        int cantidad = minimo + aleatorio.nextInt(maximo - minimo + 1);

        List<RegistroClinico> registros = new ArrayList<>();
        for (int i = 0; i < cantidad; i++) {
            Plantilla plantilla = elegidas.get(i);
            LocalDate fecha = FECHA_REFERENCIA.minusDays(aleatorio.nextInt(DIAS_HACIA_ATRAS));
            registros.add(new RegistroClinico(institucion.id() + "-" + (i + 1), fecha,
                    plantilla.titulo(), plantilla.detalle(), plantilla.categoria(), institucion));
        }
        return registros;
    }
}