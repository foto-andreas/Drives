---
apply: always
---

# AGENTS

## Geltungsbereich

Dieses Repository nutzt zwei Guideline-Sets, die in dieser Datei konsolidiert sind:

- Backend (alles außerhalb von `client/`)
- Frontend (alles unter `client/`)

Wenn ein Change beide Seiten betrifft, gelten die jeweiligen Regeln pro Datei.

## Priorität bei Konflikten

1. Bereichsspezifische Regeln in dieser Datei (Backend vs. Frontend)
2. Repo-weite Konventionen (z. B. `README.md`, Build-/Test-Vorgaben)
3. Team-Entscheidungen im Review

## Allgemeine Regeln

- Änderungen minimal und zielgerichtet halten.
- Aktuellen Code-Style, konsistente Benennungen und Einzüge beibehalten.
- Nur stabile Bibliotheks-/Framework-Versionen verwenden.
- Niemals Java- oder Bibliotheksversionen downgraden.
- Bei unklarem oder fraglichem Verhalten fachlich prüfen und Rückfragen stellen.
- Wenn ein Prompt neue dauerhafte Vorgaben für Code-, Doku- oder Arbeitsstruktur einführt: Ergänzung für diese `AGENTS.md` vorschlagen und nach Zustimmung direkt einpflegen.
- `npm`-Befehle immer im Modul `client/` ausführen.

## Korrektheit, Tests und Coverage

- Änderungen über vorhandene und bei Bedarf neue Unit-Tests absichern.
- Gefundene Fehler im Code bereinigen und durch zusätzliche Tests abdecken.
- Zielabdeckung: möglichst 90%.
- Nach Abschluss jeder Aufgabe alle relevanten Unit-Tests ausführen.
- Frontend-Tests mit Vitest-Runner ausführen (`ng test --runner=vitest`, über `npm test`).
- Falls Tests wegen erwarteter Änderungen fehlschlagen: Tests und/oder Produktionscode passend aktualisieren.

## Backend-Regeln (Java / Spring Boot / Jakarta)

### Voraussetzungen und Build

- Java 25 (Toolchain)
- Gradle über Wrapper (`./gradlew`)
- Node.js + npm (Backend-Build baut den Client mit)
- Docker / Docker Compose

### Architektur und Struktur

- Package-by-feature/module und darin package-by-layer verwenden.
- Schichten strikt trennen:
  - Web-Layer (`api.controllers`, `api.dtos`, Exception-Handling)
  - Service-Layer (`domain.services`) als Business-/Transaktionsgrenze
  - Repository-Layer (`domain.repositories`)
  - Entity-Layer (`domain.entities`)
  - Mapper-Layer (`domain.mappers`)
  - Exceptions (`domain.exceptions`)

### Java- und Spring-Standards

- Java-25-Features sinnvoll nutzen.
- Sinnvolle Namen und Standard-Namenskonventionen einhalten.
- `public` nur verwenden, wenn notwendig.
- Lombok nutzen; keine Getter/Setter/Builder handschreiben, die Lombok bereits liefert.
- Keine Field Injection in Produktionscode.
- Constructor Injection ohne `@Autowired` verwenden.
- Logging nur über SLF4J, niemals `System.out.println()`.

### Service-, API- und Persistence-Regeln

- Schreib-Operationen als Use-Case-spezifische Command-Objekte modellieren.
- `@Transactional(readOnly = true)` für reine Lesevorgänge.
- `@Transactional` für Schreibvorgänge.
- Transaktionen kurz halten.
- Keine JPA-Entities im Web-Layer verwenden.
- Request/Response als dedizierte DTOs (Records) mit Jakarta Validation.
- Spring Data Methoden klar benennen; bei komplexen Abfragen JPQL bevorzugen.
- Globale Exception-Behandlung via `@ControllerAdvice`/`@RestControllerAdvice` mit konsistentem Fehler-DTO.
- Konfiguration über `application.yaml` mit gemeinsamem Prefix und typisierter `@ConfigurationProperties`-Klasse.

### Datenbank und Migrationen

- Flyway ist Single Source of Truth für Schemaänderungen.
- Migrationen unter `src/main/resources/db/migration`.
- Namensschema: `V{version}__{description}.sql`.
- `ddl-auto` in produktionsnahen Setups nicht destruktiv halten (`validate` oder `none`).

### Backend-Testing

- JUnit 5 + Spring Boot Test.
- AssertJ für Assertions.
- Mockito nur, wenn echte Abhängigkeiten unpraktisch sind.
- Testnamen beschreibend, Given-When-Then bevorzugen.
- Relevante Befehle: `./gradlew test`, `./gradlew check`.

