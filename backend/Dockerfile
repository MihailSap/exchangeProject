# Build the Spring Boot application with the same Java version as the project.
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /workspace

COPY pom.xml .
RUN mvn -B -DskipTests dependency:go-offline

COPY src ./src
RUN mvn -B -DskipTests package

# Run as a non-root user in a smaller runtime image.
FROM eclipse-temurin:21-jre
WORKDIR /app
RUN useradd --system --create-home --uid 10001 appuser
RUN mkdir -p /app/uploads && chown appuser:appuser /app/uploads
COPY --from=build /workspace/target/*.jar /app/application.jar
USER appuser

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/application.jar"]
