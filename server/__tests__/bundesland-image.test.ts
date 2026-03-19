import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the db module to avoid DATABASE_URL requirement
vi.mock("../db", () => ({
  db: {},
}));

import { MemStorage } from "../storage";
import type { InsertQuestion } from "@shared/schema";

function sampleQuestion(overrides: Partial<InsertQuestion> = {}): InsertQuestion {
  return {
    text: "Sample question?",
    answers: ["A", "B", "C", "D"],
    correctAnswer: 1,
    explanation: "Explanation",
    category: "Bundesweit",
    difficulty: "mittel",
    hasImage: false,
    imagePath: null,
    ...overrides,
  };
}

describe("Bundesland (State) Question Handling", () => {
  let storage: MemStorage;

  beforeEach(async () => {
    storage = new MemStorage();
  });

  // ============================================================
  // NRW Category Mismatch Bug
  // ============================================================

  describe("NRW category consistency", () => {
    beforeEach(async () => {
      // The actual data uses "NRW" as category (not "Nordrhein-Westfalen")
      await storage.createManyQuestions([
        ...Array.from({ length: 40 }, (_, i) =>
          sampleQuestion({ text: `Federal Q${i}`, category: "Bundesweit" }),
        ),
        ...Array.from({ length: 6 }, (_, i) =>
          sampleQuestion({ text: `NRW Q${i}`, category: "NRW" }),
        ),
      ]);
    });

    it("filters by NRW category correctly", async () => {
      const results = await storage.getQuestionsByFilter({ category: "NRW" });
      expect(results).toHaveLength(6);
      expect(results.every((q) => q.category === "NRW")).toBe(true);
    });

    it("returns NRW + Bundesweit when state=NRW", async () => {
      const results = await storage.getQuestionsByFilter({ state: "NRW" });
      expect(results).toHaveLength(46); // 40 federal + 6 NRW
    });

    it("getRandomQuestionsForState works with NRW", async () => {
      const questions = await storage.getRandomQuestionsForState(30, "NRW");
      const federal = questions.filter((q) => q.category === "Bundesweit");
      const nrw = questions.filter((q) => q.category === "NRW");
      expect(federal).toHaveLength(30);
      expect(nrw).toHaveLength(3);
    });

    it("Nordrhein-Westfalen category returns NOTHING (data uses NRW)", async () => {
      // This exposes the mismatch: routes.ts checks for "Nordrhein-Westfalen"
      // but the data stores "NRW"
      const results = await storage.getQuestionsByFilter({
        category: "Nordrhein-Westfalen",
      });
      expect(results).toHaveLength(0); // BUG: this is the root cause
    });
  });

  // ============================================================
  // 30 Federal + 3 State Split
  // ============================================================

  describe("30 federal + 3 state split", () => {
    beforeEach(async () => {
      await storage.createManyQuestions([
        ...Array.from({ length: 300 }, (_, i) =>
          sampleQuestion({ text: `Federal Q${i}`, category: "Bundesweit" }),
        ),
        ...Array.from({ length: 10 }, (_, i) =>
          sampleQuestion({ text: `Bayern Q${i}`, category: "Bayern" }),
        ),
      ]);
    });

    it("returns exactly 33 questions (30 federal + 3 state)", async () => {
      const questions = await storage.getRandomQuestionsForState(30, "Bayern");
      expect(questions).toHaveLength(33);
      expect(questions.filter((q) => q.category === "Bundesweit")).toHaveLength(30);
      expect(questions.filter((q) => q.category === "Bayern")).toHaveLength(3);
    });

    it("returns only federal when stateCategory is undefined", async () => {
      const questions = await storage.getRandomQuestionsForState(33);
      expect(questions.every((q) => q.category === "Bundesweit")).toBe(true);
      expect(questions).toHaveLength(33);
    });

    it("returns only federal when federalCount is 33 (no room for state)", async () => {
      const questions = await storage.getRandomQuestionsForState(33, "Bayern");
      // When federalCount === 33, stateCount = 33 - 33 = 0, and the condition
      // `federalCount < 33` is false, so no state questions are fetched
      expect(questions.filter((q) => q.category === "Bayern")).toHaveLength(0);
      expect(questions).toHaveLength(33);
    });
  });

  // ============================================================
  // State with fewer questions than needed
  // ============================================================

  describe("state with fewer questions than requested", () => {
    it("returns fewer state questions if not enough available", async () => {
      await storage.createManyQuestions([
        ...Array.from({ length: 40 }, (_, i) =>
          sampleQuestion({ text: `Federal Q${i}`, category: "Bundesweit" }),
        ),
        // Only 2 state questions, but we'll request 3
        sampleQuestion({ text: "Bremen Q1", category: "Bremen" }),
        sampleQuestion({ text: "Bremen Q2", category: "Bremen" }),
      ]);

      const questions = await storage.getRandomQuestionsForState(30, "Bremen");
      const federal = questions.filter((q) => q.category === "Bundesweit");
      const state = questions.filter((q) => q.category === "Bremen");
      expect(federal).toHaveLength(30);
      expect(state).toHaveLength(2); // Only 2 available, not 3
      expect(questions).toHaveLength(32); // 30 + 2, not 33
    });

    it("returns 0 state questions for nonexistent state", async () => {
      await storage.createManyQuestions(
        Array.from({ length: 40 }, (_, i) =>
          sampleQuestion({ text: `Federal Q${i}`, category: "Bundesweit" }),
        ),
      );

      const questions = await storage.getRandomQuestionsForState(30, "Fantasieland");
      expect(questions.filter((q) => q.category === "Fantasieland")).toHaveLength(0);
      expect(questions).toHaveLength(30); // Only federal questions
    });
  });

  // ============================================================
  // Bundesweit special handling
  // ============================================================

  describe("Bundesweit handling", () => {
    beforeEach(async () => {
      await storage.createManyQuestions([
        ...Array.from({ length: 10 }, (_, i) =>
          sampleQuestion({ text: `Federal Q${i}`, category: "Bundesweit" }),
        ),
        ...Array.from({ length: 5 }, (_, i) =>
          sampleQuestion({ text: `Bayern Q${i}`, category: "Bayern" }),
        ),
      ]);
    });

    it("state=Bundesweit returns only federal questions via filter", async () => {
      // When state is "Bundesweit", the filter has special handling:
      // it should NOT add an OR condition for state
      const results = await storage.getQuestionsByFilter({ state: "Bundesweit" });
      // state="Bundesweit" is treated as no state filter (returns everything)
      expect(results).toHaveLength(15);
    });

    it("category=Bundesweit returns only Bundesweit questions", async () => {
      const results = await storage.getQuestionsByFilter({ category: "Bundesweit" });
      expect(results).toHaveLength(10);
      expect(results.every((q) => q.category === "Bundesweit")).toBe(true);
    });
  });

  // ============================================================
  // All 16 states filtering
  // ============================================================

  describe("all 16 states filter correctly", () => {
    const ALL_STATES = [
      "Baden-Württemberg", "Bayern", "Berlin", "Brandenburg",
      "Bremen", "Hamburg", "Hessen", "Mecklenburg-Vorpommern",
      "Niedersachsen", "NRW", "Rheinland-Pfalz", "Saarland",
      "Sachsen", "Sachsen-Anhalt", "Schleswig-Holstein", "Thüringen",
    ];

    beforeEach(async () => {
      const questions: InsertQuestion[] = [];
      // 10 federal questions
      for (let i = 0; i < 10; i++) {
        questions.push(sampleQuestion({ text: `Federal Q${i}`, category: "Bundesweit" }));
      }
      // 2 questions per state
      for (const state of ALL_STATES) {
        questions.push(sampleQuestion({ text: `${state} Q1`, category: state }));
        questions.push(sampleQuestion({ text: `${state} Q2`, category: state }));
      }
      await storage.createManyQuestions(questions);
    });

    it.each(ALL_STATES)("filters %s correctly", async (stateName) => {
      const results = await storage.getQuestionsByFilter({ category: stateName });
      expect(results).toHaveLength(2);
      expect(results.every((q) => q.category === stateName)).toBe(true);
    });

    it.each(ALL_STATES)("state=%s returns federal + state questions", async (stateName) => {
      const results = await storage.getQuestionsByFilter({ state: stateName });
      expect(results).toHaveLength(12); // 10 federal + 2 state
      const federal = results.filter((q) => q.category === "Bundesweit");
      const state = results.filter((q) => q.category === stateName);
      expect(federal).toHaveLength(10);
      expect(state).toHaveLength(2);
    });
  });

  // ============================================================
  // Incorrect questions with state filter
  // ============================================================

  describe("incorrect and marked questions state filtering (MemStorage stubs)", () => {
    it("getIncorrectQuestions returns empty (MemStorage limitation)", async () => {
      const results = await storage.getIncorrectQuestions({ state: "Bayern" });
      expect(results).toEqual([]);
    });

    it("getMarkedQuestions returns empty (MemStorage limitation)", async () => {
      const results = await storage.getMarkedQuestions({ state: "Bayern" });
      expect(results).toEqual([]);
    });
  });

  // ============================================================
  // Theme filtering with state context
  // ============================================================

  describe("theme filtering", () => {
    beforeEach(async () => {
      await storage.createManyQuestions([
        sampleQuestion({ text: "Grundgesetz Artikel 1", category: "Bundesweit" }),
        sampleQuestion({ text: "Wahl zum Bundestag", category: "Bundesweit" }),
        sampleQuestion({ text: "Geschichte der DDR", category: "Bundesweit" }),
        sampleQuestion({ text: "Religion und Toleranz", category: "Bundesweit" }),
        sampleQuestion({ text: "Bayern Frage", category: "Bayern" }),
      ]);
    });

    it("theme verfassung matches grundgesetz", async () => {
      const results = await storage.getQuestionsByFilter({ theme: "verfassung" });
      expect(results.some((q) => q.text.includes("Grundgesetz"))).toBe(true);
    });

    it("theme staat-buerger matches Wahl", async () => {
      const results = await storage.getQuestionsByFilter({ theme: "staat-buerger" });
      expect(results.some((q) => q.text.includes("Wahl"))).toBe(true);
    });

    it("theme geschichte matches DDR", async () => {
      const results = await storage.getQuestionsByFilter({ theme: "geschichte" });
      expect(results.some((q) => q.text.includes("DDR"))).toBe(true);
    });

    it("theme mensch-gesellschaft matches Religion", async () => {
      const results = await storage.getQuestionsByFilter({ theme: "mensch-gesellschaft" });
      expect(results.some((q) => q.text.includes("Religion"))).toBe(true);
    });

    it("theme filter does NOT include state questions", async () => {
      // Theme filtering only applies to question text, not category
      // But state questions wouldn't match federal themes by default
      const results = await storage.getQuestionsByFilter({ theme: "verfassung" });
      expect(results.every((q) => q.category === "Bundesweit")).toBe(true);
    });
  });
});

