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

### November 4, 2025 - Version 3.0.0 (CRITICAL CACHE UPDATE)
- **🔥 AGGRESSIVES Cache-Management**: Automatische Löschung ALLER Caches bei Version-Update (APP_VERSION 3.0.0)
- **Service Worker v3**: Cache-Version auf v3 erhöht, erzwingt komplette Neuinstallation
- **Auto-Reload bei Update**: Automatischer Seiten-Reload nach Cache-Bereinigung
- **Manueller Cache-Clear Button**: Neuer "Cache leeren & App aktualisieren"-Button in Einstellungen
- **Bug-Fix Mobile**: Problem mit alter gecachter App-Version auf Mobilgeräten behoben
- **Bug-Report Modal optimiert**: Responsive Design mit linksbündiger Beschreibung, optimierten Abständen und Schriftgrößen
- **Quiz-Fragendarstellung verbessert**: Fragennummer entfernt, Zeilenabstände optimiert, responsive für alle Geräte
- **Bildfragen-Bug behoben**: Frage ID 29 korrekt als Nicht-Bildfrage markiert

**WICHTIG FÜR NUTZER**: 
- Beim nächsten Laden wird automatisch die neueste Version geladen
- Auf Mobilgeräten: Gehen Sie zu Einstellungen → "Cache leeren & App aktualisieren"

### Previous Updates
- PWA conversion completed with proper manifest.json and service worker for iOS/Android installation
- Comprehensive smooth animations implemented using framer-motion across all pages
- Complete user flow tested and confirmed working