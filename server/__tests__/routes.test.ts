import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import express from "express";
import { createServer, type Server } from "http";
import type { AddressInfo } from "net";

// Mock the db module to avoid DATABASE_URL requirement
vi.mock("../db", () => ({
  db: {},
}));

// Mock nodemailer
vi.mock("nodemailer", () => ({
  default: {
    createTransporter: () => ({
      sendMail: vi.fn().mockResolvedValue({ messageId: "test" }),
    }),
  },
}));

// Mock storage with MemStorage - need to override the exported singleton
const { MemStorage } = await import("../storage");
const memStorage = new MemStorage();

vi.mock("../storage", async (importOriginal) => {
  const original = await importOriginal<typeof import("../storage")>();
  const mem = new original.MemStorage();

  // Seed questions into the MemStorage instance
  const federal = Array.from({ length: 40 }, (_, i) => ({
    text: `Federal Q${i + 1}`,
    answers: ["A", "B", "C", "D"],
    correctAnswer: 1,
    explanation: `Explanation ${i}`,
    category: "Bundesweit",
    difficulty: "mittel",
    hasImage: false,
    imagePath: null,
  }));
  const bayern = Array.from({ length: 10 }, (_, i) => ({
    text: `Bayern Q${i + 1}`,
    answers: ["A", "B", "C", "D"],
    correctAnswer: 2,
    explanation: null,
    category: "Bayern",
    difficulty: "leicht",
    hasImage: false,
    imagePath: null,
  }));
  const nrw = Array.from({ length: 6 }, (_, i) => ({
    text: `NRW Q${i + 1}`,
    answers: ["A", "B", "C", "D"],
    correctAnswer: 1,
    explanation: null,
    category: "NRW",
    difficulty: "mittel",
    hasImage: false,
    imagePath: null,
  }));
  const imageQuestions = Array.from({ length: 3 }, (_, i) => ({
    text: `Image Q${i + 1}`,
    answers: ["A", "B", "C", "D"],
    correctAnswer: 1,
    explanation: null,
    category: "Bundesweit",
    difficulty: "mittel",
    hasImage: true,
    imagePath: `img${i}.png`,
  }));

  // createManyQuestions is async, we run it as part of the mock setup
  await mem.createManyQuestions([...federal, ...bayern, ...nrw, ...imageQuestions]);

  return {
    ...original,
    storage: mem,
  };
});

const { registerRoutes } = await import("../routes");

let app: express.Express;
let server: Server;
let baseUrl: string;

beforeAll(async () => {
  app = express();
  app.use(express.json());
  server = await registerRoutes(app);
  await new Promise<void>((resolve) => {
    server.listen(0, () => resolve());
  });
  const addr = server.address() as AddressInfo;
  baseUrl = `http://localhost:${addr.port}`;
});

afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

