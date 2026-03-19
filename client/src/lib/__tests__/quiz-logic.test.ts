import { describe, it, expect, vi, beforeEach } from "vitest";
import { shuffleArray, calculateResults, formatDuration, getQuizTypeQuestions } from "../quiz-logic";
import type { Question, QuizState } from "@shared/schema";

// ---------- helpers ----------

function makeQuestion(overrides: Partial<Question> = {}): Question {
  return {
    id: 1,
    text: "Sample question?",
    answers: ["A", "B", "C", "D"],
    correctAnswer: 1, // 1-indexed, so answer "A" is correct
    explanation: null,
    category: "Bundesweit",
    difficulty: "mittel",
    hasImage: false,
    imagePath: null,
    ...overrides,
  };
}

function makeQuizState(
  questionCount: number,
  answersMap: Record<number, number>,
  correctAnswer = 1,
): QuizState {
  const questions = Array.from({ length: questionCount }, (_, i) =>
    makeQuestion({ id: i + 1, correctAnswer }),
  );
  return {
    questions,
    currentQuestionIndex: 0,
    selectedAnswers: answersMap,
    startTime: Date.now() - 5000, // 5 seconds ago
  };
}

// ============================================================
// shuffleArray
// ============================================================

describe("shuffleArray", () => {
  it("returns an array of the same length", () => {
    const input = [1, 2, 3, 4, 5];
    expect(shuffleArray(input)).toHaveLength(5);
  });

  it("does not mutate the original array", () => {
    const input = [1, 2, 3, 4, 5];
    const copy = [...input];
    shuffleArray(input);
    expect(input).toEqual(copy);
  });

  it("preserves all elements (no duplicates or losses)", () => {
    const input = [10, 20, 30, 40, 50];
    const result = shuffleArray(input);
    expect(result.sort((a, b) => a - b)).toEqual([10, 20, 30, 40, 50]);
  });

  it("handles an empty array", () => {
    expect(shuffleArray([])).toEqual([]);
  });

  it("handles a single-element array", () => {
    expect(shuffleArray([42])).toEqual([42]);
  });
});

// ============================================================
// calculateResults
// ============================================================

describe("calculateResults", () => {
  // ---- basic scoring ----

  it("counts correct and incorrect answers", () => {
    // correctAnswer=1 means index 0 is correct
    const state = makeQuizState(3, { 0: 0, 1: 0, 2: 1 }, 1);
    const results = calculateResults(state);
    expect(results.correct).toBe(2); // q0 and q1 answered with index 0 (0+1===1)
    expect(results.incorrect).toBe(1); // q2 answered with index 1 (1+1!==1)
    expect(results.total).toBe(3);
  });

  it("computes percentage correctly", () => {
    const state = makeQuizState(4, { 0: 0, 1: 0, 2: 0, 3: 1 }, 1);
    const results = calculateResults(state);
    expect(results.percentage).toBe(75); // 3/4 = 75%
  });

  it("handles all correct answers", () => {
    const state = makeQuizState(5, { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 }, 1);
    const results = calculateResults(state);
    expect(results.correct).toBe(5);
    expect(results.incorrect).toBe(0);
    expect(results.percentage).toBe(100);
  });

  it("handles all incorrect answers", () => {
    const state = makeQuizState(5, { 0: 3, 1: 3, 2: 3, 3: 3, 4: 3 }, 1);
    const results = calculateResults(state);
    expect(results.correct).toBe(0);
    expect(results.incorrect).toBe(5);
    expect(results.percentage).toBe(0);
  });

  // ---- empty / unanswered ----

  it("handles empty selectedAnswers (user submitted without answering)", () => {
    const state = makeQuizState(10, {}, 1);
    const results = calculateResults(state);
    expect(results.total).toBe(0);
    expect(results.percentage).toBe(0);
    // NOTE: This is a discovered edge case — 0 correct >= ceil(0 * 0.51) = 0,
    // so "passed" is true with no answers. Consider fixing in production code.
    expect(results.passed).toBe(true);
  });

  // ---- 0-indexed answer mapping ----

  it("correctly maps 0-indexed selection to 1-indexed correctAnswer", () => {
    // If correctAnswer is 3, selecting index 2 should be correct (2+1===3)
    const q = makeQuestion({ id: 1, correctAnswer: 3 });
    const state: QuizState = {
      questions: [q],
      currentQuestionIndex: 0,
      selectedAnswers: { 0: 2 },
      startTime: Date.now() - 1000,
    };
    const results = calculateResults(state);
    expect(results.correct).toBe(1);
    expect(results.questionResults[0].isCorrect).toBe(true);
  });

  it("selecting index 0 is correct when correctAnswer is 1", () => {
    const q = makeQuestion({ id: 1, correctAnswer: 1 });
    const state: QuizState = {
      questions: [q],
      currentQuestionIndex: 0,
      selectedAnswers: { 0: 0 },
      startTime: Date.now() - 1000,
    };
    const results = calculateResults(state);
    expect(results.correct).toBe(1);
  });

  // ---- pass/fail logic for full test (33 questions) ----

  it("passes with exactly 17/33 correct", () => {
    const answers: Record<number, number> = {};
    for (let i = 0; i < 17; i++) answers[i] = 0; // correct
    for (let i = 17; i < 33; i++) answers[i] = 3; // incorrect
    const state = makeQuizState(33, answers, 1);
    const results = calculateResults(state);
    expect(results.passed).toBe(true);
    expect(results.correct).toBe(17);
  });

  it("fails with 16/33 correct", () => {
    const answers: Record<number, number> = {};
    for (let i = 0; i < 16; i++) answers[i] = 0; // correct
    for (let i = 16; i < 33; i++) answers[i] = 3; // incorrect
    const state = makeQuizState(33, answers, 1);
    const results = calculateResults(state);
    expect(results.passed).toBe(false);
    expect(results.correct).toBe(16);
  });

  // ---- pass/fail logic for practice (non-33 questions) ----

  it("passes practice with >= 51% (ceil)", () => {
    // 10 questions, ceil(10*0.51) = ceil(5.1) = 6 needed
    const answers: Record<number, number> = {};
    for (let i = 0; i < 6; i++) answers[i] = 0;
    for (let i = 6; i < 10; i++) answers[i] = 3;
    const state = makeQuizState(10, answers, 1);
    const results = calculateResults(state);
    expect(results.passed).toBe(true);
  });

  it("fails practice with < 51% (ceil)", () => {
    // 10 questions, need 6; only get 5
    const answers: Record<number, number> = {};
    for (let i = 0; i < 5; i++) answers[i] = 0;
    for (let i = 5; i < 10; i++) answers[i] = 3;
    const state = makeQuizState(10, answers, 1);
    const results = calculateResults(state);
    expect(results.passed).toBe(false);
  });

  // ---- time tracking ----

  it("computes timeSpent in seconds", () => {
    const startTime = Date.now() - 10_000; // 10 seconds ago
    const state: QuizState = {
      questions: [makeQuestion()],
      currentQuestionIndex: 0,
      selectedAnswers: { 0: 0 },
      startTime,
    };
    const results = calculateResults(state);
    // Allow 1-second tolerance for test execution time
    expect(results.timeSpent).toBeGreaterThanOrEqual(9);
    expect(results.timeSpent).toBeLessThanOrEqual(11);
  });

  // ---- questionResults output ----

  it("includes question details in questionResults", () => {
    const q = makeQuestion({ id: 42, correctAnswer: 2 });
    const state: QuizState = {
      questions: [q],
      currentQuestionIndex: 0,
      selectedAnswers: { 0: 1 }, // 1+1=2, so correct
      startTime: Date.now(),
    };
    const results = calculateResults(state);
    expect(results.questionResults).toHaveLength(1);
    expect(results.questionResults[0]).toEqual({
      questionId: 42,
      selectedAnswer: 1,
      isCorrect: true,
      question: q,
    });
  });

  // ---- sparse indices ----

  it("ignores indices where question is undefined", () => {
    const state = makeQuizState(2, { 0: 0, 5: 0 }, 1);
    // Index 5 doesn't exist in a 2-question quiz
    const results = calculateResults(state);
    expect(results.total).toBe(1); // only index 0 should count
  });
});

