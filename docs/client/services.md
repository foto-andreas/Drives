# Services und State-Management (Client)

Services sind in Angular für die Geschäftslogik und die Kommunikation mit dem Backend zuständig. Sie sind als Singleton-Provider (`providedIn: 'root'`) implementiert.

## Core Services

### DriveService
Verantwortlich für alle Operationen im Zusammenhang mit Fahrten.
- **Backend-Kommunikation:** CRUD-Operationen via `HttpClient`.
- **State-Management:**
  - `lastSelectedDate`: Ein Readonly-Signal, das das zuletzt gewählte Datum speichert, um es beim nächsten Eintrag vorzubelegen.
  - `currentFilter`: Speichert den aktuellen Filterzustand (Jahr, Monat, Grund) für die Listenansicht.
- **Besonderheit:** Beinhaltet Mapping-Logik (`toDrive`, `toRequest`), um Datumsformate zwischen Backend (String) und Frontend (Date-Objekt) zu konvertieren.

### DriveTemplateService
Verwaltet die Fahrtvorlagen.
- **Backend-Kommunikation:** CRUD-Operationen für `DriveTemplate`.
- Bietet eine einfache Schnittstelle zum Laden aller Vorlagen für Dropdowns in Formularen.

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
