# Einbürgerungstest Quiz App

## Overview

This is a German citizenship test (Einbürgerungstest) practice application built with React and Express. The app allows users to practice for the German naturalization test with official questions, track their progress, and customize their learning experience.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Components**: Radix UI primitives with custom shadcn/ui components
- **Styling**: Tailwind CSS with CSS variables for theming
- **Build Tool**: Vite with React plugin

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript (ESM modules)
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (@neondatabase/serverless)
- **Storage**: DatabaseStorage implementation using PostgreSQL
- **API**: RESTful API endpoints
- **Static Assets**: Express static middleware for question images

### Key Components

#### Database Schema
- **Questions Table**: Stores quiz questions with multiple choice answers, correct answers, explanations, and categories
- **Quiz Sessions Table**: Tracks completed quiz attempts with results and performance metrics
- **User Settings Table**: Stores user preferences for quiz customization

#### Core Features
- **Quiz Modes**: Full test mode (33 questions) and practice mode
- **Question Management**: Random question selection with shuffling options
- **Progress Tracking**: Session history, statistics, and performance analytics
- **Customizable Settings**: Timer, immediate feedback, question shuffling
- **Responsive Design**: Mobile-first approach with adaptive UI

#### Storage System
- **IStorage Interface**: Abstraction layer for data persistence
- **DatabaseStorage Implementation**: PostgreSQL storage using Drizzle ORM
- **Real Question Data**: 460 official German citizenship test questions loaded from Excel (300 federal + 160 state questions)
- **Image Support**: 7 questions with visual content (images) properly integrated

## Data Flow

1. **Quiz Initialization**: User selects quiz type → Frontend requests random questions → Backend retrieves questions from database
2. **Question Display**: Questions rendered with multiple choice options → User selections tracked in local state
3. **Answer Submission**: User answers stored locally → Progress calculated in real-time
4. **Quiz Completion**: Final results calculated → Session data sent to backend → Results stored in database
5. **Statistics**: Historical data retrieved for progress tracking and analytics

## External Dependencies

### Core Framework Dependencies
- **@tanstack/react-query**: Server state management and caching
- **drizzle-orm**: Type-safe database ORM
- **@neondatabase/serverless**: PostgreSQL database connection
- **wouter**: Lightweight client-side routing

