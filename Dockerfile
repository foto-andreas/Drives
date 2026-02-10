FROM eclipse-temurin:25-jdk

VOLUME /tmp

ARG JAR_FILE
COPY ${JAR_FILE} app.jar

EXPOSE 8080

ENTRYPOINT ["java","-jar","/app.jar"]
