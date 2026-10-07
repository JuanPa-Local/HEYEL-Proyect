# HEYEL

Avance funcional de registro e inicio de sesión de pacientes. Incluye API REST y frontend React; la entrega completa sigue pendiente según [el reparto de trabajo](docs/ENTREGA-AUTH.md).

## Ejecutar localmente

Requisitos: Java 17 o superior, Node.js 20.19+ o 22.12+, y PostgreSQL. Maven se obtiene mediante el wrapper incluido. Con Java 21 también se puede compilar; el proyecto genera bytecode compatible con Java 17.

1. Desde la raíz, iniciar PostgreSQL: `docker compose up -d postgres`. Si no tienes Compose, crea `heyel_db` en un PostgreSQL local y ajusta las variables indicadas abajo.
2. En otra terminal, iniciar el backend:

   ```bash
   cd backend
   bash mvnw spring-boot:run
   ```

   En Windows: `mvnw.cmd spring-boot:run`.
3. Iniciar el frontend en otra terminal:

   ```bash
   cd frontend
   npm ci
   npm run dev
   ```

4. Abrir [HEYEL local](http://127.0.0.1:5173), elegir **Registrarme**, completar datos de prueba, leer y aceptar las condiciones. Después elegir **Iniciar sesión**.

Vite reenvía `/api` a `127.0.0.1:8080`. Las llamadas se realizan desde el mismo origen para que la cookie de sesión y CSRF funcionen sin abrir CORS. No uses Live Server para este frontend.

El ajuste de registro indicado en `Validacion_Supuestos_HEYEL (2).pdf` se documenta en [la revisión de supuestos](docs/REVISION-SUPUESTOS.md).

## Configuración

| Variable del backend | Valor local por defecto |
| --- | --- |
| `DB_URL` | `jdbc:postgresql://localhost:5433/heyel_db` |
| `DB_USER` | `postgres` |
| `DB_PASSWORD` | `postgres` (solo desarrollo) |
| `DDL_AUTO` | `update` (solo desarrollo) |
| `COOKIE_SECURE` | `false` para HTTP local; `true` al usar HTTPS |

Si modificas la clave en Compose, exporta también `DB_PASSWORD` en la terminal del backend. El volumen conserva las cuentas: cambiar la variable de Compose no cambia la contraseña de una base ya inicializada. No borres el volumen si contiene datos necesarios.

## Verificación

```bash
cd backend
bash mvnw test
```

Las pruebas usan H2 temporal, no necesitan ni modifican PostgreSQL.

```bash
cd frontend
npm test
npm run build
```

No está desplegado ni preparado todavía para datos médicos reales. Antes de desplegar, completar las tareas de seguridad, migraciones y validación del documento de requisitos que figuran en `docs/ENTREGA-AUTH.md`.
