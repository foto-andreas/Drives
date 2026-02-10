# Paket- und Klassenstruktur (Server)

Dieses Dokument bietet einen detaillierten Überblick über die Pakete und Klassen des Backends.

## de.schrell.drives
Das Basis-Paket der Anwendung.

| Klasse | Beschreibung |
| :--- | :--- |
| `FahrtenApplication` | Die Hauptklasse der Spring Boot Anwendung. |
| `SecurityConfig` | Konfiguration der Sicherheitseinstellungen (OAuth2-Login, CSRF-Handling, CORS-Unterstützung). |

## de.schrell.drives.config.multitenancy
Konfiguration und Infrastruktur für Multitenancy.

| Klasse | Beschreibung |
| :--- | :--- |
| `MultiTenantDataSourceConfiguration` | Erstellt tenant-spezifische DataSources und leitet die DB-URL dynamisch aus der Basis-URL ab. |
| `TenantAwareRoutingDataSource` | Routing-DataSource, die anhand des aktuellen Tenants die richtige DataSource auswählt. |
| `TenantContext` | ThreadLocal-Container für den aktuell aktiven Tenant. |
| `TenantFilter` | Filter zur Ermittlung des Tenants aus dem OAuth2-Principal. |
| `DatabaseInitializationTracker` | Merkt sich Initialisierungen pro Tenant und liefert den Status zurück. |
| `InitializationNotificationFilter` | Setzt `X-Db-Initialized`, wenn eine Initialisierung erfolgt ist. |

## de.schrell.drives.drives.api
Enthält die Web-Schicht der Anwendung (Controller und DTOs).

### controllers
| Klasse | Beschreibung |
| :--- | :--- |
| `DriveController` | REST-Endpunkte für die Verwaltung von Fahrten. |
| `DriveTemplateController` | REST-Endpunkte für die Verwaltung von Fahrtvorlagen. |
| `UserController` | REST-Endpunkt für den Abruf des aktuell angemeldeten Benutzers. |

### dtos
| Klasse | Beschreibung |
| :--- | :--- |
| `DriveRequest` | Record für Eingabedaten beim Erstellen/Aktualisieren einer Fahrt. |
| `DriveResponse` | Record für die Rückgabe von Fahrtdaten an das Frontend. |
| `DriveTemplateRequest` | Record für Eingabedaten für Fahrtvorlagen. |
| `DriveTemplateResponse` | Record für die Rückgabe von Fahrtvorlagen. |
| `UserResponse` | Record für die Rückgabe des Benutzernamens. |
| `ErrorResponse` | Standardisiertes Format für Fehlermeldungen. |

### handlers
| Klasse | Beschreibung |
| :--- | :--- |
| `GlobalExceptionHandler` | Fängt Ausnahmen anwendungsweit ab und wandelt sie in `ErrorResponse`-Objekte um. |

## de.schrell.drives.drives.domain
Enthält die Kernlogik und den Datenzugriff.

### entities
| Klasse | Beschreibung |
| :--- | :--- |
| `Drive` | JPA-Entity für eine Fahrt. |
| `DriveTemplate` | JPA-Entity für eine Fahrtvorlage. |
| `Reason` | Enum für den Grund einer Fahrt. |

### services
| Klasse | Beschreibung |
| :--- | :--- |
| `DriveService` | Implementiert die Geschäftslogik für Fahrten (Validierung, Normalisierung). |
| `DriveTemplateService` | Implementiert die Geschäftslogik für Fahrtvorlagen. |

### repositories
| Klasse | Beschreibung |
| :--- | :--- |
| `DriveRepository` | Spring Data JPA Repository für den Zugriff auf die `Drive`-Tabelle. |
| `DriveTemplateRepository` | Spring Data JPA Repository für den Zugriff auf die `DriveTemplate`-Tabelle. |

### mappers
| Klasse | Beschreibung |
| :--- | :--- |
| `DriveMapper` | Komponente zur Konvertierung zwischen Entities und DTOs. Nutzt teilweise manuelle Logik zur Auflösung von Beziehungen. |

### commands
| Klasse | Beschreibung |
| :--- | :--- |
| `DriveCommand` | Immutable Objekt, das Daten für Schreiboperationen im `DriveService` transportiert. |
| `DriveTemplateCommand` | Immutable Objekt für Schreiboperationen im `DriveTemplateService`. |

### exceptions
| Klasse | Beschreibung |
| :--- | :--- |
| `ResourceNotFoundException` | Wird geworfen, wenn eine angeforderte ID nicht existiert. |
| `DriveTemplateInUseException` | Wird geworfen, wenn versucht wird, eine Vorlage zu löschen, die noch referenziert wird. |
