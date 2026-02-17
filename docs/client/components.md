# Komponenten (Frontend)

Detaillierte Beschreibung der zentralen UI-Bausteine der Anwendung.

## 📝 Formulare

### 1. `DriveForm`
Die wichtigste Komponente zur Datenerfassung.

| Feature | Beschreibung |
| :--- | :--- |
| **Vorlagen-Support** | Dropdown zur Auswahl einer `DriveTemplate`. Das Feld ist seit Version 0.0.1 optional. |
| **Dynamische Validierung** | Wenn kein Template gewählt ist, werden `reason`, `fromLocation`, `toLocation` und `driveLength` zu Pflichtfeldern (`Validators.required`). |
| **UX: Automatisches Ausfüllen** | Beim Auswählen einer Vorlage werden manuelle Eingaben geleert. Beim Öffnen des Grund-Selects wird der Vorlagen-Grund vorgeschlagen, sofern das Feld noch leer ist. |
| **Datumsvorbelegung** | Nutzt das `lastSelectedDate` aus dem `DriveService`, um die Erfassung mehrerer Fahrten hintereinander zu beschleunigen. |
| **Vorlagen-Sortierung** | Die Vorlagenliste priorisiert die zuletzt verwendete Zieladresse (`lastToLocation`) für schnelleren Zugriff. |

### 2. `DriveTemplateForm`
Zur Definition von Standardwegen.

| Feature | Beschreibung |
| :--- | :--- |
| **Validierung** | Alle Felder sind Pflichtfelder. |
| **Längen-Logik** | Bei Auswahl von `HOME` ist eine Länge von 0 km zulässig, bei allen anderen Gründen muss die Länge >= 1 km sein. |

### 3. `Scan`
Scan-Komponente zur Erfassung von Start/Ziel per Foto und GPS.

| Feature | Beschreibung |
| :--- | :--- |
| **Geolocation & Foto** | Erfasst Standort und Foto für `START`/`ZIEL`. |
| **OCR & Reverse-Geocoding** | OCR extrahiert den KM-Stand, Reverse-Geocoding ergänzt die Adresse. |
| **Commit-Logik** | Eine Fahrt wird nur erzeugt, wenn Start/Ziel vorhanden sind und die Strecke > 0 ist. |

## 📊 Listenansichten

### 1. `DriveList`
Zentrale Übersicht der Fahrten.

- **Filterleiste:** Ermöglicht Filtern nach Jahr (Pflicht für Monat), Monat und Grund.
- **Tabelle:** Zeigt Datum, Vorlagen-Name, Von/Nach (mit Pfeil-Logik), Länge und Grund.
- **CSV-Export:** Generiert eine CSV-Datei basierend auf den aktuell sichtbaren (gefilterten) Daten.
- **Swipe-Logic:** Implementiert `onRowTouchStart/Move/End`, um Zeilen auf Mobilgeräten nach links zu wischen (Lösch-Indikator).
- **Home-Office-Export:** Bei Grund `HOME` wird im Export die Anzahl statt Kilometer aggregiert.

### 2. `DriveTemplateList`
Verwaltung der verfügbaren Vorlagen.

- Zeigt Name, Strecke und Standard-Grund.
- Implementiert dieselbe Swipe-Geste zum Löschen wie die Fahrtenliste.

## 🏗 Gemeinsame Features

### Sticky Table Header & Scroll Container
Beide Listen-Komponenten nutzen einen `.table-container` in ihrem CSS:
```css
.table-container {
  max-height: 75vh; /* Mobil */
  overflow: auto;
}
@media (min-width: 600px) {
  .table-container {
    max-height: 80vh; /* Desktop */
  }
}
```
Dies stellt sicher, dass die Tabellenüberschriften und Filter beim Scrollen sichtbar bleiben.

### ReasonHelper Integration
Alle Komponenten nutzen den `ReasonHelper`, um die technischen Enum-Keys (`WORK`, `PRIVATE`, etc.) in lokalisierte Strings ("Arbeit", "Privat") für die Anzeige umzuwandeln.
