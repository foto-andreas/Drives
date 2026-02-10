# Fahrtenbuch

Fahrten buch auf Basis von Fahrt-Vorlagen und Möglichkeit, HomeOffice-Tage nachzuhalten. 
Es gibt einen CSV-Export (auf Basis der Filtermöglcihkeiten) für die Steuererklärung.

## Deployment

Der Client-Coe wird zusammen mit dem Server-Code gebaut. Die gesamte Anwendung kann als Docker-Container
bereitgestellt werden. Wenn die Task ```dockerBuild``` nicht funktioniert, das hier benutzen:
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
  docker compose up -d && \
  popd && \
  pushd /opt/drives-tas && \
  docker compose up -d && \
  popd
```

## Junie

### Doku-Prompt:
```text
* Erstelle eine ausführliche Dokumentation für jedes Package und jede Klasse.
* Beschreibe Ressourcen und deren Nutzung. 
* Ergänze Grafiken (mit Mermaid) und Tabellen, falls sinnvoll. 
* Gehe auf alle Besonderheiten ein. 
* Erstelle eine Gesamtdokumentation auf oberer Ebene, die eine Zusammenfassung und Links zu den Einzel-Dokumentationen enthält.
* Die gesamte Dokumentation soll einheitlich aussehen 
```

### Codestyle:
```text
* Suche die Junie-guidelines.md Dateien und passe den Code dahingehend an, dass diese soweit wie möglich 
und sinnvoll erfüllt sind. 
* Achte darauf, dass Lombok benutzt wird und ergänze nicht die durch Lombok implizit bereitgestellten Dinge.
* Achte auf speziell implementierte Getter und Setter. Erhalte deren Verhalten.
```

### Korrektheit:
```text
* Prüfe den gesamten Code intensiv auf Korrektheit.
* Wenn ein Verhalten fraglich ist, stelle Rückfragen.
* Ergänze Kommentare, falls sinnvoll.
* Bereinige den Code bei Fehlern.
* Erstelle zusätliche Testfälle, die diese Probleme abdecken.
* Es soll eine Testabdeckung von 90% erreicht werden.
```

## TODOs
* Benutzername
  * Erstelle einen neuen Endpunkt, mit dem der Benutzername ermittelt werden kann.
  * Zeige disen Benutzernamen in kleinerer Schrift unter der Überschrift Fahrtenbuch an.
* Client-ID
  * Für den produktiven Code soll die Client-ID aus der Environment-Variablen GOOGLE_CLIENT_ID ermittelt werden
  * Für den produktiven Code soll das CLient-Secret aus der Environment-Variablen GOOGLE_CLIENT_SECRET ermittelt werden