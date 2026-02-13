# Fahrtenbuch

Fahrtenbuch auf Basis von Fahrtvorlagen und Möglichkeit, Home-Office-Tage nachzuhalten. Es gibt einen CSV-Export (auf Basis der Filtermöglichkeiten) für die Steuererklärung.

Diese Anwendung ist zu einem Großteil mit KI erstellt. Dazu wurde IntelliJ-Ultimate mit Jetbrains-AI verwendet. Es dient einerseits als nutzbare Anwendung im persönlichen Umfeld, als auch als Lernbeispiel für die Arbeit mit KI in der Softwareentwicklung.

## Dokumentation

Die ausführliche Dokumentation des Projekts (Architektur, API, Datenmodell, Frontend) befindet sich in der **[DOCUMENTATION.md](DOCUMENTATION.md)**.

- Backend: siehe `docs/server/` (Architecture, Data-Model, API, Packages)
- Frontend: siehe `docs/client/` (Overview, Components, Services, Models)

## Test starten

Nur lokal:
```bash
runLocal.sh
```

## Deployment

Der Client-Code wird zusammen mit dem Server-Code gebaut. Die gesamte Anwendung kann als Docker-Container bereitgestellt werden. Wenn der Task ```dockerBuild``` nicht funktioniert, das hier benutzen:
```bash
./gradlew build && \
  docker build --build-arg JAR_FILE=build/libs/drives-0.0.1-SNAPSHOT.jar -t drives:0.0.1-SNAPSHOT . && \
  docker save drives -o drives.tar && \
  scp drives.tar root@evcc-box.schrell.de:
```
und nach Übertragung der drives.tar auf Server-Seite:
```bash
docker load -i ~/drives.tar && \
  pushd /opt/drives-as && \
  docker compose down \
  docker compose up -d && \
  popd && \
  pushd /opt/drives-tas && \
  docker compose down \
  docker compose up -d && \
  popd
```

Im Repo gibt es die folgenden Beispieldateien für ein Deployment mit Docker und Traefik als Reverse-Proxy:
* docker-compose.yaml
* traefik-dynamic-drives-middleware.yaml
* docker-drives-env.txt

Die Einstellungen für die Middleware müssen per File bereitgestellt werden, da es innerhalb der Docker-Labels sonst zu Race-Conditions kommt. Das zeigt sich dann daran, dass Middlewares nicht gefunden werden.

## Junie

### Doku-Prompt
```text
Doku-Update
* Erstelle eine ausführliche Dokumentation für jedes Package und jede Klasse.
* Beschreibe Ressourcen und deren Nutzung. 
* Ergänze Grafiken (mit Mermaid) und Tabellen, falls sinnvoll. 
* Gehe auf alle Besonderheiten ein. 
* Erstelle eine Gesamtdokumentation auf oberer Ebene, die eine Zusammenfassung und Links zu den Einzel-Dokumentationen enthält.
* Die gesamte Dokumentation soll einheitlich aussehen
* Prüfe sämtliche Dokumentations-Dateien und Kommentare im Code auf aktuellen Stand und Korrektheit. 
* Nimm eventuelle Korrekturen und Erweiterungen vor. 
* Halte dich an die aktuelle einheitliche Struktur.
```

### Codestyle
```text
* Suche die Junie-guidelines.md Dateien und passe den Code dahingehend an, dass diese soweit wie möglich 
und sinnvoll erfüllt sind. 
* Achte darauf, dass Lombok benutzt wird und ergänze nicht die durch Lombok implizit bereitgestellten Dinge.
* Achte auf speziell implementierte Getter und Setter. Erhalte deren Verhalten.
```

### Korrektheit
```text
* Prüfe den gesamten Code intensiv auf Korrektheit.
* Wenn ein Verhalten fraglich ist, stelle Rückfragen.
* Ergänze Kommentare, falls sinnvoll.
* Bereinige den Code bei Fehlern.
* Erstelle zusätzliche Testfälle, die diese Probleme abdecken.
* Es soll eine Testabdeckung von 90% erreicht werden.
```

## TODOs

* GitHub-Workflows

## Tests & Coverage

- Server-Tests und Coverage ausführen:
  ```bash
  ./gradlew clean test jacocoTestReport check
  ```
  Der `check`-Task enthält eine JaCoCo-Coverage-Verification mit Mindestabdeckung 90% (Instructions). HTML-Report: 
  ```
  build/reports/jacoco/test/html/index.html
  ```

- Client-Tests (Karma/Vitest) ausführen:
  ```bash
  cd client && npm test
  ```

Hinweise:
- Der Client-Build ist in den Gradle-Build integriert (`:client:build`).
- In Anzeige und CSV-Export werden explizite Werte der Fahrt gegenüber Vorlagenwerten priorisiert.
- Ohne Vorlage sind im Formular Grund, Von, Nach und Länge Pflicht; bei Vorlage optional.