describe("API Routes", () => {
  // ============================================================
  // GET /api/questions
  // ============================================================

  describe("GET /api/questions", () => {
    it("returns an array of questions", async () => {
      const res = await fetch(`${baseUrl}/api/questions`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
    });
  });

  // ============================================================
  // GET /api/questions/random/:count
  // ============================================================

  describe("GET /api/questions/random/:count", () => {
    it("returns 400 for invalid count", async () => {
      const res = await fetch(`${baseUrl}/api/questions/random/abc`);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe("Invalid count parameter");
    });

    it("returns 400 for negative count", async () => {
      const res = await fetch(`${baseUrl}/api/questions/random/-5`);
      expect(res.status).toBe(400);
    });

    it("returns 400 for zero count", async () => {
      const res = await fetch(`${baseUrl}/api/questions/random/0`);
      expect(res.status).toBe(400);
    });

    it("returns questions for valid count", async () => {
      const res = await fetch(`${baseUrl}/api/questions/random/5`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(Array.isArray(data)).toBe(true);
    });

    it("returns state-specific quiz (30 federal + 3 state) when state param given", async () => {
      const res = await fetch(`${baseUrl}/api/questions/random/33?state=Bayern`);
      expect(res.status).toBe(200);
      const data = await res.json();
      const federal = data.filter((q: any) => q.category === "Bundesweit");
      const state = data.filter((q: any) => q.category === "Bayern");
      expect(federal.length).toBe(30);
      expect(state.length).toBe(3);
    });

    it("returns NRW state questions when category=NRW", async () => {
      const res = await fetch(
        `${baseUrl}/api/questions/random/10?category=NRW`,
      );
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.length).toBeGreaterThan(0);
      expect(data.every((q: any) => q.category === "NRW")).toBe(true);
    });

    it("returns NRW + federal questions when state=NRW", async () => {
      const res = await fetch(`${baseUrl}/api/questions/random/33?state=NRW`);
      expect(res.status).toBe(200);
      const data = await res.json();
      const federal = data.filter((q: any) => q.category === "Bundesweit");
      const nrw = data.filter((q: any) => q.category === "NRW");
      expect(federal.length).toBe(30);
      expect(nrw.length).toBe(3);
    });

    it("includes image questions in federal results", async () => {
      const res = await fetch(`${baseUrl}/api/questions`);
      expect(res.status).toBe(200);
      const data = await res.json();
      const imageQuestions = data.filter((q: any) => q.hasImage);
      expect(imageQuestions.length).toBe(3);
      imageQuestions.forEach((q: any) => {
        expect(q.imagePath).toBeTruthy();
        expect(q.category).toBe("Bundesweit");
      });
    });

    it("supports chronological sorting", async () => {
      const res = await fetch(
        `${baseUrl}/api/questions/random/10?mode=all&chronological=true`,
      );
      expect(res.status).toBe(200);
      const data = await res.json();
      for (let i = 1; i < data.length; i++) {
        expect(data[i].id).toBeGreaterThanOrEqual(data[i - 1].id);
      }
    });
  });

  // ============================================================
  // POST /api/quiz-sessions
  // ============================================================

  describe("POST /api/quiz-sessions", () => {
    it("creates a session with valid data", async () => {
      const res = await fetch(`${baseUrl}/api/quiz-sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "full",
          totalQuestions: 33,
          correctAnswers: 20,
          incorrectAnswers: 13,
          percentage: 61,
          passed: true,
          timeSpent: 1200,
          questionResults: [],
        }),
      });
      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.id).toBeDefined();
      expect(data.type).toBe("full");
    });

    it("returns 400 for invalid session data", async () => {
      const res = await fetch(`${baseUrl}/api/quiz-sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: 123 }),
      });
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe("Invalid session data");
    });
  });

  // ============================================================
  // GET /api/quiz-sessions/recent
  // ============================================================

  describe("GET /api/quiz-sessions/recent", () => {
    it("returns recent sessions", async () => {
      const res = await fetch(`${baseUrl}/api/quiz-sessions/recent`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(Array.isArray(data)).toBe(true);
    });

    it("respects limit parameter", async () => {
      const res = await fetch(`${baseUrl}/api/quiz-sessions/recent?limit=1`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.length).toBeLessThanOrEqual(1);
    });
  });

  // ============================================================
  // GET /api/quiz-sessions/stats
  // ============================================================

  describe("GET /api/quiz-sessions/stats", () => {
    it("returns stats object", async () => {
      const res = await fetch(`${baseUrl}/api/quiz-sessions/stats`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toHaveProperty("totalTests");
      expect(data).toHaveProperty("averageScore");
      expect(data).toHaveProperty("bestScore");
      expect(data).toHaveProperty("totalStudyTime");
    });
  });

  // ============================================================
  // Settings
  // ============================================================

  describe("settings endpoints", () => {
    it("GET /api/settings returns settings", async () => {
      const res = await fetch(`${baseUrl}/api/settings`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toHaveProperty("hasSelectedState");
    });

    it("PATCH /api/settings updates settings", async () => {
      const res = await fetch(`${baseUrl}/api/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selectedState: "Bayern" }),
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.selectedState).toBe("Bayern");
    });
  });

  // ============================================================
  // Marked Questions
  // ============================================================

  describe("marked questions endpoints", () => {
    it("POST /api/marked-questions requires valid questionId", async () => {
      const res = await fetch(`${baseUrl}/api/marked-questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe("Valid questionId is required");
    });

    it("POST /api/marked-questions rejects string questionId", async () => {
      const res = await fetch(`${baseUrl}/api/marked-questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId: "abc" }),
      });
      expect(res.status).toBe(400);
    });

    it("GET /api/marked-questions/count returns count", async () => {
      const res = await fetch(`${baseUrl}/api/marked-questions/count`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toHaveProperty("count");
      expect(typeof data.count).toBe("number");
    });

    it("GET /api/marked-questions/:questionId checks if marked", async () => {
      const res = await fetch(`${baseUrl}/api/marked-questions/1`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toHaveProperty("marked");
      expect(typeof data.marked).toBe("boolean");
    });

    it("GET /api/marked-questions/:questionId returns 400 for invalid id", async () => {
      const res = await fetch(`${baseUrl}/api/marked-questions/notanumber`);
      expect(res.status).toBe(400);
    });
  });

  // ============================================================
  // Incorrect Answers
  // ============================================================

  describe("incorrect answers endpoints", () => {
    it("GET /api/incorrect-answers/count returns count", async () => {
      const res = await fetch(`${baseUrl}/api/incorrect-answers/count`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(typeof data.count).toBe("number");
    });

    it("DELETE /api/incorrect-answers/question/:questionId rejects NaN", async () => {
      const res = await fetch(
        `${baseUrl}/api/incorrect-answers/question/notanumber`,
        { method: "DELETE" },
      );
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe("Invalid question ID");
    });
  });

  // ============================================================
  // Reset Statistics
  // ============================================================

  describe("POST /api/reset-statistics", () => {
    it("resets all statistics", async () => {
      const res = await fetch(`${baseUrl}/api/reset-statistics`, {
        method: "POST",
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
    });
  });

  // ============================================================
  // Bug Report
  // ============================================================

  describe("POST /api/bug-report", () => {
    it("rejects empty description", async () => {
      const res = await fetch(`${baseUrl}/api/bug-report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: "",
          timestamp: new Date().toISOString(),
        }),
      });
      expect(res.status).toBe(400);
    });

    it("rejects missing required fields", async () => {
      const res = await fetch(`${baseUrl}/api/bug-report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      expect(res.status).toBe(400);
    });
  });

  // ============================================================
  // Detailed Stats
  // ============================================================

  describe("GET /api/quiz-sessions/detailed-stats", () => {
    it("returns detailed stats", async () => {
      const res = await fetch(`${baseUrl}/api/quiz-sessions/detailed-stats`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toHaveProperty("totalQuestions");
      expect(data).toHaveProperty("correctAnswers");
      expect(data).toHaveProperty("incorrectAnswers");
      expect(data).toHaveProperty("totalTests");
      expect(data).toHaveProperty("testsPassedCount");
      expect(data).toHaveProperty("testsPassedPercentage");
    });

    it("accepts state query parameter", async () => {
      const res = await fetch(
        `${baseUrl}/api/quiz-sessions/detailed-stats?state=Bayern`,
      );
      expect(res.status).toBe(200);
    });
  });

  // ============================================================
  // Unique Questions
  // ============================================================

  describe("GET /api/quiz-sessions/unique-questions", () => {
    it("returns unique questions count", async () => {
      const res = await fetch(`${baseUrl}/api/quiz-sessions/unique-questions`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toHaveProperty("uniqueQuestionsAnswered");
      expect(typeof data.uniqueQuestionsAnswered).toBe("number");
    });
  });
});
