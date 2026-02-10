# Datenmodelle (Client)

Das Frontend verwendet TypeScript-Interfaces, um die Struktur der Datenobjekte zu definieren und Typsicherheit zu gewährleisten.

## Interfaces

### Drive
Repräsentiert eine Fahrt innerhalb der Anwendung.

```typescript
export interface Drive {
  id?: string | null;
  template: DriveTemplate | null;
  date: Date;
  reason?: ReasonKey | null;
}
```

### DriveRequest
Spezielle Struktur für den Versand von Fahrtdaten an das Backend.

```typescript
export interface DriveRequest {
  id?: string | null;
  templateId: string | null;
  date: string; // ISO-String Format
  reason?: ReasonKey | null;
}
```

### DriveTemplate
Repräsentiert eine Fahrtvorlage.

```typescript
export interface DriveTemplate {
  id?: string | null;
  name: string;
  driveLength: number;
  fromLocation: string;
  toLocation: string;
  reason: ReasonKey;
}
```

### DriveFilter
Definiert die Kriterien für die Filterung der Fahrtenliste.

```typescript
export interface DriveFilter {
  year: number;
  month: number;
  reason: ReasonKey | null;
}
```

### UserResponse
Rückgabedatentyp des Benutzer-Endpunkts.

```typescript
export interface UserResponse {
  name: string;
}
```

## Enums

### Reason
Definiert die Kategorien einer Fahrt. Das Enum im Frontend enthält zusätzlich die deutschen Labels für die Anzeige.

```typescript
export enum Reason {
  WORK = "Arbeit",
  ESTATE = "Haus",
  HOME = "HomeOffice",
  PRIVATE = "privat",
  OTHER = "sonstiges"
}
```

## Mapping
Da das Backend Datumsangaben als Strings (`YYYY-MM-DD`) liefert, das Frontend jedoch mit `Date`-Objekten arbeitet, findet im `DriveService` ein Mapping statt. Dies stellt sicher, dass Komponenten direkt mit nativen Datumsfunktionen arbeiten können.
