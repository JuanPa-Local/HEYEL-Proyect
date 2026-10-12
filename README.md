# HEYEL

HEYEL es un portal web donde un paciente puede ver en un solo lugar la información que tienen sus instituciones de salud sobre él. Es el proyecto del curso Proyecto de Innovación en TI (Pontificia Universidad Javeriana).

- **App desplegada:** https://heyel.onrender.com
- **Versión:** Release 1 (`v0.1`)

> La app está en el plan gratuito de Render. Si nadie la ha usado en un rato, la primera carga puede tardar uno o dos minutos mientras el servidor arranca.

## Qué hace este release

- Registro de cuenta con aceptación de las condiciones de uso (US-01, US-07).
- Inicio y cierre de sesión (US-02).
- Historial consolidado de cuatro instituciones, ordenado del más reciente al más antiguo (US-03, US-05).
- Filtros del historial por categoría y por institución (US-04, US-05).
- Vista adaptada para celular: en pantallas pequeñas la tabla se muestra como tarjetas.

### Lo que es simulado

- Las cuatro instituciones (IPS Salud Vital, Laboratorio Clínico Andino, Centro de Imágenes del Norte y Clínica Altos del Bosque) son **ficticias**. La app todavía no se conecta con EPS, IPS ni laboratorios reales.
- Los registros clínicos los genera el backend con datos de demostración a partir del ID del paciente. Cada cuenta ve siempre el mismo historial, pero no es información médica real. La pantalla lo indica con el aviso «Datos de demostración» y la API responde `datosSimulados: true`.
- Las instituciones simuladas están detrás de una interfaz (`FuenteInstitucional`), así que se pueden reemplazar por conexiones reales sin cambiar la API ni la pantalla.

No uses datos médicos ni documentos reales al probarla.

## Correrlo en local

Se puede tener corriendo en unos 10 minutos (la primera vez Maven y npm descargan dependencias).

### Requisitos

- Git
- Java 17 o superior (con Java 21 también funciona)
- Node.js 20.19+ o 22.12+
- Docker Desktop, para levantar PostgreSQL

No hace falta instalar Maven, el proyecto trae el wrapper (`mvnw`).

### Pasos

**1. Clonar el repositorio**

```bash
git clone https://github.com/JuanPa-Local/HEYEL-Proyect.git
cd HEYEL-Proyect
```

**2. Levantar la base de datos** (con Docker Desktop abierto)

```bash
docker compose up -d postgres
```

Esto crea la base `heyel_db` en el puerto `5433` con usuario y contraseña `postgres`. El backend ya viene configurado con esos valores, no hay que cambiar nada.

**3. Correr el backend** (en otra terminal)

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

Queda listo cuando en la consola aparece `Started BackendApplication`. Corre en `http://localhost:8080`.

**4. Correr el frontend** (en otra terminal)

```bash
cd frontend
npm ci
npm run dev
```

**5. Abrir la app** en http://127.0.0.1:5173

Dale a **Registrarme**, crea una cuenta de prueba, acepta las condiciones e inicia sesión. Ahí debe aparecer el historial con los filtros.

Vite redirige las llamadas a `/api` hacia el backend en el puerto 8080, así que todo queda en el mismo origen y la cookie de sesión funciona sin configurar CORS. No uses Live Server para abrir el frontend.

### Si algo falla

- **El backend no conecta a la base:** revisa que Docker Desktop esté abierto y que `docker compose ps` muestre el contenedor `postgres` corriendo.
- **Ya tenías el volumen creado con otra contraseña:** corre el backend con esa contraseña (`$env:DB_PASSWORD="tu_clave"` en PowerShell o `export DB_PASSWORD=tu_clave` en macOS/Linux, antes del paso 3).
- **El puerto 5433 u 8080 está ocupado:** cierra lo que lo esté usando o cambia el puerto en `docker-compose.yml` y en `DB_URL`.

## Pruebas

Backend (usa H2 en memoria, no necesita PostgreSQL):
```bash
cd backend
./mvnw test          # Windows: .\mvnw.cmd test
```

Frontend:
```bash
cd frontend
npm test
```

## Variables de configuración del backend

| Variable | Valor por defecto (local) | Para qué sirve |
| --- | --- | --- |
| `DB_URL` | `jdbc:postgresql://localhost:5433/heyel_db` | Conexión a PostgreSQL |
| `DB_USER` | `postgres` | Usuario de la base |
| `DB_PASSWORD` | `postgres` | Contraseña de la base (solo desarrollo) |
| `DDL_AUTO` | `update` | Hibernate crea o actualiza las tablas |
| `COOKIE_SECURE` | `false` | Ponerlo en `true` cuando la app corre con HTTPS |

## Despliegue

La app desplegada corre en [Render](https://render.com) con el plan gratuito:

- **Web Service (Docker):** usa el `Dockerfile` de la raíz. Compila el frontend con Node, lo copia como archivos estáticos dentro del backend y empaqueta todo en un solo `.jar`, así que frontend y API quedan en la misma URL.
- **PostgreSQL:** base gratuita de Render, en la misma región que el servicio.
- **Variables configuradas en Render:** `DB_URL` (con el hostname interno de la base), `DB_USER`, `DB_PASSWORD` y `COOKIE_SECURE=true`.

Cada push a la rama configurada en Render dispara un nuevo despliegue.

Para probar la imagen en local antes de subir cambios:
```bash
docker build -t heyel .
docker run --rm -p 8080:8080 -e DB_URL=jdbc:postgresql://host.docker.internal:5433/heyel_db -e COOKIE_SECURE=false heyel
```
y abrir http://localhost:8080.

## Estructura

```
backend/    API en Spring Boot 3 (Java 17), Spring Security con sesiones, JPA y PostgreSQL
  domain/historial/                       Lógica del historial consolidado
  infrastructure/instituciones/simuladas/ Instituciones de demostración
frontend/   React 19 + Vite
docs/       Notas de entregas anteriores (registro, login y revisión de supuestos)
Dockerfile  Imagen para el despliegue
```

Los detalles del registro, el login, la seguridad y el contrato REST de autenticación están en [docs/ENTREGA-AUTH.md](docs/ENTREGA-AUTH.md).

| Método | Ruta | Qué hace |
| --- | --- | --- |
| GET | `/api/auth/terms` | Condiciones de uso vigentes |
| GET | `/api/auth/csrf` | Token CSRF para las peticiones POST |
| POST | `/api/auth/register` | Crea la cuenta |
| POST | `/api/auth/login` | Inicia sesión |
| GET | `/api/auth/me` | Datos de la cuenta con sesión activa |
| POST | `/api/auth/logout` | Cierra la sesión |
| GET | `/api/historial` | Historial consolidado del paciente con sesión activa |

## Equipo

- Diego Mendoza
- Juan Pablo Suárez Moreno
- Andrés Felipe Contreras Báez
- Mateo Galindo Páez
- Juan Pablo Peña Bernal