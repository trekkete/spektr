# Multi-stage build for Spring Boot backend
FROM --platform=linux/amd64 maven:3.9-eclipse-temurin-17 AS build

WORKDIR /app

# Copy pom.xml and download dependencies (cached layer)
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source code and build
COPY src ./src
RUN mvn clean package -DskipTests

# Runtime stage
FROM --platform=linux/amd64 eclipse-temurin:17-jre-jammy

WORKDIR /app

# Install libpcap for Pcap4J RADIUS packet parsing and curl for health checks
RUN apt-get update && \
    apt-get install -y libpcap0.8 libpcap-dev curl && \
    rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd -r spektr && useradd -r -g spektr spektr

# Copy jar from build stage
COPY --from=build /app/target/*.jar app.jar

# Change ownership
RUN chown -R spektr:spektr /app

# Switch to non-root user
USER spektr

# Expose port
EXPOSE 8080

# Health check (simple HTTP check - returns 200 OK or redirects to login)
HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8080/ || exit 1

# Run application
ENTRYPOINT ["java", "-Djava.security.egd=file:/dev/./urandom", "-jar", "app.jar"]
