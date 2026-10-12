# 1. Compila el frontend
FROM node:22-alpine AS frontend
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# 2. Compila el backend y le agrega el frontend como archivos estáticos
FROM maven:3.9-eclipse-temurin-17 AS backend
WORKDIR /app/backend
COPY backend/pom.xml ./
COPY backend/src ./src
COPY --from=frontend /app/frontend/dist ./src/main/resources/static
RUN mvn -q package -DskipTests

# 3. Imagen final, solo con el .jar
FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=backend /app/backend/target/*.jar app.jar
ENV COOKIE_SECURE=true
EXPOSE 8080
# Render entrega la base como DATABASE_URL (postgres://usuario:clave@host:puerto/base) y Spring
# necesita el formato JDBC: se toma lo que va después de la última @ y se le antepone jdbc:postgresql://.
# El usuario y la clave llegan aparte en DB_USER y DB_PASSWORD.
CMD ["sh", "-c", "if [ -n \"$DATABASE_URL\" ]; then export DB_URL=\"jdbc:postgresql://${DATABASE_URL##*@}\"; fi; exec java -XX:MaxRAMPercentage=75 -Dserver.port=${PORT:-8080} -jar app.jar"]