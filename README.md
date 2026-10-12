# HEYEL

HEYEL reúne en un solo lugar el historial clínico que un paciente tiene repartido en distintas instituciones de salud. El paciente crea su cuenta, entra y ve sus exámenes, imágenes y consultas ordenados del más reciente al más antiguo, con filtros por categoría e institución. Es el proyecto del curso Proyecto de Innovación en TI (Pontificia Universidad Javeriana).

- **App desplegada:** https://heyel.onrender.com
- **Versión:** Release 1 (`v0.1`)

> La app está en el plan gratuito de Render. Si nadie la ha usado en un rato, la primera carga puede tardar uno o dos minutos mientras el servidor arranca. Abran la URL unos minutos antes de una demo o de una prueba con usuarios.

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

**4. Abrir** http://127.0.0.1:5173, elegir **Registrarme**, crear una cuenta de prueba y aceptar las condiciones. Al terminar, la app entra directo al historial.

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

## Despliegue en Render

La app publicada corre en el plan gratuito de Render:

- **Web Service (Docker):** usa el [`Dockerfile`](Dockerfile) de la raíz. Compila el frontend con Node, lo copia como archivos estáticos dentro del backend y empaqueta todo en un solo `.jar`, así que frontend y API quedan en la misma URL.
- **PostgreSQL:** base gratuita de Render en la misma región del servicio. Vence el 10 de noviembre de 2026.
- **Variables configuradas:** `DB_URL` (con el hostname interno de la base), `DB_USER`, `DB_PASSWORD` y `COOKIE_SECURE=true`.

Para publicar cambios hay que entrar al servicio en Render y usar Manual Deploy → Deploy latest commit, porque el servicio está conectado como repositorio público y no se despliega solo con cada push.

Para crear el despliegue desde cero también está [`render.yaml`](render.yaml): en Render, **New → Blueprint**, conectar este repositorio y confirmar la base `heyel-db` y el servicio `heyel`.

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