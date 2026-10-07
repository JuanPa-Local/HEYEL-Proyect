# Revisión contra Validación de supuestos HEYEL

Documento revisado: `Validacion_Supuestos_HEYEL (2).pdf`, ubicado en `/home/mai/Downloads/`, seis páginas, fecha interna 30 de septiembre de 2026. La sección «Decisión y Ajuste al Roadmap» está en las páginas 5–6. El código se revisó y ajustó el 7 de octubre de 2026.

## Qué exige para este avance

| Decisión/evidencia del PDF | Estado anterior | Ajuste y estado actual |
| --- | --- | --- |
| Separar «Iniciar sesión» de «Registrarme» (p. 5) | Dos pantallas con enlaces al pie; la elección principal podía ser poco evidente | Navegación visible con ambas opciones y estado de página activa; cada opción tiene su formulario y acción propia |
| Avisar en el mismo paso si faltan los términos (p. 5) | No había casilla ni validación de aceptación | Casilla sin marcar, condiciones expandibles, aviso junto a la casilla y foco sobre ella; no se envía el registro sin aceptar |
| Registrar la aceptación de forma efectiva | No existía evidencia persistida | API exige `termsAccepted: true` y versión vigente, incluso para el alias original; guarda fecha y versión. Las cuentas previas no reciben una aceptación inventada |
| Guía corta de primer uso, «entra nueva, a validar» (pp. 5–6) | No había guía | Guía breve desplegable para elegir registro, aceptar condiciones e iniciar sesión. Implementada; validación con usuarios pendiente |
| Pacientes olvidan términos/tratamiento de datos (p. 3) | No había explicación del alcance | Condiciones visibles explican los datos de cuenta y aclaran que el registro no autoriza consultar información en instituciones |

La fecha/versionado de aceptación son medidas de implementación para respaldar la casilla; el PDF no prescribe esos campos técnicos.

## Límites y pendientes conservados

- **US-07 / autorización de consulta:** el PDF trata registro y autorización dentro del alcance, pero autorizar consultas de registros médicos requiere un flujo separado. Aceptar condiciones de una cuenta no implementa ni concede ese permiso. Queda para el equipo.
- **Contenido definitivo de términos y tratamiento de datos:** el PDF no incluye esos textos. Se añadió un texto visible de condiciones del prototipo académico, que permite probar el mecanismo. El equipo debe revisar y aprobar el contenido definitivo antes de un uso público.
- **Historial, filtros y compartir (US-03 a US-06):** no forman parte de este avance de registro/login. El texto explicativo del filtro se deberá incorporar cuando se implemente esa pantalla.
- **Página de humo / H1:** es un experimento de interés con correo y autorización, diferente de crear una cuenta con contraseña. No se construyó esa página ni se interpreta un registro de cuenta como resultado de H1.
- **Hipótesis H2/H3 y guía:** las pruebas de software no validan que adultos mayores entiendan el flujo ni que médicos usen el enlace. Hay que repetir las pruebas con usuarios y registrar evidencia.
- **JWT:** el documento de validación no exige JWT; la propuesta arquitectónica del compañero sí lo menciona. Se conserva la sesión de Spring con HttpOnly/CSRF y se deja explícito en la entrega.

## Comprobaciones efectuadas

Seis pruebas del backend verifican el flujo de autenticación y, adicionalmente, que aceptación ausente, nula, falsa o con versión antigua impidan crear una cuenta. Se comprueba que se guarda la fecha/versionado del registro aceptado.

Cinco pruebas del frontend en DOM simulado verifican la navegación separada, que la casilla no venga marcada, el aviso dentro del formulario, el envío de aceptación/versionado, el error devuelto por la API y que login no solicite una nueva aceptación. Estas pruebas también ejercitan el renderizado de los componentes con JSX automático.

La compilación de producción del frontend pasó. La comprobación manual en navegador y la ejecución contra PostgreSQL real siguen pendientes; no se declara cumplida la validación con usuarios del documento.
