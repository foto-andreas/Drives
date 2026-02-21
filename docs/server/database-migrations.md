# Datenbank-Migrationen (Flyway)

Dieses Dokument beschreibt die Migration-Strategie des Backends.

## Zielbild

- Schema-Management erfolgt ausschließlich über Flyway.
- Manuelle DDL-/ALTER-Logik in Java wird nicht mehr verwendet.
- Bestehende Datenbanken im aktuellen Schema-Stand werden beim ersten Flyway-Lauf gebaselined und danach regulär versioniert.

## Aktuelle Migrationen

| Version | Datei | Zweck |
| :--- | :--- | :--- |
| `2` | `src/main/resources/db/migration/V2__baseline_current_schema.sql` | Definiert den vollständigen aktuellen Schema-Stand (`drive_template`, `drive`, `scan_entry`, Indizes). |

Hinweis:
- Baseline-Version ist `1`.
- Damit werden bestehende, bereits aktuelle Datenbanken ohne Flyway-History sauber übernommen.

## Ablauf zur Laufzeit

```mermaid
---
config:
  layout: elk
---
flowchart TD
    A[Server startet] --> B[Routing-DataSource erstellt default-DataSource]
    B --> C[Flyway migrate fuer default]
    C --> D[default Tenant ist bereit]
    D --> E[Request fuer Tenant X]
    E --> F[DataSource fuer Tenant X wird lazy erstellt]
    F --> G[Flyway migrate fuer Tenant X]
    G --> H[Tenant X ist bereit]
```

## Kompatibilität mit bestehenden Datenbanken

- Baseline auf Version `1` erlaubt die Übernahme bereits bestehender Schemas.
- Fehlende alte Migrationen werden über das Flyway-Muster `*:missing` toleriert.
- Die erste aktuelle Migration (`V2`) ist idempotent formuliert (`IF NOT EXISTS`) und kann deshalb auch auf bereits bestehenden Schemas sicher ausgeführt werden.

## Operative Hinweise

- Neue Schema-Änderungen immer als neue Flyway-Version (`V3`, `V4`, ...).
- Bestehende Migrationen nach dem Rollout nicht inhaltlich ändern.
- `spring.jpa.hibernate.ddl-auto` bleibt auf `validate`, damit JPA nur prüft, aber keine DDL erzeugt.
