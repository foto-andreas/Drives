# Datenmodelle (Frontend)

## TypeScript-Interfaces

### `Drive`
```
interface Drive {
  id?: string | null;
  template: DriveTemplate | null;
  date: Date;
  reason?: ReasonKey | null;
  fromLocation?: string | null;
  toLocation?: string | null;
  driveLength?: number | null;
}
```

### `DriveFilter`
```
interface DriveFilter {
  year: number | null;
  month: number | null;
  reason: string | null;
}
```

### `DriveRequest`
```
interface DriveRequest {
  id?: string | null;
  templateId: string | null;
  date: string; // yyyy-MM-dd
  reason?: ReasonKey | null;
  fromLocation?: string | null;
  toLocation?: string | null;
  driveLength?: number | null;
}
```

### `DriveTemplate`
```
interface DriveTemplate {
  id?: string | null;
  name: string;
  driveLength: number;
  fromLocation: string;
  toLocation: string;
  reason: ReasonKey;
}
```

### `ScanEntry`
```
type ScanType = 'START' | 'ZIEL';

interface ScanEntry {
  id: string;
  type: ScanType;
  timestamp: Date;
  latitude: number;
  longitude: number;
  address: string | null;
  kmStand: number;
}
```

### `UserResponse`
```
interface UserResponse {
  name: string;
  version: string;
}
```

### `InitializationStatusResponse`
```
interface InitializationStatusResponse {
  initialized: boolean;
}
```

### `Reason`
```
export enum Reason {
  WORK = "Arbeit",
  ESTATE = "Haus",
  HOME = "HomeOffice",
  PRIVATE = "privat",
  OTHER = "sonstiges"
}

export type ReasonKey = keyof typeof Reason;
```

## Hinweise
- Der Client priorisiert in Anzeige und CSV-Export die expliziten Fahrtwerte gegenüber Vorlagenwerten.
- Beim Öffnen des Grund-Selects in `DriveForm` wird – falls leer – der Grund aus der gewählten Vorlage übernommen; beim Wechsel der Vorlage werden alle Override-Felder geleert.
