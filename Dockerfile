FROM eclipse-temurin:25-jdk

VOLUME /tmp

ENV TESSERACT_PATH=/usr/share/tesseract-ocr/5/tessdata
ENV OCR_LIBRARY_PATH=/usr/lib/aarch64-linux-gnu:/usr/lib/x86_64-linux-gnu:/usr/lib

RUN apt-get update \
    && apt-get install -y --no-install-recommends tesseract-ocr tesseract-ocr-deu \
    && LEPT_LIB="$(find /usr/lib -type f -name 'liblept.so*' | sort | head -n 1)" \
    && test -n "${LEPT_LIB}" \
    && ln -sf "${LEPT_LIB}" "$(dirname "${LEPT_LIB}")/libleptonica.so" \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

ARG JAR_FILE
COPY ${JAR_FILE} app.jar

EXPOSE 8080

ENTRYPOINT ["java","-jar","/app.jar"]
