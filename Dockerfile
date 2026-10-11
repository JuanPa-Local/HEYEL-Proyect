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
CMD ["sh", "-c", "java -XX:MaxRAMPercentage=75 -Dserver.port=${PORT:-8080} -jar app.jar"]