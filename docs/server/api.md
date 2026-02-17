# API-Referenz (Backend)

Basis-URL: `/api`

## Drives

### GET `/drives`
- Query-Parameter (optional): `year`, `month`, `reason`
- Antwort: `DriveResponse[]`
- Anmerkung: Ergebnisse enthalten effektive Werte – explizite Fahrtwerte haben Vorrang vor Vorlagenwerten.

### GET `/drives/{id}`
- Antwort: `DriveResponse`

### GET `/drives/years`
- Antwort: `number[]` (Jahre mit vorhandenen Fahrten)

### GET `/latestDrive`
- Antwort: `LocalDate` (yyyy-MM-dd) oder `204 No Content`

### GET `/latestDriveInfo`
- Antwort: `DriveResponse` oder `204 No Content`

### PUT `/drives`
- Zweck: Neue Fahrt anlegen
- Request-Body: `DriveRequest`
- Validierung:
  - Ohne `templateId`: `reason`, `fromLocation`, `toLocation`, `driveLength` sind Pflicht

### POST `/drives`
- Zweck: Bestehende Fahrt aktualisieren
- Request-Body: `DriveRequest` (mit `id`)

### DELETE `/drives/{id}`
- Zweck: Fahrt löschen

## Scan Entries

### POST `/scan-entries`
- Content-Type: `multipart/form-data`
- Felder: `type` (`START|ZIEL`), `timestamp` (ISO-OffsetDateTime), `latitude`, `longitude`, `photo`
- Antwort: `ScanEntryResponse`

### GET `/scan-entries/latest-start`
- Antwort: `ScanEntryResponse` oder `204 No Content`

### POST `/scan-entries/commit`
- Zweck: Erzeugt eine Fahrt aus Scan-Start/Ziel
- Request-Body: `ScanEntryCommitRequest`
- Antwort: `DriveResponse`

## User

### GET `/user`
- Antwort: `UserResponse` (Name, Version)

## Initialization

### GET `/initialization-status`
- Antwort: `InitializationStatusResponse` (`initialized: true|false`)

## DriveTemplates

### GET `/driveTemplates`
- Antwort: `DriveTemplateResponse[]`

### GET `/driveTemplates/{id}`
- Antwort: `DriveTemplateResponse`

### PUT `/driveTemplates`
- Zweck: Neue Vorlage anlegen
- Request-Body: `DriveTemplateRequest`

### POST `/driveTemplates`
- Zweck: Vorlage aktualisieren
- Request-Body: `DriveTemplateRequest` (mit `id`)

### DELETE `/driveTemplates/{id}`
- Hinweis: Löschen nur möglich, wenn keine Fahrt diese Vorlage referenziert (409 sonst)

## DTOs (Auszug)

### DriveRequest
```
{
  id: string | null,
  date: LocalDate (yyyy-MM-dd),
  templateId: string | null,
  reason: Reason | null,
  fromLocation: string | null,
  toLocation: string | null,
  driveLength: number | null
}
```

### DriveResponse
```
{
  id: string,
  date: LocalDate,
  template: DriveTemplateResponse | null,
  reason: Reason | null,
  fromLocation: string | null,
  toLocation: string | null,
  driveLength: number | null
}
```

### ScanEntryResponse
```
{
  id: string,
  type: ScanType,
  timestamp: OffsetDateTime,
  latitude: number,
  longitude: number,
  address: string | null,
  kmStand: number
}
```

### ScanEntryCommitRequest
```
{
  startId: string,
  endId: string,
  startKmStand: number | null,
  endKmStand: number | null,
  startAddress: string | null,
  endAddress: string | null
}
```

### UserResponse
```
{
  name: string,
  version: string
}
```

### InitializationStatusResponse
```
{
  initialized: boolean
}
```
