# AGENTS

Dieses Repository hat **zwei getrennte Guideline-Sets** (jeweils im `.junie`-Verzeichnis), abhängig davon, ob du am Backend oder Frontend arbeitest.

## 1) Backend (Java / Spring Boot / Jakarta)

- **Geltungsbereich:** alle Backend-Änderungen außerhalb von `client/` (z. B. `src/main/java`, `src/test/java`, `build.gradle`, Docker/Deploy, etc.)
- **Zu verwendende Guidelines:** `/.junie/**`

**Regel:** Wenn du Backend-Code oder Backend-Konfiguration anfasst, befolge die Guidelines aus `/.junie`.

## 2) Frontend (TypeScript / Angular)

- **Geltungsbereich:** alles unter `client/` (z. B. `client/src/**`, `client/angular.json`, `client/package.json`, Tests, Build-Konfig)
- **Zu verwendende Guidelines:** `/client/.junie/**`

**Regel:** Wenn du TypeScript- oder Angular-Code im Frontend anfasst, befolge die Guidelines aus `client/.junie`.

## 3) Wenn ein Change beide Seiten betrifft

- Wende **jeweils die passenden Guidelines pro Teiländerung** an:
    - Backend-Dateien → `/.junie`
    - Frontend-Dateien in `client/` → `client/.junie`

## 4) Priorität bei Konflikten

1. Bereichsspezifische Guidelines (`client/.junie` für Frontend, `/.junie` für Backend)
2. Repo-weite Konventionen (z. B. aus `README.md`, Build-/Test-Vorgaben)
3. Team-Entscheidungen im Review

## 5) Korrektheit

1. Sichere bei allen Änderungen die Korrektheit durch vorhandene und neue Unit-Tests
2. Stell die Testabdeckung sicher, so dass möglichst 90% erreicht werden. 
3. Nutze auch fachliche Prüfung auf Sinnhaftigkeit und frage ggf. nach. 
4. Prüfe den gesamten Code intensiv auf Korrektheit. 
5. Wenn ein Verhalten fraglich ist, stelle Rückfragen. 
6. Bereinige den Code bei Fehlern. 
7. Erstelle zusätzliche Testfälle, die diese Probleme abdecken.

## 7) Ergänzungen 
* Verwende die neuesten stabilen Versionen von Bibliotheken und Frameworks
* Verwende sinnvolle und beschreibende Namen für Variablen, Funktionen und Klassen
* Verwende konsistente Einzüge und Formatierungen im gesamten Codebasis
* WICHTIG: Führe alle Unit-Tests nach Abschluss einer Aufgabe durch. Überprüfe, ob Tests aufgrund erwarteter Änderungen nicht bestehen. Wenn ja, schreiben Sie den Testcode neu oder überprüfen Sie den Produktionscode erneut. Verwenden Sie "-runner=vitest"
* Denk IMMER daran, dass Lombok im Code verwendet wird, aber NICHT Code, was Lombok bereitstellt,
* NIEMALS JAVA-Version oder andere BIBLIOTHEKSVERSIONEN herunterzustufen
* Führe alle Unit-Tests durch, nachdem du eine Aufgabe abgeschlossen hast. Überprüfe, ob Tests aufgrund erwarteter Änderungen nicht bestehen. Wenn ja, schreiben Sie den Testcode neu oder überprüfen Sie den Produktionscode erneut.

## 7) Systemdokumentation
* Erstelle eine ausführliche Dokumentation für jedes Package und jede Klasse bzw. passe diese bei Änderungen im Code an.
* Beschreibe Ressourcen und deren Nutzung.
* Ergänze Grafiken (mit Mermaid) und Tabellen, falls sinnvoll.
* Gehe auf alle Besonderheiten ein.
* Erstelle eine Gesamtdokumentation auf oberer Ebene, die eine Zusammenfassung und Links zu den Einzel-Dokumentationen enthält.
* Die gesamte Dokumentation soll einheitlich aussehen
* Prüfe sämtliche Dokumentations-Dateien und Kommentare im Code auf aktuellen Stand und Korrektheit.
* Nimm eventuelle Korrekturen und Erweiterungen vor.
* Halte dich an die aktuelle einheitliche Struktur.
* Ergänze Kommentare, falls sinnvoll.
* Ergänze IMMER die Dokumentation um fehlende Teile und passe sie entsprechend der aktuellen Implementierung an.
* Ergänze die Dokumentation um neue Funktionen und Features, wenn diese hinzugefügt werden.
* Aktualisiere die Dokumentation bei Änderungen an bestehenden Funktionen und Features.
* Verwende ein einheitliches Format für die Dokumentation, um eine konsistente Darstellung zu gewährleisten.
* Verwende Markdown für die Dokumentation, um eine einfache und lesbare Formatierung zu ermöglichen.
* Verwende Markdown-Plugins für die Dokumentation, um zusätzliche Funktionalitäten wie Code-Snippets oder Diagramme zu unterstützen.
* Verwende Markdown-Tools für die Dokumentation, um die Dokumentation zu erstellen und zu verwalten.
* Verwende Markdown-Editor-Plugins für die Dokumentation, um die Dokumentation zu bearbeiten und zu formatieren.
* Verwende Markdown-Viewer-Plugins für die Dokumentation, um die Dokumentation zu lesen und zu präsentieren.
