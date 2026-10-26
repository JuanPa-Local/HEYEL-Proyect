# HEYEL

HEYEL reúne en un solo lugar el historial clínico que un paciente tiene repartido en distintas instituciones de salud. El paciente crea su cuenta, entra y ve sus exámenes, imágenes y consultas ordenados del más reciente al más antiguo, con filtros por categoría e institución. Es el proyecto del curso Proyecto de Innovación en TI (Pontificia Universidad Javeriana).

- **App desplegada y landing:** https://heyel.onrender.com (sin sesión, la raíz muestra la landing; «Crear mi cuenta» lleva al registro)
- **Versión:** Release 2 (`v0.2`)

> La app está en el plan gratuito de Render. Si nadie la ha usado en un rato, la primera carga puede tardar uno o dos minutos mientras el servidor arranca. Abran la URL unos minutos antes de una demo o de una prueba con usuarios.

## Qué cambió en la versión v0.2

Los cambios salen de la validación del Release 1 con 6 usuarios (hallazgos H1 a H3) y de una solicitud del equipo.

| Update | Origen | Cómo se comprueba en la URL |
| --- | --- | --- |
| El registro cuenta los caracteres que le faltan a la contraseña y marca la casilla de condiciones como «Obligatorio» | Hallazgo H1 | Al escribir la contraseña se ve cuántos caracteres faltan para 12 |
| El botón «Cerrar sesión» resalta sobre el encabezado | Hallazgo H2 | El botón tiene fondo claro sobre el encabezado verde, en celular y computador |
| Tarjeta «Tu último examen» arriba del historial | Hallazgo H3 | Al entrar se ve el examen de laboratorio más reciente y su institución, sin filtros |
| Buscador por nombre en el historial | Hallazgo H3 | Al escribir «hemograma» solo quedan esos registros; se combina con los filtros |
| Gráfica de pie con los registros por institución | Solicitud del equipo | Muestra cuántos registros aporta cada institución; al tocar una, filtra el historial |

Además, la raíz de la URL muestra la **landing** (problema, propuesta de valor, cómo funciona en 3 pasos, captura real y botón para crear la cuenta). Sus visitas y los clics en «Crear mi cuenta» se cuentan con una analítica propia que no usa cookies ni guarda datos de la persona: el total se consulta en `GET /api/analitica/resumen`.

## Qué incluye la versión v0.1

| Funcionalidad | Cómo se comprueba en la URL |
| --- | --- |
| Registro de paciente con aceptación de condiciones (US-01, US-07) | Sin marcar la casilla, el formulario avisa en el mismo paso y no crea la cuenta |
| Ingreso directo después del registro | Al registrarse, el paciente llega a su historial sin volver a escribir sus datos |
| Inicio y cierre de sesión (US-02) | Con datos incorrectos aparece un error; al recargar la página la sesión se mantiene; «Cerrar sesión» vuelve al inicio |
| Límite de intentos | Después de 5 intentos fallidos de inicio de sesión en un minuto, la app pide esperar antes de volver a intentar |
| Historial consolidado de cuatro instituciones (US-03, US-05) | Después de entrar se ven los registros de todas las instituciones, del más reciente al más antiguo |
| Filtro por categoría (US-05) | Al elegir «Laboratorio», «Imagenología» o «Consulta» solo quedan esos registros y el contador cambia |
| Filtro por institución (US-04) | Al elegir una institución solo quedan sus registros; si ninguno coincide con los filtros, «Quitar filtros» restablece la lista |
| Vista para celular | En pantallas pequeñas la tabla del historial se muestra como tarjetas |

### Lo que es simulado

- Las cuatro instituciones (IPS Salud Vital, Laboratorio Clínico Andino, Centro de Imágenes del Norte y Clínica Altos del Bosque) son **ficticias**. La app todavía no se conecta con EPS, IPS ni laboratorios reales.
- Los registros clínicos los genera el backend con datos de demostración a partir del ID del paciente. Cada cuenta ve siempre el mismo historial, pero no es información médica real. La pantalla lo indica con el aviso «Datos de demostración» y la API responde `datosSimulados: true`.
- Las instituciones simuladas están detrás de una interfaz (`FuenteInstitucional`), así que se pueden reemplazar por conexiones reales sin cambiar la API ni la pantalla.

No uses datos médicos ni documentos reales al probarla.

## Correrlo en local (menos de 15 minutos)

### Opción A: todo con Docker (un solo comando)

