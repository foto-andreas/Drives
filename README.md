# Fahrtenbuch



## Deployment

```bash
./gradlew build && \
  docker build --build-arg JAR_FILE=build/libs/drives-0.0.1-SNAPSHOT.jar -t drives:0.0.1-SNAPSHOT . && \
  docker save drives -o drives.tar && \
  scp drives.tar root@evcc-box.schrell.de:
```
und auf Server-Seite
```bash
docker load -i ~/drives.tar && \
  pushd /opt/drives-as && \
  docker compose up -d && \
  popd && \
  pushd /opt/drives-tas && \
  docker compose up -d && \
  popd
```

Doku-Prompt:
```text
* Prüfe den gesamten Code und erstelle eine ausführliche Dokumentation für jedes Package. 
* Ergänze Grafiken (mit Mermaid) und Tabellen, falls sinnvoll. 
* Gehe auf alle Besonderheiten ein. 
* Erstelle eine Gesamtdokumentation aufoberer Ebene, die eine Zusammenfassung und Links zu den Einzel-Dokumentationen enthält. 
```

Codestyle:
```text
Suche die Junie-guidelines.md Dateien und kpasse den Code dahingehend an, dass diese soweit wie möglich und 
sinnvoll erfüllt sind.
```