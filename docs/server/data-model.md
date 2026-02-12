# Datenmodell (Backend)

## Entities

### DriveTemplate
- `id: String (UUID)`
- `name: String` (eindeutig, Index)
- `driveLength: int`
- `fromLocation: String`
- `toLocation: String`
- `reason: Reason` (Enum)

### Drive
- `id: String (UUID)`
- `template: DriveTemplate | null` (ManyToOne, optional)
- `date: LocalDate`
- `reason: Reason | null` (Override)
- `fromLocation: String | null` (Override)
- `toLocation: String | null` (Override)
- `driveLength: Integer | null` (Override)

> Hinweis: Bei gesetzter Vorlage werden Felder, die identisch zur Vorlage sind, vor dem Speichern auf `null` gesetzt (nur Overrides werden persistiert).

## Relationen
- `Drive` — `DriveTemplate`: n:1 (optional)

## Abfragen
- `DriveRepository.findFiltered(year, month, reason)`
  - JPQL mit `LEFT JOIN` auf `d.template t`, um auch Fahrten ohne Vorlage (`template = null`) zurückzugeben.
  - Filterlogik:
    - Jahr/Monat: anhand `d.date`
    - Grund: Entweder explizit am Drive (`d.reason`) oder, falls dort `null`, über `t.reason`

## Migrations- & Schema-Handling
- Automatische Erstinitialisierung des Schemas je Tenant (H2-Datei pro Benutzerkennung)
- Automatische Migration fehlender Spalten in `drive`: `from_location`, `to_location`, `drive_length`
- Flyway-Unterstützung vorbereitet (`src/main/resources/db/migration`) – für produktive Systeme empfohlen
