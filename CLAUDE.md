# Leben in Deutschland — Einbürgerungstest App

## Tech Stack
- **Frontend:** React 18 + TypeScript + Vite + TailwindCSS + shadcn/ui
- **Backend:** Express + Drizzle ORM + Neon PostgreSQL (MemStorage fallback)
- **Mobile:** Capacitor 8 (Android), `isNativePlatform()` for native branching
- **State:** TanStack Query (`queryClient.invalidateQueries` for cache)
- **Notifications:** Firebase Cloud Messaging (FCM) with server-side cron

## Key Architecture
- `server/routes.ts` — API endpoints, question shuffle logic
- `client/src/lib/local-api-router.ts` — Mirrors server routes for native Android (localStorage)
- `client/src/lib/local-storage-backend.ts` — Native data persistence
- `shared/constants.ts` — `OFFICIAL_TEST_QUESTION_COUNT=33`, `OFFICIAL_PASS_THRESHOLD=17`, `shuffleArray()`
- `questions-data.json` (root) — Server reads via fs; `client/src/data/questions-data.json` — Client imports for native

## Build & Deploy
- Web: `npm run build` → `dist/public/`
- Android: `npm run build && npx cap sync android && cd android && ./gradlew bundleRelease`
- Requires Java 21 (`JAVA_HOME=$(/usr/libexec/java_home -v 21)`)
- `.aab` output: `android/app/build/outputs/bundle/release/app-release.aab`

## Important Patterns
- Quiz types: `full` (Testsimulation, 33 Fragen) vs `practice` (Übungsmodus, variable Anzahl)
- Test abort discards data; practice abort saves (if answers > 0)
- `allowAnswerChange` only in Testsimulation (`quizType === 'full'`)
- Shuffle always applies (no state condition) for modes: all/mistakes/marked/unplayed/category