## Frontend-Regeln (TypeScript / Angular)

### TypeScript-Grundsätze

- Strict Type Checking verwenden.
- Typinferenz nutzen, wenn der Typ offensichtlich ist.
- `any` vermeiden; bei Unsicherheit `unknown` verwenden.

### Angular-Grundsätze

- Standalone-Komponenten verwenden (kein NgModule-Design).
- `standalone: true` nicht explizit setzen (für dieses Projekt Standard).
- Signals für lokalen State verwenden.
- Feature-Routen lazy laden.
- `@HostBinding`/`@HostListener` nicht verwenden; Host-Bindings im `host`-Objekt deklarieren.
- Für statische Bilder `NgOptimizedImage` verwenden (keine Base64-Inline-Bilder damit).

### Accessibility

- AXE-Checks müssen bestehen.
- WCAG AA Mindestanforderungen einhalten (Fokus, Kontrast, ARIA).

### Komponenten, Templates, Services

- Komponenten klein und fokussiert halten.
- `input()`/`output()` statt Decorator-Inputs/Outputs.
- `computed()` für abgeleiteten State.
- `ChangeDetectionStrategy.OnPush` setzen.
- Kleine Komponenten bevorzugt mit Inline-Template.
- Reactive Forms statt Template-driven Forms.
- Kein `ngClass`/`ngStyle`; stattdessen `class`-/`style`-Bindings.
- Externe Template-/Style-Pfade relativ zur Component-TS-Datei.
- Templates einfach halten; native Kontrollfluss-Syntax (`@if`, `@for`, `@switch`) verwenden.
- Async Pipe für Observables verwenden.
- Keine Objektinstanziierung/Konstruktoraufrufe im Template.
- Keine Arrow Functions im Template.
- Services Single Responsibility, `providedIn: 'root'`, `inject()` statt Constructor Injection.
- Signal-Updates nur über `set`/`update`, niemals `mutate`.

## Dokumentation

- Dokumentation bei Codeänderungen immer aktuell halten.
- Einheitliches Format und einheitliche Struktur beibehalten.
- `DOCUMENTATION.md` als zentrale Gesamtdokumentation (Zusammenfassung + Links) pflegen.
- Packages/Klassen/Ressourcen/Besonderheiten ausreichend dokumentieren; Tabellen/Diagramme nutzen, wenn sinnvoll.
- Doku-Anpassungen klein halten; unnötige Umformulierungen vermeiden.
- Ungereimtheiten im Code oder inkonsistente deutsche Bezeichnungen am Ende der Gesamtdokumentation mit Code-Verweisen festhalten.

### Mermaid-Workflow

- Mermaid nicht direkt in Markdown einbetten.
- Diagrammquelle als `.mmd` speichern.
- Jede `.mmd` beginnt mit:

```text
---
config:
  look: neo
  layout: elk
---
```

- `.mmd` mit `mermaid-cli` (aus `client/node_modules`) nach `.svg` rendern und SVG in Markdown einbinden.
- SVGs nach dem Rendern normalisieren:
  - kein Root-`width="100%"`
  - kein Root-`max-width`
  - kleine Diagramme mit intrinsischen Maßen belassen
- SVGs in Markdown zentriert und mit begrenzter Darstellungsgröße einbinden:

```html
<p align="center">
  <img src="..." alt="..." style="max-width:min(100%, 960px); max-height:480px; width:auto; height:auto;">
</p>
```

- Nach jeder Mermaid-Änderung diese Checks ausführen:
  - `rg 'width="100%"|max-width:' docs/diagrams/*.svg` darf keine Treffer liefern.
  - `rg 'max-width:min\(100%, 960px\); max-height:480px; width:auto; height:auto;' DOCUMENTATION.md docs/**/*.md` muss für alle Diagramm-Einbindungen Treffer liefern.

### Sprache und Zeilenenden in Doku

- In Doku-/Markdown-Dateien und Diagrammtexten standardmäßig echte deutsche Umlaute (`ä`, `ö`, `ü`) und `ß` verwenden.
- Umschreibungen (`ae`, `oe`, `ue`, `ss`) nur bei technischen Literalen/Identifiern (z. B. Code-Literale, Dateinamen, API-Namen).
- In Dokumentationsdateien LF verwenden und generell keine gemischten Zeilenenden erzeugen.

## Zeilenenden (global)

- Für Code-, Konfigurations- und Dokumentationsdateien sind LF-Zeilenenden zu verwenden.
- Gemischte Zeilenenden sind im gesamten Repository zu vermeiden.
- Ausnahme: Windows-Batchdateien (`*.bat`) dürfen CRLF verwenden.
