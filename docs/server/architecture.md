# Architektur & Schichtenmodell (Backend)

Diese Anwendung folgt einem paketierten Schichtenmodell (package-by-feature, innerhalb der Module package-by-layer):

- API-Schicht (`...drives.api`): Controller, DTOs, Exception-Handler
- Domain-Schicht (`...drives.domain`): Entities, Commands, Mapper, Services, Repositories
- Konfiguration (`...config`): Security, WebConfig, Multitenancy, DataSource-Handling

## Hauptkomponenten

- DriveController/DriveTemplateController: REST-Endpunkte unter `/api`
- DriveService/DriveTemplateService: Transaktionale Geschäftslogik
- DriveRepository/DriveTemplateRepository: Spring Data JPA Repositories
- DriveMapper: Konsolidierung und Fallback von Vorlagenwerten zu Fahrten

## Wichtige Architekturentscheidungen

- Template ist optional: Eine Fahrt kann ohne Vorlage gespeichert werden. Ohne Vorlage sind `reason`, `fromLocation`, `toLocation`, `driveLength` Pflicht.
- Overrides statt Duplikate: Ist eine Vorlage gesetzt, werden Felder, die identisch zur Vorlage sind, vor dem Speichern auf `null` gesetzt. Der Mapper liefert zur Anzeige/Antwort stets den effektiven Wert (Fahrt > Vorlage).
- Abfrage-Transparenz: `DriveRepository.findFiltered(...)` nutzt einen `LEFT JOIN` auf `template`, damit Fahrten ohne Vorlage nicht aus Ergebnissen fallen.
- Multitenancy: Pro Benutzer/Tenant eigene H2-Datei (Produktiv: PostgreSQL möglich). Schema-Initialisierung und Migration sind automatisiert.

## Transaktionen

- Lesevorgänge: `@Transactional(readOnly = true)`
- Schreibvorgänge: `@Transactional` in Services

## Validierung

- Zentral in `DriveService.validateDrive(...)`: Ohne Vorlage sind genannte Pflichtfelder erforderlich; sonst wird reduziert gespeichert.
