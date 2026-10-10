package com.heyel.infrastructure.instituciones.simuladas;

import com.heyel.domain.historial.FuenteInstitucional;
import com.heyel.domain.historial.InstitucionSalud;
import com.heyel.infrastructure.instituciones.simuladas.InstitucionSimulada.Plantilla;

import java.util.List;

import static com.heyel.domain.historial.Categoria.CONSULTA;
import static com.heyel.domain.historial.Categoria.IMAGENOLOGIA;
import static com.heyel.domain.historial.Categoria.LABORATORIO;

/**
 * Instituciones ficticias del MVP. Los nombres son inventados: no corresponden a
 * instituciones reales ni a datos de pacientes reales.
 */
public final class CatalogoInstitucionesSimuladas {

    private CatalogoInstitucionesSimuladas() {
    }

    public static List<FuenteInstitucional> crear() {
        return List.of(
                new InstitucionSimulada(
                        new InstitucionSalud("ips-salud-vital", "IPS Salud Vital", "IPS"),
                        List.of(
                                new Plantilla("Consulta de medicina general", "Control anual. Tensión arterial dentro de lo esperado.", CONSULTA),
                                new Plantilla("Control de presión arterial", "Seguimiento de tensión arterial y ajuste de hábitos.", CONSULTA),
                                new Plantilla("Consulta de nutrición", "Plan de alimentación y control de peso.", CONSULTA),
                                new Plantilla("Glicemia en ayunas", "Resultado dentro del rango de referencia.", LABORATORIO)),
                        2, 3),
                new InstitucionSimulada(
                        new InstitucionSalud("laboratorio-andino", "Laboratorio Clínico Andino", "Laboratorio"),
                        List.of(
                                new Plantilla("Hemograma completo", "Valores dentro de los rangos de referencia.", LABORATORIO),
                                new Plantilla("Perfil lipídico", "Colesterol total y triglicéridos.", LABORATORIO),
                                new Plantilla("Uroanálisis", "Sin hallazgos relevantes.", LABORATORIO),
                                new Plantilla("Hormona estimulante de tiroides (TSH)", "Resultado dentro del rango de referencia.", LABORATORIO),
                                new Plantilla("Creatinina en sangre", "Función renal dentro de lo esperado.", LABORATORIO)),
                        2, 4),
                new InstitucionSimulada(
                        new InstitucionSalud("imagenes-del-norte", "Centro de Imágenes del Norte", "Imagenología"),
                        List.of(
                                new Plantilla("Radiografía de tórax", "Sin hallazgos agudos.", IMAGENOLOGIA),
                                new Plantilla("Ecografía abdominal", "Órganos abdominales de aspecto normal.", IMAGENOLOGIA),
                                new Plantilla("Resonancia magnética de rodilla", "Cambios leves en el menisco medial.", IMAGENOLOGIA)),
                        1, 2),
                new InstitucionSimulada(
                        new InstitucionSalud("clinica-altos-del-bosque", "Clínica Altos del Bosque", "Clínica"),
                        List.of(
                                new Plantilla("Consulta de urgencias", "Atención por dolor abdominal. Egreso el mismo día.", CONSULTA),
                                new Plantilla("Consulta de ortopedia", "Valoración de dolor de rodilla.", CONSULTA),
                                new Plantilla("Hemoglobina glicosilada", "Control metabólico de los últimos tres meses.", LABORATORIO),
                                new Plantilla("Tomografía de senos paranasales", "Engrosamiento leve de la mucosa.", IMAGENOLOGIA)),
                        1, 3));
    }
}