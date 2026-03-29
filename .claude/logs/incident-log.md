# Incident Log

---

## [NEAR-MISS] Hardcoded Keystore Credentials | 2026-03-28

**Severity:** medium
**Session:** 032826-T2
**File:** `android/app/build.gradle` lines 22-25

**Description:** `storePassword` and `keyPassword` are hardcoded as plaintext strings in the release signingConfig block. The keystore file itself is gitignored via `*.jks`, but the passwords are committed in plaintext. Any developer with repo access can read the signing credentials.

**Why near-miss and not FAIL:** The passwords are for a self-managed keystore with a predictable name (`einbuergerungstest123`), suggesting low entropy / developer convenience password rather than a production secret rotated from a secrets manager. No confirmed breach; flagged proactively.

**Required fix:** Move passwords to a gitignored `android/keystore.properties` file and read them in `build.gradle` via `Properties` loading. See Android developer docs: https://developer.android.com/studio/publish/app-signing#secure-shared-keystore

**Adjacent vulnerability identified:** `.env` is not excluded from `.gitignore`. An `untracked .env` is present in the working tree. If `git add .` is ever run, environment secrets (DB credentials, API keys) would be committed.

**Status:** OPEN — awaiting remediation

---
- `2026-03-29 14:25:38` | FAILURE | CRITICAL | OTHER | Bash | Exit code 128
- `2026-03-29 14:25:44` | FAILURE | ERROR | OTHER | Bash | Exit code 2
- `2026-03-29 14:26:46` | FAILURE | ERROR | OTHER | Bash | Exit code 1
- `2026-03-29 14:28:56` | GUARD | HIGH | BLOCKED: git reset --hard → cd /Users/dacvu/Leben-in-Deutschland && git branch feat/claudify-system HEAD && git reset --hard origin/main
- `2026-03-29 14:33:15` | FAILURE | ERROR | OTHER | mcp__Claude_Preview__preview_start | Failed to start server: Failed to start preview server: node:events:486
- `2026-03-29 14:33:51` | FAILURE | ERROR | API | mcp__Claude_Preview__preview_start | Port 5000 is in use by another process (not a preview server). Run `lsof -i :5000` to identify what's using it. Ask the user: does this server need port 5000 specifically (e.g. for OAuth callbacks, we
- `2026-03-29 14:43:13` | FAILURE | ERROR | OTHER | Bash | Exit code 1
