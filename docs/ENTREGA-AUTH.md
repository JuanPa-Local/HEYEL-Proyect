# Entrega parcial: registro e inicio de sesión

Este avance entrega un flujo básico integrado y deja trabajo explícito para el equipo. Se revisó `Validacion_Supuestos_HEYEL (2).pdf`, especialmente «Decisión y Ajuste al Roadmap» (páginas 5–6). La correspondencia con ese documento se detalla en [la revisión de supuestos](REVISION-SUPUESTOS.md). El PDF valida supuestos y ajustes de experiencia; no reemplaza el PRD ni especifica todo el contrato de registro/login. No se afirma haber completado todas las historias ni toda la arquitectura propuesta.

## Implementado

- Registro con nombre, correo y contraseña; validación Jakarta, correo normalizado y rechazo de duplicados (409). Aceptación explícita de condiciones vigentes, fecha y versión persistidas; no se supone consentimiento de cuentas anteriores.
- Contraseña de 12–64 caracteres, con límite adicional de 72 bytes UTF-8 para BCrypt; hash BCrypt con costo 12. No se recorta ni normaliza la contraseña.
- Login con mensaje genérico para correo inexistente, clave incorrecta y cuenta inactiva. Comparación de hash también para correo inexistente.
- Sesión persistida en el servidor, cookie HttpOnly y SameSite=Lax; ID de sesión rotado al autenticarse y token CSRF renovado. Caduca tras 30 minutos de inactividad.
- Endpoints autenticados, consulta de la cuenta propia y bloqueo de acceso al perfil de otro paciente. Se retiraron el listado público y `/hash-test`.
- DTOs de entrada/salida: ninguna respuesta de estos endpoints incluye contraseña o hash. La entidad además ignora el password en JSON y ya no genera un `toString` con los datos sensibles mediante `@Data`.
- Formularios React separados por navegación «Iniciar sesión» / «Registrarme», guía breve, confirmación de contraseña, mostrar/ocultar, errores y estado de envío, restauración de sesión al recargar, pantalla mínima de cuenta y logout. La casilla de condiciones empieza sin marcar y muestra su error en el mismo paso.
- Configuración PostgreSQL por variables, Compose local y pruebas de integración con H2.

### Decisión sobre JWT

La estructura compartida proponía JWT. Este avance usa sesiones de Spring Security para la aplicación web: no hay token en localStorage y cerrar sesión invalida la sesión del servidor. JWT no se implementó. Si el PDF lo exige, hay que adaptar el contrato de forma coordinada y resolver expiración, almacenamiento, refresh y revocación; no basta con devolver un token en el login.

## Contrato REST

| Método | Ruta | Resultado |
| --- | --- | --- |
| GET | `/api/auth/terms` | Condiciones del prototipo: `{version, title, paragraphs}` |
| GET | `/api/auth/csrf` | `{token, headerName}` y cookie de sesión |
| POST | `/api/auth/register` | 201 con `{id, fullName, email, role}`; no inicia sesión |
| POST | `/api/auth/login` | 200 con los mismos campos y sesión autenticada |
| GET | `/api/auth/me` | Cuenta propia; 401 si no hay sesión |
| POST | `/api/auth/logout` | 204, invalida sesión y borra cookie |
| GET | `/api/pacientes/{id}` o `/{id}/profile` | Solo perfil propio; 403 para ID ajeno |

Se conservan como alias POST `/api/pacientes/register` y `/api/pacientes/login` para facilitar integración con el trabajo previo. También exigen CSRF.

Registro: `{ "fullName": "Ana Pérez", "email": "ana@example.com", "password": "Una frase segura 123", "termsAccepted": true, "termsVersion": "prototipo-2026-10-07" }`. La versión se obtiene de `/api/auth/terms`; ausencia o rechazo de aceptación y versión desactualizada producen 400.
Login: `{ "email": "ana@example.com", "password": "Una frase segura 123" }`.

Para Postman u otro cliente: pedir primero `/api/auth/csrf`, conservar la cookie y enviar el token en el encabezado indicado en cada POST. Después de login, pedir un token nuevo antes de logout. El frontend hace esto automáticamente. Sin CSRF válido se devuelve 403 incluso en registro/login. Validación: 400; credenciales incorrectas: 401; duplicado: 409.

## Lombok y Jakarta: diagnóstico

El POM anterior pedía Java 21 y el entorno tenía Java 17. Esto impide compilar antes de poder comprobar getters y anotaciones. Se ajustó la versión objetivo a 17, manteniendo Spring Boot 4.1.1. No era necesario reemplazar los imports `jakarta.persistence`: el starter JPA ya aporta esa API. Se añadió `spring-boot-starter-validation` para `jakarta.validation`.

