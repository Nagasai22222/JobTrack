# JobTrack — Job Application Management System Backend

JobTrack is a production-hardened, interview-explainable Spring Boot backend REST API for tracking job applications, comments, activity timelines, document attachments, and application statistics.

---

## 🛠️ Technology Stack

* **Java 17+**
* **Spring Boot 3.3.4** (Web, Data JPA, Security, Validation, Actuator)
* **PostgreSQL** & **Flyway Database Migrations** (V1–V6)
* **JWT Authentication** (BCrypt password hashing, stateless sessions)
* **SpringDoc OpenAPI / Swagger UI 2.5**
* **Docker & Multi-Stage Containerization**

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
* JDK 17+
* Apache Maven 3.9+
* PostgreSQL running locally on port 5432 (`jobtrack_db`)

### 2. Environment Setup
Copy `.env.example` to `.env` (optional) or set environment variables:
```bash
export DB_USERNAME=postgres
export DB_PASSWORD=your_db_password
export JWT_SECRET=your_long_secure_jwt_secret_key_string
```

### 3. Build & Run
```bash
# Build the project
mvn clean package -DskipTests

# Run Spring Boot application
mvn spring-boot:run
```
The server starts on `http://localhost:8080`.

---

## 📦 Production Deployment & Profiles

### 1. Spring Profiles
* **Default (Dev):** `application.properties`
* **Production:** `application-prod.properties` (activated via `SPRING_PROFILES_ACTIVE=prod`)

### 2. Required Environment Variables
| Variable | Description | Example / Default |
|---|---|---|
| `PORT` | Platform HTTP Server Port | `8080` |
| `DB_URL` | PostgreSQL JDBC Connection String | `jdbc:postgresql://db-host:5432/jobtrack_db` |
| `DB_USERNAME` | Database Username | `postgres` |
| `DB_PASSWORD` | Database Password | `secure_password` |
| `JWT_SECRET` | Secret Key for JWT Signing | `min_64_bytes_secret_key` |
| `JWT_EXPIRATION` | JWT Expiration in Milliseconds | `3600000` (1 Hour) |
| `JOBTRACK_CORS_ALLOWED_ORIGINS` | Comma-separated CORS Origins | `https://app.jobtrack.com` |
| `JOBTRACK_UPLOAD_DIR` | Attachment Storage Path | `uploads/job-applications` |

### 3. Docker Container Deployment
```bash
# Build Docker image
docker build -t jobtrack-backend:latest .

# Run container with environment variables
docker run -d \
  -p 8080:8080 \
  -e SPRING_PROFILES_ACTIVE=prod \
  -e DB_URL=jdbc:postgresql://host.docker.internal:5432/jobtrack_db \
  -e DB_USERNAME=postgres \
  -e DB_PASSWORD=your_password \
  -e JWT_SECRET=your_jwt_secret_key \
  --name jobtrack-api \
  jobtrack-backend:latest
```

---

## 🔍 Health & Documentation Endpoints

* **Actuator Health Check:** `GET /actuator/health` -> `{"status":"UP"}`
* **Swagger UI:** `http://localhost:8080/swagger-ui.html`
* **OpenAPI 3 JSON Spec:** `http://localhost:8080/v3/api-docs`

---

## 📁 Document Storage Architecture & Cloud Migration

JobTrack abstracts attachment persistence via the `DocumentStorageService` interface:
* **Current Implementation:** `LocalDocumentStorageService` (stores files in server filesystem directory with random UUID names).
* **Future Cloud Migration:** To migrate to AWS S3, Cloudinary, or MinIO, implement `S3DocumentStorageService implements DocumentStorageService` without altering business services or controller endpoints.
