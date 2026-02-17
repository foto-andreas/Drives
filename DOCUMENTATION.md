# Projektdokumentation - Fahrtenbuch

Dieses Dokument dient als Einstiegspunkt für die gesamte Dokumentation des Fahrtenbuch-Projekts. Die Anwendung ermöglicht die effiziente Erfassung von Fahrten auf Basis von Vorlagen, inklusive Unterstützung für Home-Office-Tage und CSV-Export für die Steuererklärung.

## 🧭 Inhaltsverzeichnis

1.  [**Backend-Dokumentation (Server)**](#-backend-dokumentation-server)
2.  [**Frontend-Dokumentation (Client)**](#-frontend-dokumentation-client)
3.  [**Architektur & Design-Entscheidungen**](#-architektur--design-entscheidungen)
4.  [**Besonderheiten & Workflows**](#-besonderheiten--workflows)

---

## 🖥 Backend-Dokumentation (Server)

Das Backend ist mit Spring Boot 4 (Java 25) realisiert und verwaltet die Datenhaltung sowie die Geschäftslogik.

- 🏗 **[Architektur & Schichtenmodell](docs/server/architecture.md)**: Details zum Aufbau der Anwendung und der Schichtentrennung.
- 📊 **[Datenmodell](docs/server/data-model.md)**: ER-Diagramm und detaillierte Beschreibungen der Entities (`Drive`, `DriveTemplate`).
- 🔌 **[API-Referenz](docs/server/api.md)**: Dokumentation der REST-Endpunkte, DTOs und Fehlerbehandlung.
- 📦 **[Paket- & Klassenstruktur](docs/server/packages.md)**: Detaillierte Übersicht aller Java-Packages und Klassen-Verantwortlichkeiten.

---

## 🌐 Frontend-Dokumentation (Client)

Das Frontend basiert auf Angular 21 und bietet eine moderne, reaktive Benutzeroberfläche.

- 🚀 **[Übersicht & Routing](docs/client/overview.md)**: UI-Flow, Navigationsstruktur und Mobil-Optimierungen.
- 🧱 **[Komponenten](docs/client/components.md)**: Detaillierte Beschreibung der Formulare und Listenansichten.
- ⚙️ **[Services & State](docs/client/services.md)**: Kommunikation mit dem Backend und State-Management mittels Signals.
- 📄 **[Datenmodelle](docs/client/models.md)**: TypeScript-Interfaces und Enums für die clientseitige Datenhaltung.

---

## 🏗 Architektur & Design-Entscheidungen

### Schichtenmodell
Die Anwendung folgt einem klassischen Schichtenmodell (Controller -> Service -> Repository), wobei die Fachlogik strikt in den Services gekapselt ist.

```mermaid
---
config:
  layout: elk
---
graph LR
    User[Benutzer] <--> Angular[Angular Frontend]
    Angular <--> Spring[Spring Boot Backend]
    Spring <--> DB[(Datenbank)]
```

### Multitenancy (Mehrbenutzerbetrieb)
Jeder Benutzer arbeitet auf seiner eigenen Datenbank (isolierte Datenhaltung).
- **Identifikation:** Über Google OAuth2 (E-Mail).
- **Datenhaltung:** Pro Benutzer eine eigene H2-Datenbankdatei (oder PostgreSQL-Schema).
- **Automatisierung:** Schema-Erstellung und Migrationen erfolgen automatisch beim ersten Login.

---

## ✨ Besonderheiten & Workflows

### Flexibilität bei Fahrten
Fahrten können sowohl **mit** als auch **ohne** Vorlage erfasst werden.
- **Ohne Vorlage:** Alle fahrtrelevanten Daten (Von, Nach, Länge, Grund) müssen manuell eingegeben werden.
- **Mit Vorlage:** Die Vorlage liefert Standardwerte. Diese können jedoch individuell pro Fahrt überschrieben werden (Overrides).
- **Priorisierung:** In der Anzeige und im CSV-Export haben manuelle Overrides immer Vorrang vor den Vorlagenwerten.

### CSV-Export
Die Anwendung bietet einen integrierten CSV-Export in der Fahrtenliste. Dieser berücksichtigt die aktuell gesetzten Filter (Jahr, Monat, Grund), was die Vorbereitung der Steuererklärung erheblich vereinfacht.

### Home-Office Support
Über den speziellen Grund `HOME` können Home-Office-Tage erfasst werden. Auf Mobilgeräten wird hierbei die UI angepasst (kein Richtungspfeil), und in der Vorlagen-Definition ist für diesen Fall eine Länge von 0 km zulässig.

### Scan-Workflow
Die App unterstützt einen Scan-Flow für Start/Ziel: Geolocation + Foto werden hochgeladen, OCR liest den KM-Stand, Reverse-Geocoding ergänzt Adressen und der Nutzer kann daraus eine Fahrt erzeugen. Tesseract wird über `TESSERACT_PATH` konfiguriert, optionale Native-Libs über `OCR_LIBRARY_PATH`. Für Debugging können Zwischenbilder und OCR-Text über `OCR_DEBUG_ENABLED` und `OCR_DEBUG_DIR` ausgegeben werden; Details siehe `docs/server/architecture.md`.

---
> 💡 *Tipp: Weitere Informationen zum Deployment und zum Starten der Anwendung finden sich in der [README.md](README.md).*
