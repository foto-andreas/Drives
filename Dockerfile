FROM eclipse-temurin:25-jdk

VOLUME /tmp

# OAuth2 Google credentials (can be overridden at runtime)
ENV GOOGLE_CLIENT_ID=""
ENV GOOGLE_CLIENT_SECRET=""

ARG JAR_FILE
COPY ${JAR_FILE} app.jar

EXPOSE 8080

ENTRYPOINT ["java","-jar","/app.jar"]
