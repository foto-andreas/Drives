# Paket- & Klassenstruktur (Backend)

Dieses Dokument beschreibt die interne Organisation des Backends, die Verantwortlichkeiten der einzelnen Pakete und die darin enthaltenen Klassen.

## 🏗 Architektur-Übersicht

Das Backend folgt einem Schichtenmodell, wobei die Geschäftslogik in der Domänenschicht konzentriert ist.

```mermaid
graph TD
    subgraph API-Layer
        C[Controller] --> DTO[DTOs]
        H[GlobalExceptionHandler]
    end
    subgraph Domain-Layer
        S[Services] --> CMD[Commands]
        S --> M[Mapper]
        S --> R[Repositories]
        R --> E[Entities]
    end
    subgraph Config-Layer
        MT[Multitenancy]
        SC[Security/WebConfig]
    end
    C --> S
    M --> DTO
    M --> E
```

## 📦 Paket-Details

### 1. `de.schrell.drives.config`
Konfigurationsklassen für das Framework und die Infrastruktur.

| Klasse | Beschreibung |
| :--- | :--- |
| `SecurityConfig` | Konfiguration von Spring Security (OAuth2 Login, CSRF, Authorisierung). |
| `WebConfig` | Web-spezifische Einstellungen (z.B. CORS-Header). |

#### 📂 `config.multitenancy`
Spezialisierte Logik für den Mehrbenutzerbetrieb mit getrennten Datenbanken.

| Klasse | Beschreibung |
| :--- | :--- |
| `MultiTenantDataSourceConfiguration` | Erzeugt dynamisch DataSources basierend auf dem Tenant-ID. Übernimmt die Erstinitialisierung (`CREATE TABLE`) und Schema-Migration (`ALTER TABLE`). |
| `InitializationNotificationFilter` | Ein Servlet-Filter, der den Initialisierungsstatus im HTTP-Header `X-Db-Initialized` mitschickt. |
| `InitializationTracker` | Hält den Status bereit, ob ein Tenant bereits initialisiert wurde. |

### 2. `de.schrell.drives.drives.api`
Die Schnittstelle nach außen.

#### 📂 `api.controllers`
REST-Endpunkte für die Kommunikation mit dem Frontend.

| Klasse | Beschreibung |
| :--- | :--- |
| `DriveController` | Endpunkte für Fahrten (`/api/drives`, `/api/latestDrive`). |
| `DriveTemplateController` | Endpunkte für Fahrtvorlagen (`/api/driveTemplates`). |

#### 📂 `api.dtos`
Data Transfer Objects (Java Records) für Request/Response.

| Klasse | Beschreibung |
| :--- | :--- |
| `DriveRequest` / `DriveResponse` | Repräsentation einer Fahrt. |
| `DriveTemplateRequest` / `DriveTemplateResponse` | Repräsentation einer Vorlage. |
| `ErrorResponse` | Standardisiertes Fehlerformat für den `GlobalExceptionHandler`. |

#### 📂 `api.handlers`
| Klasse | Beschreibung |
| :--- | :--- |
| `GlobalExceptionHandler` | Zentrales Error-Handling mit `@RestControllerAdvice`. Wandelt Exceptions in `ErrorResponse` um. |

### 3. `de.schrell.drives.drives.domain`
Der Kern der Anwendung.

#### 📂 `domain.services`
Zentrale Geschäftslogik und transaktionale Grenzen.

| Klasse | Beschreibung |
| :--- | :--- |
| `DriveService` | Steuert das Erstellen, Ändern und Löschen von Fahrten. Implementiert die Validierung (Pflichtfelder ohne Vorlage) und die Redundanzprüfung (Löschen von Werten, die dem Template entsprechen). |
| `DriveTemplateService` | Verwaltet Vorlagen. Verhindert das Löschen von Vorlagen, die noch in Fahrten referenziert werden. |

#### 📂 `domain.repositories`
Spring Data JPA Schnittstellen.

| Klasse | Beschreibung |
| :--- | :--- |
| `DriveRepository` | Beinhaltet die komplexe `findFiltered`-Abfrage mit `LEFT JOIN`, um Fahrten ohne Template nicht zu verlieren. |
| `DriveTemplateRepository` | Standardzugriff auf Vorlagen, sortiert nach Name. |

#### 📂 `domain.mappers`
| Klasse | Beschreibung |
| :--- | :--- |
| `DriveMapper` | Komponente zur Konvertierung zwischen Entities und DTOs. Implementiert die Fallback-Logik (Fahrtwert vor Templatewert). |

#### 📂 `domain.entities`
JPA-Entities (Datenbanktabellen).

| Klasse | Beschreibung |
| :--- | :--- |
| `Drive` | Repräsentiert eine Fahrt. Enthält optionale Override-Felder. |
| `DriveTemplate` | Repräsentiert eine wiederverwendbare Vorlage. |
| `Reason` | Enum für den Grund einer Fahrt (WORK, HOME, PRIVATE, etc.). |

#### 📂 `domain.commands`
Interne Datenstrukturen für Schreiboperationen.

| Klasse | Beschreibung |
| :--- | :--- |
| `DriveCommand` | Kapselt die Daten zum Anlegen/Ändern einer Fahrt. |
| `DriveTemplateCommand` | Kapselt die Daten zum Anlegen/Ändern einer Vorlage. |

## 💡 Besonderheiten der Implementierung

- **Lombok-Nutzung:** Es wird konsequent Lombok (`@Getter`, `@Setter`, `@RequiredArgsConstructor`) eingesetzt, um Boilerplate-Code zu vermeiden.
- **Transaction Management:** `@Transactional` wird auf Service-Ebene genutzt, um die Konsistenz der Datenbank sicherzustellen.
- **Validierung:** Jakarta Validation (`@NotNull`, `@NotBlank`) wird in den DTOs verwendet; komplexe fachliche Validierung findet in den Services statt.
