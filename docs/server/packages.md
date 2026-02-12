# Paket- & Klassenstruktur (Backend)

Die wichtigsten Pakete im Modul `de.schrell.drives`:

- `config`
  - `multitenancy`
    - `MultiTenantDataSourceConfiguration`: Erstinitialisierung und Migration der Tenant-Datenbank (H2/PostgreSQL)
    - `InitializationNotificationFilter`: Setzt `X-Db-Initialized`-Header, liefert Status-Endpunkt
  - `SecurityConfig`, `WebConfig`: Sicherheit und Web-Konfiguration

- `drives.api`
  - `controllers`: `DriveController`, `DriveTemplateController`
  - `dtos`: `DriveRequest`, `DriveResponse`, `DriveTemplateRequest`, `DriveTemplateResponse`, `ErrorResponse`
  - `handlers`: `GlobalExceptionHandler`

- `drives.domain`
  - `commands`: `DriveCommand`, `DriveTemplateCommand`
  - `entities`: `Drive`, `DriveTemplate`, `Reason`
  - `exceptions`: `ResourceNotFoundException`, `DriveTemplateInUseException`
  - `mappers`: `DriveMapper`
  - `repositories`: `DriveRepository`, `DriveTemplateRepository`
  - `services`: `DriveService`, `DriveTemplateService`

## Hinweise
- Services bilden transaktionale Grenzen und kapseln Validierung/Normalisierung.
- Mapper stellen sicher, dass Response-Daten immer effektive Werte enthalten (Fahrt > Vorlage).
- Repositories enthalten nur schmale, wohldefinierte Queries (z. B. `findFiltered` mit `LEFT JOIN`).
