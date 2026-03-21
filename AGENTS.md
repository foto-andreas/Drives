---
apply: always
---

# AGENTS

## 1. Geltungsbereich

Dieses Repository nutzt zwei Guideline-Sets im `.junie`-Verzeichnis:

- Backend (alles außerhalb von `client/`): `/.junie/**`
- Frontend (alles unter `client/`): `/client/.junie/**`

Wenn ein Change beide Seiten betrifft, gelten die jeweiligen Regeln pro Datei.

## 2. Priorität bei Konflikten

1. Bereichsspezifische Guidelines (`/.junie` bzw. `client/.junie`)
2. Repo-weite Konventionen (z. B. `README.md`, Build-/Test-Vorgaben)
3. Team-Entscheidungen im Review

## 3. Allgemeine Regeln

- Änderungen minimal und zielgerichtet halten.
- Aktuellen Code-Style, konsistente Benennungen und Einzüge beibehalten.
- Nur stabile Bibliotheks-/Framework-Versionen verwenden; niemals Java- oder Bibliotheksversionen downgraden.
- Lombok berücksichtigen und keinen Boilerplate-Code ergänzen, den Lombok bereits liefert.
- Bei unklarem oder fraglichem Verhalten fachlich prüfen und Rückfragen stellen.
- Wenn ein Prompt neue dauerhafte Vorgaben für Code-, Doku- oder Arbeitsstruktur einführt: Ergänzung für diese `AGENTS.md` vorschlagen und nach Zustimmung direkt einpflegen.
- Führe npm im Modul client aus

## 4. Korrektheit, Tests und Coverage

- Änderungen über vorhandene und bei Bedarf neue Unit-Tests absichern.
- Gefundene Fehler im Code bereinigen und durch zusätzliche Testfälle abdecken.
- Zielabdeckung: möglichst 90%.
- Nach Abschluss jeder Aufgabe alle relevanten Unit-Tests ausführen.
- Frontend-Tests mit Vitest-Runner ausführen (z. B. `--runner=vitest`).
- Falls Tests aufgrund erwarteter Änderungen fehlschlagen: Tests und/oder Produktionscode passend aktualisieren.

## 5. Dokumentation

- Dokumentation bei Codeänderungen immer auf aktuellen Stand bringen.
- Einheitliches Format und einheitliche Struktur beibehalten.
- `DOCUMENTATION.md` als zentrale Gesamtdokumentation mit Zusammenfassung und Links auf Detaildokumente pflegen.
- Packages, Klassen, Ressourcen und Besonderheiten ausreichend dokumentieren; Tabellen/Diagramme nutzen, wenn sinnvoll.
- Doku-Anpassungen klein halten; unnötige Umformulierungen vermeiden.
- Ungereimtheiten im Code oder inkonsistente deutsche Bezeichnungen in einem Abschnitt am Ende der Gesamtdokumentation mit Code-Verweisen festhalten.

### 5.1 Mermaid-Workflow

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
- SVGs in Markdown zentriert und mit begrenzter Darstellungsgröße einbinden, um übergroße Diagramme zuverlässig zu vermeiden:

```html
<p align="center">
  <img src="..." alt="..." style="max-width:min(100%, 960px); max-height:480px; width:auto; height:auto;">
</p>
```

- Nach jeder Mermaid-Änderung immer diese Checks ausführen und ggf. korrigieren:
  - `rg 'width="100%"|max-width:' docs/diagrams/*.svg` darf keine Treffer liefern.
  - `rg '<p align="center">\\n\\s*<img .*max-width:min\\(100%, 960px\\); max-height:480px;' DOCUMENTATION.md docs/**/*.md` muss für alle Diagramm-Einbindungen Treffer liefern.

### 5.2 Sprache und Zeilenenden in Doku

- In Doku-/Markdown-Dateien und Diagrammtexten standardmäßig echte deutsche Umlaute (`ä`, `ö`, `ü`) und `ß` verwenden.
- Umschreibungen (`ae`, `oe`, `ue`, `ss`) nur bei technischen Literalen/Identifiern (z. B. Code-Literale, Dateinamen, API-Namen).
- In Dokumentationsdateien LF verwenden und generell keine gemischten Zeilenenden erzeugen.
