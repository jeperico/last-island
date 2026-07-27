# ─── Build stage ──────────────────────────────────────────────────────────────
FROM eclipse-temurin:21-jdk AS build
WORKDIR /app
COPY service/ .
RUN chmod +x mvnw && ./mvnw package -DskipTests -q

# ─── Runtime stage ────────────────────────────────────────────────────────────
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
COPY service/otel/opentelemetry-javaagent.jar /app/otel/opentelemetry-javaagent.jar

ENV OTEL_EXPORTER_OTLP_ENDPOINT=http://tempo:4318
ENV OTEL_EXPORTER_OTLP_PROTOCOL=http/protobuf
ENV OTEL_SERVICE_NAME=last-island-api
ENV OTEL_METRICS_EXPORTER=none

EXPOSE 8081
ENTRYPOINT ["java", "-javaagent:/app/otel/opentelemetry-javaagent.jar", "-jar", "app.jar"]