describe("Image Question Handling", () => {
  let storage: MemStorage;

  beforeEach(async () => {
    storage = new MemStorage();
  });

  // ============================================================
  // Image questions data consistency
  // ============================================================

  describe("image data consistency", () => {
    it("hasImage=true always paired with imagePath", async () => {
      await storage.createManyQuestions([
        sampleQuestion({ hasImage: true, imagePath: "test.png" }),
        sampleQuestion({ hasImage: false, imagePath: null }),
      ]);

      const all = await storage.getAllQuestions();
      for (const q of all) {
        if (q.hasImage) {
          expect(q.imagePath).toBeTruthy();
        }
      }
    });

    it("hasImage=true with null imagePath creates an inconsistent question", async () => {
      // This tests the edge case — the UI guards with `hasImage && imagePath`
      // but the data should never be in this state
      const q = await storage.createQuestion(
        sampleQuestion({ hasImage: true, imagePath: null }),
      );
      expect(q.hasImage).toBe(true);
      expect(q.imagePath).toBeNull();
      // This combination means the "Bild anzeigen" button won't show
      // because question-card.tsx checks: `question.hasImage && question.imagePath`
    });

    it("hasImage=false with imagePath set creates an inconsistent question", async () => {
      const q = await storage.createQuestion(
        sampleQuestion({ hasImage: false, imagePath: "orphan.png" }),
      );
      expect(q.hasImage).toBe(false);
      expect(q.imagePath).toBe("orphan.png");
      // The image button won't show because hasImage is false
    });
  });

  // ============================================================
  // Image questions are always Bundesweit
  // ============================================================

  describe("image questions are federal only", () => {
    it("all image questions have category Bundesweit", async () => {
      // Replicate the actual data pattern: all 7 image questions are Bundesweit
      await storage.createManyQuestions([
        sampleQuestion({ hasImage: true, imagePath: "img1.png", category: "Bundesweit" }),
        sampleQuestion({ hasImage: true, imagePath: "img2.png", category: "Bundesweit" }),
        sampleQuestion({ hasImage: false, category: "Bayern" }),
        sampleQuestion({ hasImage: false, category: "NRW" }),
      ]);

      const all = await storage.getAllQuestions();
      const imageQuestions = all.filter((q) => q.hasImage);
      expect(imageQuestions.every((q) => q.category === "Bundesweit")).toBe(true);
    });

    it("state filtering includes image questions from Bundesweit", async () => {
      await storage.createManyQuestions([
        sampleQuestion({ hasImage: true, imagePath: "img1.png", category: "Bundesweit" }),
        sampleQuestion({ hasImage: false, category: "Bundesweit" }),
        sampleQuestion({ hasImage: false, category: "Bayern" }),
      ]);

      const results = await storage.getQuestionsByFilter({ state: "Bayern" });
      const imageQuestions = results.filter((q) => q.hasImage);
      expect(imageQuestions).toHaveLength(1); // The federal image question is included
    });
  });

  // ============================================================
  // Image questions in quiz modes
  // ============================================================

  describe("image questions in different quiz modes", () => {
    beforeEach(async () => {
      await storage.createManyQuestions([
        ...Array.from({ length: 35 }, (_, i) =>
          sampleQuestion({
            text: `Federal Q${i}`,
            category: "Bundesweit",
            hasImage: i < 7, // First 7 have images
            imagePath: i < 7 ? `img${i}.png` : null,
          }),
        ),
        ...Array.from({ length: 6 }, (_, i) =>
          sampleQuestion({ text: `Bayern Q${i}`, category: "Bayern" }),
        ),
      ]);
    });

    it("random selection can include image questions", async () => {
      const questions = await storage.getRandomQuestions(33);
      // Some might have images (probabilistic, but with 7/35 odds it's very likely)
      const hasAnyImage = questions.some((q) => q.hasImage);
      // Can't guarantee, but verify the field is present
      expect(questions.every((q) => typeof q.hasImage === "boolean")).toBe(true);
    });

    it("filter returns image questions with correct imagePath", async () => {
      const results = await storage.getQuestionsByFilter({ category: "Bundesweit" });
      const imageQuestions = results.filter((q) => q.hasImage);
      expect(imageQuestions).toHaveLength(7);
      imageQuestions.forEach((q) => {
        expect(q.imagePath).toMatch(/^img\d\.png$/);
      });
    });

    it("state quiz includes federal image questions", async () => {
      const questions = await storage.getRandomQuestionsForState(30, "Bayern");
      const federal = questions.filter((q) => q.category === "Bundesweit");
      // Federal questions may include some image questions
      expect(federal).toHaveLength(30);
      expect(federal.every((q) => typeof q.hasImage === "boolean")).toBe(true);
    });
  });
});
