# Frontend-Übersicht & Routing

Das Angular-Frontend ist als Single-Page-Application (SPA) konzipiert und bietet eine intuitive Benutzeroberfläche zur Erfassung und Verwaltung von Fahrten.

## 🚀 Routing-Struktur

Die Navigation innerhalb der Anwendung wird über den Angular Router gesteuert (Hash-Location via `withHashLocation()`).

| Pfad | Komponente | Beschreibung |
| :--- | :--- | :--- |
| `/drives` | `DriveList` | Hauptliste aller Fahrten mit Filtern und Export. |
| `/drives/new` | `DriveForm` | Erfassung einer neuen Fahrt. |
| `/drives/edit/:id` | `DriveForm` | Bearbeiten einer bestehenden Fahrt. |
| `/scan` | `Scan` | Scannen von Start/Ziel (Foto, GPS, OCR) und Übernahme als Fahrt. |
| `/driveTemplates` | `DriveTemplateList` | Verwaltung der Fahrtvorlagen. |
| `/driveTemplates/new` | `DriveTemplateForm` | Erstellung einer neuen Vorlage. |
| `/driveTemplates/edit/:id` | `DriveTemplateForm` | Bearbeiten einer Vorlage. |
| `/` | (Redirect) | Startseite leitet auf `/drives/new` weiter. |

## 🏗 Komponenten-Hierarchie

<p align="center">
  <img src="../diagrams/client-components-hierarchy.svg" alt="Komponenten-Hierarchie" style="max-width:min(100%, 960px); max-height:480px; width:auto; height:auto;">
</p>

Quelle: [`docs/diagrams/client-components-hierarchy.mmd`](../diagrams/client-components-hierarchy.mmd)

## 📱 Mobil-Optimierungen & UX

Die Anwendung ist "Mobile First" gestaltet, um die Erfassung direkt im Fahrzeug zu erleichtern.

### Listen-Aktionen
In den Listen (`DriveList`, `DriveTemplateList`) öffnet ein Zeilenklick die Bearbeitung. Löschen erfolgt über die sichtbare Aktionsspalte mit Bestätigungsdialog.

### Dynamische UI-Elemente
- **Pfeil-Separator:** In der Liste wird zwischen Start und Ziel ein Pfeil angezeigt. Bei `HOME` (Home-Office) wird dieser ausgeblendet, da kein physischer Weg zurückgelegt wurde.
- **Formular-Validierung:** Die Pflichtfelder passen sich dynamisch an, je nachdem ob eine Vorlage gewählt wurde oder nicht.
- **Scan-Flow:** Der Scan-Screen nutzt Geolocation und Foto-Upload (clientseitig auf max. 1280px skaliert und als JPEG komprimiert). Start- und Ziel-Scans werden per OCR (KM-Stand) und Reverse-Geocoding (Adresse) ergänzt; der Grund kann ausgewählt werden (Default `sonstiges`) und die Fahrt kann übernommen werden.

## 🛠 Technologien
- **Angular 21**
- **Angular Material** & **CDK**
- **Signals** (State-Management)
- **RxJS** (Streams/Interop)
- **Vitest** (Unit-Testing)
