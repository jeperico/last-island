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

# OTel config is fully env-driven (no defaults baked in):
# - Local Docker Compose: OTEL_EXPORTER_OTLP_ENDPOINT=http://tempo:4318, OTEL_METRICS_EXPORTER=none (Prometheus scrapes /actuator/prometheus instead)
# - Render (prod): OTEL_EXPORTER_OTLP_ENDPOINT=<grafana-cloud-otlp>, OTEL_METRICS_EXPORTER=otlp, OTEL_EXPORTER_OTLP_HEADERS=<auth>
# Set these in docker-compose.observability.yml / Render dashboard — not here.

EXPOSE 8081
ENTRYPOINT ["java", "-javaagent:/app/otel/opentelemetry-javaagent.jar", "-jar", "app.jar"]
