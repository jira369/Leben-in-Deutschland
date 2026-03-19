import { describe, it, expect } from "vitest";
import {
  insertQuestionSchema,
  insertQuizSessionSchema,
  insertUserSettingsSchema,
  insertIncorrectAnswerSchema,
  insertMarkedQuestionSchema,
} from "../schema";

describe("Zod schemas", () => {
  // ============================================================
  // insertQuestionSchema
  // ============================================================

  describe("insertQuestionSchema", () => {
    const validQuestion = {
      text: "Sample?",
      answers: ["A", "B", "C", "D"],
      correctAnswer: 1,
    };

    it("accepts valid question data", () => {
      const result = insertQuestionSchema.safeParse(validQuestion);
      expect(result.success).toBe(true);
    });

    it("accepts question with all optional fields", () => {
      const result = insertQuestionSchema.safeParse({
        ...validQuestion,
        explanation: "Because...",
        category: "Bundesweit",
        difficulty: "leicht",
        hasImage: true,
        imagePath: "test.png",
      });
      expect(result.success).toBe(true);
    });

    it("rejects missing text", () => {
      const result = insertQuestionSchema.safeParse({
        answers: ["A", "B"],
        correctAnswer: 1,
      });
      expect(result.success).toBe(false);
    });

    it("rejects missing correctAnswer", () => {
      const result = insertQuestionSchema.safeParse({
        text: "Q?",
        answers: ["A", "B"],
      });
      expect(result.success).toBe(false);
    });
  });

  // ============================================================
  // insertQuizSessionSchema
  // ============================================================

  describe("insertQuizSessionSchema", () => {
    const validSession = {
      type: "full",
      totalQuestions: 33,
      correctAnswers: 20,
      incorrectAnswers: 13,
      percentage: 61,
      passed: true,
    };

    it("accepts valid session data", () => {
      const result = insertQuizSessionSchema.safeParse(validSession);
      expect(result.success).toBe(true);
    });

    it("accepts session with optional fields", () => {
      const result = insertQuizSessionSchema.safeParse({
        ...validSession,
        timeSpent: 1200,
        practiceType: "Fehler üben",
        questionResults: [{ questionId: 1, selectedAnswer: 0, isCorrect: true }],
      });
      expect(result.success).toBe(true);
    });

    it("rejects non-string type", () => {
      const result = insertQuizSessionSchema.safeParse({
        ...validSession,
        type: 123,
      });
      expect(result.success).toBe(false);
    });

    it("rejects non-boolean passed", () => {
      const result = insertQuizSessionSchema.safeParse({
        ...validSession,
        passed: "yes",
      });
      expect(result.success).toBe(false);
    });

    it("rejects missing required fields", () => {
      const result = insertQuizSessionSchema.safeParse({ type: "full" });
      expect(result.success).toBe(false);
    });
  });

  // ============================================================
  // insertUserSettingsSchema
  // ============================================================

  describe("insertUserSettingsSchema", () => {
    it("accepts valid settings", () => {
      const result = insertUserSettingsSchema.safeParse({
        selectedState: "Bayern",
        hasSelectedState: true,
        timerEnabled: true,
      });
      expect(result.success).toBe(true);
    });

    it("accepts empty object (all fields optional with defaults)", () => {
      const result = insertUserSettingsSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it("accepts null selectedState", () => {
      const result = insertUserSettingsSchema.safeParse({
        selectedState: null,
      });
      expect(result.success).toBe(true);
    });
  });

  // ============================================================
  // insertIncorrectAnswerSchema
  // ============================================================

  describe("insertIncorrectAnswerSchema", () => {
    it("accepts valid incorrect answer", () => {
      const result = insertIncorrectAnswerSchema.safeParse({
        questionId: 1,
        selectedAnswer: 2,
        correctAnswer: 3,
      });
      expect(result.success).toBe(true);
    });

    it("rejects missing questionId", () => {
      const result = insertIncorrectAnswerSchema.safeParse({
        selectedAnswer: 2,
        correctAnswer: 3,
      });
      expect(result.success).toBe(false);
    });

    it("rejects string values for number fields", () => {
      const result = insertIncorrectAnswerSchema.safeParse({
        questionId: "one",
        selectedAnswer: "two",
        correctAnswer: "three",
      });
      expect(result.success).toBe(false);
    });
  });

  // ============================================================
  // insertMarkedQuestionSchema
  // ============================================================

  describe("insertMarkedQuestionSchema", () => {
    it("accepts valid marked question", () => {
      const result = insertMarkedQuestionSchema.safeParse({ questionId: 42 });
      expect(result.success).toBe(true);
    });

    it("rejects missing questionId", () => {
      const result = insertMarkedQuestionSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it("rejects non-number questionId", () => {
      const result = insertMarkedQuestionSchema.safeParse({ questionId: "abc" });
      expect(result.success).toBe(false);
    });
  });
});
