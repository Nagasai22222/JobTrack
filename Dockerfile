# Multi-stage Dockerfile for JobTrack Spring Boot Backend

# Stage 1: Build stage
FROM maven:3.9-eclipse-temurin-17-alpine AS builder
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -B
COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: Production Runtime Stage
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
RUN addgroup -S jobtrack && adduser -S jobtrack -G jobtrack \
    && mkdir -p /app/uploads/job-applications \
    && chown -R jobtrack:jobtrack /app/uploads
USER jobtrack:jobtrack
# Copy JAR artifact from build stage
COPY --from=builder /app/target/jobtrack-0.0.1-SNAPSHOT.jar app.jar

# Configurable environment variables with defaults
ENV PORT=8080 \
    SPRING_PROFILES_ACTIVE=prod \
    JOBTRACK_UPLOAD_DIR=uploads/job-applications

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
