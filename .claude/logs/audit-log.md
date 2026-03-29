# Audit Log

---

## [032826-T2] v3.2.1 Release Audit | 2026-03-28

**Verdict:** WARN
**Tier:** T2 — Standard review
**Scope:** 6 checks across data integrity, package naming, versioning, bug fix, security, build config

### Check Results

| # | Check | Verdict | Notes |
|---|---|---|---|
| 1 | Data Integrity | PASS | 460 questions, all correctAnswer 0-3, no NRW category |
| 2 | Package Name Consistency | PASS | All 4 files use de.lebenindeutschland.quiz |
| 3 | Version Consistency | PASS | package.json 3.2.1, build.gradle versionCode 321 / versionName 3.2.1 |
| 4 | Lukas Bug Fix | PASS | Both network error and empty array fallbacks present |
| 5 | Security | WARN | Hardcoded keystore password in build.gradle:24; .env not in .gitignore |
| 6 | Clean Build | PASS | No Replit plugins in vite.config.ts |

### Warnings

- W1: `android/app/build.gradle:24` — `storePassword "einbuergerungstest123"` and `keyPassword "einbuergerungstest123"` are hardcoded plaintext. Keystore file is gitignored (*.jks) but passwords are not. Should be moved to environment variables or a local, gitignored `keystore.properties` file.
- W2: `.gitignore` does not exclude `.env`. A `.env` file is present in the working tree (untracked per git status). If accidentally staged, secrets would be committed.

### Quality Trend

Quality: [session: first audit — no prior data | task: release-audit N/A — first run | model: claude-sonnet-4-6 N/A — first run]

---
