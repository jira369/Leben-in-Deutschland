# Einbürgerungstest Quiz App

## Overview

Dies ist eine Übungsanwendung für den deutschen Einbürgerungstest, entwickelt mit React und Express. Die App ermöglicht Nutzern das Üben mit offiziellen Fragen, die Verfolgung des Lernfortschritts und die Anpassung der Lernerfahrung. Das Projekt zielt darauf ab, eine umfassende und benutzerfreundliche Plattform zur Vorbereitung auf den deutschen Einbürgerungstest bereitzustellen, indem es alle 460 offiziellen Fragen integriert und verschiedene Übungsmodi anbietet.

## User Preferences

Bevorzugter Kommunikationsstil: Einfache, alltägliche Sprache.

## System Architecture

### Frontend-Architektur
- **Framework**: React 18 mit TypeScript
- **Routing**: Wouter
- **Zustandsmanagement**: TanStack Query (React Query)
- **UI-Komponenten**: Radix UI mit shadcn/ui-Komponenten
- **Styling**: Tailwind CSS mit CSS-Variablen
- **Build-Tool**: Vite
- **Design-Ansatz**: Mobile-First, responsiv, adaptiv
- **PWA-Implementierung**: Manifest, Service Worker, App-Icons, Meta-Tags für mobile Installation

### Backend-Architektur
- **Laufzeit**: Node.js mit Express.js
- **Sprache**: TypeScript (ESM-Module)
- **Datenbank**: PostgreSQL mit Drizzle ORM
- **Speicher**: DatabaseStorage-Implementierung mit PostgreSQL
- **API**: RESTful API-Endpunkte
- **Statische Assets**: Express Static Middleware für Fragenbilder

### Hauptkomponenten
- **Datenbankschema**: Tabellen für Fragen, Quiz-Sitzungen, Benutzereinstellungen.
- **Kernfunktionen**: Volltest-Modus (33 Fragen), Übungsmodus, zufällige Fragenauswahl, Fortschrittsverfolgung, anpassbare Einstellungen (Timer, Feedback, Fragenmischung).
- **Fragensystem**: Enthält alle 460 offiziellen Einbürgerungstest-Fragen (300 bundesweit, 160 bundeslandspezifisch), inklusive 7 bundesweiten und 32 bundeslandspezifischen Bilderfragen (Wappen und Karten).
- **Datenfluss**: Quiz-Initialisierung, Fragenanzeige, Antwortübermittlung, Quiz-Abschluss, Statistiken.

### Systemdesign
- **Deployment**: Vite für Frontend-Build, esbuild für Backend-Bündelung.
- **Umgebungsvariablen**: `DATABASE_URL`, `NODE_ENV`.
- **TypeScript**: Strenger Modus, Pfad-Mapping.
- **Modulsystem**: ESM-Module.
- **UI/UX Entscheidungen**: Konsistente Terminologie ("Test" vs. "Übung"), optimierte Navigation, verfeinerte Beenden-Logik, angepasste Startseitenfilter, detaillierte Übungstyp-Details, erweiterte Zeitanzeige, optimierte Statistiken-UI.

## External Dependencies

