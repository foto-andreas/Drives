# API-Referenz (Server)

Diese Dokumentation beschreibt die REST-Schnittstellen des Fahrtenbuch-Backends. Alle Endpunkte sind unter dem Präfix `/api` erreichbar.

## Basis-Konfiguration
- **Root-URL:** `/api`
- **Format:** JSON
- **Authentifizierung:** Über Spring Security (Details siehe Architektur-Dokumentation)
- **CORS:** Aktiviert (`@CrossOrigin`)

## Fahrten (Drives)

### Alle Fahrten abrufen
`GET /api/drives`

Gibt eine Liste aller Fahrten zurück, sortiert nach Datum aufsteigend.

**Antwort:** `200 OK` mit einer Liste von `DriveResponse`-Objekten.

### Einzelne Fahrt abrufen
`GET /api/drives/{id}`

**Antwort:** `200 OK` mit einem `DriveResponse`-Objekt oder `404 Not Found`.

### Letztes Fahrtdatum abrufen
`GET /api/latestDrive`

Gibt das Datum der zeitlich aktuellsten Fahrt zurück. Wird im Frontend verwendet, um das Standarddatum für neue Einträge vorzubelegen.

**Antwort:** `200 OK` mit ISO-Datum (z.B. `"2024-05-20"`) oder `204 No Content`, wenn keine Fahrten existieren.

### Neue Fahrt hinzufügen
`PUT /api/drives`

**Body:** `DriveRequest`
**Antwort:** `200 OK` mit der erstellten Fahrt.

### Fahrt aktualisieren
`POST /api/drives`

**Body:** `DriveRequest` (ID muss enthalten sein)
**Antwort:** `200 OK` mit der aktualisierten Fahrt.

### Fahrt löschen
`DELETE /api/drives/{id}`

**Antwort:** `200 OK`.

---

## Fahrtvorlagen (DriveTemplates)

### Alle Vorlagen abrufen
`GET /api/driveTemplates`

**Antwort:** `200 OK` mit einer Liste von `DriveTemplateResponse`-Objekten.

### Einzelne Vorlage abrufen
`GET /api/driveTemplates/{id}`

**Antwort:** `200 OK` mit einem `DriveTemplateResponse`-Objekt.

### Neue Vorlage hinzufügen
`PUT /api/driveTemplates`

**Body:** `DriveTemplateRequest`
**Antwort:** `200 OK` mit der erstellten Vorlage.

### Vorlage aktualisieren
`POST /api/driveTemplates`

**Body:** `DriveTemplateRequest` (ID muss enthalten sein)
**Antwort:** `200 OK` mit der aktualisierten Vorlage.

### Vorlage löschen
`DELETE /api/driveTemplates/{id}`

**Antwort:** `200 OK`. Falls die Vorlage noch in Fahrten verwendet wird, wird ein Fehler zurückgegeben (Abhängig von der Datenbank-Integrität/Service-Logik).

---

## Fehlerbehandlung

Das System verwendet eine globale Fehlerbehandlung (`GlobalExceptionHandler`), die ein einheitliches Fehlerformat zurückgibt.

| HTTP Status | Grund |
| :--- | :--- |
| `404 Not Found` | Ressource mit der angegebenen ID existiert nicht. |
| `400 Bad Request` | Validierungsfehler bei den Eingabedaten. |
| `409 Conflict` | Vorlage kann nicht gelöscht werden, da sie noch verwendet wird. |

**Fehler-Payload:**
```json
{
  "message": "Fehlerbeschreibung",
  "status": 404,
  "timestamp": "2024-05-20T12:00:00"
}
```
