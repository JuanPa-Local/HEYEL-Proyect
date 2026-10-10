package com.heyel.domain.historial;

import java.util.List;
import java.util.UUID;

 //Puerto hacia el sistema de una institución de salud.
public interface FuenteInstitucional {

    InstitucionSalud institucion();

    List<RegistroClinico> consultarRegistros(UUID pacienteId);
}