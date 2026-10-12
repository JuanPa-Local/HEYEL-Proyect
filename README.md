# HEYEL

HEYEL reúne en un solo lugar el historial clínico que un paciente tiene repartido en distintas instituciones de salud. El paciente crea su cuenta, entra y ve sus exámenes, imágenes y consultas ordenados del más reciente al más antiguo, con filtros por categoría e institución.

Es un prototipo académico: las instituciones y los registros clínicos son **ficticios** y se generan para cada paciente. No ingreses información médica real.

**URL pública:** _pendiente: pegar aquí la URL de Render cuando termine el despliegue_

## Qué incluye la versión v0.1

| Funcionalidad | Cómo se comprueba en la URL |
| --- | --- |
| Registro de paciente con aceptación de condiciones (US-001) | Sin marcar la casilla, el formulario avisa en el mismo paso y no crea la cuenta |
| Ingreso directo después del registro | Al registrarse, el paciente llega a su historial sin volver a escribir sus datos |
| Inicio y cierre de sesión (US-002) | Con datos incorrectos aparece un error; al recargar la página la sesión se mantiene; «Cerrar sesión» vuelve al login |
| Historial consolidado de cuatro instituciones (US-03, US-05) | Después de entrar se ven los registros de todas las instituciones, del más reciente al más antiguo |
| Filtro por categoría (US-04) | Al elegir «Laboratorio», «Imagenología» o «Consulta» solo quedan esos registros y el contador cambia |
| Filtro por institución (US-05) | Al elegir una institución solo quedan sus registros; si ninguno coincide con los filtros, «Quitar filtros» restablece la lista |

## Correr localmente (menos de 15 minutos)

### Opción A: todo con Docker (un solo comando)

Requisito: [Docker Desktop](https://www.docker.com/products/docker-desktop/) abierto.

```bash
docker compose up --build
```

Cuando la consola muestre `Started BackendApplication`, abrir <http://localhost:8080>. La primera vez tarda unos minutos porque descarga dependencias; las siguientes arranca en segundos. Para detenerlo: `Ctrl + C` y luego `docker compose down`.

### Opción B: modo desarrollo (para modificar el código)

Requisitos: Java 17 o superior, Node.js 20.19+ o 22.12+ y Docker (solo para PostgreSQL). Maven viene incluido con el wrapper.

1. Desde la raíz, iniciar PostgreSQL:

   ```bash
   docker compose up -d postgres
   ```

2. En otra terminal, iniciar el backend:

   ```bash
   cd backend
   ./mvnw spring-boot:run
   ```

   En Windows (PowerShell): `.\mvnw.cmd spring-boot:run`.

3. En otra terminal, iniciar el frontend:

   ```bash
   cd frontend
   npm ci
   npm run dev
   ```

4. Abrir <http://127.0.0.1:5173>, elegir **Registrarme**, completar datos de prueba y aceptar las condiciones.

Vite reenvía `/api` a `127.0.0.1:8080` para que la cookie de sesión y el token CSRF funcionen desde el mismo origen. No uses Live Server para este frontend.

Si no tienes Docker, crea la base `heyel_db` en un PostgreSQL local y ajusta las variables de la tabla de abajo.

## Configuración

| Variable del backend | Valor local por defecto |
| --- | --- |
| `DB_URL` | `jdbc:postgresql://localhost:5433/heyel_db` |
| `DB_USER` | `postgres` |
| `DB_PASSWORD` | `postgres` (solo desarrollo) |
| `DDL_AUTO` | `update` (solo desarrollo) |
| `COOKIE_SECURE` | `false` para HTTP local; `true` con HTTPS |
| `DATABASE_URL` | Solo en Render: `postgres://...`; el contenedor la convierte en `DB_URL` al arrancar |
| `HEYEL_LIMITE_LOGIN_FALLIDOS_POR_MINUTO` | `5` intentos fallidos por correo e IP; después responde 429 |
| `HEYEL_LIMITE_REGISTROS_POR_HORA` | `10` registros por IP; súbelo si varios usuarios se registran desde la misma red en una sesión de validación |

Si cambias la clave en Compose, exporta también `DB_PASSWORD` en la terminal del backend. El volumen conserva las cuentas: cambiar la variable no cambia la clave de una base ya creada.

## Despliegue en Render

El archivo [`render.yaml`](render.yaml) crea la base PostgreSQL y el servicio web a partir del [`Dockerfile`](Dockerfile), que compila el frontend y lo sirve desde el mismo backend.

1. En Render: **New → Blueprint** y conectar este repositorio.
2. Confirmar los recursos que propone: la base `heyel-db` y el servicio `heyel`.
3. Al terminar el despliegue, abrir la URL del servicio (termina en `onrender.com`) desde un celular y pegarla arriba en este README.

En el plan gratuito, Render suspende el servicio cuando no recibe visitas y la primera carga puede tardar cerca de un minuto: abran la URL antes de la demo.

## Verificación

```bash
cd backend
./mvnw test
```

Las pruebas usan una base H2 temporal; no necesitan ni modifican PostgreSQL.

```bash
cd frontend
npm test
npm run build
```

## Límites conocidos

- Las instituciones de salud son simuladas (`CatalogoInstitucionesSimuladas`); no hay conexión con instituciones reales.
- La sesión vive en la memoria del servidor: funciona con una sola instancia.
- Las decisiones de autenticación y los pendientes de seguridad están en [docs/ENTREGA-AUTH.md](docs/ENTREGA-AUTH.md) y [docs/REVISION-SUPUESTOS.md](docs/REVISION-SUPUESTOS.md).
