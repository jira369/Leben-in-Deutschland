import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

const questionsData = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, "../../questions-data.json"), "utf8"),
);

describe("questions-data.json integrity", () => {
  it("contains exactly 460 questions", () => {
    expect(questionsData).toHaveLength(460);
  });

  it("has 300 Bundesweit questions", () => {
    const federal = questionsData.filter(
      (q: any) => q.category === "Bundesweit",
    );
    expect(federal).toHaveLength(300);
  });

  it("has 10 questions per state for all 16 states", () => {
    const states = [
      "Baden-Württemberg",
      "Bayern",
      "Berlin",
      "Brandenburg",
      "Bremen",
      "Hamburg",
      "Hessen",
      "Mecklenburg-Vorpommern",
      "Niedersachsen",
      "NRW",
      "Rheinland-Pfalz",
      "Saarland",
      "Sachsen",
      "Sachsen-Anhalt",
      "Schleswig-Holstein",
      "Thüringen",
    ];
    for (const state of states) {
      const stateQ = questionsData.filter((q: any) => q.category === state);
      expect(stateQ).toHaveLength(10);
    }
  });

  it("has 42 image questions total", () => {
    const imageQ = questionsData.filter((q: any) => q.hasImage);
    expect(imageQ).toHaveLength(42);
  });

  it("has 10 federal image questions", () => {
    const federalImages = questionsData.filter(
      (q: any) => q.hasImage && q.category === "Bundesweit",
    );
    expect(federalImages).toHaveLength(10);
  });

  it("has 2 image questions per state (Aufgabe 1 and 8)", () => {
    const states = [
      "Baden-Württemberg",
      "Bayern",
      "Berlin",
      "Brandenburg",
      "Bremen",
      "Hamburg",
      "Hessen",
      "Mecklenburg-Vorpommern",
      "Niedersachsen",
      "NRW",
      "Rheinland-Pfalz",
      "Saarland",
      "Sachsen",
      "Sachsen-Anhalt",
      "Schleswig-Holstein",
      "Thüringen",
    ];
    for (const state of states) {
      const stateImages = questionsData.filter(
        (q: any) => q.hasImage && q.category === state,
      );
      expect(stateImages).toHaveLength(2);
    }
  });

  it("every image question has a non-empty imagePath", () => {
    const imageQ = questionsData.filter((q: any) => q.hasImage);
    for (const q of imageQ) {
      expect(q.imagePath).toBeTruthy();
      expect(typeof q.imagePath).toBe("string");
    }
  });

  it("every image file referenced exists on disk", () => {
    const imageQ = questionsData.filter(
      (q: any) => q.hasImage && q.imagePath,
    );
    for (const q of imageQ) {
      const fullPath = path.resolve(
        __dirname,
        "../../public/images",
        q.imagePath,
      );
      const inAttached = path.resolve(
        __dirname,
        "../../attached_assets",
        q.imagePath,
      );
      const exists = fs.existsSync(fullPath) || fs.existsSync(inAttached);
      expect(exists).toBe(true);
    }
  });

  it("every question has valid answers array with 4 elements", () => {
    for (const q of questionsData) {
      expect(Array.isArray(q.answers)).toBe(true);
      expect(q.answers).toHaveLength(4);
      q.answers.forEach((a: any) => {
        expect(typeof a).toBe("string");
        expect(a.length).toBeGreaterThan(0);
      });
    }
  });

  it("every question has 1-indexed correctAnswer within bounds", () => {
    for (const q of questionsData) {
      expect(q.correctAnswer).toBeGreaterThanOrEqual(1);
      expect(q.correctAnswer).toBeLessThanOrEqual(q.answers.length);
    }
  });

  it("date serial in Aufgabe 186 is converted to German date format", () => {
    const q186 = questionsData.find(
      (q: any) => q.questionNumber === 186 && q.category === "Bundesweit",
    );
    expect(q186).toBeDefined();
    expect(q186.answers).toEqual([
      "1. Mai",
      "17. Juni",
      "20. Juli",
      "9. November",
    ]);
    expect(q186.correctAnswer).toBe(2); // 17. Juni
  });

  it("numeric answers are stored as strings", () => {
    // Q24 has numeric answers: 14, 15, 16, 17
    const q24 = questionsData.find(
      (q: any) => q.questionNumber === 24 && q.category === "Bundesweit",
    );
    expect(q24).toBeDefined();
    expect(q24.answers).toEqual(["14", "15", "16", "17"]);
    expect(q24.correctAnswer).toBe(3); // "16"
  });
});