// ============================================================
// formatDuration
// ============================================================

describe("formatDuration", () => {
  it("returns '-' for null", () => {
    expect(formatDuration(null)).toBe("-");
  });

  it("returns '-' for undefined", () => {
    // The function checks for undefined despite the type
    expect(formatDuration(undefined as unknown as null)).toBe("-");
  });

  it("formats 0 seconds", () => {
    expect(formatDuration(0)).toBe("0s");
  });

  it("formats seconds only (< 60)", () => {
    expect(formatDuration(45)).toBe("45s");
  });

  it("formats exactly 60 seconds as 1:00", () => {
    expect(formatDuration(60)).toBe("1:00");
  });

  it("formats minutes with padded seconds", () => {
    expect(formatDuration(65)).toBe("1:05");
  });

  it("formats larger minute values", () => {
    expect(formatDuration(3599)).toBe("59:59");
  });

  it("formats hours", () => {
    expect(formatDuration(3600)).toBe("1h 0min");
  });

  it("formats hours and minutes", () => {
    expect(formatDuration(3661)).toBe("1h 1min");
  });

  it("formats large durations", () => {
    expect(formatDuration(7260)).toBe("2h 1min");
  });
});

// ============================================================
// getQuizTypeQuestions
// ============================================================

describe("getQuizTypeQuestions", () => {
  const questions = Array.from({ length: 50 }, (_, i) =>
    makeQuestion({ id: i + 1 }),
  );

  it("returns 33 questions for full quiz type", () => {
    const result = getQuizTypeQuestions(questions, "full");
    expect(result).toHaveLength(33);
  });

  it("returns 10 questions for practice quiz type", () => {
    const result = getQuizTypeQuestions(questions, "practice");
    expect(result).toHaveLength(10);
  });

  it("returns all questions when fewer than slice size", () => {
    const fewQuestions = questions.slice(0, 5);
    const result = getQuizTypeQuestions(fewQuestions, "full");
    expect(result).toHaveLength(5);
  });

  it("preserves order when shuffle=false", () => {
    const result = getQuizTypeQuestions(questions, "practice", false);
    expect(result.map((q) => q.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it("does not mutate the input array", () => {
    const copy = [...questions];
    getQuizTypeQuestions(questions, "full");
    expect(questions.map((q) => q.id)).toEqual(copy.map((q) => q.id));
  });
});