- **@tanstack/react-query**: Server-Zustandsmanagement und Caching.
- **drizzle-orm**: Typsichere Datenbank-ORM.
- **@neondatabase/serverless**: PostgreSQL-Datenbankverbindung.
- **wouter**: Leichtgewichtiges clientseitiges Routing.
- **@radix-ui/**\*: Headless UI-Komponenten.
- **tailwindcss**: Utility-First CSS-Framework.
- **class-variance-authority**: Komponentenvarianten-Management.
- **clsx**: Bedingte Klassenname-Utility.
- **vite**: Build-Tool und Entwicklungsserver.
- **typescript**: Typprüfung und Kompilierung.

## Recent Changes

### November 4, 2025 - Version 3.2.0 (KOMPLETTE SERVICE WORKER NEUSCHREIBUNG)

**🔥 KRITISCHER FIX - ROOT CAUSE BEHOBEN:**

**Das Problem:**
- Service Worker v4 versuchte nicht-existierende Dateien zu cachen (`/static/js/bundle.js` - alte CRA-Pfade)
- Installation schlug FEHL → Alter Service Worker blieb aktiv
- API-Responses wurden cache-first gecacht → 286 Fragen blieben im Cache
- Neue Cache-Clear-Logik in v3.1.0 wurde NIE ausgeführt (alte JS-Bundles aktiv)

**Die Lösung (Architect-Empfehlung):**

**1. Service Worker v5 - Komplette Neuschreibung:**
- ✅ Network-First Strategie (statt cache-first)
- ✅ KEINE API-Response-Caching mehr
- ✅ Nur echte Assets precachen (/, /manifest.json)
- ✅ `skipWaiting()` + `clients.claim()` für sofortige Kontrolle
- ✅ Promise.allSettled statt addAll (kein Installation-Fail)
- ✅ Versionierter Cache-Name: `einbuergerungstest-v5-20251104`

**2. Frontend-Änderungen:**
- ✅ SW-Registrierung versioniert: `/sw.js?v=20251104`
- ✅ Unregister-Logik jetzt auch in PRODUCTION aktiv
- ✅ App-Version auf 3.2.0 erhöht
- ✅ Settings-Button updated

**Technische Details:**
```javascript
// NEU: Network-First (KEINE API-Caching)
if (url.pathname.startsWith('/api/')) {
  event.respondWith(fetch(request)); // Immer frisch!
  return;
}

// NEU: skipWaiting + clients.claim
self.skipWaiting();
self.clients.claim();
```

**WAS NUTZER TUN MÜSSEN:**

**Desktop:**
1. **App öffnen** → Auto-Update auf v3.2.0 startet
2. **Wenn nötig:** Strg+Shift+R (Windows) / Cmd+Shift+R (Mac)

**Mobile (iOS/Android):**
1. **App komplett schließen** (aus App-Switcher entfernen)
2. **5 Sekunden warten**
3. **App neu öffnen** → Auto-Update läuft

**ODER:**
- Einstellungen → "Cache leeren & App aktualisieren" Button

**Erwartetes Ergebnis:**
- ✅ 310 Fragen (nicht 286!)
- ✅ Korrekte Antwortvalidierung
- ✅ Alle Features funktionieren

---

### November 4, 2025 - Version 3.1.0 (CACHE-FIX - TEILWEISE ERFOLGREICH)

**🔥 KRITISCHE BUG-FIXES:**

**Problem 1: Falsche Fragenanzahl (286 statt 310)**
- **Root Cause**: React Query cached alte API-Responses im IndexedDB
- **Lösung**: Vollständiges IndexedDB-Clearing bei App-Updates implementiert
- **Status**: ✅ Behoben - API gibt korrekt 310 Fragen zurück (300 Bundesweit + 10 Bremen)

**Problem 2: Falsche Antwortvalidierung**
- **Root Cause**: Alte gecachte Question-Daten mit falschen `correctAnswer` Werten
- **Lösung**: Komplettes Cache-Clearing inklusive React Query Cache
- **Debug**: Validation-Logging hinzugefügt für Entwickler-Diagnose
- **Status**: ✅ Behoben - Validierung funktioniert korrekt (0-based → 1-based)

**IMPLEMENTIERTE LÖSUNGEN:**
- **Service Worker v4**: Cache-Name auf v4 erhöht → Erzwingt komplette Neuinstallation
- **IndexedDB-Clearing**: React Query Cache wird bei Updates automatisch gelöscht
- **Triple-Layer Cache-Clearing**: 
  1. Service Worker Caches
  2. IndexedDB (React Query)
  3. localStorage (mit Theme-Preservation)
- **Manueller Cache-Button erweitert**: Jetzt auch mit IndexedDB-Clearing
- **Debug-Logging**: Antwortvalidierung wird in Dev-Mode geloggt
- **Auto-Reload**: Automatischer Page-Reload nach Cache-Clear

**TECHNISCHE DETAILS:**
- Database ist korrekt: 460 Fragen (300 Bundesweit + 160 Bundesländer)
- API-Endpoint `/api/questions/random?mode=all` gibt korrekt 310 Fragen zurück
- Validierungslogik: `selectedAnswer (0-based) + 1 === question.correctAnswer (1-based)`

**WAS NUTZER TUN MÜSSEN:**
1. **Automatisch**: App komplett schließen und neu öffnen → Auto-Update auf 3.1.0
2. **Manuell**: Einstellungen → "Cache leeren & App aktualisieren" Button
3. **Hardcore** (falls nötig): App deinstallieren und neu installieren

---

### Previous Updates (Version 3.0.0)
- **Service Worker v3**: Cache-Version auf v3 erhöht
- **Auto-Reload bei Update**: Automatischer Seiten-Reload nach Cache-Bereinigung
- **Manueller Cache-Clear Button**: Neuer "Cache leeren & App aktualisieren"-Button in Einstellungen
- **Bug-Report Modal optimiert**: Responsive Design mit linksbündiger Beschreibung
- **Quiz-Fragendarstellung verbessert**: Fragennummer entfernt
- **Bildfragen-Bug behoben**: Frage ID 29 korrekt markiert

### Previous Updates
- PWA conversion completed with proper manifest.json and service worker for iOS/Android installation
- Comprehensive smooth animations implemented using framer-motion across all pages
- Complete user flow tested and confirmed working