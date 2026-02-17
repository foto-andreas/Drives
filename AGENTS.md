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

## 6) Ergänzungen
* Use the latest stable versions of libraries and frameworks
* Use meaningful and descriptive names for variables, functions, and classes
* Use consistent indentation and formatting throughout the codebase
* IMPORTANT: Run all Unit tests after finishing a task. Check if tests are failing due to expected changes. if yes, rewrite testcode otherwise check production code again. Use "-runner=vitest"
* ALWAYS remember that lombok is used in the code, do NOT code things lombok provides
* NEVER downgrade JAVA-Version or other LIBRARY versions
* Run all Unit tests after finishing a task. Check if tests are failing due to expected changes. if yes, rewrite testcode otherwise check production code again.
