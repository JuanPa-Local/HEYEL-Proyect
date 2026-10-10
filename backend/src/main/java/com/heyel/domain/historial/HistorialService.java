package com.heyel.domain.historial;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
 
 //Consulta a cada institución y une sus registros en un solo historial (US-03 y US-05).
public class HistorialService {

    private static final Comparator<RegistroClinico> MAS_RECIENTE_PRIMERO =
            Comparator.comparing(RegistroClinico::fecha).reversed()
                    .thenComparing(registro -> registro.institucion().nombre())
                    .thenComparing(RegistroClinico::titulo);

    private final List<FuenteInstitucional> fuentes;
    private final boolean datosSimulados;

    public HistorialService(List<FuenteInstitucional> fuentes, boolean datosSimulados) {
        this.fuentes = List.copyOf(fuentes);
        this.datosSimulados = datosSimulados;
    }

    public HistorialConsolidado consolidar(UUID pacienteId) {
        List<RegistroClinico> registros = new ArrayList<>();
        List<InstitucionSalud> instituciones = new ArrayList<>();
        List<InstitucionSalud> noDisponibles = new ArrayList<>();

        for (FuenteInstitucional fuente : fuentes) {
            try {
                registros.addAll(fuente.consultarRegistros(pacienteId));
                instituciones.add(fuente.institucion());
            } catch (RuntimeException falla) {
                // Una institución caída no debe dejar al paciente sin el resto de su historial.
                noDisponibles.add(fuente.institucion());
            }
        }

        registros.sort(MAS_RECIENTE_PRIMERO);
        instituciones.sort(Comparator.comparing(InstitucionSalud::nombre));
        return new HistorialConsolidado(List.copyOf(registros), List.copyOf(instituciones),
                List.copyOf(noDisponibles), datosSimulados);
    }
}