### UI and Styling Dependencies
- **@radix-ui/***: Headless UI components for accessibility
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Component variant management
- **clsx**: Conditional class name utility

### Development Dependencies
- **vite**: Build tool and development server
- **typescript**: Type checking and compilation
- **@replit/vite-plugin-***: Replit-specific development tools

## Deployment Strategy

### Development Environment
- **Local Development**: Vite dev server with hot module replacement
- **Database**: Environment variable `DATABASE_URL` for connection
- **Build Process**: Vite builds frontend, esbuild bundles backend

### Production Build
- **Frontend**: Static assets built to `dist/public`
- **Backend**: Bundled Node.js application in `dist/index.js`
- **Database Migrations**: Drizzle Kit handles schema migrations
- **Environment**: Production mode with optimized builds

### Configuration
- **Environment Variables**: `DATABASE_URL`, `NODE_ENV`
- **TypeScript**: Strict mode enabled with path mapping
- **Module System**: ESM modules throughout the application

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
| Schleswig-Holstein | 442-451 | 441-450 | 10 | 2 (Frage 1+8) | ✅ Vollständig |
| Thüringen | 452-461 | 451-460 | 10 | 2 (Frage 1+8) | ✅ Vollständig |

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

## Changelog

Changelog:
- June 28, 2025. Initial setup with complete quiz system
- June 28, 2025. Added PostgreSQL database integration with Drizzle ORM
- June 28, 2025. Integrated 376 real German citizenship test questions from Excel
- June 28, 2025. Added image support for 7 visual questions with static asset serving
- June 28, 2025. Added German state (Bundesland) selection system for first-time users
- June 28, 2025. Implemented state-specific quiz logic (30 federal + 3 state questions)
- June 28, 2025. Enhanced user settings to include selected state and first-use tracking
- June 29, 2025. Added two additional Baden-Württemberg questions (IDs 377-378) with visual content
- June 29, 2025. Expanded Baden-Württemberg question set to 8 total questions for comprehensive state practice
- June 29, 2025. **Vollständige Korrektur der Bundesländer-Fragen:** Implementierung aller 160 offiziellen Fragen (16 Bundesländer × 10 Fragen) basierend auf korrekter Excel-Zuordnung (Zeilen 302-461)
- June 29, 2025. **Korrektur der bundesweiten Fragen:** Aktualisierung auf korrekte 300 bundesweite Fragen basierend auf Excel-Zeilen 2-301 (Spalte B = "Alle"). Gesamtsystem jetzt mit allen 460 offiziellen Fragen vollständig.
- June 29, 2025. Bayern-Bilderfragen hinzugefügt: Wappen-Frage (ID 311) und Karten-Frage (ID 318) mit offiziellen Bildern verknüpft.
- June 29, 2025. Berlin-Bilderfragen hinzugefügt: Wappen-Frage (ID 321) und Karten-Frage (ID 328) mit offiziellen Bildern verknüpft.
- June 29, 2025. Brandenburg-Bilderfragen hinzugefügt: Wappen-Frage (ID 331) und Karten-Frage (ID 338) mit offiziellen Bildern verknüpft.
- June 29, 2025. Bremen-Bilderfragen hinzugefügt: Wappen-Frage (ID 341) und Karten-Frage (ID 348) mit offiziellen Bildern verknüpft.
- June 29, 2025. **KRITISCHER FIX: Kompletter Datenbank-Neuimport aller 460 Fragen** - Korrektur des fundamentalen Answer-Mapping-Problems. Ursprünglich waren correct_answer Indizes falsch zugeordnet, sodass falsche Antworten als richtig markiert wurden. Jetzt verwendet das System korrekte Excel-Spalten-Zuordnung (E-H für Antworten, I für korrekte Antwort) mit verbessertem Text-Matching-Algorithmus.
- June 29, 2025. **KRITISCHER FRONTEND-FIX: Array-Index-Mismatch behoben** - Korrektur des fundamentalen Problems in der Frontend-Logik: selectedAnswer (0-basiert) wurde direkt mit correctAnswer (1-basiert) verglichen. Fix: selectedAnswer + 1 === correctAnswer sowohl in question-card.tsx als auch quiz-logic.ts. Betraf alle Quiz-Bewertungen und Statistiken.
- June 29, 2025. **UI-ZUSTANDSFEHLER BEHOBEN: RadioGroup Reset-Problem** - Korrektur des Problems, dass RadioGroup bei neuen Fragen die vorherige Auswahl beibehielt. Fix: key={question.id} zur RadioGroup hinzugefügt für kompletten Component-Reset bei Fragewechsel.
- June 29, 2025. Frage 70 Bildintegration: Bundespresident Gustav Heinemann Bild (Frage 70_1751224471375.png) zur historischen Frage über Bundespräsidenten-Aufgaben hinzugefügt.
- June 29, 2025. **BILDANZEIGE-VERBESSERUNG: Modal-System implementiert** - Ersetzte direkte Bildanzeige durch eleganten "Bild anzeigen" Button mit Modal-Dialog. Verhindert Bildschirm-Überladung, bietet bessere UX für alle Bilderfragen (bundesweite und Bundesländer-Fragen). Modal mit X-Button und Click-Outside schließbar.
- June 29, 2025. **KATEGORIALES ÜBUNGSSYSTEM FIX:** Thematische Kategorienfilterung implementiert - Backend filtert jetzt korrekt nach Schlüsselwörtern (Geschichte, Verfassung, etc.) statt nicht-existierender Kategorie-IDs. Bundesland-spezifische Fragen laden korrekt.
- June 29, 2025. **CHRONOLOGISCHE SORTIERUNG:** Alle Übungskategorien haben jetzt "Zufällig üben" und "Chronologisch üben" Optionen. Backend unterstützt chronological=true Parameter für ID-basierte Sortierung.
- June 29, 2025. **BILDPFAD-KORREKTUR:** Alle Bilderfragen verwenden jetzt korrekte Dateinamen (mit Timestamps). Doppelte Schließen-Buttons im Modal entfernt. Bremen-, Bayern-, Berlin-, Brandenburg-, und Baden-Württemberg-Bilder funktionieren vollständig.
- June 29, 2025. **UI-KONSISTENZ FIX:** Alle Button-Paare auf Practice-Seite haben einheitliche Höhe (h-10) und responsive Verhalten. Bundesland-Karte optimiert für mobile Ansicht mit flex-column Layout.
- June 29, 2025. **ERGEBNISANZEIGE-KORREKTUR:** Results-Seite zeigt jetzt korrekt Quiz-Ergebnisse an nach Abschluss oder vorzeitigem Beenden. Implementiert localStorage-Fallback für zuverlässige Datenübertragung zwischen Quiz- und Results-Seiten.
- July 5, 2025. Hamburg-Bilderfragen hinzugefügt: Wappen-Frage (ID 351) und Karten-Frage (ID 358) mit offiziellen Bildern verknüpft.
- July 5, 2025. Hessen-Bilderfragen hinzugefügt: Wappen-Frage (ID 361) und Karten-Frage (ID 368) mit offiziellen Bildern verknüpft.
- July 5, 2025. Mecklenburg-Vorpommern-Bilderfragen hinzugefügt: Wappen-Frage (ID 371) und Karten-Frage (ID 378) mit offiziellen Bildern verknüpft.
- July 5, 2025. Niedersachsen-Bilderfragen hinzugefügt: Wappen-Frage (ID 381) und Karten-Frage (ID 388) mit offiziellen Bildern verknüpft.
- July 5, 2025. Nordrhein-Westfalen-Bilderfragen hinzugefügt: Wappen-Frage (ID 391) und Karten-Frage (ID 398) mit offiziellen Bildern verknüpft.
- July 5, 2025. Rheinland-Pfalz-Bilderfragen hinzugefügt: Wappen-Frage (ID 401) und Karten-Frage (ID 408) mit offiziellen Bildern verknüpft.
- July 5, 2025. Saarland-Bilderfragen hinzugefügt: Wappen-Frage (ID 411) und Karten-Frage (ID 418) mit offiziellen Bildern verknüpft.
- July 5, 2025. Sachsen-Bilderfragen hinzugefügt: Wappen-Frage (ID 421) und Karten-Frage (ID 428) mit offiziellen Bildern verknüpft.
- July 5, 2025. Sachsen-Anhalt-Bilderfragen hinzugefügt: Wappen-Frage (ID 431) und Karten-Frage (ID 438) mit offiziellen Bildern verknüpft.

## User Preferences

Preferred communication style: Simple, everyday language.