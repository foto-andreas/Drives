# Frontend-Übersicht & Routing

Das Angular-Frontend bietet drei Hauptansichten:

- Fahrt anlegen/bearbeiten (`/drives/new`, `/drives/edit/:id`): Komponente `DriveForm`
- Fahrtenliste (`/drives`): Komponente `DriveList` inkl. CSV-Export
- Vorlagenliste/-formular (`/driveTemplates`, `/driveTemplates/new`, `/driveTemplates/edit/:id`): `DriveTemplateList`, `DriveTemplateForm`

## Navigation & Layout
- Obere `mat-toolbar` mit Burger-Menü
- Sidenav mit Links zu Fahrten, Neue Fahrt, Vorlagen
- Inhalt wird im `mat-sidenav-content` gerendert

## Mobil-Optimierungen
- Swipe-Geste auf Zeilen zum schnellen Löschen (Bestätigungs-Dialog)
- In Listen ist nur die Tabelle scrollbar; Header/Filter bleiben stehen
- Pfeil „Von → Nach“ wird bei Grund `HOME` unterdrückt
- Tooltips in Vorlagen-Combobox wurden entfernt (bessere Scrollbarkeit auf Mobilgeräten)
