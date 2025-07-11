# Einbürgerungstest Quiz App

## Überblick

Dies ist eine Übungsanwendung für den deutschen Einbürgerungstest, die mit React und Express entwickelt wurde. Die App ermöglicht es Nutzern, mit offiziellen Fragen für den deutschen Einbürgerungstest zu üben, ihren Fortschritt zu verfolgen und ihre Lernerfahrung anzupassen.

## Systemarchitektur

### Frontend-Architektur
- **Framework**: React 18 mit TypeScript
- **Routing**: Wouter für clientseitiges Routing
- **Zustandsmanagement**: TanStack Query (React Query) für Server-Zustandsmanagement
- **UI-Komponenten**: Radix UI-Primitive mit benutzerdefinierten shadcn/ui-Komponenten
- **Styling**: Tailwind CSS mit CSS-Variablen für Theming
- **Build-Tool**: Vite mit React-Plugin

### Backend-Architektur
- **Laufzeit**: Node.js mit Express.js
- **Sprache**: TypeScript (ESM-Module)
- **Datenbank**: PostgreSQL mit Drizzle ORM
- **Datenbank-Anbieter**: Neon Database (@neondatabase/serverless)
- **Speicher**: DatabaseStorage-Implementierung mit PostgreSQL
- **API**: RESTful API-Endpunkte
- **Statische Assets**: Express Static Middleware für Fragenbilder

### Hauptkomponenten

#### Datenbankschema
- **Fragen-Tabelle**: Speichert Quizfragen mit Multiple-Choice-Antworten, korrekten Antworten, Erklärungen und Kategorien
- **Quiz-Sitzungen-Tabelle**: Verfolgt abgeschlossene Quizversuche mit Ergebnissen und Leistungsmetriken
- **Benutzereinstellungen-Tabelle**: Speichert Benutzerpräferenzen für Quiz-Anpassungen

#### Kernfunktionen
- **Quiz-Modi**: Volltest-Modus (33 Fragen) und Übungsmodus
- **Fragenverwaltung**: Zufällige Fragenauswahl mit Mischoptionen
- **Fortschrittsverfolgung**: Sitzungshistorie, Statistiken und Leistungsanalysen
- **Anpassbare Einstellungen**: Timer, sofortiges Feedback, Fragenmischung
- **Responsives Design**: Mobile-First-Ansatz mit adaptiver Benutzeroberfläche

#### Speichersystem
- **IStorage-Interface**: Abstraktionsschicht für Datenpersistierung
- **DatabaseStorage-Implementierung**: PostgreSQL-Speicher mit Drizzle ORM
- **Echte Fragendaten**: 460 offizielle deutsche Einbürgerungstest-Fragen aus Excel geladen (300 Bundesfragen + 160 Landesfragen)
- **Bildunterstützung**: 7 Fragen mit visuellem Inhalt (Bilder) ordnungsgemäß integriert

## Datenfluss

1. **Quiz-Initialisierung**: Benutzer wählt Quiz-Typ → Frontend fordert zufällige Fragen an → Backend ruft Fragen aus Datenbank ab
2. **Fragenanzeige**: Fragen mit Multiple-Choice-Optionen gerendert → Benutzerauswahlen im lokalen Zustand verfolgt
3. **Antwortübermittlung**: Benutzerantworten lokal gespeichert → Fortschritt in Echtzeit berechnet
4. **Quiz-Abschluss**: Endergebnisse berechnet → Sitzungsdaten an Backend gesendet → Ergebnisse in Datenbank gespeichert
5. **Statistiken**: Historische Daten für Fortschrittsverfolgung und Analysen abgerufen

## Externe Abhängigkeiten

### Kern-Framework-Abhängigkeiten
- **@tanstack/react-query**: Server-Zustandsmanagement und Caching
- **drizzle-orm**: Typsichere Datenbank-ORM
- **@neondatabase/serverless**: PostgreSQL-Datenbankverbindung
- **wouter**: Leichtgewichtiges clientseitiges Routing

