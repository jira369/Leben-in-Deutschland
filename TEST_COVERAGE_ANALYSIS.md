# Test Coverage Analysis

## Current State: 0% Coverage

The codebase has **zero test files**, **no test framework installed**, and **no CI/CD pipeline**. This analysis identifies the highest-impact areas where tests should be added.

---

## Priority 1: Core Scoring Logic (`client/src/lib/quiz-logic.ts`)

This is the **most critical file to test** — it determines whether users pass or fail.

### `calculateResults()`
- **Pass/fail logic is nuanced**: Full tests (33 questions) require ≥17 correct; practice tests use a 51% threshold via `Math.ceil(total * 0.51)`. An off-by-one error here silently gives wrong results.
- **Untested edge cases**:
  - Empty `selectedAnswers` (user submits without answering)
  - Questions where `selectedAnswer` is `0` (first option) — the `selectedAnswer + 1 === question.correctAnswer` mapping between 0-indexed answers and 1-indexed `correctAnswer` is error-prone
  - Boundary: exactly 17/33 correct (should pass), 16/33 (should fail)
  - Boundary: exactly 51% on practice (e.g., 6/11 questions)
  - `quizState.questions[questionIndex]` being `undefined` if indices are sparse

### `shuffleArray()`
- Verify it doesn't mutate the original array
- Verify output length matches input length
- Verify all elements are preserved (no duplicates/losses)

### `formatDuration()`
- `null` and `undefined` inputs → should return `'-'`
- `0` seconds → `"0s"`
- `59` seconds → `"59s"`
- `60` seconds → `"1:00"`
- `3661` seconds → `"1h 1min"`
- Negative numbers (currently unhandled)

### `getQuizTypeQuestions()`
- `type='full'` slices to 33; `type='practice'` slices to 10
- What happens when fewer questions exist than the slice size?
- Does `shuffle=false` preserve order?

### `fetchQuestionsForQuiz()`
- Verify correct URL construction for each mode (`mistakes`, `marked`, `all`, category, state)
- Verify `chronological` param controls sorting vs. shuffling
- Error handling when fetch fails

---

## Priority 2: Storage Layer (`server/storage.ts`)

853 lines of data access logic with two implementations (`MemStorage` and `DatabaseStorage`).

### `MemStorage` — ideal for unit testing without a database

- **`getQuizSessionStats()`**: Only counts `type='full'` sessions. Test that practice sessions are excluded from stats.
- **`getDetailedStats()`**: Aggregates correct/incorrect across ALL sessions but only counts full tests for pass rate. Verify this split behavior.
- **`getQuestionsByFilter()`**: Complex filtering with `category`, `state`, `search`, `theme`, `excludeIds`, `random`, `limit`. Each filter path needs testing, especially:
  - `theme` filtering uses keyword matching (e.g., "geschichte" matches questions containing "demokratie") — easy to get wrong
  - Combined `state` + `category` interactions
  - `excludeIds` with empty array vs. populated array
- **`getRandomQuestionsForState()`**: Should return exactly 30 federal + 3 state questions for a 33-question test. What if fewer state questions exist?
- **Incomplete implementations**: `addIncorrectAnswer()` and `addMarkedQuestion()` throw errors in MemStorage — these should be implemented or tests should verify the error behavior.

### `DatabaseStorage` — needs integration tests

- **`getUniqueQuestionsAnswered()`**: Uses raw SQL with `jsonb_array_elements`. This is fragile — test with empty sessions, sessions with null `questionResults`, and sessions with duplicate question IDs.
- **`getUserSettings()`**: Auto-creates default settings if none exist. Test the creation path and idempotency.
- **`updateUserSettings()`**: Uses partial updates. Verify that unset fields aren't overwritten.
- **`getIncorrectQuestions()`**: Uses `INNER JOIN` with state filtering. Test with no state, "Bundesweit" state, and a specific state.

---

## Priority 3: API Routes (`server/routes.ts`)

15+ endpoints with no request/response validation testing.

### Critical routes to test:

| Route | Risk | What to Test |
|-------|------|--------------|
| `GET /api/questions/random/:count` | **High** | The 30:3 federal/state split, mode switching (mistakes/marked/all/category), invalid count, chronological sorting |
| `POST /api/quiz-sessions` | **High** | Zod validation accepts valid data, rejects invalid data, handles missing fields |
| `PATCH /api/settings` | **Medium** | Partial updates work, invalid fields rejected |
| `POST /api/marked-questions` | **Medium** | Toggle behavior (mark → unmark → mark), invalid questionId |
| `DELETE /api/incorrect-answers/question/:questionId` | **Medium** | Invalid/NaN questionId handling |
| `POST /api/bug-report` | **Low** | Zod validation, XSS in description field (currently injected directly into HTML email via `description.replace(/\n/g, '<br>')`) |

### Security concern:
`routes.ts:486` — The bug report description is inserted into an HTML email without sanitization:
```typescript
${description.replace(/\n/g, '<br>')}
```
This is an **XSS vector** in email clients. Should be HTML-escaped.

---

## Priority 4: React Hooks (`client/src/hooks/use-quiz.ts`)

### `useQuiz()` hook
- `startQuiz()` reads from `window.location.search` — test with various URL parameter combinations
- `selectAnswer()` — verify state updates correctly, especially with rapid clicks
- `nextQuestion()` / `previousQuestion()` — boundary behavior (first/last question)
- `finishQuiz()` — verify it calls `trackIncorrectAnswers`, saves session, and invalidates correct query keys
- `progress` calculation — verify it's 0-100% range

---

## Priority 5: React Components

### Components with testable logic:
- **`quiz/timer.tsx`** — Countdown timer with 60-minute limit for full tests
- **`quiz/question-card.tsx`** — Answer selection, image question rendering
- **`pages/results.tsx`** — Score display, pass/fail state
- **`pages/statistics.tsx`** — Chart rendering with edge cases (no data, single session)

---

## Recommended Test Setup

### Framework: Vitest + React Testing Library
Vitest integrates natively with the existing Vite build system — zero extra configuration. Add to `package.json`:

```json
{
  "devDependencies": {
    "vitest": "^3.0.0",
    "@testing-library/react": "^16.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "@testing-library/user-event": "^14.0.0"
  },
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

### Suggested test file structure:
```
client/src/lib/__tests__/quiz-logic.test.ts        ← Priority 1
server/__tests__/storage.test.ts                    ← Priority 2
server/__tests__/routes.test.ts                     ← Priority 3
client/src/hooks/__tests__/use-quiz.test.ts         ← Priority 4
client/src/components/quiz/__tests__/timer.test.tsx  ← Priority 5
```

### Estimated impact:
| Priority | Files | Estimated Test Count | Risk Coverage |
|----------|-------|---------------------|---------------|
| P1: Quiz logic | 1 | ~25 tests | Scoring correctness |
| P2: Storage | 1 | ~30 tests | Data integrity |
| P3: Routes | 1 | ~20 tests | API contracts |
| P4: Hooks | 1 | ~15 tests | State management |
| P5: Components | 3-4 | ~20 tests | UI correctness |

**~110 tests** would cover the meaningful business logic. The 45+ shadcn/ui primitive components do not need custom tests.
