import { TAREAS } from './tareas';

// Las sesiones terminadas en este celular. Quedan aunque se cierre la pestaña, para poder
// descargarlas después aunque el servidor no haya respondido.
const CLAVE_HISTORIAL = 'heyel-validacion-sesiones';

export function leerHistorial() {
  try { return JSON.parse(localStorage.getItem(CLAVE_HISTORIAL)) ?? []; }
  catch { return []; }
}

function escribirHistorial(sesiones) {
  try { localStorage.setItem(CLAVE_HISTORIAL, JSON.stringify(sesiones)); }
  catch { /* Sin localStorage solo queda la descarga de la sesión actual. */ }
}

export function agregarAlHistorial(sesion) {
  escribirHistorial([...leerHistorial(), sesion]);
}

export function actualizarEnHistorial(idLocal, cambios) {
  escribirHistorial(leerHistorial().map(s => (s.idLocal === idLocal ? { ...s, ...cambios } : s)));
}

// Excel en español usa coma decimal y punto y coma como separador.
const decimal = n => (n === null || n === undefined ? '' : String(n).replace('.', ','));
const celda = valor => {
  const texto = valor === null || valor === undefined ? '' : String(valor);
  return /[";\n\r]/.test(texto) ? `"${texto.replaceAll('"', '""')}"` : texto;
};
const dosDigitos = n => String(n).padStart(2, '0');

export function formatearFechaHora(iso) {
  const f = new Date(iso);
  return `${f.getFullYear()}-${dosDigitos(f.getMonth() + 1)}-${dosDigitos(f.getDate())} ${dosDigitos(f.getHours())}:${dosDigitos(f.getMinutes())}`;
}

export function armarCsv(sesiones) {
  const encabezado = ['Código', 'Fecha', 'Perfil', 'Probó una versión anterior', 'Facilitador', 'Observador',
    ...TAREAS.flatMap(t => [`T${t.numero} tiempo (s)`, `T${t.numero} con ayuda`, `T${t.numero} completada`]),
    'SUS', 'Estrellas', 'Lo más difícil', 'Qué cambiaría', '¿Nos recomendaría?',
    ...Array.from({ length: 10 }, (_, i) => `SUS P${i + 1}`)];
  const filas = sesiones.map(s => [
    s.codigo, formatearFechaHora(s.fecha), s.perfil, s.probo, s.facilitador, s.observador,
    ...TAREAS.flatMap(t => {
      const r = s.tareas.find(x => x.numero === t.numero);
      return r ? [decimal(r.segundos), r.conAyuda ? 'Sí' : 'No', r.completada ? 'Sí' : 'No'] : ['', '', ''];
    }),
    decimal(s.sus), s.estrellas, s.masDificil, s.cambiaria, s.recomendaria,
    ...s.susRespuestas,
  ]);
  // El BOM hace que Excel lea bien las tildes.
  return '﻿' + [encabezado, ...filas].map(fila => fila.map(celda).join(';')).join('\r\n');
}

export function descargarCsv(nombre, contenido) {
  const url = URL.createObjectURL(new Blob([contenido], { type: 'text/csv;charset=utf-8' }));
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombre;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  URL.revokeObjectURL(url);
}
