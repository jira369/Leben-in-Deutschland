# Einbuergerungstest Quiz

Ubungs-App fur den deutschen Einburgerungstest mit allen 310 offiziellen BAMF-Fragen.

**[Google Play Store](https://play.google.com/store/apps/details?id=de.lebenindeutschland.quiz)**

## Features

- **Testsimulation** - Originalgetreuer Test mit 33 Fragen und 60-Minuten-Timer
- **Ubungsmodus** - 10 zufallige Fragen mit sofortigem Feedback
- **Alle 310 Fragen** - Chronologisch oder zufallig durcharbeiten
- **Bundesland-Auswahl** - 3 landesspezifische Fragen fur alle 16 Bundeslander
- **Fehler uben** - Wiederhole nur falsch beantwortete Fragen
- **Fragen markieren** - Gezielt schwierige Fragen wiederholen
- **Thematisch uben** - Geschichte, Verfassung, Gesellschaft, Staat & Burger
- **Statistiken** - Detaillierter Lernfortschritt mit Testergebnissen
- **Push-Benachrichtigungen** - Tagliche Erinnerungen fur die Lern-Streak (FCM)
- **Offline nutzbar** - PWA mit Service Worker Caching
- **Kostenlos & werbefrei**

## Tech Stack

| Bereich | Technologie |
|---------|-------------|
| Frontend | React 18, TypeScript, Tailwind CSS, Framer Motion |
| Backend | Express, Drizzle ORM, Neon PostgreSQL |
| Mobile | Capacitor 8 (Android) |
| Push | Firebase Cloud Messaging (FCM) |
| State Management | TanStack Query |
| UI Components | Radix UI / shadcn/ui |
| Build | Vite 5, esbuild |

## Projektstruktur

```
client/                    # React Frontend
  src/
    components/            # UI-Komponenten (shadcn/ui)
    hooks/                 # React Hooks (useQuiz, useNotifications, ...)
    lib/                   # Utilities (quiz-logic, platform detection, firebase)
    pages/                 # Seiten (home, quiz, results, statistics, ...)
  public/
    sw.js                  # Service Worker (Caching + Push)

server/                    # Express Backend
  index.ts                 # Server-Einstiegspunkt
  routes.ts                # API-Endpunkte
  storage.ts               # Datenbank-Layer (DatabaseStorage + MemStorage)
  db.ts                    # Neon DB-Verbindung
  firebase-admin.ts        # Firebase Admin SDK
  notifications-cron.ts    # Taglicher Reminder-Cron-Job

shared/                    # Geteilter Code
  schema.ts                # Drizzle Schema + TypeScript Types
  constants.ts             # App-Konstanten (Fragenzahl, Bestehensgrenze, ...)

android/                   # Capacitor Android-Projekt
```

## Voraussetzungen

- Node.js 20+
- npm
- Android SDK (fur Mobile-Builds)
- Java 21 (fur Gradle)

## Installation & Entwicklung

```bash
# Dependencies installieren
npm install

# Entwicklungsserver starten
npm run dev

# TypeScript pruefen
npm run check
```

Der Dev-Server startet auf Port 5000 und bedient sowohl die API als auch den Vite-Dev-Server.

## Umgebungsvariablen

Erstelle eine `.env`-Datei im Projektroot:

```env
# Datenbank (optional - ohne faellt die App auf In-Memory-Storage zurueck)
DATABASE_URL=postgresql://...

# Firebase Push-Notifications
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_VAPID_KEY=...
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}

# Bug-Report E-Mail (optional)
GMAIL_USER=...
GMAIL_PASS=...
REPORT_EMAIL=...
```

## Android-Build

```bash
# Web-Assets bauen
npm run build:web

# Capacitor synchronisieren
npx cap sync android

# Release-Bundle (.aab) erstellen
cd android && ./gradlew bundleRelease

# Die .aab-Datei liegt dann unter:
# android/app/build/outputs/bundle/release/app-release.aab
```

Fur den Release-Build wird ein Signing-Keystore benoetigt (`keystore.properties` in `android/`).

## API-Endpunkte

| Methode | Pfad | Beschreibung |
|---------|------|-------------|
| GET | `/api/questions` | Alle Fragen |
| GET | `/api/questions/random/:count` | Zufallige Fragen |
| POST | `/api/questions/initialize` | Fragen aus JSON laden |
| GET | `/api/settings` | Benutzereinstellungen |
| PATCH | `/api/settings` | Einstellungen aktualisieren |
| POST | `/api/quiz-sessions` | Testergebnis speichern |
| GET | `/api/quiz-sessions/recent` | Letzte Ergebnisse |
| GET | `/api/quiz-sessions/stats` | Gesamtstatistik |
| POST | `/api/fcm/register` | FCM-Token registrieren |
| POST | `/api/fcm/unregister` | FCM-Token entfernen |
| POST | `/api/fcm/practiced` | Lernaktivitaet melden |
| POST | `/api/bug-report` | Bug-Report senden |

## Fragenkatalog

Alle 310 Fragen stammen aus dem offiziellen BAMF-Fragenkatalog 2025:
- 300 bundesweite Fragen (Geschichte, Politik, Gesellschaft)
- 10 Fragen pro Bundesland (160 landesspezifische Fragen)

Im echten Test: 30 bundesweite + 3 landesspezifische = 33 Fragen.
Bestehensgrenze: 17 von 33 richtig.

## Lizenz

MIT
