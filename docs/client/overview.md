# Frontend-Übersicht & Routing

Das Angular-Frontend ist als Single-Page-Application (SPA) konzipiert und bietet eine intuitive Benutzeroberfläche zur Erfassung und Verwaltung von Fahrten.

## 🚀 Routing-Struktur

Die Navigation innerhalb der Anwendung wird über den Angular Router gesteuert.

| Pfad | Komponente | Beschreibung |
| :--- | :--- | :--- |
| `/drives` | `DriveList` | Hauptliste aller Fahrten mit Filtern und Export. |
| `/drives/new` | `DriveForm` | Erfassung einer neuen Fahrt. |
| `/drives/edit/:id` | `DriveForm` | Bearbeiten einer bestehenden Fahrt. |
| `/driveTemplates` | `DriveTemplateList` | Verwaltung der Fahrtvorlagen. |
| `/driveTemplates/new` | `DriveTemplateForm` | Erstellung einer neuen Vorlage. |
| `/driveTemplates/edit/:id` | `DriveTemplateForm` | Bearbeiten einer Vorlage. |
| `**` | (Redirect) | Unbekannte Pfade leiten zur Fahrtenliste (`/drives`) weiter. |

## 🏗 Komponenten-Hierarchie

```mermaid
graph TD
    AppComponent --> Toolbar[MatToolbar]
    AppComponent --> Sidenav[MatSidenav]
    Sidenav --> NavList[MatNavList]
    AppComponent --> Content[RouterOutlet]
    Content --> DL[DriveList]
    Content --> DF[DriveForm]
    Content --> TL[DriveTemplateList]
    Content --> TF[DriveTemplateForm]
```

## 📱 Mobil-Optimierungen & UX

Die Anwendung ist "Mobile First" gestaltet, um die Erfassung direkt im Fahrzeug zu erleichtern.

### Swipe-to-Delete
In den Listen (`DriveList`, `DriveTemplateList`) können Zeilen nach links gewischt werden, um eine Lösch-Aktion freizulegen. Dies ermöglicht eine schnelle Verwaltung ohne dedizierte Buttons in jeder Zeile auf kleinen Bildschirmen.

### Scroll-Verhalten
Um die Übersichtlichkeit zu wahren, wurde ein spezielles CSS-Layout implementiert:
- Die Filter und Aktions-Buttons oben bleiben statisch (Sticky-Header-Effekt).
- Nur der Tabelleninhalt (`mat-table`) innerhalb des `table-container` ist vertikal scrollbar.

### Dynamische UI-Elemente
- **Pfeil-Separator:** In der Liste wird zwischen Start und Ziel ein Pfeil angezeigt. Bei `HOME` (Home-Office) wird dieser ausgeblendet, da kein physischer Weg zurückgelegt wurde.
- **Formular-Validierung:** Die Pflichtfelder passen sich dynamisch an, je nachdem ob eine Vorlage gewählt wurde oder nicht.

## 🛠 Technologien
- **Angular 19**
- **Angular Material** (UI-Komponenten)
- **Signals** (State-Management)
- **Bootstrap 5** (Utility-Klassen für Layout)
- **Karma/Vitest** (Unit-Testing)