Requisito: [Docker Desktop](https://www.docker.com/products/docker-desktop/) abierto.

```bash
git clone https://github.com/JuanPa-Local/HEYEL-Proyect.git
cd HEYEL-Proyect
docker compose up --build
```

Cuando la consola muestre `Started BackendApplication`, abrir http://localhost:8080. La primera vez tarda unos minutos porque descarga dependencias; las siguientes arranca en segundos. Para detenerlo: `Ctrl + C` y luego `docker compose down`.

### Opción B: modo desarrollo (para modificar el código)

Requisitos: Git, Java 17 o superior (con Java 21 también funciona), Node.js 20.19+ o 22.12+ y Docker Desktop (solo para PostgreSQL). No hace falta instalar Maven, el proyecto trae el wrapper (`mvnw`).

**1. Levantar la base de datos** desde la raíz del repo:

```bash
docker compose up -d postgres
```

Esto crea la base `heyel_db` en el puerto `5433` con usuario y contraseña `postgres`. El backend ya viene configurado con esos valores.

**2. Correr el backend** en otra terminal:

Windows (PowerShell):
```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

macOS / Linux:
```bash
cd backend
./mvnw spring-boot:run
```

Queda listo cuando aparece `Started BackendApplication`.

**3. Correr el frontend** en otra terminal:

```bash
cd frontend
npm ci
npm run dev
```

**4. Abrir** http://127.0.0.1:5173, elegir **Crear mi cuenta** en la landing, crear una cuenta de prueba y aceptar las condiciones. Al terminar, la app entra directo al historial.

Vite reenvía `/api` a `127.0.0.1:8080` para que la cookie de sesión y el token CSRF funcionen desde el mismo origen. No uses Live Server para este frontend.

### Si algo falla

- **El backend no conecta a la base:** revisa que Docker Desktop esté abierto y que `docker compose ps` muestre el contenedor `postgres` corriendo.
- **Ya tenías el volumen creado con otra contraseña:** corre el backend con esa contraseña (`$env:DB_PASSWORD="tu_clave"` en PowerShell o `export DB_PASSWORD=tu_clave` en macOS/Linux, antes del paso 2). Cambiar la variable no cambia la clave de una base ya creada.
- **El puerto 5433 u 8080 está ocupado:** cierra lo que lo esté usando o cambia el puerto en `docker-compose.yml` y en `DB_URL`.
- **Sin Docker:** crea la base `heyel_db` en un PostgreSQL local y ajusta las variables de la tabla de abajo.

## Configuración

| Variable del backend | Valor local por defecto |
| --- | --- |
| `DB_URL` | `jdbc:postgresql://localhost:5433/heyel_db` |
| `DB_USER` | `postgres` |
| `DB_PASSWORD` | `postgres` (solo desarrollo) |
| `DDL_AUTO` | `update` (solo desarrollo) |
| `COOKIE_SECURE` | `false` para HTTP local; `true` con HTTPS |
| `DATABASE_URL` | Solo en Render con Blueprint: `postgres://...`; el contenedor la convierte en `DB_URL` al arrancar |
| `HEYEL_LIMITE_LOGIN_FALLIDOS_POR_MINUTO` | `5` intentos fallidos por correo e IP; después responde 429 |
| `HEYEL_LIMITE_REGISTROS_POR_HORA` | `10` registros por IP; súbelo si varios usuarios se registran desde la misma red en una sesión de validación |
| `HEYEL_LIMITE_EVENTOS_POR_HORA` | `60` eventos de analítica de la landing por IP, para que nadie infle las visitas |

## Despliegue en Render

La app publicada corre en el plan gratuito de Render:

- **Web Service (Docker):** usa el [`Dockerfile`](Dockerfile) de la raíz. Compila el frontend con Node, lo copia como archivos estáticos dentro del backend y empaqueta todo en un solo `.jar`, así que frontend y API quedan en la misma URL.
- **PostgreSQL:** base gratuita de Render en la misma región del servicio. Vence el 10 de noviembre de 2026.
- **Variables configuradas:** `DB_URL` (con el hostname interno de la base), `DB_USER`, `DB_PASSWORD` y `COOKIE_SECURE=true`.

Para publicar cambios hay que entrar al servicio en Render y usar Manual Deploy → Deploy latest commit, porque el servicio está conectado como repositorio público y no se despliega solo con cada push.

Para crear el despliegue desde cero también está [`render.yaml`](render.yaml): en Render, **New → Blueprint**, conectar este repositorio y confirmar la base `heyel-db` y el servicio `heyel`. Un servicio creado así sí se despliega solo con cada commit a `main` (`autoDeployTrigger: commit`); el servicio actual no se creó con el Blueprint y por eso sigue siendo manual.

## Verificación

Backend (usa H2 en memoria, no necesita PostgreSQL):
```bash
cd backend
./mvnw test          # Windows: .\mvnw.cmd test
```

Frontend:
```bash
cd frontend
npm test
npm run build
```

## Estructura y API

```
backend/    API en Spring Boot 3 (Java 17), Spring Security con sesiones, JPA y PostgreSQL
  domain/historial/                       Lógica del historial consolidado
  infrastructure/instituciones/simuladas/ Instituciones de demostración
frontend/   React 19 + Vite
docs/       Notas de entregas anteriores (registro, login y revisión de supuestos)
Dockerfile  Imagen para el despliegue
render.yaml Blueprint de Render
```

| Método | Ruta | Qué hace |
| --- | --- | --- |
| GET | `/api/auth/terms` | Condiciones de uso vigentes |
| GET | `/api/auth/csrf` | Token CSRF para las peticiones POST |
| POST | `/api/auth/register` | Crea la cuenta |
| POST | `/api/auth/login` | Inicia sesión |
| GET | `/api/auth/me` | Datos de la cuenta con sesión activa |
| POST | `/api/auth/logout` | Cierra la sesión |
| GET | `/api/historial` | Historial consolidado del paciente con sesión activa |
| POST | `/api/analitica/eventos` | Cuenta una visita a la landing (`VISITA_LANDING`) o un clic en «Crear mi cuenta» (`CLIC_CREAR_CUENTA`) |
| GET | `/api/analitica/resumen` | Totales de visitas, clics y cuentas creadas |

## Límites conocidos

- Las instituciones de salud son simuladas (`CatalogoInstitucionesSimuladas`); no hay conexión con instituciones reales.
- La sesión vive en la memoria del servidor: funciona con una sola instancia.
- Las decisiones de autenticación y los pendientes de seguridad están en [docs/ENTREGA-AUTH.md](docs/ENTREGA-AUTH.md) y [docs/REVISION-SUPUESTOS.md](docs/REVISION-SUPUESTOS.md).

## Equipo

- Diego Mendoza
- Juan Pablo Suárez Moreno
- Andrés Felipe Contreras Báez
- Mateo Galindo Páez
- Juan Pablo Peña Bernal