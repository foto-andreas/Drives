# Komponenten (Client)

Das Frontend ist in mehrere Standalone-Komponenten unterteilt. Jede Komponente besteht typischerweise aus einer TypeScript-Klasse (`.ts`), einem HTML-Template (`.html`) und CSS-Styles (`.css`).

## Hauptkomponenten

### DriveList (`/drive-list`)
Die zentrale Ansicht zum Einsehen der Fahrten.
- **Funktionen:**
  - Tabellarische Anzeige der Fahrten.
  - Filterung nach Jahr, Monat und Grund.
  - CSV-Export der gefilterten Liste.
  - Löschen von Einträgen.
  - Verlinkung zur Bearbeitung.

### DriveForm (`/drive-form`)
Das Formular zum Erfassen und Ändern von Fahrten.
- **Funktionen:**
  - Auswahl einer Vorlage (Dropdown).
  - Datums-Eingabe (Vorbelegung mit dem Datum der letzten Fahrt oder heute).
  - Manueller Override des Grundes.
  - Validierung der Pflichtfelder.

### DriveTemplateList (`/drive-template-list`)
Verwaltung der Fahrtvorlagen.
- **Funktionen:**
  - Auflistung aller verfügbaren Vorlagen.
  - Button zum Erstellen neuer Vorlagen.
  - Bearbeiten und Löschen von Vorlagen.

### DriveTemplateForm (`/drive-template-form`)
Formular für Vorlagen.
- **Eingabefelder:** Name, Länge (km), Start, Ziel, Grund.
- **Besonderheit:** Der Name muss eindeutig sein (Backend-Validierung).

### AppComponent (`app.ts`)
Die Root-Komponente der Anwendung.
- Enthält das globale Navigationsmenü.
- Stellt den `router-outlet` bereit.

## Gemeinsame Verhaltensweisen

- **Reaktivität:** Komponenten reagieren auf Änderungen in den Services via Signals oder Observables.
- **Benutzerführung:** Nach erfolgreichem Speichern erfolgt in der Regel eine automatische Weiterleitung zur Listenansicht.
