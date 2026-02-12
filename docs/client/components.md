# Komponenten (Frontend)

## DriveForm
- Formular zum Anlegen/Bearbeiten einer Fahrt
- Template optional; ohne Vorlage sind `reason`, `fromLocation`, `toLocation`, `driveLength` Pflicht (Validatoren dynamisch)
- Beim Wechsel auf eine Vorlage werden Formularfelder `reason`, `fromLocation`, `toLocation`, `driveLength` geleert
- Öffnen des Grund-Selects übernimmt – falls leer – den Grund aus der Vorlage

## DriveList
- Liste mit Filtern (Reason/Jahr/Monat) und CSV-Export
- Anzeige „Von/Nach/Länge“: Explizite Fahrtwerte haben Priorität vor Vorlagenwerten
- Bei Grund `HOME` kein Pfeil zwischen Von/Nach
- Mobile: Swipe zum Löschen

## DriveTemplateForm
- Formular zum Anlegen/Bearbeiten von Vorlagen
- `driveLength`: bei Grund `HOME` ist `0` erlaubt, sonst `>= 1`

## DriveTemplateList
- Tabelle der Vorlagen mit Bearbeiten/Löschen
- Mobile: Swipe zum Löschen
