FROM eclipse-temurin:25-jdk

VOLUME /tmp

ENV TESSERACT_PATH=/usr/share/tesseract-ocr/5/tessdata

RUN apt-get update \
    && apt-get install -y --no-install-recommends tesseract-ocr tesseract-ocr-deu \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

ARG JAR_FILE
COPY ${JAR_FILE} app.jar

EXPOSE 8080

ENTRYPOINT ["java","-jar","/app.jar"]
