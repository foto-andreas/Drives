# API-Referenz (Backend)

Basis-URL: `/api`

## Drives

### GET `/drives`
- Query-Parameter (optional): `year`, `month`, `reason`
- Antwort: `DriveResponse[]`
- Anmerkung: Ergebnisse enthalten effektive Werte – explizite Fahrtwerte haben Vorrang vor Vorlagenwerten.

### GET `/drives/{id}`
- Antwort: `DriveResponse`

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
