// Las mismas cinco tareas del R1 y el R2, para que los tres releases se puedan comparar.
// `logro` es lo que hace la app cuando la tarea se cumple: si pasa mientras corre el tiempo,
// la tarea se cierra sola. T3 se responde en voz alta, así que se cierra con «Terminé».
export const TAREAS = [
  { numero: 1, texto: 'Crea una cuenta y entra a tu historial.', criterio: 'Llega a su historial sin pedir ayuda', logro: 'login' },
  { numero: 2, texto: 'Cierra sesión y vuelve a entrar con la cuenta que creaste.', criterio: 'Entra a su historial sin ayuda', logro: 'volver-a-entrar' },
  { numero: 3, texto: 'Di en voz alta cuál es tu último examen de laboratorio y dónde te lo hicieron.', criterio: 'Responde bien en menos de un minuto', logro: null },
  { numero: 4, texto: 'Deja en pantalla solo los registros del Centro de Imágenes del Norte.', criterio: 'La pantalla muestra solo esa institución', logro: 'filtro-institucion', valor: 'imagenes-del-norte' },
  { numero: 5, texto: 'Cierra sesión.', criterio: 'Vuelve a la pantalla de inicio', logro: 'logout' },
];

// Cuestionario SUS (System Usability Scale). Las impares son positivas y las pares negativas.
export const PREGUNTAS_SUS = [
  'Creo que me gustaría usar esta aplicación con frecuencia.',
  'Encontré la aplicación innecesariamente complicada.',
  'Pensé que la aplicación era fácil de usar.',
  'Creo que necesitaría ayuda de una persona con conocimientos técnicos para usar esta aplicación.',
  'Las funciones de la aplicación estaban bien integradas.',
  'Pensé que la aplicación tenía demasiadas cosas inconsistentes.',
  'Imagino que la mayoría de las personas aprendería a usar esta aplicación muy rápido.',
  'Encontré la aplicación muy difícil de usar.',
  'Me sentí seguro o segura usando la aplicación.',
  'Necesité aprender muchas cosas antes de poder usar la aplicación.',
];

// Regla de la Junta: a las impares se les resta 1, a las pares se les resta de 5,
// se suman y se multiplican por 2,5. Va de 0 a 100.
export function calcularSus(respuestas) {
  return respuestas.reduce((suma, r, i) => suma + (i % 2 === 0 ? r - 1 : 5 - r), 0) * 2.5;
}