Lombok continúa activo con `@Builder`, `@Getter`, `@Setter` y constructores. Su procesador queda configurado una vez en `maven-compiler-plugin`, con versión tomada del BOM de Spring Boot. La compilación y las pruebas ejercitan los métodos generados; no se sustituyeron por getters escritos manualmente.

Si el compañero todavía ve errores en IntelliJ:

1. Abrir/importar **backend/pom.xml** como proyecto Maven y recargar las dependencias.
2. Seleccionar JDK 17 o superior para el proyecto y para Maven; comprobar `java -version` y `bash mvnw -version`.
3. Activar procesamiento de anotaciones en Settings → Build, Execution, Deployment → Compiler → Annotation Processors.
4. Revisar el soporte/plugin Lombok de su versión de IntelliJ.
5. Ejecutar `bash mvnw clean test` (Windows: `mvnw.cmd clean test`). Si esto pasa y el IDE sigue marcando errores, el problema restante está en la configuración del editor.

La anotación habitual es `@Data`, no `@Add`. En `Paciente` se usan getters/setters explícitamente anotados para evitar incluir contraseñas en `toString`.

Referencias: [configuración oficial de Lombok con Maven](https://projectlombok.org/setup/maven), [sesiones de Spring Security](https://docs.spring.io/spring-security/reference/servlet/authentication/session-management.html), [protección CSRF](https://docs.spring.io/spring-security/reference/servlet/exploits/csrf.html).

## Trabajo pendiente sugerido

| Responsable sugerido | Trabajo concreto | Criterio para darlo por terminado |
| --- | --- | --- |
| Compañero/a de frontend | Adaptar a Figma, errores de otros campos y accesibilidad | Pantallas revisadas en móvil/escritorio, teclado, mensajes asociados al campo |
| Compañero/a de autenticación | Límite de intentos de login y registro, con pruebas | Respuesta 429 al superar umbral; recuperación tras ventana y sin bloquear permanentemente a usuarios |
| Compañero/a de requisitos | Revisar condiciones definitivas y diseñar autorización US-07 separada | Texto aprobado por el equipo; no se confunde registro con permiso de consulta médica |
| Compañero/a de backend | Verificación de correo y recuperación de contraseña si las exige el PDF | Tokens de un solo uso, con expiración; pruebas y estados visibles en frontend |
| Compañero/a de arquitectura | Separar dominio puro de JPA/Spring con puertos y adaptadores | `Paciente` sin dependencias de Spring/JPA; entidad y repositorio en infraestructura; casos de uso en application |
| Compañero/a de QA | Validar los ajustes con usuarios y ejecutar pruebas de navegador/PostgreSQL | Criterios de las historias trazados; registro → login → recarga → logout, errores, duplicados y sesión vencida |
| Compañero/a de infraestructura | HTTPS, cookies Secure, secretos y migraciones | Mismo origen para frontend/API, `COOKIE_SECURE=true`, `DDL_AUTO=validate` y esquema con migraciones |

El dominio actual sigue mezclado con persistencia y servicio, conservando el trabajo del compañero; el adaptador existente no se reorganizó en esta entrega. La pantalla de cuenta es mínima: dashboard clínico, carga de documentos y edición de perfil quedan fuera de este avance.

Seguridad pendiente antes de exposición pública: límite de intentos, auditoría sin datos sensibles, invalidación coordinada de sesiones si se desactiva una cuenta y, si hay varias instancias, almacenamiento compartido de sesiones. Aún no hay funcionalidad pública de desactivación de cuentas.

## Evidencia de verificación

- Compilación Maven exitosa con JDK 17, Lombok y Jakarta.
- Seis pruebas de integración exitosas: hash/duplicados, validación/CSRF, sesión/perfiles/logout, credenciales/cuenta inactiva flujo con encabezado CSRF real + rotación de ID/token y aceptación obligatoria de condiciones vigentes.
- Cinco pruebas de componentes exitosas con `npm test` (DOM simulado, sin acceso a un navegador): navegación separada, casilla sin marcar, aviso local, envío de versión/aceptación y rechazo de la API.
- `npm run build` exitoso; `npm install` reportó cero vulnerabilidades al instalar.
- PostgreSQL real no se verificó en este entorno: Docker Compose no está instalado como subcomando; H2 se usó únicamente para pruebas.
- La revisión visual y el recorrido en navegador no se ejecutaron: el acceso al sitio local fue rechazado por la revisión de permisos. Quedan como tarea de QA; compilar no demuestra por sí solo el comportamiento del navegador.

## Condiciones del prototipo

El PDF requiere la aceptación, pero no proporciona el texto de términos ni una política final. `RegistrationTerms` contiene condiciones de un prototipo académico, visibles desde el formulario y la API. Deben revisarse antes de un uso público; no se presentan como una política definitiva de tratamiento de información médica. Las cuentas preexistentes conservan `termsAcceptedAt`/`termsVersion` nulos si no hay aceptación registrada.
