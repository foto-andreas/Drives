# Services und State-Management (Client)

Services sind in Angular für die Geschäftslogik und die Kommunikation mit dem Backend zuständig. Sie sind als Singleton-Provider (`providedIn: 'root'`) implementiert.

## Core Services

### DriveService
Verantwortlich für alle Operationen im Zusammenhang mit Fahrten.
- **Backend-Kommunikation:** CRUD-Operationen via `HttpClient`.
- **State-Management:**
  - `lastSelectedDate`: Ein Readonly-Signal, das das zuletzt gewählte Datum speichert, um es beim nächsten Eintrag vorzubelegen.
  - `currentFilter`: Speichert den aktuellen Filterzustand (Jahr, Monat, Grund) für die Listenansicht.
  - `lastToLocation`: Merkt sich das zuletzt verwendete Ziel (für Vorlagen-Priorisierung).
- **Besonderheit:** Beinhaltet Mapping-Logik (`toDrive`, `toRequest`), um Datumsformate zwischen Backend (String) und Frontend (Date-Objekt) zu konvertieren.
- **Zusatz-Endpunkte:** `getLatestDriveDate`, `getLatestDrive`, `getYears`.

### DriveTemplateService
Verwaltet die Fahrtvorlagen.
- **Backend-Kommunikation:** CRUD-Operationen für `DriveTemplate`.
- Bietet eine einfache Schnittstelle zum Laden aller Vorlagen für Dropdowns in Formularen.

### ScanService
Verantwortlich für das Scannen von Start/Ziel.
- **Upload:** `POST /api/scan-entries` (Multipart mit Foto, GPS und Timestamp).
- **Latest-Start:** `GET /api/scan-entries/latest-start` (204 wenn kein Start verfügbar).
- **Commit:** `POST /api/scan-entries/commit` erzeugt eine Fahrt aus Scan-Daten, inkl. optionalem `reason` (Default: `OTHER`).

### InitializationService
Liest den Initialisierungsstatus der Tenant-Datenbank.
- **Endpoint:** `GET /api/initialization-status`
- **Nutzung:** App zeigt eine Toast-Nachricht, wenn eine neue DB initialisiert wurde.

### UserService
Lädt Informationen über den aktuell angemeldeten Benutzer.
- **Backend-Kommunikation:** Ruft `/api/user` ab.
- **State-Management:**
  - `name`: Ein Readonly-Signal, das den Namen des Benutzers enthält.
  - `version`: Ein Readonly-Signal mit der Server-Version.

## Helper

### ReasonHelper
Stellt statische Hilfsmethoden für den Umgang mit dem `Reason`-Enum bereit.
- `toString(reason)`: Wandelt einen Enum-Key (z.B. `WORK`) in sein lesbares Label (z.B. `Arbeit`) um.
- `keys()`: Gibt alle verfügbaren Keys des Enums zurück (nützlich für Select-Boxen).

## State-Management mit Signals

Die Anwendung nutzt Angular Signals, um Zustandsänderungen effizient zu verfolgen:

```typescript
// Beispiel aus DriveService
private readonly currentFilterSignal = signal<DriveFilter>({
  year: new Date().getFullYear(),
  month: new Date().getMonth() + 1,
  reason: null,
});

public readonly currentFilter = this.currentFilterSignal.asReadonly();
```

Vorteile:
- Automatische Aktualisierung der UI bei Änderungen.
- Kein explizites Subscribing notwendig in vielen Fällen.
- Bessere Performance durch feingranulare Change Detection.

## HTTP-Interceptor

### ErrorInterceptor
Zentrale Fehlerbehandlung: baut eine konsistente Fehlermeldung und zeigt einen Snackbar-Toast.

### InitializationInterceptor
Reagiert auf den Response-Header `X-Db-Initialized: true` und zeigt eine Erfolgsmeldung.

### Fehler-Toast unterdrücken
Mit `SUPPRESS_GLOBAL_ERROR_TOAST` (HttpContext) können einzelne Requests den globalen Error-Toast unterdrücken.