### UI- und Styling-Abhängigkeiten
- **@radix-ui/***: Headless UI-Komponenten für Barrierefreiheit
- **tailwindcss**: Utility-First CSS-Framework
- **class-variance-authority**: Komponentenvarianten-Management
- **clsx**: Bedingte Klassenname-Utility

### Entwicklungsabhängigkeiten
- **vite**: Build-Tool und Entwicklungsserver
- **typescript**: Typprüfung und Kompilierung
- **@replit/vite-plugin-***: Replit-spezifische Entwicklungstools

## Deployment-Strategie

### Entwicklungsumgebung
- **Lokale Entwicklung**: Vite Dev-Server mit Hot Module Replacement
- **Datenbank**: Umgebungsvariable `DATABASE_URL` für Verbindung
- **Build-Prozess**: Vite baut Frontend, esbuild bündelt Backend

### Produktions-Build
- **Frontend**: Statische Assets in `dist/public` gebaut
- **Backend**: Gebündelte Node.js-Anwendung in `dist/index.js`
- **Datenbank-Migrationen**: Drizzle Kit behandelt Schema-Migrationen
- **Umgebung**: Produktionsmodus mit optimierten Builds

### Konfiguration
- **Umgebungsvariablen**: `DATABASE_URL`, `NODE_ENV`
- **TypeScript**: Strenger Modus aktiviert mit Pfad-Mapping
- **Modulsystem**: ESM-Module in der gesamten Anwendung

## Fragensystem Übersicht

Das System enthält jetzt alle 460 offiziellen Einbürgerungstest-Fragen basierend auf dem originalen Excel-Sheet:

### Bundesweite Fragen (300 Fragen)
- **Excel-Zeilen:** 2-301 (Spalte B = "Alle")
- **Datenbank-IDs:** 1-300
- **Anzahl:** 300 Fragen
- **Bilderfragen:** 7 bekannte Bilderfragen (IDs: 21, 55, 70, 130, 176, 181, 187)

### Bundesländer-Fragen (160 Fragen)
Basierend auf dem originalen Excel-Sheet (Zeilen 302-461):

| Bundesland | Zeilen im Excel | Datenbank IDs | Anzahl Fragen | Bilderfragen | Status |
|------------|-----------------|---------------|---------------|--------------|---------|
| Baden-Württemberg | 302-311 | 301-310 | 10 | 2 (Frage 1+8) | ✅ Vollständig |
| Bayern | 312-321 | 311-320 | 10 | 2 (Frage 1+8) | ✅ Vollständig mit Bildern |
| Berlin | 322-331 | 321-330 | 10 | 2 (Frage 1+8) | ✅ Vollständig mit Bildern |
| Brandenburg | 332-341 | 331-340 | 10 | 2 (Frage 1+8) | ✅ Vollständig mit Bildern |
| Bremen | 342-351 | 341-350 | 10 | 2 (Frage 1+8) | ✅ Vollständig mit Bildern |
| Hamburg | 352-361 | 351-360 | 10 | 2 (Frage 1+8) | ✅ Vollständig mit Bildern |
| Hessen | 362-371 | 361-370 | 10 | 2 (Frage 1+8) | ✅ Vollständig mit Bildern |
| Mecklenburg-Vorpommern | 372-381 | 371-380 | 10 | 2 (Frage 1+8) | ✅ Vollständig mit Bildern |
| Niedersachsen | 382-391 | 381-390 | 10 | 2 (Frage 1+8) | ✅ Vollständig mit Bildern |
| Nordrhein-Westfalen | 392-401 | 391-400 | 10 | 2 (Frage 1+8) | ✅ Vollständig mit Bildern |
| Rheinland-Pfalz | 402-411 | 401-410 | 10 | 2 (Frage 1+8) | ✅ Vollständig mit Bildern |
| Saarland | 412-421 | 411-420 | 10 | 2 (Frage 1+8) | ✅ Vollständig mit Bildern |
| Sachsen | 422-431 | 421-430 | 10 | 2 (Frage 1+8) | ✅ Vollständig mit Bildern |
| Sachsen-Anhalt | 432-441 | 431-440 | 10 | 2 (Frage 1+8) | ✅ Vollständig mit Bildern |
| Schleswig-Holstein | 442-451 | 441-450 | 10 | 2 (Frage 1+8) | ✅ Vollständig mit Bildern |
| Thüringen | 452-461 | 451-460 | 10 | 2 (Frage 1+8) | ✅ Vollständig mit Bildern |

**Gesamt:** 160 Bundesländer-Fragen (16 Bundesländer × 10 Fragen)

## Fragensystem Zusammenfassung
- **Bundesweite Fragen:** 300 (IDs 1-300, Excel-Zeilen 2-301)
- **Bundesländer-Fragen:** 160 (IDs 301-460, Excel-Zeilen 302-461)
- **Gesamtfragen:** 460 offizielle Einbürgerungstest-Fragen

### Bilderfragen-Schema
- **Frage 1 jedes Bundeslandes:** Wappenfrage ("Welches Wappen gehört zu...")
- **Frage 8 jedes Bundeslandes:** Kartenidentifikation ("Welches Bundesland ist...")

### Hinweis zu Bildern
Die Bilderfragen sind in der Datenbank markiert (`has_image: true`), aber die tatsächlichen Bilddateien müssen noch bereitgestellt werden. Die Pfade folgen dem Schema: `state_[bundesland]_[fragenummer].png`

## Änderungsprotokoll

Entwicklungshistorie:
- 28. Juni 2025. Erstmalige Einrichtung mit vollständigem Quiz-System
- 28. Juni 2025. PostgreSQL-Datenbankintegration mit Drizzle ORM hinzugefügt
- 28. Juni 2025. 376 echte deutsche Einbürgerungstest-Fragen aus Excel integriert
- 28. Juni 2025. Bildunterstützung für 7 visuelle Fragen mit statischer Asset-Bereitstellung hinzugefügt
- 28. Juni 2025. Deutsches Bundesland-Auswahlsystem für Erstnutzer hinzugefügt
- 28. Juni 2025. Bundesland-spezifische Quiz-Logik implementiert (30 Bundesfragen + 3 Landesfragen)
- 28. Juni 2025. Benutzereinstellungen erweitert um ausgewähltes Bundesland und Erstnutzung-Tracking
- 29. Juni 2025. Zwei zusätzliche Baden-Württemberg-Fragen (IDs 377-378) mit visuellem Inhalt hinzugefügt
- 29. Juni 2025. Baden-Württemberg-Fragensatz auf 8 Gesamtfragen für umfassende Landesübung erweitert
- 29. Juni 2025. **Vollständige Korrektur der Bundesländer-Fragen:** Implementierung aller 160 offiziellen Fragen (16 Bundesländer × 10 Fragen) basierend auf korrekter Excel-Zuordnung (Zeilen 302-461)
- 29. Juni 2025. **Korrektur der bundesweiten Fragen:** Aktualisierung auf korrekte 300 bundesweite Fragen basierend auf Excel-Zeilen 2-301 (Spalte B = "Alle"). Gesamtsystem jetzt mit allen 460 offiziellen Fragen vollständig.
- 29. Juni 2025. Bayern-Bilderfragen hinzugefügt: Wappen-Frage (ID 311) und Karten-Frage (ID 318) mit offiziellen Bildern verknüpft.
- 29. Juni 2025. Berlin-Bilderfragen hinzugefügt: Wappen-Frage (ID 321) und Karten-Frage (ID 328) mit offiziellen Bildern verknüpft.
- 29. Juni 2025. Brandenburg-Bilderfragen hinzugefügt: Wappen-Frage (ID 331) und Karten-Frage (ID 338) mit offiziellen Bildern verknüpft.
- 29. Juni 2025. Bremen-Bilderfragen hinzugefügt: Wappen-Frage (ID 341) und Karten-Frage (ID 348) mit offiziellen Bildern verknüpft.
- 29. Juni 2025. **KRITISCHER FIX: Kompletter Datenbank-Neuimport aller 460 Fragen** - Korrektur des fundamentalen Answer-Mapping-Problems. Ursprünglich waren correct_answer Indizes falsch zugeordnet, sodass falsche Antworten als richtig markiert wurden. Jetzt verwendet das System korrekte Excel-Spalten-Zuordnung (E-H für Antworten, I für korrekte Antwort) mit verbessertem Text-Matching-Algorithmus.
- 29. Juni 2025. **KRITISCHER FRONTEND-FIX: Array-Index-Mismatch behoben** - Korrektur des fundamentalen Problems in der Frontend-Logik: selectedAnswer (0-basiert) wurde direkt mit correctAnswer (1-basiert) verglichen. Fix: selectedAnswer + 1 === correctAnswer sowohl in question-card.tsx als auch quiz-logic.ts. Betraf alle Quiz-Bewertungen und Statistiken.
- 29. Juni 2025. **UI-ZUSTANDSFEHLER BEHOBEN: RadioGroup Reset-Problem** - Korrektur des Problems, dass RadioGroup bei neuen Fragen die vorherige Auswahl beibehielt. Fix: key={question.id} zur RadioGroup hinzugefügt für kompletten Component-Reset bei Fragewechsel.
- 29. Juni 2025. Frage 70 Bildintegration: Bundespresident Gustav Heinemann Bild (Frage 70_1751224471375.png) zur historischen Frage über Bundespräsidenten-Aufgaben hinzugefügt.
- 29. Juni 2025. **BILDANZEIGE-VERBESSERUNG: Modal-System implementiert** - Ersetzte direkte Bildanzeige durch eleganten "Bild anzeigen" Button mit Modal-Dialog. Verhindert Bildschirm-Überladung, bietet bessere UX für alle Bilderfragen (bundesweite und Bundesländer-Fragen). Modal mit X-Button und Click-Outside schließbar.
- 29. Juni 2025. **KATEGORIALES ÜBUNGSSYSTEM FIX:** Thematische Kategorienfilterung implementiert - Backend filtert jetzt korrekt nach Schlüsselwörtern (Geschichte, Verfassung, etc.) statt nicht-existierender Kategorie-IDs. Bundesland-spezifische Fragen laden korrekt.
- 29. Juni 2025. **CHRONOLOGISCHE SORTIERUNG:** Alle Übungskategorien haben jetzt "Zufällig üben" und "Chronologisch üben" Optionen. Backend unterstützt chronological=true Parameter für ID-basierte Sortierung.
- 29. Juni 2025. **BILDPFAD-KORREKTUR:** Alle Bilderfragen verwenden jetzt korrekte Dateinamen (mit Timestamps). Doppelte Schließen-Buttons im Modal entfernt. Bremen-, Bayern-, Berlin-, Brandenburg-, und Baden-Württemberg-Bilder funktionieren vollständig.
- 29. Juni 2025. **UI-KONSISTENZ FIX:** Alle Button-Paare auf Practice-Seite haben einheitliche Höhe (h-10) und responsive Verhalten. Bundesland-Karte optimiert für mobile Ansicht mit flex-column Layout.
- 29. Juni 2025. **ERGEBNISANZEIGE-KORREKTUR:** Results-Seite zeigt jetzt korrekt Quiz-Ergebnisse an nach Abschluss oder vorzeitigem Beenden. Implementiert localStorage-Fallback für zuverlässige Datenübertragung zwischen Quiz- und Results-Seiten.
- 5. Juli 2025. Hamburg-Bilderfragen hinzugefügt: Wappen-Frage (ID 351) und Karten-Frage (ID 358) mit offiziellen Bildern verknüpft.
- 5. Juli 2025. Hessen-Bilderfragen hinzugefügt: Wappen-Frage (ID 361) und Karten-Frage (ID 368) mit offiziellen Bildern verknüpft.
- 5. Juli 2025. Mecklenburg-Vorpommern-Bilderfragen hinzugefügt: Wappen-Frage (ID 371) und Karten-Frage (ID 378) mit offiziellen Bildern verknüpft.
- 5. Juli 2025. Niedersachsen-Bilderfragen hinzugefügt: Wappen-Frage (ID 381) und Karten-Frage (ID 388) mit offiziellen Bildern verknüpft.
- 5. Juli 2025. Nordrhein-Westfalen-Bilderfragen hinzugefügt: Wappen-Frage (ID 391) und Karten-Frage (ID 398) mit offiziellen Bildern verknüpft.
- 5. Juli 2025. Rheinland-Pfalz-Bilderfragen hinzugefügt: Wappen-Frage (ID 401) und Karten-Frage (ID 408) mit offiziellen Bildern verknüpft.
- 5. Juli 2025. Saarland-Bilderfragen hinzugefügt: Wappen-Frage (ID 411) und Karten-Frage (ID 418) mit offiziellen Bildern verknüpft.
- 5. Juli 2025. Sachsen-Bilderfragen hinzugefügt: Wappen-Frage (ID 421) und Karten-Frage (ID 428) mit offiziellen Bildern verknüpft.
- 5. Juli 2025. Sachsen-Anhalt-Bilderfragen hinzugefügt: Wappen-Frage (ID 431) und Karten-Frage (ID 438) mit offiziellen Bildern verknüpft.
- 5. Juli 2025. Schleswig-Holstein-Bilderfragen hinzugefügt: Wappen-Frage (ID 441) und Karten-Frage (ID 448) mit offiziellen Bildern verknüpft.
- 5. Juli 2025. Thüringen-Bilderfragen hinzugefügt: Wappen-Frage (ID 451) und Karten-Frage (ID 458) mit offiziellen Bildern verknüpft.
- 5. Juli 2025. **DOKUMENTATION VOLLSTÄNDIG DEUTSCH:** Komplette Übersetzung der technischen Dokumentation ins Deutsche - alle Abschnitte von Systemarchitektur bis Deployment-Strategie jetzt auf Deutsch verfügbar.
- 6. Juli 2025. **PWA-IMPLEMENTIERUNG:** Vollständige Umwandlung zur Progressive Web App - Manifest erstellt, Service Worker für Offline-Funktionalität hinzugefügt, App-Icons generiert, Meta-Tags für mobile Installation integriert, automatisches Install-Prompt implementiert. App ist jetzt installierbar auf mobilen Geräten und Desktop.
- 11. Juli 2025. **UI-TERMINOLOGIE KONSISTENT:** Vollständige Trennung zwischen "Test" (nur Volltest mit 33 Fragen) und "Übung" (alle anderen Modi). Ergebnis-Seite zeigt nur bei Volltest "Einbürgerungstest bestanden". Quiz-Interface verwendet "Übung beenden" für alle Modi außer Volltest. Timer von 45 auf 60 Minuten erhöht. Dark Mode vollständig für alle Quiz- und Ergebnis-Komponenten implementiert.

## Benutzerpräferenzen

Bevorzugter Kommunikationsstil: Einfache, alltägliche Sprache.